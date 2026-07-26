/**
 * Session unsealing. Covers the two defects this replaces: a role read from
 * a client-writable cookie (C6), and a token whose expiry was never checked.
 */

const SECRET = "test-secret-at-least-32-characters-long";

const NOW_SECONDS = Math.floor(Date.now() / 1000);

function makeJwt(claims: Record<string, unknown>): string {
  const b64 = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  // The signature is never verified here: authenticity comes from the
  // AES-GCM cookie seal. A placeholder is correct for these tests.
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(claims)}.signature`;
}

const validClaims = {
  sub: "sonia@medilease.tn",
  userId: "11111111-1111-1111-1111-111111111111",
  tenantId: "22222222-2222-2222-2222-222222222222",
  role: "GESTIONNAIRE",
  name: "Sonia B.",
  exp: NOW_SECONDS + 3600,
};

describe("readSession", () => {
  const original = process.env.BFF_COOKIE_SECRET;

  beforeEach(() => {
    jest.resetModules();
    process.env.BFF_COOKIE_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.BFF_COOKIE_SECRET = original;
  });

  async function seal(claims: Record<string, unknown>) {
    const { encrypt } = await import("@/lib/crypto");
    return encrypt(makeJwt(claims));
  }

  const load = async () => import("./session");

  it("reads a valid session", async () => {
    const { readSession } = await load();
    const session = await readSession(await seal(validClaims));

    expect(session).toMatchObject({
      userId: validClaims.userId,
      email: validClaims.sub,
      name: "Sonia B.",
      role: "GESTIONNAIRE",
      tenantId: validClaims.tenantId,
    });
  });

  it("accepts a super admin with no tenant", async () => {
    const { readSession } = await load();
    const session = await readSession(
      await seal({ ...validClaims, role: "SUPER_ADMIN", tenantId: undefined }),
    );
    expect(session?.role).toBe("SUPER_ADMIN");
    expect(session?.tenantId).toBeUndefined();
  });

  it("rejects an expired token", async () => {
    const { readSession } = await load();
    const expired = await seal({ ...validClaims, exp: NOW_SECONDS - 1 });
    expect(await readSession(expired)).toBeNull();
  });

  it("rejects a token expiring exactly now", async () => {
    const { readSession } = await load();
    expect(await readSession(await seal({ ...validClaims, exp: NOW_SECONDS }))).toBeNull();
  });

  it("rejects an unrecognised role", async () => {
    const { readSession } = await load();
    const forged = await seal({ ...validClaims, role: "PLATFORM_OWNER" });
    expect(await readSession(forged)).toBeNull();
  });

  it.each(["sub", "userId", "role", "exp"])(
    "rejects a token missing %s",
    async (claim) => {
      const { readSession } = await load();
      const claims = { ...validClaims } as Record<string, unknown>;
      delete claims[claim];
      expect(await readSession(await seal(claims))).toBeNull();
    },
  );

  it("rejects a non-numeric exp", async () => {
    const { readSession } = await load();
    expect(await readSession(await seal({ ...validClaims, exp: "soon" }))).toBeNull();
  });

  it("rejects an unsealed JWT presented directly", async () => {
    // The cookie must be sealed. A raw JWT is not a valid cookie value.
    const { readSession } = await load();
    expect(await readSession(makeJwt(validClaims))).toBeNull();
  });

  it("rejects a malformed JWT inside a valid seal", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const { readSession } = await load();
    expect(await readSession(await encrypt("not-a-jwt"))).toBeNull();
  });

  it.each([undefined, ""])("rejects an absent cookie (%s)", async (value) => {
    const { readSession } = await load();
    expect(await readSession(value)).toBeNull();
  });

  it("decodes base64url payloads containing - and _", async () => {
    const { readSession } = await load();
    // "?" and "~" force base64 chars that differ between base64 and base64url.
    const session = await readSession(
      await seal({ ...validClaims, name: "Sonia ?~ B." }),
    );
    expect(session?.name).toBe("Sonia ?~ B.");
  });
});

describe("toPublicSession", () => {
  it("never exposes the token", async () => {
    process.env.BFF_COOKIE_SECRET = SECRET;
    const { toPublicSession } = await import("./session");
    const shaped = toPublicSession({
      token: "header.payload.signature",
      userId: "u",
      email: "e",
      name: "n",
      role: "ADMIN",
      tenantId: "t",
      exp: NOW_SECONDS + 60,
    });

    expect(shaped).not.toHaveProperty("token");
    expect(shaped).not.toHaveProperty("exp");
    expect(Object.keys(shaped).sort()).toEqual([
      "email",
      "name",
      "role",
      "tenantId",
      "userId",
    ]);
  });
});

// No static imports above: this marks the file as a module so its
// top-level constants are scoped to it.
export {};
