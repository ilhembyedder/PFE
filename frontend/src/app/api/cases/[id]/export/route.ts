import { withAuth, proxyBinary } from "@/lib/bff";

type Params = { id: string };

/** GET /api/cases/:id/export — the case history as a PDF. */
export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyBinary(session, `/cases/${params.id}/export`, {
    contentType: "application/pdf",
    filename: `dossier-${params.id}.pdf`,
  }),
);
