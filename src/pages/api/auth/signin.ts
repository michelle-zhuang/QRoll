import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ cookies, redirect, url }) => {
  const supabase = createSupabaseClient(cookies);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${url.origin}/api/auth/callback` },
  });

  if (error) return new Response(error.message, { status: 500 });
  return redirect(data.url);
};
