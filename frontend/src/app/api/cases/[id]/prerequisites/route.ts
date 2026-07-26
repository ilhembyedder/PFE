import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

/** GET /api/cases/:id/prerequisites — what blocks the next transition. */
export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/cases/${params.id}/prerequisites`),
);
