import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';
import { safeNext } from '../../../lib/redirect';

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const type = formData.get('type')?.toString(); // 'signin' or 'signup'
  const next = safeNext(url.searchParams.get('next'));
  const baseUrl = import.meta.env.PUBLIC_APP_URL || url.origin;

  if (!email || !password) {
    return new Response('Email and password are required', { status: 400 });
  }

  const supabase = createSupabaseClient(cookies);

  if (type === 'signup') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) return new Response(error.message, { status: 400 });
    // Supabase returns an empty identities array (instead of an error) when the email is already registered
    if (data.user && data.user.identities?.length === 0) {
      return new Response('An account with this email already exists. Try signing in instead.', { status: 409 });
    }
    return new Response('Check your email for the confirmation link!', { status: 200 });
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return new Response(error.message, { status: 400 });
    if (data.session?.user?.email) {
      cookies.set('qroll_last_email', data.session.user.email, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    }
    return redirect(next);
  }
};
