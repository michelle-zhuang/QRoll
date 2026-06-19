import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const supabase = createSupabaseClient(cookies);
  await supabase.auth.signOut();
  return redirect('/login');
};
