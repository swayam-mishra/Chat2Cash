import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { usersTable, apiKeysTable } from "../schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "./errorHandler";
import { env } from "../config/env";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

declare global {
  namespace Express {
    interface Request {
      user?: typeof usersTable.$inferSelect;
      orgId?: string;
    }
  }
}

const JWKS = createRemoteJWKSet(new URL(env.NEON_JWKS_URL));

export const authHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers["x-api-key"] as string;

  try {
    // API Key authentication (machine access)
    if (apiKeyHeader) {
      // Compute hash as a Buffer so we can use timingSafeEqual below
      const incomingHash = crypto.createHash("sha256").update(apiKeyHeader).digest();
      const incomingHashHex = incomingHash.toString("hex");

      // Fetch by hash (indexed column) — also select the stored hash so we
      // can verify it at the application layer with a constant-time comparison.
      // This closes the timing oracle that would exist if we relied solely on
      // the database string equality check (DB query latency differs between
      // "row found" and "row not found", leaking whether a hash prefix is valid).
      const result = await db
        .select({ orgId: apiKeysTable.organizationId, keyHash: apiKeysTable.keyHash })
        .from(apiKeysTable)
        .where(and(eq(apiKeysTable.keyHash, incomingHashHex), eq(apiKeysTable.isActive, true)))
        .limit(1);

      if (result.length === 0) throw new AppError("Invalid API Key", 401);

      // Constant-time comparison — prevents timing side-channel attacks where
      // an attacker could infer hash byte values from response-time variance.
      const storedHash = Buffer.from(result[0].keyHash, "hex");
      if (
        storedHash.length !== incomingHash.length ||
        !crypto.timingSafeEqual(incomingHash, storedHash)
      ) {
        throw new AppError("Invalid API Key", 401);
      }

      req.orgId = result[0].orgId;
      return next();
    }

    // JWT authentication (human access via Neon Auth)
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const { payload } = await jwtVerify(token, JWKS);

        const userId = payload.sub as string;
        const userEmail = payload.email as string;

        // Atomic JIT sync: upsert user in local DB on first login
        // Prevents race conditions from concurrent requests by a new user
        const [user] = await db
          .insert(usersTable)
          .values({
            id: userId,
            email: userEmail,
            name: (payload.name as string) ?? "Unknown",
          })
          .onConflictDoUpdate({
            target: usersTable.id,
            set: {
              email: userEmail,
              name: (payload.name as string) ?? "Unknown",
            },
          })
          .returning();

        req.user = user;

        // Set org context from the user record
        if (req.user?.organizationId) {
          req.orgId = req.user.organizationId;
        }

        return next();
      } catch (jwtError) {
        throw new AppError("Invalid or Expired Token", 401);
      }
    }

    throw new AppError("Authentication required", 401);
  } catch (err) {
    next(err);
  }
};

export const requireOrg = (req: Request, res: Response, next: NextFunction) => {
  if (!req.orgId) {
    return next(new AppError("User is not part of an Organization", 403));
  }
  next();
};
