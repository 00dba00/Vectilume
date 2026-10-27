import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { selectReleaseIcons, type CatalogEntry } from "./build-release.ts";

const root = fileURLToPath(new URL("../../icons-svg/", import.meta.url));
const readCatalog = (name: string) => JSON.parse(readFileSync(path.join(root, `${name}.json`), "utf8"));
const catalog: (CatalogEntry & { glyph: string; form: string })[] = readCatalog("lettering");
const alphabet = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZČĆĐŠŽ");
const expected = [...alphabet, ...alphabet.map(c=>c.toLowerCase()), ...Array.from("0123456789"), "DŽ", "LJ", "NJ", "dž", "lj", "nj", "Dž", "Lj", "Nj"];

describe("Letters & Numbers collection", () => {
  it("includes the full requested alphabet, Croatian digraphs and digits in every form and style", () => {
    for (const glyph of expected) {
      const variants = catalog.filter(i=>i.glyph===glyph);
      assert.deepEqual(variants.map(i=>i.form).sort(), ["circle", "plain", "square"], glyph);
    }
    assert.equal(new Set(catalog.map(i=>i.glyph)).size, 119);
    assert.equal(catalog.length, 357);
    for (const item of catalog) for (const style of ["outline","duotone","solid"]) {
      assert.ok(existsSync(path.join(root,"src",style,`${item.id}.svg`)), `${item.id}/${style}`);
    }
  });
  it("uses collision-free ASCII IDs across all collections and case-insensitive filesystems", () => {
    const catalogs = Object.fromEntries(["hobbies","general","content","lettering","food","transport"].map(id=>[id,readCatalog(id)]));
    const all = selectReleaseIcons({ version:"0.1.0", collections:Object.keys(catalogs) }, catalogs);
    assert.equal(new Set(all.map(i=>i.id.toLowerCase())).size, all.length);
    for (const item of catalog) assert.match(item.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
  it("distinguishes commonly confused glyphs without depending on fonts", () => {
    for (const style of ["outline","duotone","solid"]) {
      const source = (glyph: string) => {
        const item = catalog.find(i=>i.glyph===glyph && i.form==="plain")!;
        return readFileSync(path.join(root,"src",style,`${item.id}.svg`),"utf8");
      };
      for (const [a,b] of [["O","0"],["I","1"],["I","l"],["S","5"],["Č","Ć"],["D","Đ"],["a","A"]]) {
        assert.notEqual(source(a!), source(b!), `${a}/${b} ${style}`);
      }
      for (const glyph of expected) assert.doesNotMatch(source(glyph), /<(text|image|use)\b|font-family/);
    }
  });
});
