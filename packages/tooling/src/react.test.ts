import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildReactSources, componentName } from "./react.ts";
import { STYLES } from "./svg-rules.ts";
import { componentName as catalogName, reactSnippet } from "../../../apps/web/src/lib/react-snippet.ts";

describe("reactSnippet", () => {
  const props = { size: 24, color: "", strokeWidth: 1.75, primary: "", secondary: "", title: "" };

  it("leaves defaults out", () => {
    assert.equal(reactSnippet("trash", "outline", props).jsx, "<Trash />");
  });

  it("writes only the props that apply to the style", () => {
    const tried = { size: 16, color: "#f00", strokeWidth: 2, primary: "#00f", secondary: "", title: 'Say "hi"' };
    assert.equal(
      reactSnippet("trash", "duotone", tried).jsx,
      '<TrashDuotone size={16} color="#f00" strokeWidth={2} style={{ "--icon-primary": "#00f" }} title={"Say \\"hi\\""} />',
    );
    assert.equal(reactSnippet("trash", "solid", tried).jsx, '<TrashSolid size={16} color="#f00" title={"Say \\"hi\\""} />');
  });
});

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><!-- c -->${body}</svg>`;

describe("componentName", () => {
  it("is the id in PascalCase plus the style suffix", () => {
    assert.equal(componentName("trash", "outline"), "Trash");
    assert.equal(componentName("trending-up", "duotone"), "TrendingUpDuotone");
    assert.equal(componentName("3d-printing", "solid"), "Icon3dPrintingSolid");
  });

  it("matches the name the catalog shows", () => {
    for (const id of ["trash", "trending-up", "3d-printing", "letter-a"]) {
      for (const style of STYLES) assert.equal(catalogName(id, style), componentName(id, style));
    }
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
