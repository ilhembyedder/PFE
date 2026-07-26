import { render, screen } from "@/test/render";
import { ValuationCard } from "./valuation-card";
import type { Valuation } from "@/types/api";

/**
 * The signature component's three guard states.
 *
 * The zero-residual case is the one that matters most: the backend returns
 * RELIABLE for a comparison it never performed (CODE_REVIEW.md H-21), and a
 * green "Fiable" badge on that is the most damaging thing this screen can
 * display. These tests assert the UI refuses to repeat it.
 */

const CASE_ID = "11111111-1111-1111-1111-111111111111";

const valuation = (overrides: Partial<Valuation> = {}): Valuation => ({
  caseId: CASE_ID,
  marketValueCents: 1_840_000,
  initialResidualValueCents: 2_200_000,
  deviationValueCents: -360_000,
  deviationPercentage: 16.36,
  reliabilityIndicator: "MODERATE_RISK",
  currencyCode: "EUR",
  ...overrides,
});

describe("ValuationCard", () => {
  it("leads with the deviation, not the market value", () => {
    render(<ValuationCard valuation={valuation()} caseId={CASE_ID} />);

    // The hero figure is the deviation percentage; market and residual are
    // its inputs and are rendered smaller.
    const hero = document.querySelector(".type-figure-hero");
    expect(hero?.textContent).toMatch(/16,4/);
    expect(hero?.textContent).toMatch(/%/);
  });

  it("labels the reliability band with an icon, in each locale", () => {
    render(<ValuationCard valuation={valuation()} caseId={CASE_ID} />);
    expect(screen.getByText("Écart modéré")).toBeInTheDocument();

    render(<ValuationCard valuation={valuation()} caseId={CASE_ID} />, { locale: "en" });
    expect(screen.getByText("Moderate deviation")).toBeInTheDocument();
  });

  it("renders the whole card in English when the locale is English", () => {
    render(<ValuationCard valuation={valuation()} caseId={CASE_ID} />, { locale: "en" });
    expect(screen.getByText("Value estimate")).toBeInTheDocument();
    expect(screen.getByText("Market value")).toBeInTheDocument();
    expect(screen.getByText("Residual value")).toBeInTheDocument();
    // No French must leak through.
    expect(screen.queryByText(/Valeur de marché/)).toBeNull();
  });

  it("exposes an accessible region naming the vehicle", () => {
    render(
      <ValuationCard
        valuation={valuation()}
        caseId={CASE_ID}
        extracted={{ brand: "BMW", model: "520d", year: 2020 }}
      />,
    );
    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-label", expect.stringContaining("BMW"));
  });

  it("shows extracted provenance alongside the figures", () => {
    render(
      <ValuationCard
        valuation={valuation()}
        caseId={CASE_ID}
        extracted={{ brand: "BMW", model: "520d", year: 2020, mileage: 87000 }}
      />,
    );
    expect(screen.getByText(/Extrait du rapport/)).toBeInTheDocument();
    expect(screen.getByText(/BMW · 520d · 2020/)).toBeInTheDocument();
  });

  describe("guard: zero or absent residual (H-21)", () => {
    it("renders Non calculable instead of the backend's RELIABLE", () => {
      render(
        <ValuationCard
          valuation={valuation({
            initialResidualValueCents: 0,
            // The backend really does send this for a zero residual.
            reliabilityIndicator: "RELIABLE",
          })}
          caseId={CASE_ID}
        />,
      );

      expect(screen.getByText("Non calculable")).toBeInTheDocument();
      expect(screen.queryByText("Fiable")).not.toBeInTheDocument();
    });

    it("renders Not computable in English too, never Reliable", () => {
      render(
        <ValuationCard
          valuation={valuation({
            initialResidualValueCents: 0,
            reliabilityIndicator: "RELIABLE",
          })}
          caseId={CASE_ID}
        />,
        { locale: "en" },
      );
      expect(screen.getByText("Not computable")).toBeInTheDocument();
      expect(screen.queryByText("Reliable")).not.toBeInTheDocument();
    });

    it("explains the cause and offers a correction", () => {
      render(
        <ValuationCard
          valuation={valuation({ initialResidualValueCents: 0 })}
          caseId={CASE_ID}
        />,
      );

      expect(screen.getByText(/valeur résiduelle du contrat est nulle/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Corriger le dossier" })).toHaveAttribute(
        "href",
        `/cases/${CASE_ID}?edit=1`,
      );
    });

    it("promotes the market value, which is still real", () => {
      render(
        <ValuationCard
          valuation={valuation({ initialResidualValueCents: 0 })}
          caseId={CASE_ID}
        />,
      );
      const hero = document.querySelector(".type-figure-hero");
      expect(hero?.textContent).toMatch(/18[\s\u00A0\u202F]400,00/);
    });

    it("renders no percentage at all", () => {
      render(
        <ValuationCard
          valuation={valuation({ initialResidualValueCents: null })}
          caseId={CASE_ID}
        />,
      );
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe("guard: deviation above 100%", () => {
    const extreme = valuation({
      initialResidualValueCents: 9_200_000,
      marketValueCents: 1_840_000,
      deviationValueCents: -7_360_000,
      deviationPercentage: 400,
      reliabilityIndicator: "CRITICAL_RISK",
    });

    it("promotes the absolute figure over the percentage", () => {
      render(<ValuationCard valuation={extreme} caseId={CASE_ID} />);
      const hero = document.querySelector(".type-figure-hero");
      // Currency, not "−400,0 %", which cannot be pictured.
      expect(hero?.textContent).toMatch(/73[\s\u00A0\u202F]600,00/);
      expect(hero?.textContent).not.toMatch(/%/);
    });

    it("expresses the magnitude as a multiple", () => {
      render(<ValuationCard valuation={extreme} caseId={CASE_ID} />);
      expect(screen.getByText(/fois inférieure à la valeur résiduelle/)).toBeInTheDocument();
    });

    it("advises checking the residual value without blocking", () => {
      render(<ValuationCard valuation={extreme} caseId={CASE_ID} />);
      expect(screen.getByText(/Écart inhabituel/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Corriger le dossier" })).toBeInTheDocument();
    });

    it("clamps the display at the stored ceiling", () => {
      render(
        <ValuationCard
          valuation={valuation({ deviationPercentage: 999.99, deviationValueCents: null })}
          caseId={CASE_ID}
        />,
      );
      expect(screen.getByText("> 999 %")).toBeInTheDocument();
    });
  });

  it("links to the source report when a document is known", () => {
    render(
      <ValuationCard valuation={valuation()} caseId={CASE_ID} documentId="doc-1" />,
    );
    expect(screen.getByRole("link", { name: /Voir le rapport source/ })).toHaveAttribute(
      "href",
      `/api/cases/${CASE_ID}/documents/doc-1/download`,
    );
  });

  it("omits the source link when no document is known", () => {
    render(<ValuationCard valuation={valuation()} caseId={CASE_ID} />);
    expect(screen.queryByRole("link", { name: /Voir le rapport source/ })).toBeNull();
  });
});
