"use server";

import { revalidatePath } from "next/cache";
import { STORAGE_OPTIONS, type ItemStatus, type Storage } from "@/lib/db-types";
import { createClient } from "@/lib/supabase/server";

export type ItemFormState = {
  error: string | null;
  /** Set on success; changing it remounts the form fields to clear them. */
  submittedAt?: number;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseStorage(value: FormDataEntryValue | null): Storage {
  const raw = String(value ?? "");
  return (STORAGE_OPTIONS as readonly string[]).includes(raw)
    ? (raw as Storage)
    : "fridge";
}

/** Parses "2.5", "" or nonsense into a positive quantity, defaulting to 1. */
function parseQuantity(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export async function addItem(
  _prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const expires_at = String(formData.get("expires_at") ?? "");
  const unit = String(formData.get("unit") ?? "").trim();
  const quantity = parseQuantity(formData.get("quantity"));
  const shelf_life_id = String(formData.get("shelf_life_id") ?? "").trim();

  if (!name) return { error: "Give the item a name." };
  if (name.length > 120) return { error: "That name is too long." };
  if (!DATE_PATTERN.test(expires_at)) {
    return { error: "Pick an expiry date." };
  }
  if (quantity === null) {
    return { error: "Quantity must be a positive number." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // user_id is set from the verified session, never from the form. The RLS
  // with-check policy would reject a forged value anyway, but not sending one
  // means there is nothing to forge.
  const { error } = await supabase.from("food_items").insert({
    user_id: user.id,
    name,
    quantity,
    unit: unit || null,
    storage: parseStorage(formData.get("storage")),
    expires_at,
    // A bad id would be rejected by the foreign key; send null rather than
    // letting a stale client value fail the whole insert.
    shelf_life_id: shelf_life_id || null,
    source: "manual",
  });

  if (error) return { error: "Could not save that item. Try again." };

  revalidatePath("/dashboard");
  return { error: null, submittedAt: Date.now() };
}

/** Marks an item used or wasted. `resolved_at` is required by a check constraint. */
export async function resolveItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ItemStatus;
  if (!id || (status !== "used" && status !== "wasted")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // No .eq('user_id') needed — the RLS policy scopes this to the caller's
  // rows. It is added anyway as belt-and-braces against a policy regression.
  await supabase
    .from("food_items")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

/** Returns a resolved item to the active list. */
export async function restoreItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("food_items")
    .update({ status: "active", resolved_at: null })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function deleteItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("food_items").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/dashboard");
}
