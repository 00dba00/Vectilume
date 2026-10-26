import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkAgainstPublished, selectReleaseIcons } from "./build-release.ts";

const entry = (id: string) => ({ id, label: id, group: "g", groupLabel: "G" });
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
});

describe("checkAgainstPublished", () => {
  const published = { version: "0.2.0", names: ["check", "close", "trash"] };

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
