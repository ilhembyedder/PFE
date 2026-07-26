import { ApiError, isApiError } from "./api-error";

describe("ApiError", () => {
  it("carries status, code and details", () => {
    const error = new ApiError(409, "Prérequis non satisfait", {
      code: "PREREQUISITE",
      details: ["Aucune estimation IA validée"],
    });

    expect(error.status).toBe(409);
    expect(error.code).toBe("PREREQUISITE");
    expect(error.details).toEqual(["Aucune estimation IA validée"]);
    expect(error.name).toBe("ApiError");
    expect(error).toBeInstanceOf(Error);
  });

  describe("retry policy", () => {
    // docs/DESIGN_SCREENS.md §12: retry 5xx and network only. Retrying a
    // 4xx just delays a message the user needs to see.
    it.each([400, 401, 403, 404, 409, 413, 422])(
      "does not retry %i",
      (status) => {
        expect(new ApiError(status, "x").isRetryable).toBe(false);
      },
    );

    it.each([500, 502, 503, 504])("retries %i", (status) => {
      expect(new ApiError(status, "x").isRetryable).toBe(true);
    });

    it("retries a network failure", () => {
      const error = ApiError.network();
      expect(error.isNetwork).toBe(true);
      expect(error.isRetryable).toBe(true);
      // Distinct from a server error, per the error taxonomy.
      expect(error.message).toBe("Connexion au serveur impossible.");
    });
  });

  describe("isApiError", () => {
    it("narrows an ApiError", () => {
      expect(isApiError(new ApiError(500, "x"))).toBe(true);
    });

    it("rejects a plain Error and non-errors", () => {
      expect(isApiError(new Error("x"))).toBe(false);
      expect(isApiError({ status: 500 })).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
    });
  });
});
