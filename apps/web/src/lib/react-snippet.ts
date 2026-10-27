import type { IconStyle } from "./icons";

const SUFFIX: Record<IconStyle, string> = { outline: "", duotone: "Duotone", solid: "Solid" };

/** Same naming as the @vectilume/react generator (packages/tooling/src/react.ts); a test keeps them equal. */
export function componentName(id: string, style: IconStyle): string {
  const pascal = id.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase());
  return `${/^\d/.test(pascal) ? "Icon" : ""}${pascal}${SUFFIX[style]}`;
}

export function reactSnippet(id: string, style: IconStyle) {
  const name = componentName(id, style);
  return { importLine: `import { ${name} } from "@vectilume/react";`, jsx: `<${name} size={24} />` };
}
