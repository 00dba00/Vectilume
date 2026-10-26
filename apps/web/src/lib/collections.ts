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
    title: "Hobbies",
    description: "Sports, music, crafts and everyday activities in three Vectilume styles.",
    searchLabel: "Search hobbies",
    placeholder: "e.g. swimming, karate, drawing…",
    items: hobbies,
  },
  {
    id: "general",
    title: "General",
    description: "Navigation, actions, status, people, analytics and other interface icons.",
    searchLabel: "Search icons",
    placeholder: "e.g. close, calendar, mail…",
    items: general,
  },
];
