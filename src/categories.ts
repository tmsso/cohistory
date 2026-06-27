import { categoryColors } from './theme'

export type Category =
  | 'war'
  | 'revolution'
  | 'politics'
  | 'treaty'
  | 'disaster'
  | 'science'
  | 'religion'
  | 'exploration'
  | 'economy'
  | 'general'

export const CATEGORIES: Category[] = [
  'war',
  'revolution',
  'politics',
  'treaty',
  'disaster',
  'science',
  'religion',
  'exploration',
  'economy',
  'general',
]

export const CATEGORY_LABEL: Record<Category, string> = {
  war: 'War & conflict',
  revolution: 'Revolution',
  politics: 'Politics',
  treaty: 'Treaty & diplomacy',
  disaster: 'Disaster',
  science: 'Science & culture',
  religion: 'Religion',
  exploration: 'Exploration',
  economy: 'Economy',
  general: 'General',
}

export function categoryColor(c: Category): string {
  return categoryColors[c] ?? categoryColors.general
}

// Title-keyword inference — the working fallback. Order = priority.
// Extend freely; one entry per category keeps it readable.
const RULES: [RegExp, Category][] = [
  [/\b(war|battle|siege|invasion|campaign|conflict|annex|conquest|blockade)\b/i, 'war'],
  [/\b(revolution|uprising|revolt|insurrection|coup|rebellion|mutiny|barricade)\b/i, 'revolution'],
  [/\b(treaty|peace|congress|accord|alliance|armistice|convention|partition)\b/i, 'treaty'],
  [/\b(elect|election|president|parliament|assembly|republic|constitution|abdicat|accede|accession|governor|chancellor|minister|reform act|suffrage|crown|throne|regent|monarch)\b/i, 'politics'],
  [/\b(plague|famine|earthquake|fire|flood|epidemic|cholera|eruption|drought|disaster|hurricane)\b/i, 'disaster'],
  [/\b(discover|university|theory|invent|telescope|opera|symphony|novel|academy|painting|exhibition)\b/i, 'science'],
  [/\b(church|pope|papal|religio|cathedral|synod|reformation|crusade|bishop)\b/i, 'religion'],
  [/\b(expedition|voyage|explor|landing|colony|colonis|settle|frontier)\b/i, 'exploration'],
  [/\b(trade|bank|market|tariff|gold rush|economic|company|railway|canal|currency)\b/i, 'economy'],
]

export function inferCategory(title: string): Category {
  for (const [re, cat] of RULES) if (re.test(title)) return cat
  return 'general'
}

/**
 * Wikidata `instance of` (P31) → category. Intentionally stubbed: the optional
 * Wikidata adapter (DESIGN.md §6) will supply P31 values and a real mapping.
 */
export function categoryFromP31(_p31?: string): Category | null {
  return null
}

/** Resolve a category: explicit field → Wikidata P31 hook → title inference. */
export function resolveCategory(e: { category?: Category; title: string }): Category {
  if (e.category) return e.category
  const fromP31 = categoryFromP31()
  if (fromP31) return fromP31
  return inferCategory(e.title)
}
