import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../schema";
import { env } from "./env";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ...(env.NODE_ENV === "production" && {
    ssl: {
      rejectUnauthorized: true,
      // ca: env.DATABASE_CA_CERT,
    },
  }),
});

export const db = drizzle(pool, { schema });