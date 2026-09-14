import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

export const GET = withAuth<Params>(
  async ({ session, params }) =>
    proxyJson(session, `/admin/users/${params.id}`),
  { roles: ["ADMIN"] },
);

export const PUT = withAuth<Params>(
  async ({ session, request, params }) => {
    const body: unknown = await request.json();
    return proxyJson(session, `/admin/users/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  { roles: ["ADMIN"] },
);
