import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Service-role client — bypasses RLS. Used by API routes that act on behalf of the single pilot user (e.g. writes coming back from n8n). */
export function getSupabaseServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables saknas.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cookie-bound client — respects RLS as the logged-in user. Used in server components/route handlers that read on behalf of the current session. */
export async function getSupabaseSessionClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables saknas.");
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a Server Component without write access — middleware refreshes the session instead
        }
      },
    },
  });
}
