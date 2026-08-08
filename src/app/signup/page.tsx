import Link from "next/link";
import { AuthForm } from "@/app/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-accent"
        >
          Shelfie
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1.5 mb-8 text-sm text-foreground-muted">
          Start tracking what&rsquo;s in your kitchen.
        </p>

        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
