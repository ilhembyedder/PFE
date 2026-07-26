import { withAuth, proxyBinary } from "@/lib/bff";

type Params = { id: string; docId: string };

export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyBinary(
    session,
    `/cases/${params.id}/documents/${params.docId}/download`,
  ),
);
