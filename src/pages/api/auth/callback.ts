import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';
import { safeNext } from '../../../lib/redirect';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  
  if (code) {
    const supabase = createSupabaseClient(cookies);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    if (data.session?.user?.email) {
      cookies.set('qroll_last_email', data.session.user.email, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    }
  }
  return redirect(next);
};
