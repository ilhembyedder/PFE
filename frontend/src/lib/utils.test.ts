import { cn } from "./utils";

/**
 * Guards the typography namespace against tailwind-merge.
 *
 * The type roles were originally named `text-figure-hero`, `text-body` and so
 * on. tailwind-merge classified them as belonging to Tailwind's own `text-*`
 * group and SILENTLY DROPPED them whenever they were combined with a colour:
 * cn("text-figure-hero", "text-warning") returned just "text-warning", so
 * every figure on the valuation card lost its size and weight.
 *
 * They are now `type-*`, outside Tailwind's namespace. These tests exist so a
 * future rename back into a Tailwind-owned prefix fails loudly here rather
 * than degrading the interface invisibly.
 */

const ROLES = [
  "type-figure-hero",
  "type-figure",
  "type-display",
  "type-headline",
  "type-title",
  "type-body",
  "type-body-sm",
  "type-label",
  "type-caption",
  "type-identifier",
] as const;

const COLOURS = [
  "text-foreground",
  "text-muted-foreground",
  "text-primary",
  "text-warning",
  "text-success",
  "text-destructive",
] as const;

describe("cn", () => {
  it.each(ROLES)("keeps %s when combined with a colour", (role) => {
    for (const colour of COLOURS) {
      const result = cn(role, colour);
      expect(result).toContain(role);
      expect(result).toContain(colour);
    }
  });

  it("keeps a type role alongside a utility that sets text alignment", () => {
    const result = cn("type-figure", "text-right", "text-muted-foreground");
    expect(result).toContain("type-figure");
    expect(result).toContain("text-right");
    expect(result).toContain("text-muted-foreground");
  });

  it("still deduplicates genuinely conflicting Tailwind utilities", () => {
    // The merge behaviour we do want must keep working.
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-foreground", "text-primary")).toBe("text-primary");
  });

  it("merges conditional and array inputs", () => {
    expect(cn("type-body", false && "hidden", ["px-2", null])).toBe("type-body px-2");
  });
});
