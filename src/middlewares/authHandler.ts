import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../config/db";
import { usersTable, apiKeysTable } from "../schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "./errorHandler";
import { env } from "../config/env";
import crypto from "crypto";

// Initialize Supabase Client (Auth only)
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Extend Express Request to include User and Org info
declare global {
  namespace Express {
    interface Request {
      user?: typeof usersTable.$inferSelect;
      orgId?: string;
    }
  }
}

export const authHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers["x-api-key"] as string;

  try {
    // ===============================================
    // PATH 1: MACHINE ACCESS (API KEY)
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
    // PATH 2: HUMAN ACCESS (SUPABASE JWT)
    // ===============================================
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      // A. Verify Token with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw new AppError("Invalid or Expired Token", 401);

      // B. JIT Sync: Check if user exists in Neon
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);

      if (existingUser.length > 0) {
        req.user = existingUser[0];
      } else {
        // C. User doesn't exist in Neon yet — create them now (Just-In-Time provisioning)
        const [newUser] = await db
          .insert(usersTable)
          .values({
            id: user.id, // Matches Supabase auth.uid()
            email: user.email!,
            name: user.user_metadata?.full_name ?? "Unknown",
            // organizationId is null until they create or join an org
          })
          .returning();
        req.user = newUser;
      }

      // D. Set org context from the user record
      if (req.user?.organizationId) {
        req.orgId = req.user.organizationId;
      }

      return next();
    }

    throw new AppError("Authentication required", 401);
  } catch (err) {
    next(err);
  }
};

/**
 * Guard middleware: ensures the authenticated identity belongs to an organization.
 * Use after authHandler on routes that strictly require an org context.
 */
export const requireOrg = (req: Request, res: Response, next: NextFunction) => {
  if (!req.orgId) {
    return next(new AppError("User is not part of an Organization", 403));
  }
  next();
};
