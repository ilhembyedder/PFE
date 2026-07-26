import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, isLocale } from "./config";
import { PHASES, RELIABILITY } from "@/types/api";

/**
 * Catalogue integrity.
 *
 * The main risk with two languages is drift: a key added to one file and
 * forgotten in the other, which renders a bracketed key or a blank label in
 * production. These tests make that a build failure instead.
 */

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flatten(value, path);
  });
}

/**
 * Extracts {placeholder} names.
 *
 * The name must be followed by `,` or `}` so ICU branch BODIES are not
 * mistaken for placeholders: in `{count, plural, =0 {No cases} ...}` the
 * token `{No cases}` is a body, not an argument, and an earlier version of
 * this helper captured "No" and "Aucun" as placeholder names, reporting a
 * mismatch on two perfectly correct messages.
 */
function placeholders(message: string): string[] {
  const found = new Set<string>();
  for (const match of message.matchAll(/\{(\w+)\s*(?=[,}])/g)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found].sort();
}

function valueAt(tree: Tree, path: string): string {
  let node: string | Tree = tree;
  for (const segment of path.split(".")) {
    node = (node as Tree)[segment]!;
  }
  return node as string;
}

const frKeys = flatten(fr as Tree);
const enKeys = flatten(en as Tree);

describe("message catalogues", () => {
  it("both define at least the full surface", () => {
    expect(frKeys.length).toBeGreaterThan(200);
  });

  it("French has no key English is missing", () => {
    expect(enKeys.filter((k) => !frKeys.includes(k))).toEqual([]);
  });

  it("English has no key French is missing", () => {
    expect(frKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
  });

  it("no message is empty or whitespace", () => {
    const empty: string[] = [];
    for (const [name, tree] of [
      ["fr", fr as Tree],
      ["en", en as Tree],
    ] as const) {
      for (const key of flatten(tree)) {
        if (valueAt(tree, key).trim().length === 0) empty.push(`${name}:${key}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it("matching keys use the same placeholders", () => {
    // A mismatch here means one language silently drops an interpolated
    // value: "Delete {name}?" rendering as "Delete?".
    const mismatched = frKeys
      .map((key) => {
        const a = placeholders(valueAt(fr as Tree, key));
        const b = placeholders(valueAt(en as Tree, key));
        return a.join(",") === b.join(",") ? null : `${key}: fr(${a}) vs en(${b})`;
      })
      .filter(Boolean);
    expect(mismatched).toEqual([]);
  });

  describe("domain enums are fully covered", () => {
    it.each(LOCALES)("%s translates every phase", (locale) => {
      const tree = (locale === "fr" ? fr : en) as unknown as Record<string, Tree>;
      for (const phase of PHASES) {
        expect(typeof tree.phases?.[phase]).toBe("string");
        expect(typeof tree.phasesShort?.[phase]).toBe("string");
      }
    });

    it.each(LOCALES)("%s translates every reliability state", (locale) => {
      const tree = (locale === "fr" ? fr : en) as unknown as Record<string, Tree>;
      // Including the two frontend-only states the UI derives itself.
      for (const state of [...RELIABILITY, "NOT_COMPUTABLE", "NOT_VALUED"]) {
        expect(typeof tree.reliability?.[state]).toBe("string");
      }
    });

    it.each(LOCALES)("%s translates every role and alert type", (locale) => {
      const tree = (locale === "fr" ? fr : en) as unknown as Record<string, Tree>;
      for (const role of ["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE"]) {
        expect(typeof tree.roles?.[role]).toBe("string");
      }
      for (const type of [
        "DORMANCY",
        "DEADLINE",
        "MISSING_PREREQUISITE",
        "VEHICLE_DISCREPANCY",
      ]) {
        expect(typeof tree.alertTypes?.[type]).toBe("string");
      }
    });
  });

  it("the two languages actually differ", () => {
    // Guards against a catalogue being copied rather than translated.
    const identical = frKeys.filter(
      (key) => valueAt(fr as Tree, key) === valueAt(en as Tree, key),
    );
    // Proper nouns and symbols legitimately match; anything more means a
    // section was never translated.
    expect(identical.length).toBeLessThan(frKeys.length * 0.15);
  });
});

describe("locale config", () => {
  it("declares French as the default", () => {
    expect(DEFAULT_LOCALE).toBe("fr");
    expect(LOCALES).toContain("fr");
    expect(LOCALES).toContain("en");
  });

  it("labels each locale in its own language", () => {
    expect(LOCALE_LABELS.fr).toBe("Français");
    expect(LOCALE_LABELS.en).toBe("English");
  });

  it("narrows only known locales", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});
