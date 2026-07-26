import { withAuth, proxyJson } from "@/lib/bff";

export const GET = withAuth(async ({ session }) => proxyJson(session, "/clients"));

export const POST = withAuth(async ({ session, request }) => {
  const body: unknown = await request.json();
  return proxyJson(session, "/clients", {
    method: "POST",
    body: JSON.stringify(body),
  });
});
