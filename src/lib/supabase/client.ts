"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnvironment } from "@/lib/supabase/env";

export function createClient() {
  const { url, publishableKey } = requireSupabaseEnvironment();

  return createBrowserClient(url, publishableKey);
}
