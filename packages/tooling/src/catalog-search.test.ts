import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { catalogMatcher } from "../../../apps/web/src/lib/catalog-search.ts";

const character = (glyph: string, descriptor: string) => ({
  id: `letter-${descriptor}`, label: `${glyph} · ${descriptor}`,
  groupLabel: descriptor, keywords: [glyph, descriptor, "plain"], glyph,
});

describe("character catalog search", () => {
  const upper = character("A", "uppercase");
  const lower = character("a", "lowercase");
  it("matches literal characters without matching words in every label", () => {
    assert.deepEqual([upper, lower, character("B", "uppercase")].filter(catalogMatcher("A")), [upper]);
    assert.deepEqual([upper, lower].filter(catalogMatcher("a")), [lower]);
    assert.equal(catalogMatcher("uppercase a")(upper), true);
    assert.equal(catalogMatcher("uppercase a")(lower), false);
  });
  it("preserves diacritics, normalizes decomposed Unicode, and matches digraphs", () => {
    assert.equal(catalogMatcher("c")(character("č", "lowercase")), false);
    assert.equal(catalogMatcher("c\u030c")(character("č", "lowercase")), true);
    assert.equal(catalogMatcher("Dž")(character("Dž", "titlecase digraph")), true);
    assert.equal(catalogMatcher("Dž")(character("DŽ", "uppercase digraph")), false);
  });
  it("matches punctuation and currency literally, while descriptions still work", () => {
    assert.equal(catalogMatcher("€")(character("€", "euro")), true);
    assert.equal(catalogMatcher("euro")(character("€", "euro")), true);
    assert.equal(catalogMatcher("+")(character("−", "minus")), false);
    assert.equal(catalogMatcher("7")(character("7", "number")), true);
  });
  it("preserves the existing folded multi-word search for other collections", () => {
    const icon = { id: "flower-arranging", label: "Flower arranging", groupLabel: "Home", keywords: ["cvijeće"] };
    assert.equal(catalogMatcher("FLOWER cvijece")(icon), true);
    assert.equal(catalogMatcher("flower cooking")(icon), false);
    assert.equal(catalogMatcher("")(icon), true);
  });

  it("finds a renamed icon by its former name", () => {
    const icon = { id: "trash", label: "Trash", groupLabel: "Actions", keywords: ["delete"], aliases: ["bin"] };
    assert.equal(catalogMatcher("bin")(icon), true);
  });
});
