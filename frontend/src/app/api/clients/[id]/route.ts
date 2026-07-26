import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

// `params` is awaited inside withAuth. Destructuring it synchronously here
// is what broke client and contract mutations before: Next 16 makes params
// a Promise, so the id reached the backend as the string "undefined".
export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/clients/${params.id}`),
);

export const PUT = withAuth<Params>(async ({ session, params, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, `/clients/${params.id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
});

export const DELETE = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/clients/${params.id}`, { method: "DELETE" }),
);
