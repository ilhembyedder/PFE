import { withAuth, API_BASE, backendHeaders, fail } from "@/lib/bff";

type Params = { id: string };

/**
 * GET /api/cases/:id/progress
 *
 * Server-sent events passthrough for the AI valuation pipeline. Proxies the
 * backend's /valuation-progress stream, re-emitting the body unbuffered.
 *
 * `no-transform` matters: without it an intermediary may buffer the stream
 * and the three progress stages arrive at once, which defeats the point.
 */
export const GET = withAuth<Params>(async ({ session, params }) => {
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/cases/${params.id}/valuation-progress`, {
      headers: backendHeaders(session, { Accept: "text/event-stream" }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[bff] valuation stream unreachable", error);
    return fail(503, "Connexion au serveur impossible.");
  }

  if (!upstream.ok || !upstream.body) {
    return fail(
      upstream.status === 200 ? 502 : upstream.status,
      "Le suivi de l'analyse n'est pas disponible.",
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disables proxy buffering on nginx, which otherwise holds the stream.
      "X-Accel-Buffering": "no",
    },
  });
});

// The stream must not be statically optimised or cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;
