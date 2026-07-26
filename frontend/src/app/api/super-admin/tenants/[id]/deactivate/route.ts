import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

export const PUT = withAuth<Params>(
  async ({ session, params }) =>
    proxyJson(session, `/super-admin/tenants/${params.id}/deactivate`, {
      method: "PUT",
    }),
  { roles: ["SUPER_ADMIN"] },
);
