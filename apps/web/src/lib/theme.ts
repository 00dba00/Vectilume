import type { CSSProperties } from "react";

export type Background = "light" | "dark";

export interface Theme {
  background: Background;
  /** Outline/solid color; null follows the background. */
  ink: string | null;
  primary: string;
  secondary: string;
  stroke: number;
}

export const DEFAULT_THEME: Theme = {
  background: "light",
  ink: null,
  primary: "#2563eb",
  secondary: "#93c5fd",
  stroke: 1.75,
};

/** CSS variables consumed by the icons inside a canvas. */
export function themeVars(theme: Theme): CSSProperties {
  return {
    "--icon-primary": theme.primary,
    "--icon-secondary": theme.secondary,
    "--icon-stroke": theme.stroke,
    ...(theme.ink ? { "--ink": theme.ink } : {}),
  } as CSSProperties;
}
