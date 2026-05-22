import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) { return cookies.get(key)?.value; },
        set(key, value, options) { cookies.set(key, value, options as CookieOptions); },
        remove(key, options) { cookies.delete(key, options as CookieOptions); },
      },
    }
  );
}
