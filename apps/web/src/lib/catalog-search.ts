interface SearchableItem {
  id: string;
  label: string;
  groupLabel: string;
  keywords: string[];
  glyph?: string;
}

const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Character queries preserve case and accents; descriptive searches keep accent folding. */
export function catalogMatcher(query: string): (item: SearchableItem) => boolean {
  const terms = query.normalize("NFC").trim().split(/\s+/).filter(Boolean);
  const explicitCase = terms.some((term) => /^(upper|lower|title)case$/i.test(term));
  return (item) => {
    const haystack = fold(`${item.label} ${item.id} ${item.groupLabel} ${item.keywords.join(" ")}`);
    return terms.every((term) => {
      if (item.glyph && (Array.from(term).length === 1 || /^(dž|lj|nj)$/i.test(term))) {
        return explicitCase ? item.glyph.toLowerCase() === term.toLowerCase() : item.glyph === term;
      }
      return haystack.includes(fold(term));
    });
  };
}
