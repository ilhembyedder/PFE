import { withAuth, proxyJson } from "@/lib/bff";

/**
 * Tenant administration. Gated on ADMIN in the BFF as well as the backend:
 * these routes previously forwarded any valid session, leaving enforcement
 * entirely to the backend.
 */
export const GET = withAuth(
  async ({ session }) => proxyJson(session, "/admin/tenant"),
  { roles: ["ADMIN"] },
);

export const PUT = withAuth(
  async ({ session, request }) => {
    const body: unknown = await request.json();
    return proxyJson(session, "/admin/tenant/branding", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  { roles: ["ADMIN"] },
);
