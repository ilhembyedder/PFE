import { withAuth, proxyJson } from "@/lib/bff";

export const GET = withAuth(async ({ session }) => proxyJson(session, "/contracts"));

export const POST = withAuth(async ({ session, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, "/contracts", {
    method: "POST",
    body: JSON.stringify(body),
  });
});
