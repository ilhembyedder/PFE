import { withAuth, proxyJson } from "@/lib/bff";

/** AI deviation thresholds driving the reliability indicator. */
export const GET = withAuth(
  async ({ session }) => proxyJson(session, "/admin/tenant/config/thresholds"),
  { roles: ["ADMIN"] },
);

export const PUT = withAuth(
  async ({ session, request }) => {
    const body: unknown = await request.json();
    return proxyJson(session, "/admin/tenant/config/thresholds", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  { roles: ["ADMIN"] },
);
