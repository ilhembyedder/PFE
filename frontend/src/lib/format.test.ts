import {
  formatMoney,
  formatPercent,
  phaseLabel,
  resolveReliability,
  reliabilityTone,
  statusLabel,
  roleLabel,
  initials,
  daysSince,
} from "./format";

/**
 * The copy register and money handling.
 *
 * resolveReliability is the important one: it is the frontend's independent
 * guard against CODE_REVIEW.md H-21, where the backend labels an uncomputed
 * comparison RELIABLE.
 */

describe("copy register", () => {
  it("maps every phase to French", () => {
    expect(phaseLabel("PRE_CONTENTIEUX")).toBe("Pré-contentieux");
    expect(phaseLabel("MISE_EN_DEMEURE")).toBe("Mise en demeure");
    expect(phaseLabel("SAISIE")).toBe("Saisie du véhicule");
    expect(phaseLabel("VENTE")).toBe("Vente");
    expect(phaseLabel("CLOTURE")).toBe("Clôture");
  });

  it("maps status and role", () => {
    expect(statusLabel("TERMINATED")).toBe("Résilié");
    expect(roleLabel("GESTIONNAIRE")).toBe("Gestionnaire");
    expect(roleLabel("SUPER_ADMIN")).toBe("Super administrateur");
  });

  it("falls back to the raw value rather than rendering nothing", () => {
    expect(phaseLabel("UNKNOWN_PHASE")).toBe("UNKNOWN_PHASE");
  });

  it("renders an em dash for absent values", () => {
    expect(phaseLabel(null)).toBe("—");
    expect(statusLabel(undefined)).toBe("—");
  });
});

describe("formatMoney", () => {
  it("divides cents and formats in French", () => {
    // Non-breaking spaces are expected in fr-FR output.
    expect(formatMoney(2_200_000, "EUR")).toMatch(/22[\s\u00A0\u202F]000,00/);
  });

  it("uses the record's currency, never a hardcoded one", () => {
    expect(formatMoney(100_000, "TND")).toContain("TND");
    expect(formatMoney(100_000, "EUR")).toMatch(/€/);
  });

  it("handles zero as a real value, not as absent", () => {
    expect(formatMoney(0, "EUR")).toMatch(/0,00/);
  });

  it("returns an em dash for null or undefined", () => {
    expect(formatMoney(null, "EUR")).toBe("—");
    expect(formatMoney(undefined, "EUR")).toBe("—");
  });

  it("degrades gracefully on an invalid currency code", () => {
    expect(formatMoney(150_000, "NOTACODE")).toMatch(/1[\s\u00A0\u202F]500,00/);
  });
});

describe("formatPercent", () => {
  it("takes its sign from the deviation, not the magnitude", () => {
    // The backend stores the percentage as an absolute value; direction comes
    // from the signed deviation in cents.
    expect(formatPercent(16.4, -360_000)).toMatch(/^\u221216,4/);
    expect(formatPercent(16.4, 360_000)).toMatch(/^\+16,4/);
  });

  it("uses a true minus sign, not a hyphen", () => {
    expect(formatPercent(5, -1)).toContain("\u2212");
    expect(formatPercent(5, -1)).not.toContain("-");
  });

  it("omits the sign at zero", () => {
    expect(formatPercent(0, 0)).not.toMatch(/[+\u2212]/);
  });

  it("accepts a string, as BigDecimal serialises to one", () => {
    expect(formatPercent("12.50", -1)).toMatch(/12,5/);
  });

  it("returns an em dash for null or unparseable input", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent("abc")).toBe("—");
  });
});

describe("resolveReliability", () => {
  const base = {
    reliabilityIndicator: "RELIABLE" as const,
    initialResidualValueCents: 2_200_000,
    marketValueCents: 1_840_000,
  };

  it("passes the backend indicator through when the comparison is valid", () => {
    expect(resolveReliability(base)).toBe("RELIABLE");
    expect(resolveReliability({ ...base, reliabilityIndicator: "CRITICAL_RISK" })).toBe(
      "CRITICAL_RISK",
    );
  });

  describe("guards against H-21", () => {
    // The backend never computes the percentage when the residual is <= 0, so
    // the uncomputed 0.0 falls through its band check and returns RELIABLE.
    // A green badge on a comparison that never ran is the worst possible
    // output here, so the UI decides for itself.
    it("returns NOT_COMPUTABLE for a zero residual even when told RELIABLE", () => {
      expect(
        resolveReliability({ ...base, initialResidualValueCents: 0 }),
      ).toBe("NOT_COMPUTABLE");
    });

    it("returns NOT_COMPUTABLE for a null residual", () => {
      expect(
        resolveReliability({ ...base, initialResidualValueCents: null }),
      ).toBe("NOT_COMPUTABLE");
    });

    it("returns NOT_COMPUTABLE for a negative residual", () => {
      expect(
        resolveReliability({ ...base, initialResidualValueCents: -100 }),
      ).toBe("NOT_COMPUTABLE");
    });
  });

  it("returns NOT_VALUED when no market value exists", () => {
    expect(resolveReliability({ ...base, marketValueCents: null })).toBe("NOT_VALUED");
    expect(resolveReliability(null)).toBe("NOT_VALUED");
    expect(resolveReliability(undefined)).toBe("NOT_VALUED");
  });

  it("returns NOT_VALUED when the indicator is missing entirely", () => {
    expect(resolveReliability({ ...base, reliabilityIndicator: null })).toBe("NOT_VALUED");
  });
});

describe("reliabilityTone", () => {
  it("maps each state to its semantic tone", () => {
    expect(reliabilityTone("RELIABLE")).toBe("success");
    expect(reliabilityTone("MODERATE_RISK")).toBe("warning");
    expect(reliabilityTone("CRITICAL_RISK")).toBe("critical");
  });

  it("keeps the non-computable states neutral, never green", () => {
    expect(reliabilityTone("NOT_COMPUTABLE")).toBe("neutral");
    expect(reliabilityTone("NOT_VALUED")).toBe("neutral");
  });
});

describe("initials", () => {
  it("takes at most two initials", () => {
    expect(initials("Sonia Benali")).toBe("SB");
    expect(initials("Jean Pierre Marie Dupont")).toBe("JP");
  });

  it("returns a placeholder rather than an empty string", () => {
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});

describe("daysSince", () => {
  it("counts whole days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(daysSince(threeDaysAgo)).toBe(3);
  });

  it("returns null for absent or invalid input", () => {
    expect(daysSince(null)).toBeNull();
    expect(daysSince("not-a-date")).toBeNull();
  });
});
