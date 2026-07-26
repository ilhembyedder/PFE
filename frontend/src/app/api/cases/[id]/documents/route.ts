import { withAuth, proxyJson, proxyFormData, fail } from "@/lib/bff";

type Params = { id: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const GET = withAuth<Params>(async ({ session, params }) =>
  proxyJson(session, `/cases/${params.id}/documents`),
);

/**
 * POST /api/cases/:id/documents
 *
 * Size and type are checked here, before the request leaves. The backend
 * enforces 10MB in code but never configures spring.servlet.multipart, so
 * Boot's 1MB default applies and anything larger returns a raw 500 rather
 * than a 413 (CODE_REVIEW.md H-5). Rejecting at the edge means the user
 * gets an accurate message regardless of when that is fixed.
 */
export const POST = withAuth<Params>(async ({ session, params, request }) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return fail(400, "Aucun fichier fourni.");
  }
  if (file.size === 0) {
    return fail(400, "Ce fichier est vide.");
  }
  if (file.size > MAX_BYTES) {
    return fail(413, "Ce fichier dépasse la taille maximale de 10 Mo.");
  }
  if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
    return fail(415, "Format non accepté. Utilisez un PDF, un JPEG ou un PNG.");
  }

  return proxyFormData(session, `/cases/${params.id}/documents`, formData);
});
