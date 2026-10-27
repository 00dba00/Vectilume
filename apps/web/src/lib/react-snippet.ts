import type { IconStyle } from "./icons";

const SUFFIX: Record<IconStyle, string> = { outline: "", duotone: "Duotone", solid: "Solid" };

/** Same naming as the @vectilume/react generator (packages/tooling/src/react.ts); a test keeps them equal. */
export function componentName(id: string, style: IconStyle): string {
  const pascal = id.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase());
  return `${/^\d/.test(pascal) ? "Icon" : ""}${pascal}${SUFFIX[style]}`;
}

/** Props the inspector lets you try; empty strings and defaults are left out of the JSX. */
export interface SnippetProps {
  size: number;
  color: string;
  strokeWidth: number;
  primary: string;
  secondary: string;
  title: string;
}

export const DEFAULT_SIZE = 24;
export const DEFAULT_STROKE = 1.75;

/** JSX string attributes have no escapes, so anything with a quote or backslash goes in braces. */
const jsxString = (value: string) => (/["\\]/.test(value) ? `{${JSON.stringify(value)}}` : `"${value}"`);

export function reactSnippet(id: string, style: IconStyle, props: SnippetProps) {
  const name = componentName(id, style);
  const attrs: string[] = [];
  if (props.size !== DEFAULT_SIZE) attrs.push(`size={${props.size}}`);
  if (props.color) attrs.push(`color=${jsxString(props.color)}`);
  if (style !== "solid" && props.strokeWidth !== DEFAULT_STROKE) attrs.push(`strokeWidth={${props.strokeWidth}}`);
  const vars = [
    props.primary && `"--icon-primary": ${JSON.stringify(props.primary)}`,
    props.secondary && `"--icon-secondary": ${JSON.stringify(props.secondary)}`,
  ].filter(Boolean);
  if (style === "duotone" && vars.length) attrs.push(`style={{ ${vars.join(", ")} }}`);
  if (props.title) attrs.push(`title=${jsxString(props.title)}`);
  return {
    importLine: `import { ${name} } from "@vectilume/react";`,
    jsx: `<${name}${attrs.map((attr) => ` ${attr}`).join("")} />`,
  };
}
