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
      const hash = crypto.createHash("sha256").update(apiKeyHeader).digest("hex");

      const result = await db
        .select({ orgId: apiKeysTable.organizationId })
        .from(apiKeysTable)
        .where(and(eq(apiKeysTable.keyHash, hash), eq(apiKeysTable.isActive, true)))
        .limit(1);

      if (result.length === 0) throw new AppError("Invalid API Key", 401);

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

        // JIT sync: create user in local DB on first login
        const existingUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);

        if (existingUser.length > 0) {
          req.user = existingUser[0];
        } else {
          const [newUser] = await db
            .insert(usersTable)
            .values({
              id: userId,
              email: userEmail,
              name: (payload.name as string) ?? "Unknown",
              // organizationId is assigned when the user creates/joins an org
            })
            .returning();
          req.user = newUser;
        }

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
