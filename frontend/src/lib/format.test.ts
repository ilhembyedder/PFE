import {
  EM_DASH,
  daysSince,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatRelative,
  initials,
  intlLocale,
  reliabilityTone,
  resolveReliability,
} from "./format";

/**
 * Locale-aware formatting, exercised in BOTH locales.
 *
 * Enum labels are no longer here: they live in messages/{fr,en}.json and are
 * covered by messages.test.ts, which checks the two catalogues have identical
 * shapes so a key cannot exist in one language only.
 *
 * resolveReliability is the important one: it is the frontend's independent
 * guard against CODE_REVIEW.md H-21, where the backend labels an uncomputed
 * comparison RELIABLE.
 */

describe("intlLocale", () => {
  it("maps to full BCP 47 tags so grouping and currency behave", () => {
    expect(intlLocale("fr")).toBe("fr-FR");
    expect(intlLocale("en")).toBe("en-GB");
  });

  it("falls back to the default for unknown or absent input", () => {
    expect(intlLocale("de")).toBe("fr-FR");
    expect(intlLocale(undefined)).toBe("fr-FR");
  });
});

describe("formatMoney", () => {
  it("divides cents and groups per locale", () => {
    // French uses a narrow/non-breaking space; English uses a comma.
    expect(formatMoney(2_200_000, "EUR", "fr")).toMatch(/22[\s\u00A0\u202F]000,00/);
    expect(formatMoney(2_200_000, "EUR", "en")).toMatch(/22,000\.00/);
  });

  it("uses the record's currency, never a hardcoded one", () => {
    expect(formatMoney(100_000, "TND", "fr")).toContain("TND");
    expect(formatMoney(100_000, "EUR", "fr")).toMatch(/€/);
    expect(formatMoney(100_000, "TND", "en")).toContain("TND");
  });

  it("treats zero as a real value, not as absent", () => {
    expect(formatMoney(0, "EUR", "fr")).toMatch(/0,00/);
    expect(formatMoney(0, "EUR", "en")).toMatch(/0\.00/);
  });

  it("returns an em dash for null or undefined", () => {
    expect(formatMoney(null, "EUR", "fr")).toBe(EM_DASH);
    expect(formatMoney(undefined, "EUR", "en")).toBe(EM_DASH);
  });

  it("degrades gracefully on an invalid currency code", () => {
    expect(formatMoney(150_000, "NOTACODE", "fr")).toMatch(/1[\s\u00A0\u202F]500,00/);
  });
});

describe("formatPercent", () => {
  it("takes its sign from the deviation, not the magnitude", () => {
    // The backend stores an absolute percentage; direction comes from the
    // signed deviation in cents.
    expect(formatPercent(16.4, -360_000, "fr")).toMatch(/^\u221216,4/);
    expect(formatPercent(16.4, 360_000, "fr")).toMatch(/^\+16,4/);
    expect(formatPercent(16.4, -360_000, "en")).toMatch(/^\u221216\.4/);
  });

  it("uses a true minus sign, never a hyphen", () => {
    const fr = formatPercent(5, -1, "fr");
    expect(fr).toContain("\u2212");
    expect(fr).not.toContain("-");
  });

  it("inserts a non-breaking space before % in French only", () => {
    expect(formatPercent(12, -1, "fr")).toContain("\u00A0%");
    expect(formatPercent(12, -1, "en")).not.toContain("\u00A0%");
    expect(formatPercent(12, -1, "en")).toMatch(/12\.0%$/);
  });

  it("omits the sign at zero", () => {
    expect(formatPercent(0, 0, "fr")).not.toMatch(/[+\u2212]/);
  });

  it("accepts a string, since BigDecimal serialises to one", () => {
    expect(formatPercent("12.50", -1, "fr")).toMatch(/12,5/);
  });

  it("returns an em dash for null or unparseable input", () => {
    expect(formatPercent(null, null, "fr")).toBe(EM_DASH);
    expect(formatPercent("abc", null, "fr")).toBe(EM_DASH);
  });
});

describe("formatNumber", () => {
  it("groups per locale", () => {
    expect(formatNumber(87_000, "fr")).toMatch(/87[\s\u00A0\u202F]000/);
    expect(formatNumber(87_000, "en")).toBe("87,000");
  });

  it("returns an em dash for absent or non-finite input", () => {
    expect(formatNumber(null, "fr")).toBe(EM_DASH);
    expect(formatNumber(Number.NaN, "fr")).toBe(EM_DASH);
  });
});

describe("formatDate", () => {
  const iso = "2026-03-12T14:30:00Z";

  it("renders long month names per locale", () => {
    expect(formatDate(iso, "fr")).toMatch(/mars/);
    expect(formatDate(iso, "en")).toMatch(/March/);
  });

  it("returns an em dash for absent or invalid input", () => {
    expect(formatDate(null, "fr")).toBe(EM_DASH);
    expect(formatDate("not-a-date", "fr")).toBe(EM_DASH);
  });
});

describe("formatRelative", () => {
  it("renders naturally in both locales", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(formatRelative(threeDaysAgo, "fr")).toMatch(/il y a 3 jours/);
    expect(formatRelative(threeDaysAgo, "en")).toMatch(/3 days ago/);
  });

  it("falls back to an absolute date beyond a week", () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 86_400_000).toISOString();
    expect(formatRelative(twoMonthsAgo, "en")).toMatch(/\d{4}/);
  });

  it("returns an em dash for absent input", () => {
    expect(formatRelative(null, "fr")).toBe(EM_DASH);
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
    it.each([0, null, -100])(
      "returns NOT_COMPUTABLE for a residual of %p even when told RELIABLE",
      (residual) => {
        expect(
          resolveReliability({ ...base, initialResidualValueCents: residual }),
        ).toBe("NOT_COMPUTABLE");
      },
    );
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
