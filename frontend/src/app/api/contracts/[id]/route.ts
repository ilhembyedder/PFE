import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/contracts/${params.id}`),
);

export const PUT = withAuth<Params>(async ({ session, params, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, `/contracts/${params.id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
});

export const DELETE = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/contracts/${params.id}`, { method: "DELETE" }),
);
