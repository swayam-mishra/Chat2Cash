import React, { createContext, useContext, useMemo } from "react";
import { ApiClient, createApiClient } from "@/lib/api";

/**
 * Provides a single ApiClient instance scoped to the React tree.
 *
 * This solves two problems with the previous module-level global approach:
 *
 * 1. SSR safety — module globals live for the lifetime of the Node process and
 *    are therefore shared across ALL concurrent users' requests. Storing auth
 *    tokens in a React Context ties them to the component tree, which in any
 *    SSR framework (Next.js App Router, Remix) is created fresh per request.
 *
 * 2. Testability — tests can wrap components in <ApiClientProvider> and inject
 *    a mock ApiClient instance without patching module-level singletons.
 *
 * Usage
 * ─────
 *   // Wrap your application root (already done in App.tsx):
 *   <ApiClientProvider>
 *     <RouterProvider router={router} />
 *   </ApiClientProvider>
 *
 *   // In any component or custom hook:
 *   const client = useApiClient();
 *   const orders = await client.getOrders();
 */

const ApiClientContext = createContext<ApiClient | null>(null);

export function ApiClientProvider({ children }: { children: React.ReactNode }) {
  // useMemo guarantees the same instance for all re-renders of the provider
  // without recreating it, while still being reset if the provider is unmounted
  // (e.g. per-request in SSR).
  const client = useMemo(() => createApiClient(), []);

  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

/** Access the session-scoped ApiClient instance. Must be inside ApiClientProvider. */
export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error("useApiClient() must be called inside <ApiClientProvider>.");
  }
  return client;
}
