import type { Storage } from "./db-types";

export type ShelfLifeEntry = {
  id: string;
  label: string;
  category: string;
  default_storage: Storage;
  days_fridge: number | null;
  days_pantry: number | null;
  days_freezer: number | null;
  aliases: string[];
};

export type Match = {
  entry: ShelfLifeEntry;
  /** 1 = exact, 0.8 = all words present, 0.6 = substring. */
  confidence: number;
};

/** Confidence at or above this is applied silently; below it, ask the user. */
export const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Strips a string down to comparable words.
 *
 * Receipt lines are shouty and punctuated ("GV MLK 2% GAL"), and typed input is
 * inconsistently pluralised. Normalising both sides means the matcher compares
 * meaning rather than formatting.
 */
export function normalize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .filter((w) => w.length > 1 || /\d/.test(w));
}

/** Crude but sufficient: pantry nouns are regular. */
function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("hes")) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/**
 * Finds the best shelf-life entry for a free-text item name.
 *
 * Deliberately deterministic. On Day 10 a model proposes a candidate id for
 * receipt lines this cannot resolve, but the curated table stays the only
 * source of durations either way.
 */
export function matchShelfLife(
  input: string,
  entries: ShelfLifeEntry[],
): Match | null {
  const words = normalize(input);
  if (words.length === 0) return null;
  const phrase = words.join(" ");

  let best: Match | null = null;

  const consider = (entry: ShelfLifeEntry, confidence: number) => {
    if (!best || confidence > best.confidence) best = { entry, confidence };
  };

  for (const entry of entries) {
    for (const candidate of [entry.label, ...entry.aliases]) {
      const candidateWords = normalize(candidate);
      if (candidateWords.length === 0) continue;
      const candidatePhrase = candidateWords.join(" ");

      if (candidatePhrase === phrase) {
        consider(entry, 1);
        continue;
      }

      // Every word of the alias appears in the input: "whole milk gallon"
      // still matches the alias "whole milk".
      if (candidateWords.every((w) => words.includes(w))) {
        // Longer aliases are more specific, so "2% milk" beats "milk".
        consider(entry, 0.8 + Math.min(candidateWords.length, 4) * 0.01);
        continue;
      }

      if (phrase.includes(candidatePhrase)) consider(entry, 0.6);
    }
  }

  return best && (best as Match).confidence >= CONFIDENCE_THRESHOLD
    ? best
    : null;
}

/** Days this entry keeps in the given storage, falling back to its default. */
export function daysFor(entry: ShelfLifeEntry, storage: Storage): number | null {
  const byStorage: Record<Storage, number | null> = {
    fridge: entry.days_fridge,
    pantry: entry.days_pantry,
    freezer: entry.days_freezer,
  };
  return byStorage[storage] ?? byStorage[entry.default_storage];
}

/** The expiry date implied by an entry, or null if it has no duration. */
export function expiryFor(
  entry: ShelfLifeEntry,
  storage: Storage,
  purchasedAt: Date = new Date(),
): Date | null {
  const days = daysFor(entry, storage);
  if (days === null) return null;
  const expires = new Date(purchasedAt);
  expires.setDate(expires.getDate() + days);
  return expires;
}
