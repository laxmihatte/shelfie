"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { STORAGE_OPTIONS } from "@/lib/db-types";
import { addItem, type ItemFormState } from "./actions";

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-foreground-muted focus-visible:border-accent";

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

/** Defaults the expiry picker to a week out — the common case for fridge items. */
function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AddItemForm() {
  const [state, formAction] = useActionState<ItemFormState, FormData>(addItem, {
    error: null,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Clear the form after a successful add so the next item can be typed
  // straight away — entry usually happens in bursts after a shop.
  useEffect(() => {
    if (state.error === null) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs font-medium">
            Item
          </label>
          <input
            ref={nameRef}
            id="name"
            name="name"
            required
            maxLength={120}
            placeholder="Spinach"
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
            defaultValue="fridge"
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
            defaultValue={defaultExpiry()}
            className={`${field} sm:w-40`}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        {state.error ? (
          <p role="alert" className="text-sm text-expired">
            {state.error}
          </p>
        ) : (
          <span />
        )}
        <SubmitButton />
      </div>
    </form>
  );
}
