import { withAuth, proxyJson, proxyFormData, buildQuery, fail } from "@/lib/bff";

const ENTITY_TYPES = ["client", "contract", "vehicle"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/jpg", "image/png"] as const;

const isEntityType = (v: string | null): v is EntityType =>
  v !== null && ENTITY_TYPES.includes(v as EntityType);

/**
 * GET /api/documents?entityType=&entityId=
 *
 * Parameters are allowlisted and re-encoded rather than interpolated. The
 * previous version built the backend URL by string concatenation, so a
 * value containing `&` could inject additional backend query parameters.
 */
export const GET = withAuth(async ({ session, request }) => {
  const search = request.nextUrl.searchParams;
  const entityType = search.get("entityType");

  if (!isEntityType(entityType)) {
    return fail(400, "Type d'entité invalide.");
  }
  if (!search.get("entityId")) {
    return fail(400, "Identifiant d'entité requis.");
  }

  const query = buildQuery(search, ["entityType", "entityId"]);
  return proxyJson(session, `/documents${query}`);
});

export const POST = withAuth(async ({ session, request }) => {
  const formData = await request.formData();
  const file = formData.get("file");
  const entityType = formData.get("entityType");

  if (!(file instanceof File)) return fail(400, "Aucun fichier fourni.");
  if (file.size === 0) return fail(400, "Ce fichier est vide.");
  if (file.size > MAX_BYTES) {
    return fail(413, "Ce fichier dépasse la taille maximale de 10 Mo.");
  }
  if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
    return fail(415, "Format non accepté. Utilisez un PDF, un JPEG ou un PNG.");
  }
  if (typeof entityType !== "string" || !isEntityType(entityType)) {
    return fail(400, "Type d'entité invalide.");
  }

  return proxyFormData(session, "/documents", formData);
});
