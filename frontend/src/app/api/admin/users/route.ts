import { withAuth, proxyJson } from "@/lib/bff";

export const GET = withAuth(
  async ({ session }) => proxyJson(session, "/admin/users"),
  { roles: ["ADMIN"] },
);

export const POST = withAuth(
  async ({ session, request }) => {
    const body: unknown = await request.json();
    return proxyJson(session, "/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  { roles: ["ADMIN"] },
);
