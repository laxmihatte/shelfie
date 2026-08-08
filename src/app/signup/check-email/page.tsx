import Link from "next/link";

export default async function CheckEmailPage(
  props: PageProps<"/signup/check-email">,
) {
  const { email } = await props.searchParams;
  const address = typeof email === "string" ? email : null;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Shelfie
        </p>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Check your email
        </h1>

        <p className="mt-3 text-sm text-foreground-muted">
          We sent a confirmation link
          {address ? (
            <>
              {" "}
              to <span className="font-medium text-foreground">{address}</span>
            </>
          ) : null}
          . Click it and you&rsquo;ll be signed in.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block text-sm font-medium text-accent hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
