import { withAuth, proxyJson } from "@/lib/bff";

/** GET /api/cases/assignees — managers a case can be assigned to. */
export const GET = withAuth(async ({ session }) =>
  proxyJson(session, "/cases/assignees"),
);
