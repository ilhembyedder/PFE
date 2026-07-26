import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string };

/** POST /api/cases/:id/next-phase — advance the workflow. */
export const POST = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/cases/${params.id}/next-phase`, { method: "POST" }),
);
