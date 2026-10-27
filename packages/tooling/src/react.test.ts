import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildReactSources, componentName } from "./react.ts";

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><!-- c -->${body}</svg>`;

describe("componentName", () => {
  it("is the id in PascalCase plus the style suffix", () => {
    assert.equal(componentName("trash", "outline"), "Trash");
    assert.equal(componentName("trending-up", "duotone"), "TrendingUpDuotone");
    assert.equal(componentName("3d-printing", "solid"), "Icon3dPrintingSolid");
  });
});

describe("buildReactSources", () => {
  it("emits a component per style with React prop names and nested groups", () => {
    const { js, dts } = buildReactSources(["check"], () => svg('<g transform="x"><path fill-rule="evenodd" d="M1 1"/></g>'));
    assert.match(
      js,
      /export const CheckDuotone = \/\*#__PURE__\*\/ icon\("CheckDuotone", \{"xmlns":"http:\/\/www.w3.org\/2000\/svg","viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","strokeWidth":"1.75"\}, \[\["g",\{"transform":"x"\},\[\["path",\{"fillRule":"evenodd","d":"M1 1"\}\]\]\]\]\);/,
    );
    assert.deepEqual(dts.match(/declare const \w+/g), ["declare const Check", "declare const CheckDuotone", "declare const CheckSolid"]);
  });

  it("rejects ids that collide as component names", () => {
    assert.throws(() => buildReactSources(["check", "check-solid"], () => svg("")), /both become the component CheckSolid/);
  });
});
