import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const type = formData.get('type')?.toString(); // 'signin' or 'signup'
  const next = url.searchParams.get('next') || '/dashboard';
  const baseUrl = import.meta.env.PUBLIC_APP_URL || url.origin;

  if (!email || !password) {
    return new Response('Email and password are required', { status: 400 });
  }

  const supabase = createSupabaseClient(cookies);

  if (type === 'signup') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) return new Response(error.message, { status: 400 });
    return new Response('Check your email for the confirmation link!', { status: 200 });
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return new Response(error.message, { status: 400 });
    return redirect(next);
  }
};
