import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import { COLLECTIONS } from "@/lib/collections";
import { buildLookup, iconId, icons } from "@/lib/icons";
import { STYLES } from "@/lib/studio/model";
import { StudioClient } from "./StudioClient";
import styles from "./studio.module.css";

export const metadata: Metadata = {
  title: "Studio · Vectilume",
  description: "Draw new Vectilume icons or edit existing ones on the 24×24 grid, with the library's checks as you draw.",
  alternates: { canonical: "/studio" },
};

const lookup = buildLookup(icons);
const items = COLLECTIONS.flatMap((c) => c.items);
const library = items.map((i) => ({ id: i.id, label: i.label }));
const UI = ["sparkles", "graphic-design", "circle", "grid", "maximize", "file-plus", "undo", "copy", "download", "code", "sliders", "trash", "layers", "arrow-up", "arrow-down", "alert-triangle", "badge-check", "eye"];
const ui = Object.fromEntries(UI.map((id) => [id, lookup[iconId("outline", id)] ?? ""]));
const COMMON = ["home", "search", "settings", "user", "bell", "trash"];

export default function StudioPage({ searchParams }: PageProps<"/studio">) {
  return (
    <main className={styles.page}>
      <Suspense
        fallback={
          <div className={styles.loading}>
            <Spinner size={72} label="Opening the studio…" showLabel />
          </div>
        }
      >
        <Loader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Loader({ searchParams }: Pick<PageProps<"/studio">, "searchParams">) {
  const { icon } = await searchParams;
  const item = typeof icon === "string" ? items.find((i) => i.id === icon) : undefined;
  const opened = item ? { id: item.id, sources: Object.fromEntries(STYLES.map((s) => [s, lookup[iconId(s, item.id)] ?? ""])) as Record<(typeof STYLES)[number], string> } : null;
  const near = item ? items.filter((i) => i.group === item.group && i.id !== item.id).map((i) => i.id) : COMMON;
  const neighbours = near
    .slice(0, 6)
    .map((id) => ({ id, svg: lookup[iconId("outline", id)] ?? "" }))
    .filter((n) => n.svg);
  return <StudioClient key={item?.id ?? "new"} opened={opened} library={library} neighbours={neighbours} ui={ui} />;
}
