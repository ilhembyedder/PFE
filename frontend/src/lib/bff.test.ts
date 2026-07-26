/**
 * @jest-environment node
 */

/**
 * The BFF wrapper. These tests exist because the defects they cover were
 * introduced by copy-paste across 26 near-identical handlers:
 *
 *  - super-admin and admin routes forwarded any valid session (C6)
 *  - `params` was destructured synchronously in six places, so the id
 *    reached the backend as the string "undefined"
 */

import { NextRequest } from "next/server";

const SECRET = "test-secret-at-least-32-characters-long";
const NOW = Math.floor(Date.now() / 1000);

function makeJwt(claims: Record<string, unknown>): string {
  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;
}

const claimsFor = (role: string) => ({
  sub: "user@example.com",
  userId: "user-1",
  tenantId: "tenant-1",
  role,
  name: "Test User",
  exp: NOW + 3600,
});

describe("withAuth", () => {
  const original = process.env.BFF_COOKIE_SECRET;

  beforeEach(() => {
    jest.resetModules();
    process.env.BFF_COOKIE_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.BFF_COOKIE_SECRET = original;
  });

  async function requestWith(role?: string): Promise<NextRequest> {
    const request = new NextRequest("http://localhost/api/test");
    if (role) {
      const { encrypt } = await import("@/lib/crypto");
      const { SESSION_COOKIE } = await import("@/lib/auth/session");
      request.cookies.set(SESSION_COOKIE, await encrypt(makeJwt(claimsFor(role))));
    }
    return request;
  }

  it("rejects an anonymous request with 401", async () => {
    const { withAuth } = await import("./bff");
    const handler = withAuth(async () => Response.json({ ok: true }));

    const response = await handler(await requestWith());
    expect(response.status).toBe(401);
  });

  it("rejects a forged cookie with 401", async () => {
    const { withAuth } = await import("./bff");
    const { SESSION_COOKIE } = await import("@/lib/auth/session");
    const handler = withAuth(async () => Response.json({ ok: true }));

    const request = new NextRequest("http://localhost/api/test");
    request.cookies.set(SESSION_COOKIE, "deadbeef:cafebabe");

    expect((await handler(request)).status).toBe(401);
  });

  it("passes an authenticated session to the handler", async () => {
    const { withAuth } = await import("./bff");
    const handler = withAuth(async ({ session }) =>
      Response.json({ email: session.email, role: session.role }),
    );

    const response = await handler(await requestWith("GESTIONNAIRE"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "user@example.com",
      role: "GESTIONNAIRE",
    });
  });

  describe("role gate", () => {
    it("rejects a manager reaching a SUPER_ADMIN route with 403", async () => {
      const { withAuth } = await import("./bff");
      const handler = withAuth(async () => Response.json({ ok: true }), {
        roles: ["SUPER_ADMIN"],
      });

      const response = await handler(await requestWith("GESTIONNAIRE"));
      expect(response.status).toBe(403);
    });

    it("rejects a manager reaching an ADMIN route with 403", async () => {
      const { withAuth } = await import("./bff");
      const handler = withAuth(async () => Response.json({ ok: true }), {
        roles: ["ADMIN"],
      });

      expect((await handler(await requestWith("GESTIONNAIRE"))).status).toBe(403);
    });

    it("admits the permitted role", async () => {
      const { withAuth } = await import("./bff");
      const handler = withAuth(async () => Response.json({ ok: true }), {
        roles: ["SUPER_ADMIN"],
      });

      expect((await handler(await requestWith("SUPER_ADMIN"))).status).toBe(200);
    });

    it("admits any authenticated role when unrestricted", async () => {
      const { withAuth } = await import("./bff");
      const handler = withAuth(async () => Response.json({ ok: true }));

      for (const role of ["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE"]) {
        expect((await handler(await requestWith(role))).status).toBe(200);
      }
    });
  });

  describe("params", () => {
    it("awaits params before the handler sees them", async () => {
      const { withAuth } = await import("./bff");
      const handler = withAuth<{ id: string }>(async ({ params }) =>
        Response.json({ id: params.id }),
      );

      const response = await handler(await requestWith("ADMIN"), {
        params: Promise.resolve({ id: "case-42" }),
      });

      // Not the string "undefined", which is what the old handlers sent.
      await expect(response.json()).resolves.toEqual({ id: "case-42" });
    });

    it("defaults to an empty object for static routes", async () => {
      const { withAuth } = await import("./bff");
      const handler = withAuth(async ({ params }) =>
        Response.json({ keys: Object.keys(params) }),
      );

      await expect((await handler(await requestWith("ADMIN"))).json()).resolves.toEqual(
        { keys: [] },
      );
    });
  });

  it("converts a thrown handler error into a 500 without leaking it", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { withAuth } = await import("./bff");
    const handler = withAuth(async () => {
      throw new Error("SELECT * FROM app_user failed: column x does not exist");
    });

    const response = await handler(await requestWith("ADMIN"));
    expect(response.status).toBe(500);
    const body = (await response.json()) as { message: string };
    expect(body.message).not.toMatch(/SELECT/);
    spy.mockRestore();
  });
});

describe("buildQuery", () => {
  it("passes through allowed parameters", async () => {
    const { buildQuery } = await import("./bff");
    const source = new URLSearchParams({ page: "2", size: "20" });
    expect(buildQuery(source, ["page", "size"])).toBe("?page=2&size=20");
  });

  it("drops parameters that are not allowlisted", async () => {
    const { buildQuery } = await import("./bff");
    const source = new URLSearchParams({ page: "2", sortBy: "x", evil: "1" });
    expect(buildQuery(source, ["page"])).toBe("?page=2");
  });

  it("encodes values rather than interpolating them", async () => {
    // The documents proxy previously concatenated these straight into the
    // backend URL, so a value containing & injected extra parameters.
    const { buildQuery } = await import("./bff");
    const source = new URLSearchParams();
    source.set("entityId", "abc&entityType=vehicle&x=1");

    const query = buildQuery(source, ["entityId"]);
    expect(query).toBe("?entityId=abc%26entityType%3Dvehicle%26x%3D1");
    expect([...new URLSearchParams(query.slice(1)).keys()]).toEqual(["entityId"]);
  });

  it("returns an empty string when nothing matches", async () => {
    const { buildQuery } = await import("./bff");
    expect(buildQuery(new URLSearchParams(), ["page"])).toBe("");
    expect(buildQuery(new URLSearchParams({ page: "" }), ["page"])).toBe("");
  });
});
