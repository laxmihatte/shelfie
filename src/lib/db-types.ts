/**
 * Hand-written row types mirroring supabase/migrations/0001_init.sql.
 *
 * Kept manual rather than generated so the schema stays readable without a
 * Supabase CLI login in the loop. If these drift from the migration, the
 * migration is the source of truth.
 */

export type Storage = "fridge" | "pantry" | "freezer";
export type ItemStatus = "active" | "used" | "wasted";
export type ItemSource = "manual" | "receipt";

export const STORAGE_OPTIONS: readonly Storage[] = [
  "fridge",
  "pantry",
  "freezer",
];

export type FoodItem = {
  id: string;
  user_id: string;
  name: string;
  raw_name: string | null;
  shelf_life_id: string | null;
  quantity: number;
  unit: string | null;
  storage: Storage;
  purchased_at: string; // date, YYYY-MM-DD
  expires_at: string; // date, YYYY-MM-DD
  status: ItemStatus;
  resolved_at: string | null;
  price_cents: number | null;
  source: ItemSource;
  receipt_id: string | null;
  created_at: string;
};

/** Parses a `date` column into a Date at local midnight, not UTC midnight. */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a Date as YYYY-MM-DD in local time, for writing to a date column. */
export function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
