"use server";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { COLLECTIONS } from "@/lib/collections";

export interface ReleaseSettings {
  version: string;
  collections: string[];
}

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?$/i;

/** Saves which collections go to npm into packages/icons-svg/release.json. */
export async function saveRelease(input: ReleaseSettings): Promise<ReleaseSettings> {
  // Server actions accept any POST and this one writes into the repo, so only the local dev server may run it.
  if (process.env.NODE_ENV !== "development") throw new Error("Objava se može mijenjati samo na lokalnom dev serveru.");
  const version = typeof input?.version === "string" ? input.version.trim() : "";
  if (!VERSION.test(version)) throw new Error(`Verzija "${version}" nije ispravna (npr. 0.1.0).`);
  if (!Array.isArray(input.collections)) throw new Error("Popis kolekcija nije ispravan.");
  const known = COLLECTIONS.map((collection) => collection.id);
  const unknown = input.collections.filter((id) => !known.includes(id));
  if (unknown.length > 0) throw new Error(`Nepoznate kolekcije: ${unknown.join(", ")}.`);

  const settings = { version, collections: known.filter((id) => input.collections.includes(id)) };
  // next dev runs from apps/web
  const file = path.resolve(process.cwd(), "../../packages/icons-svg/release.json");
  await writeFile(file, `${JSON.stringify(settings, null, 2)}\n`);
  return settings;
}
