import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

/** GET /api/cases/:id/history — the Envers-derived timeline. */
export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/cases/${params.id}/history`),
);
