import { withAuth, proxyJson } from "@/lib/bff";

type Params = { id: string; docId: string };

/** DELETE /api/cases/:id/documents/:docId */
export const DELETE = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/cases/${params.id}/documents/${params.docId}`, {
    method: "DELETE",
  }),
);
