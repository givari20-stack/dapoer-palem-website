import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Secure Dapoer Palem administration login.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-5 py-12 text-dark-green sm:px-8">
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-32 size-96 rounded-full border border-gold/25"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-52 -left-40 size-[30rem] rounded-full bg-palem-green/5"
      />

      <section
        aria-labelledby="login-heading"
        className="relative w-full max-w-md rounded-lg border border-dark-green/10 bg-white p-7 shadow-soft sm:p-10"
      >
        <Image
          src="/logo/dapoer-palem-black.png"
          alt="Dapoer Palem"
          width={220}
          height={76}
          className="mx-auto h-auto w-40"
          priority
        />

        <div className="mt-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-palem-green uppercase">
            Secure administration
          </p>
          <h1 id="login-heading" className="mt-3 font-serif text-4xl leading-tight">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-6 text-dark-green/60">
            Sign in to manage Dapoer Palem content.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
