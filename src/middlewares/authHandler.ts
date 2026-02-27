import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { usersTable, apiKeysTable } from "../schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "./errorHandler";
import { env } from "../config/env";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: typeof usersTable.$inferSelect;
      orgId?: string;
    }
  }
}

// Initialize Neon JWKS Set for token verification
const JWKS = createRemoteJWKSet(new URL(env.NEON_JWKS_URL));

export const authHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers["x-api-key"] as string;

  try {
    // ===============================================
    // PATH 1: MACHINE ACCESS (API KEY) - NO CHANGES
    // ===============================================
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

    // ===============================================
    // PATH 2: HUMAN ACCESS (NEON AUTH JWT)
    // ===============================================
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        // A. Verify Token locally with Neon JWKS
        const { payload } = await jwtVerify(token, JWKS);

        // Neon Auth JWT payload contains 'sub' (User ID) and 'email'
        const userId = payload.sub as string;
        const userEmail = payload.email as string;

        // B. JIT Sync: Check if user exists in your app's public.users table
        const existingUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);

        if (existingUser.length > 0) {
          req.user = existingUser[0];
        } else {
          // C. User doesn't exist in public.users yet — create them
          const [newUser] = await db
            .insert(usersTable)
            .values({
              id: userId, // Matches neon_auth.user.id
              email: userEmail,
              name: (payload.name as string) ?? "Unknown",
              // organizationId is null until they create or join an org
            })
            .returning();
          req.user = newUser;
        }

        // D. Set org context
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
