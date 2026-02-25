import { db } from "../config/db";
import { rolesTable, usersTable } from "../schema";
import { eq, and } from "drizzle-orm";

// All available permissions in the system
export const PERMISSIONS = {
  VIEW_ORDERS: "view_orders",
  EDIT_ORDERS: "edit_orders",
  DELETE_ORDERS: "delete_orders",
  VIEW_PII: "view_pii",
  MANAGE_USERS: "manage_users",
  MANAGE_BILLING: "manage_billing",
  MANAGE_API_KEYS: "manage_api_keys",
  VIEW_ANALYTICS: "view_analytics",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Default permission sets — used as fallback when no DB role entry exists yet
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: Object.values(PERMISSIONS) as Permission[],
  admin: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.DELETE_ORDERS,
    PERMISSIONS.VIEW_PII,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  manager: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.VIEW_PII,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  auditor: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  member: [
    PERMISSIONS.VIEW_ORDERS,
  ],
};

/**
 * Get permissions for a user by looking up their role in the roles table.
 * Falls back to DEFAULT_ROLE_PERMISSIONS if no DB role entry exists.
 */
export async function getUserPermissions(userId: string, orgId: string): Promise<string[]> {
  const user = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (user.length === 0) return [];

  const roleName = user[0].role ?? "member";

  // Try DB-backed role first
  const dbRole = await db
    .select({ permissions: rolesTable.permissions })
    .from(rolesTable)
    .where(and(eq(rolesTable.name, roleName), eq(rolesTable.organizationId, orgId)))
    .limit(1);

  if (dbRole.length > 0 && dbRole[0].permissions) {
    return dbRole[0].permissions as string[];
  }

  // Fallback to hardcoded defaults (during migration period)
  return DEFAULT_ROLE_PERMISSIONS[roleName] ?? [];
}

/**
 * Check if a user has a specific permission.
 */
export async function hasPermission(
  userId: string,
  orgId: string,
  permission: Permission,
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, orgId);
  return permissions.includes(permission);
}
