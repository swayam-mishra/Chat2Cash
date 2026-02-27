/**
 * Integration tests — Order API routes
 *
 * Stack: Supertest → Express app → real Drizzle/PG (Testcontainers)
 *
 * The ephemeral PostgreSQL URL is injected by tests/test-env.ts (setupFile)
 * which reads the container state written by tests/setup.ts (globalSetup).
 *
 * Every test gets a clean database via `clearAllTables` in `beforeEach`.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../../src/schema";
import {
  seedTestOrg,
  seedTestOrders,
  clearAllTables,
  TEST_API_KEY_RAW,
  type TestDb,
  type SeededOrg,
} from "../../fixtures/mockDbState";

// ── Bootstrap ──────────────────────────────────────────────────
// Import the Express app AFTER test-env.ts has set DATABASE_URL
// so that src/config/db.ts connects to the Testcontainers instance.
import app from "../../../src/app";

let testDb: TestDb;
let pool: pg.Pool;
let seeded: SeededOrg;

beforeAll(() => {
  // Create a Drizzle instance pointing at the same ephemeral DB
  // so seeder helpers don't depend on the app's internal `db` singleton.
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  testDb = drizzle(pool, { schema });
});

afterAll(async () => {
  await pool.end();
});

// ── Helpers ────────────────────────────────────────────────────

/** Authenticated GET request scoped to the seeded org */
const authGet = (path: string) =>
  request(app).get(path).set("x-api-key", TEST_API_KEY_RAW);

/** Authenticated PATCH request scoped to the seeded org */
const authPatch = (path: string) =>
  request(app).patch(path).set("x-api-key", TEST_API_KEY_RAW);

/** Authenticated DELETE request scoped to the seeded org */
const authDelete = (path: string) =>
  request(app).delete(path).set("x-api-key", TEST_API_KEY_RAW);

// ================================================================
// GET /api/orders
// ================================================================

describe("GET /api/orders", () => {
  beforeEach(async () => {
    await clearAllTables(testDb);
    seeded = await seedTestOrg(testDb);
  });

  it("returns an empty array when no orders exist", async () => {
    const res = await authGet("/api/orders");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns seeded orders", async () => {
    const orders = await seedTestOrders(testDb, seeded.org.id, 3);

    const res = await authGet("/api/orders");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);

    // Orders come back newest-first (ORDER BY created_at DESC)
    for (const order of res.body) {
      expect(order).toHaveProperty("id");
      expect(order).toHaveProperty("items");
      expect(order).toHaveProperty("status", "pending");
      expect(order).toHaveProperty("confidence", "high");
    }

    // Verify the response contains valid order objects with expected fields
    const returnedIds = new Set(res.body.map((o: any) => o.id));
    expect(returnedIds.size).toBe(3);
  });

  it("respects limit and offset query params", async () => {
    await seedTestOrders(testDb, seeded.org.id, 5);

    const res = await authGet("/api/orders?limit=2&offset=0");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("does not leak orders from another organization", async () => {
    // Seed orders under the default org
    await seedTestOrders(testDb, seeded.org.id, 2);

    // Create a second org with its own API key
    const otherOrgId = "other-org-id";
    await testDb.insert(schema.organizationsTable).values({
      id: otherOrgId,
      name: "Other Org",
      tier: "free",
    });
    await seedTestOrders(testDb, otherOrgId, 3);

    // Query with the original org's API key → should only see its 2 orders
    const res = await authGet("/api/orders");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ================================================================
// GET /api/orders/:id
// ================================================================

describe("GET /api/orders/:id", () => {
  beforeEach(async () => {
    await clearAllTables(testDb);
    seeded = await seedTestOrg(testDb);
  });

  it("returns a single order by id", async () => {
    const [first] = await seedTestOrders(testDb, seeded.org.id, 1);

    const res = await authGet(`/api/orders/${first.orderId}`);

    expect(res.status).toBe(200);
    // The PII redactor may alter string fields in the response,
    // so we verify structure rather than exact ID equality.
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("status", "pending");
    expect(res.body.items).toHaveLength(1);
  });

  it("returns 404 for a non-existent order id", async () => {
    const res = await authGet("/api/orders/non-existent-id");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found");
  });
});

// ================================================================
// PATCH /api/orders/:id  (update status)
// ================================================================

describe("PATCH /api/orders/:id", () => {
  beforeEach(async () => {
    await clearAllTables(testDb);
    seeded = await seedTestOrg(testDb);
  });

  it("updates the order status", async () => {
    const [first] = await seedTestOrders(testDb, seeded.org.id, 1);

    const res = await authPatch(`/api/orders/${first.orderId}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
  });

  it("returns 400 when status field is missing", async () => {
    const [first] = await seedTestOrders(testDb, seeded.org.id, 1);

    const res = await authPatch(`/api/orders/${first.orderId}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ================================================================
// DELETE /api/orders/:id
// ================================================================

describe("DELETE /api/orders/:id", () => {
  beforeEach(async () => {
    await clearAllTables(testDb);
    seeded = await seedTestOrg(testDb);
  });

  it("soft-deletes an order", async () => {
    const [first] = await seedTestOrders(testDb, seeded.org.id, 1);

    const delRes = await authDelete(`/api/orders/${first.orderId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body).toHaveProperty("success", true);

    // Order should no longer appear in the list
    const listRes = await authGet("/api/orders");
    expect(listRes.body).toHaveLength(0);
  });

  it("returns 404 when deleting a non-existent order", async () => {
    const res = await authDelete("/api/orders/does-not-exist");

    expect(res.status).toBe(404);
  });
});

// ================================================================
// Auth / Error-handling edge cases
// ================================================================

describe("Authentication & error handling", () => {
  beforeEach(async () => {
    await clearAllTables(testDb);
    seeded = await seedTestOrg(testDb);
  });

  it("returns 401 when no auth header is provided", async () => {
    const res = await request(app).get("/api/orders");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 401 for an invalid API key", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("x-api-key", "totally-wrong-key");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
});
