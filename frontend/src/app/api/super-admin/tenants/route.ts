import { withAuth, proxyJson } from "@/lib/bff";

/**
 * Platform administration. SUPER_ADMIN only — previously any authenticated
 * user could POST here and the BFF would forward it.
 */
export const GET = withAuth(
  async ({ session }) => proxyJson(session, "/super-admin/tenants"),
  { roles: ["SUPER_ADMIN"] },
);

export const POST = withAuth(
  async ({ session, request }) => {
    const body: unknown = await request.json();
    return proxyJson(session, "/super-admin/tenants", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  { roles: ["SUPER_ADMIN"] },
);
