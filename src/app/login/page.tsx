import Link from "next/link";
import { AuthForm } from "@/app/auth/auth-form";

const ERRORS: Record<string, string> = {
  invalid_link: "That confirmation link was malformed. Try signing in.",
  expired_link: "That confirmation link expired. Request a new one.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

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
          Welcome back
        </h1>
        <p className="mt-1.5 mb-8 text-sm text-foreground-muted">
          Sign in to see what needs eating.
        </p>

        {message ? (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-soon-bg px-3 py-2 text-sm text-soon"
          >
            {message}
          </p>
        ) : null}

        <AuthForm mode="signin" next={nextPath} />
      </div>
    </main>
  );
}
