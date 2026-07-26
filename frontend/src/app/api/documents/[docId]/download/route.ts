import { withAuth, proxyBinary } from "@/lib/bff";

type Params = { docId: string };

export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyBinary(session, `/documents/${params.docId}/download`),
);
