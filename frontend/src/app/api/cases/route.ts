import { withAuth, proxyJson, buildQuery } from "@/lib/bff";

const LIST_PARAMS = ["page", "size", "sortBy", "phase", "status", "alertLevel"] as const;

/** GET /api/cases — paged, sorted, filtered registry. */
export const GET = withAuth(async ({ session, request }) => {
  const query = buildQuery(request.nextUrl.searchParams, LIST_PARAMS);
  return proxyJson(session, `/cases${query}`);
});

/** POST /api/cases — creates client, contract, vehicle and case. */
export const POST = withAuth(async ({ session, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, "/cases", {
    method: "POST",
    body: JSON.stringify(body),
  });
});
