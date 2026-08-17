"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block" htmlFor="email">
        <span className="mb-2 block text-sm font-semibold">Email</span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-4 text-base text-dark-green transition-colors placeholder:text-dark-green/35 hover:border-dark-green/40 focus:border-palem-green focus:outline-none"
          placeholder="name@example.com"
        />
      </label>

      <label className="block" htmlFor="password">
        <span className="mb-2 block text-sm font-semibold">Password</span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-4 text-base text-dark-green transition-colors hover:border-dark-green/40 focus:border-palem-green focus:outline-none"
        />
      </label>

      {state.message ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-900/15 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-palem-green bg-palem-green px-6 py-3 text-xs font-bold tracking-[0.16em] text-white uppercase shadow-[0_10px_28px_rgb(2_108_32_/_0.18)] transition hover:-translate-y-0.5 hover:border-dark-green hover:bg-dark-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
