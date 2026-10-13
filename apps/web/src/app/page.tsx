import { Lab } from "@/components/Lab";
import { buildLookup, icons } from "@/lib/icons";

export default function Home() {
  return <Lab lookup={buildLookup(icons)} />;
}
