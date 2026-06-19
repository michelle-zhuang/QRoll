import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = createSupabaseClient(cookies);
    await supabase.auth.exchangeCodeForSession(code);
  }
  return redirect('/dashboard');
};
