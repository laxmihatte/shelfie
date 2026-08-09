"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { STORAGE_OPTIONS, toDateOnly, type Storage } from "@/lib/db-types";
import {
  daysFor,
  expiryFor,
  matchShelfLife,
  type ShelfLifeEntry,
} from "@/lib/shelf-life";
import { addItem, type ItemFormState } from "./actions";

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-foreground-muted focus-visible:border-accent";

const FALLBACK_DAYS = 7;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add item"}
    </button>
  );
}

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateOnly(d);
}

/**
 * The editable fields.
 *
 * Split out so a successful submit can remount it via `key` and reset every
 * field at once. Storage and expiry are derived from the matched shelf life
 * during render, with explicit user edits held as overrides — deriving beats
 * mirroring the match into state through an effect.
 */
function ItemFields({
  entries,
  error,
  autoFocus,
}: {
  entries: ShelfLifeEntry[];
  error: string | null;
  autoFocus: boolean;
}) {
  const [name, setName] = useState("");
  const [storageOverride, setStorageOverride] = useState<Storage | null>(null);
  const [expiryOverride, setExpiryOverride] = useState<string | null>(null);

  const match = useMemo(
    () => (name.trim() ? matchShelfLife(name, entries) : null),
    [name, entries],
  );

  const storage: Storage =
    storageOverride ?? match?.entry.default_storage ?? "fridge";

  const suggested = match ? expiryFor(match.entry, storage) : null;
  const expiry =
    expiryOverride ??
    (suggested ? toDateOnly(suggested) : inDays(FALLBACK_DAYS));

  const days = match ? daysFor(match.entry, storage) : null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs font-medium">
            Item
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={120}
            placeholder="Spinach"
            autoFocus={autoFocus}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="quantity" className="block text-xs font-medium">
            Qty
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue="1"
            className={`${field} sm:w-20`}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="storage" className="block text-xs font-medium">
            Where
          </label>
          <select
            id="storage"
            name="storage"
            value={storage}
            onChange={(e) => setStorageOverride(e.target.value as Storage)}
            className={`${field} sm:w-28`}
          >
            {STORAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="expires_at" className="block text-xs font-medium">
            Expires
          </label>
          <input
            id="expires_at"
            name="expires_at"
            type="date"
            required
            value={expiry}
            onChange={(e) => setExpiryOverride(e.target.value)}
            className={`${field} sm:w-40`}
          />
        </div>
      </div>

      {/* Carries the resolved canonical food id through to the server. */}
      <input type="hidden" name="shelf_life_id" value={match?.entry.id ?? ""} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-5 text-xs">
          {error ? (
            <p role="alert" className="text-sm text-expired">
              {error}
            </p>
          ) : match && days !== null ? (
            <p className="text-foreground-muted">
              Matched{" "}
              <span className="font-medium text-foreground">
                {match.entry.label}
              </span>{" "}
              — keeps about {days} {days === 1 ? "day" : "days"} in the{" "}
              {storage}
              {expiryOverride ? ", but your date is kept" : ""}.
            </p>
          ) : name.trim() ? (
            <p className="text-foreground-muted">
              No shelf-life match — set the date yourself.
            </p>
          ) : null}
        </div>

        <SubmitButton />
      </div>
    </>
  );
}

export function AddItemForm({ entries }: { entries: ShelfLifeEntry[] }) {
  const [state, formAction] = useActionState<ItemFormState, FormData>(addItem, {
    error: null,
  });

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <ItemFields
        key={state.submittedAt ?? 0}
        entries={entries}
        error={state.error}
        autoFocus={state.submittedAt !== undefined}
      />
    </form>
  );
}
