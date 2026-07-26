/**
 * AES-256-GCM sealing for the session cookie.
 *
 * The backend JWT never reaches the browser. It is sealed here, stored as
 * an HttpOnly cookie, and unsealed server-side on every BFF request.
 * Because GCM is authenticated, a successful decrypt is itself an integrity
 * check: a forged or tampered cookie cannot decrypt.
 *
 * Uses crypto.subtle so the Edge runtime (proxy.ts) can import this too.
 */

const SEPARATOR = ":";
const IV_BYTES = 12;

/**
 * Fails closed, always.
 *
 * The previous implementation fell back to a hardcoded secret whenever
 * NODE_ENV was not "production" — and the Dockerfile ran `next dev`, so the
 * container silently sealed every session with a secret published in this
 * repository. There is no safe default for this value.
 */
function getSecret(): string {
  const secret = process.env.BFF_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "BFF_COOKIE_SECRET is required and must be at least 32 characters. " +
        "Generate one with: openssl rand -base64 32",
    );
  }
  return secret;
}

let cachedKey: Promise<CryptoKey> | null = null;

function getCryptoKey(): Promise<CryptoKey> {
  cachedKey ??= (async () => {
    const material = new TextEncoder().encode(getSecret());
    const hash = await crypto.subtle.digest("SHA-256", material);
    return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);
  })();
  return cachedKey;
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// Explicitly backed by ArrayBuffer, not ArrayBufferLike: crypto.subtle
// requires a BufferSource, which excludes SharedArrayBuffer.
function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Returns `IV_HEX:CIPHERTEXT_HEX`. */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `${toHex(iv)}${SEPARATOR}${toHex(new Uint8Array(ciphertext))}`;
}

/**
 * Returns the plaintext, or null if the input is malformed, tampered with,
 * or sealed under a different key. Never throws on bad input: a forged
 * cookie is an expected condition, not an exceptional one.
 */
export async function decrypt(sealed: string | undefined): Promise<string | null> {
  if (!sealed) return null;

  const parts = sealed.split(SEPARATOR);
  if (parts.length !== 2) return null;

  const [ivHex, cipherHex] = parts;
  if (!ivHex || !cipherHex) return null;

  const iv = fromHex(ivHex);
  const ciphertext = fromHex(cipherHex);
  if (!iv || !ciphertext || iv.length !== IV_BYTES) return null;

  try {
    const key = await getCryptoKey();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    // Authentication tag mismatch: tampered, or a different key.
    return null;
  }
}
