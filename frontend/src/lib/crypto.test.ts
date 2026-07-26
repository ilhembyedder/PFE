/**
 * The cookie sealing layer. Untested before this rebuild, despite being the
 * only thing standing between a forged cookie and an authenticated session.
 */

const SECRET = "test-secret-at-least-32-characters-long";

describe("crypto", () => {
  const original = process.env.BFF_COOKIE_SECRET;

  beforeEach(() => {
    jest.resetModules();
    process.env.BFF_COOKIE_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.BFF_COOKIE_SECRET = original;
  });

  const load = async () => import("./crypto");

  it("round-trips a value", async () => {
    const { encrypt, decrypt } = await load();
    const token = "header.payload.signature";
    expect(await decrypt(await encrypt(token))).toBe(token);
  });

  it("produces a different ciphertext each time (random IV)", async () => {
    const { encrypt, decrypt } = await load();
    const a = await encrypt("same");
    const b = await encrypt("same");
    expect(a).not.toBe(b);
    expect(await decrypt(a)).toBe("same");
    expect(await decrypt(b)).toBe("same");
  });

  it("rejects a tampered ciphertext", async () => {
    const { encrypt, decrypt } = await load();
    const sealed = await encrypt("token");
    const [iv, cipher] = sealed.split(":");
    // Flip one nibble. AES-GCM's auth tag must catch it.
    const flipped = cipher[0] === "a" ? "b" : "a";
    expect(await decrypt(`${iv}:${flipped}${cipher.slice(1)}`)).toBeNull();
  });

  it("rejects a value sealed under a different key", async () => {
    const { encrypt } = await load();
    const sealed = await encrypt("token");

    jest.resetModules();
    process.env.BFF_COOKIE_SECRET = "a-completely-different-secret-32ch!!";
    const { decrypt } = await load();

    expect(await decrypt(sealed)).toBeNull();
  });

  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["no separator", "deadbeef"],
    ["too many parts", "aa:bb:cc"],
    ["non-hex", "zzzz:zzzz"],
    ["odd-length hex", "abc:def"],
    ["wrong IV length", "aabb:ccddeeff"],
  ])("returns null for a malformed cookie: %s", async (_label, input) => {
    const { decrypt } = await load();
    expect(await decrypt(input as string | undefined)).toBeNull();
  });

  describe("fails closed", () => {
    // The previous implementation returned a hardcoded fallback secret
    // whenever NODE_ENV !== "production" — and the Dockerfile ran `next
    // dev`, so containers sealed sessions with a secret published in this
    // repository.
    it("throws when the secret is missing", async () => {
      delete process.env.BFF_COOKIE_SECRET;
      const { encrypt } = await load();
      await expect(encrypt("x")).rejects.toThrow(/BFF_COOKIE_SECRET/);
    });

    it("throws when the secret is too short", async () => {
      process.env.BFF_COOKIE_SECRET = "short";
      const { encrypt } = await load();
      await expect(encrypt("x")).rejects.toThrow(/32 characters/);
    });

    it("throws regardless of NODE_ENV", async () => {
      delete process.env.BFF_COOKIE_SECRET;
      const { encrypt } = await load();
      await expect(encrypt("x")).rejects.toThrow();
    });
  });
});

// No static imports above: this marks the file as a module so its
// top-level constants are scoped to it.
export {};
