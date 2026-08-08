"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type AuthState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Working…" : label}
    </button>
  );
}

const fieldClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-foreground-muted focus-visible:border-accent";

export function AuthForm({
  mode,
  next,
}: {
  mode: "signin" | "signup";
  next?: string;
}) {
  const isSignUp = mode === "signup";
  const action = isSignUp ? signUp : signIn;

  const [state, formAction] = useActionState<AuthState, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={isSignUp ? 8 : undefined}
          placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
          className={fieldClass}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-expired-bg px-3 py-2 text-sm text-expired"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton label={isSignUp ? "Create account" : "Sign in"} />

      <p className="text-center text-sm text-foreground-muted">
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <Link
          href={isSignUp ? "/login" : "/signup"}
          className="font-medium text-accent hover:underline"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
