import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/cases/${params.id}`),
);

export const PUT = withAuth<Params>(async ({ session, params, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, `/cases/${params.id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
});
