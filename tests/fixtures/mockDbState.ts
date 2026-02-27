/**
 * Test Database Seeder
 *
 * Provides helpers to seed the Testcontainers PostgreSQL database
 * with realistic mock data via Drizzle ORM.
 *
 * Usage:
 *   import { seedTestOrg, seedTestOrders, clearAllTables } from "../fixtures/mockDbState";
 *   const { org, apiKey } = await seedTestOrg(db);
 *   const orders = await seedTestOrders(db, org.id);
 */

import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { randomUUID } from "crypto";
import crypto from "crypto";
import {
  organizationsTable,
  businessProfilesTable,
  usersTable,
  apiKeysTable,
  customersTable,
  ordersTable,
  orderItemsTable,
  rolesTable,
  productsTable,
} from "../../src/schema";
import type * as schema from "../../src/schema";

// Re-export the DB type used throughout tests
export type TestDb = NodePgDatabase<typeof schema>;

// ── Constants ──────────────────────────────────────────────────

/** Raw API key value tests will send in the `x-api-key` header */
export const TEST_API_KEY_RAW = "test-api-key-secret-12345";

/** SHA-256 hash stored in the database */
const TEST_API_KEY_HASH = crypto
  .createHash("sha256")
  .update(TEST_API_KEY_RAW)
  .digest("hex");

// ── Seed helpers ───────────────────────────────────────────────

export interface SeededOrg {
  org: typeof organizationsTable.$inferSelect;
  user: typeof usersTable.$inferSelect;
  apiKeyRaw: string;
}

/**
 * Seed a single organization with a business profile, one user, and an API key.
 * Returns the created records plus the raw API key for authenticating requests.
 */
export async function seedTestOrg(db: TestDb): Promise<SeededOrg> {
  const orgId = randomUUID();
  const userId = randomUUID();

  const [org] = await db
    .insert(organizationsTable)
    .values({
      id: orgId,
      name: "Test Organization",
      gstNumber: "22AAAAA0000A1Z5",
      tier: "pro",
    })
    .returning();

  await db.insert(businessProfilesTable).values({
    id: randomUUID(),
    organizationId: orgId,
    businessName: "Test Biz",
    gstNumber: "22AAAAA0000A1Z5",
    taxRate: 18.0,
    currency: "INR",
  });

  const [user] = await db
    .insert(usersTable)
    .values({
      id: userId,
      email: "test@example.com",
      name: "Test User",
      organizationId: orgId,
      role: "owner",
    })
    .returning();

  await db.insert(apiKeysTable).values({
    id: randomUUID(),
    organizationId: orgId,
    keyHash: TEST_API_KEY_HASH,
    name: "Test Key",
    maskedKey: "sk_...test",
    isActive: true,
  });

  return { org, user, apiKeyRaw: TEST_API_KEY_RAW };
}

export interface SeededOrder {
  orderId: string;
  customerId: string;
}

/**
 * Seed `count` chat-type orders (with customers & line items) for a given org.
 */
export async function seedTestOrders(
  db: TestDb,
  orgId: string,
  count: number = 3,
): Promise<SeededOrder[]> {
  const seeded: SeededOrder[] = [];

  for (let i = 0; i < count; i++) {
    const customerId = randomUUID();
    const orderId = randomUUID();

    await db.insert(customersTable).values({
      id: customerId,
      organizationId: orgId,
      name: `Customer ${i + 1}`,
      phone: `+9199000000${i}`,
    });

    await db.insert(ordersTable).values({
      id: orderId,
      organizationId: orgId,
      customerId,
      extractionType: "chat_log",
      rawAiResponse: [
        { product_name: `Product A${i}`, quantity: i + 1, price: 100 * (i + 1) },
      ],
      totalAmount: 100 * (i + 1) * (i + 1),
      currency: "INR",
      rawMessages: [
        { sender: `Customer ${i + 1}`, text: `I want ${i + 1} units of Product A${i}` },
      ],
      confidence: "high",
      status: "pending",
    });

    await db.insert(orderItemsTable).values({
      id: randomUUID(),
      orderId,
      organizationId: orgId,
      productName: `Product A${i}`,
      quantity: i + 1,
      pricePerUnit: 100 * (i + 1),
      totalPrice: 100 * (i + 1) * (i + 1),
    });

    seeded.push({ orderId, customerId });
  }

  return seeded;
}

/**
 * Truncate every application table (in FK-safe order) so each test
 * starts with a clean slate.
 */
export async function clearAllTables(db: TestDb): Promise<void> {
  // Delete in reverse-dependency order to avoid FK violations
  await db.delete(orderItemsTable);
  await db.delete(ordersTable);
  await db.delete(productsTable);
  await db.delete(customersTable);
  await db.delete(apiKeysTable);
  await db.delete(rolesTable);
  await db.delete(usersTable);
  await db.delete(businessProfilesTable);
  await db.delete(organizationsTable);
}
