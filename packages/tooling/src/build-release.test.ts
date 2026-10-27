import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkAgainstPublished, releaseNames, removableAliases, selectReleaseIcons, sinceOf } from "./build-release.ts";

const entry = (id: string) => ({ id, label: id, group: "g", groupLabel: "G", keywords: ["k"] });
const catalogs = { general: [entry("check"), entry("close")], hobbies: [entry("chess")] };

describe("selectReleaseIcons", () => {
  it("ships only confirmed collections, whole", () => {
    const icons = selectReleaseIcons({ version: "0.1.0", collections: ["general"] }, catalogs);
    assert.deepEqual(icons.map((icon) => `${icon.collection}/${icon.id}`), ["general/check", "general/close"]);
  });

  it("rejects unknown collections and duplicate icon names", () => {
    assert.throws(() => selectReleaseIcons({ version: "0.1.0", collections: ["sports"] }, catalogs), /unknown collection/);
    const clash = { ...catalogs, extra: [entry("check")] };
    assert.throws(() => selectReleaseIcons({ version: "0.1.0", collections: ["general", "extra"] }, clash), /in both/);
  });

  it("requires keywords on every icon", () => {
    const bare = { general: [{ ...entry("check"), keywords: [] }] };
    assert.throws(() => selectReleaseIcons({ version: "0.1.0", collections: ["general"] }, bare), /no keywords/);
  });
});

describe("checkAgainstPublished", () => {
  const published = { version: "0.2.0", names: ["check", "close", "trash"], since: {} };

  it("allows adding icons in a regular release", () => {
    assert.deepEqual(checkAgainstPublished(published, "0.2.1", ["check", "close", "trash", "plus"]), { removed: [] });
  });

  it("rejects removed or renamed icons unless the release is breaking", () => {
    assert.throws(() => checkAgainstPublished(published, "0.2.1", ["check", "close", "delete"]), /trash/);
    assert.deepEqual(checkAgainstPublished(published, "0.3.0", ["check", "close"]), { removed: ["trash"] });
    assert.deepEqual(checkAgainstPublished({ ...published, version: "1.4.0" }, "2.0.0", ["check"]), { removed: ["close", "trash"] });
    assert.throws(() => checkAgainstPublished({ ...published, version: "1.4.0" }, "1.5.0", ["check"]), /disappear/);
  });

  it("requires a version above the published one", () => {
    assert.throws(() => checkAgainstPublished(published, "0.2.0", published.names), /must be higher/);
  });
});

describe("aliases and since", () => {
  const renamed = { general: [{ ...entry("trash"), aliases: ["bin"] }, entry("close")] };
  const release = { version: "0.3.0", collections: ["general"] };

  it("keeps a renamed icon's old name, so the rename is not breaking", () => {
    const icons = selectReleaseIcons(release, renamed);
    const published = { version: "0.2.0", names: ["bin", "close"], since: {} };
    assert.deepEqual(checkAgainstPublished(published, "0.2.1", releaseNames(icons)), { removed: [] });
  });

  it("rejects aliases that clash with a name or are not kebab-case", () => {
    const clash = { general: [{ ...entry("trash"), aliases: ["close"] }, entry("close")] };
    assert.throws(() => selectReleaseIcons(release, clash), /is in both "general, as an alias of trash" and "general"/);
    const late = { general: [entry("close"), { ...entry("trash"), aliases: ["close"] }] };
    assert.throws(() => selectReleaseIcons(release, late), /already a name/);
    assert.throws(() => selectReleaseIcons(release, { general: [{ ...entry("trash"), aliases: ["Bin"] }] }), /kebab-case/);
  });

  it("lists published aliases only when the release is breaking", () => {
    const icons = selectReleaseIcons(release, { general: [{ ...entry("trash"), aliases: ["bin", "waste"] }] });
    const published = { version: "0.2.0", names: ["bin", "trash"], since: {} };
    assert.deepEqual(removableAliases(published, "0.3.0", icons), ["bin → trash"]);
    assert.deepEqual(removableAliases(published, "0.2.1", icons), []);
    assert.deepEqual(removableAliases(null, "0.1.0", icons), []);
  });

  it("keeps the first published version and gives new names this one", () => {
    const published = { version: "0.2.0", names: ["bin"], since: { bin: "0.1.0" } };
    assert.equal(sinceOf("bin", "0.3.0", published), "0.1.0");
    assert.equal(sinceOf("trash", "0.3.0", published), "0.3.0");
    assert.equal(sinceOf("trash", "0.1.0", null), "0.1.0");
  });
});
