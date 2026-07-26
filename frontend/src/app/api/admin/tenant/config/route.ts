import { withAuth, proxyJson } from "@/lib/bff";

/** Dormancy threshold and the statutory delay per phase. */
export const GET = withAuth(
  async ({ session }) => proxyJson(session, "/admin/tenant/config"),
  { roles: ["ADMIN"] },
);

export const PUT = withAuth(
  async ({ session, request }) => {
    const body: unknown = await request.json();
    return proxyJson(session, "/admin/tenant/config", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  { roles: ["ADMIN"] },
);
