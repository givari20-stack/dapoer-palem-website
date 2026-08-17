import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnvironment } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const environment = getSupabaseEnvironment();

  // Keep static routes available during initial setup. Protected server routes
  // still fail closed until the publishable key has been configured.
  if (!environment) {
    return response;
  }

  const supabase = createServerClient(
    environment.url,
    environment.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getUser validates the access token with Supabase Auth and refreshes the
  // cookie-backed session when required. Do not remove this call.
  await supabase.auth.getUser();

  return response;
}
