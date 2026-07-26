import { withAuth, proxyJson } from "@/lib/bff";

/** GET /api/dashboard/alerts/priority — top 5, critical first. */
export const GET = withAuth(async ({ session }) =>
  proxyJson(session, "/dashboard/alerts/priority"),
);
