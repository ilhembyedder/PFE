import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

/** GET /api/cases/:id/valuation — the AI comparison result. */
export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/cases/${params.id}/valuation`),
);

export const dynamic = "force-dynamic";
export const revalidate = 0;
