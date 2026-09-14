import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

export const PUT = withAuth<Params>(
  async ({ session, params }) =>
    proxyJson(session, `/admin/users/${params.id}/deactivate`, {
      method: "PUT",
    }),
  { roles: ["ADMIN"] },
);
