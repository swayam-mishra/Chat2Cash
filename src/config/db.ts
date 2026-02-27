import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../schema";
import { env } from "./env";

// ── Database SSL for Production (Phase 2) ───────────────────
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ...(env.NODE_ENV === "production" && {
    ssl: {
      rejectUnauthorized: true,  // Enforce valid CA certificates
      // To use a custom CA cert, set DATABASE_CA_CERT env var:
      // ca: env.DATABASE_CA_CERT,
    },
  }),
});

export const db = drizzle(pool, { schema });