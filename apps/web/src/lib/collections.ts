import content from "@vectilume/icons-svg/content.json";
import food from "@vectilume/icons-svg/food.json";
import general from "@vectilume/icons-svg/general.json";
import hobbies from "@vectilume/icons-svg/hobbies.json";
import lettering from "@vectilume/icons-svg/lettering.json";
import transport from "@vectilume/icons-svg/transport.json";

export interface CollectionItem {
  id: string;
  label: string;
  group: string;
  groupLabel: string;
  keywords: string[];
  glyph?: string;
  form?: string;
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
  {
    id: "content",
    title: "Content",
    description: "Files and folders, text editing, media controls and devices.",
    searchLabel: "Search content icons",
    placeholder: "e.g. file, bold, pause, laptop…",
    items: content,
  },
  {
    id: "lettering",
    title: "Letters & Numbers",
    description: "Uppercase and lowercase letters, Croatian characters and digraphs, numbers and symbols. Plain, circle and square forms.",
    searchLabel: "Search characters",
    placeholder: "e.g. A, č, 7, euro, uppercase…",
    items: lettering,
  },
  {
    id: "food",
    title: "Food & Drink",
    description: "Drinks, fruit and vegetables, meals, pastries and desserts in three Vectilume styles.",
    searchLabel: "Search food and drinks",
    placeholder: "e.g. coffee, apple, pizza, croissant…",
    items: food,
  },
  {
    id: "transport",
    title: "Travel & Transport",
    description: "Road transport, rail, air and sea, luggage, travel documents, accommodation and navigation.",
    searchLabel: "Search travel and transport",
    placeholder: "e.g. bus, passport, hotel, route…",
    items: transport,
  },
];
