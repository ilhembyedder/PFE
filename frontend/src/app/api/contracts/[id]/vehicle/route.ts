import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/contracts/${params.id}/vehicle`),
);

/** Upsert: the backend updates the existing vehicle when one is linked. */
export const POST = withAuth<Params>(async ({ session, params, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, `/contracts/${params.id}/vehicle`, {
    method: "POST",
    body: JSON.stringify(body),
  });
});
