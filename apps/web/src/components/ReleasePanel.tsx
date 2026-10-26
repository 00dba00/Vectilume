"use client";

import { useState, useTransition } from "react";
import release from "@vectilume/icons-svg/release.json";
import { saveRelease } from "@/app/release-actions";
import { COLLECTIONS } from "@/lib/collections";
import styles from "./ReleasePanel.module.css";

export function ReleasePanel() {
  const [version, setVersion] = useState(release.version);
  const [selected, setSelected] = useState<string[]>(release.collections);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const save = () =>
    startTransition(async () => {
      try {
        const saved = await saveRelease({ version, collections: selected });
        const titles = COLLECTIONS.filter((collection) => saved.collections.includes(collection.id)).map((collection) => collection.title);
        setStatus(titles.length ? `Spremljeno: ${titles.join(", ")} · v${saved.version}` : "Spremljeno: nijedna kolekcija nije potvrđena.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Spremanje nije uspjelo.");
      }
    });

  return (
    <section className={styles.panel} aria-labelledby="release-heading">
      <div>
        <h2 id="release-heading">Objava na npm</h2>
        <p>Potvrđene kolekcije idu cijele u paket <code>@vectilume/icons</code>.</p>
      </div>

      <div className={styles.collections}>
        {COLLECTIONS.map((collection) => (
          <label key={collection.id} className={styles.collection}>
            <input type="checkbox" checked={selected.includes(collection.id)} onChange={() => toggle(collection.id)} />
            <span>{collection.title}</span>
            <small>{collection.items.length} ikona</small>
          </label>
        ))}
      </div>

      <div className={styles.actions}>
        <label className={styles.version}>
          <span>Verzija</span>
          <input value={version} onChange={(event) => setVersion(event.target.value)} spellCheck={false} />
        </label>
        <button type="button" onClick={save} disabled={pending}>{pending ? "Spremam..." : "Spremi"}</button>
      </div>

      <p className={styles.status} role="status">{status}</p>
      <p className={styles.hint}>
        Zatim u terminalu: <code>pnpm --filter @vectilume/icons-svg release</code>, pa <code>npm publish --access public</code> iz <code>packages/icons-svg/dist/npm</code>.
      </p>
    </section>
  );
}
