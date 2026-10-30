import type { Metadata } from "next";
import { Lab } from "@/components/Lab";
import { buildLookup, icons } from "@/lib/icons";

const title = "Vectilume Icons: free SVG and React icons in outline, duotone and solid";
const description =
  "Free, MIT-licensed icon set drawn on one 24×24 grid. Search the catalog, copy SVG or JSX, or install @vectilume/react and @vectilume/icons from npm.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", siteName: "Vectilume", type: "website" },
  twitter: { card: "summary", title, description },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: "Vectilume Icons",
  description,
  url: "https://vectilume.dev",
  codeRepository: "https://github.com/00dba00/Vectilume",
  license: "https://opensource.org/licenses/MIT",
  programmingLanguage: ["TypeScript", "SVG"],
  sameAs: ["https://www.npmjs.com/package/@vectilume/react", "https://www.npmjs.com/package/@vectilume/icons"],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Lab lookup={buildLookup(icons)} />
    </>
  );
}
