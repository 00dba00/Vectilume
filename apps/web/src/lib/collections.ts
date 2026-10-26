import general from "@vectilume/icons-svg/general.json";
import hobbies from "@vectilume/icons-svg/hobbies.json";

export interface CollectionItem {
  id: string;
  label: string;
  group: string;
  groupLabel: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  searchLabel: string;
  placeholder: string;
  items: CollectionItem[];
}

export const COLLECTIONS: Collection[] = [
  {
    id: "hobbies",
    title: "Hobiji",
    description: "Sport, glazba, stvaralaštvo i svakodnevne aktivnosti u tri Vectilume stila.",
    searchLabel: "Pretraži hobije",
    placeholder: "Npr. plivanje, karate, crtanje...",
    items: hobbies,
  },
  {
    id: "general",
    title: "Općenito",
    description: "Navigacija, akcije, statusi, korisnici, analitika i ostale ikone sučelja.",
    searchLabel: "Pretraži ikone",
    placeholder: "Npr. zatvori, kalendar, pošta...",
    items: general,
  },
];
