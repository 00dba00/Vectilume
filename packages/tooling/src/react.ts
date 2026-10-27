import { parseSvg, STYLES, type Element, type IconStyle } from "./svg-rules.ts";

const SUFFIX: Record<IconStyle, string> = { outline: "", duotone: "Duotone", solid: "Solid" };

/** `trash` → `Trash`, `3d-printing` → `Icon3dPrinting` (an identifier cannot start with a digit). */
export function componentName(id: string, style: IconStyle): string {
  const pascal = id.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase());
  return `${/^\d/.test(pascal) ? "Icon" : ""}${pascal}${SUFFIX[style]}`;
}

/** SVG attribute names to React props: `stroke-width` → `strokeWidth`, `class` → `className`. */
const toProps = (attrs: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(attrs).map(([name, value]) => [
      name === "class" ? "className" : name.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()),
      value,
    ]),
  );

type Node = [string, Record<string, string>] | [string, Record<string, string>, Node[]];

const toNode = ({ tag, attrs, children }: Element): Node =>
  children.length ? [tag, toProps(attrs), children.map(toNode)] : [tag, toProps(attrs)];

const RUNTIME = `import { createElement, forwardRef } from "react";

const draw = ([tag, attrs, children = []]) => createElement(tag, attrs, ...children.map(draw));

function icon(displayName, attrs, nodes) {
  const Icon = forwardRef(function Icon({ size = 24, title, children, ...props }, ref) {
    const labelled = title != null || props["aria-label"] != null || props["aria-labelledby"] != null;
    return createElement(
      "svg",
      { ref, width: size, height: size, ...attrs, ...(labelled ? { role: "img" } : { "aria-hidden": true }), ...props },
      title != null && createElement("title", null, title),
      ...nodes.map(draw),
      children,
    );
  });
  Icon.displayName = displayName;
  return Icon;
}
`;

const TYPES = `import type { CSSProperties, ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "style"> {
  /** Also takes CSS variables, e.g. the duotone colours --icon-primary and --icon-secondary. */
  style?: CSSProperties & { [variable: \`--\${string}\`]: string | number };
  /** Width and height; default 24. */
  size?: number | string;
  /** Accessible name. Without it (or aria-label) the icon is decorative and aria-hidden. */
  title?: string;
}

export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
`;

/** The `index.js` and `index.d.ts` of @vectilume/react: one component per icon and style, plus deprecated aliases. */
export function buildReactSources(icons: { id: string; aliases?: string[] }[], readSvg: (style: IconStyle, id: string) => string) {
  const owners = new Map<string, string>();
  const claim = (name: string, owner: string) => {
    const other = owners.get(name);
    if (other) throw new Error(`"${owner}" and "${other}" both become the component ${name}`);
    owners.set(name, owner);
  };
  const js = [RUNTIME];
  const dts = [TYPES];
  for (const { id, aliases = [] } of icons) {
    for (const style of STYLES) {
      const name = componentName(id, style);
      claim(name, `${style}/${id}`);

      const [root, ...rest] = parseSvg(readSvg(style, id));
      if (root?.tag !== "svg" || rest.length) throw new Error(`${style}/${id}.svg must have a single <svg> root`);
      const nodes = JSON.stringify(root.children.map(toNode));
      js.push(`export const ${name} = /*#__PURE__*/ icon(${JSON.stringify(name)}, ${JSON.stringify(toProps(root.attrs))}, ${nodes});`);
      dts.push(`export declare const ${name}: Icon;`);

      for (const alias of aliases) {
        const old = componentName(alias, style);
        claim(old, `${style}/${alias} (alias of ${id})`);
        js.push(`export const ${old} = ${name};`);
        dts.push(`/** @deprecated Renamed to ${name}; removed in the next breaking release. */`, `export declare const ${old}: Icon;`);
      }
    }
  }
  return { js: `${js.join("\n")}\n`, dts: `${dts.join("\n")}\n` };
}
