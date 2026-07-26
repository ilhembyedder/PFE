import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

export const PUT = withAuth<Params>(async ({ session, params, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, `/cases/${params.id}/assign`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
});
