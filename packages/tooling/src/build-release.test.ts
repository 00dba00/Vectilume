import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { selectReleaseIcons } from "./build-release.ts";

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
