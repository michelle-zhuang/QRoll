import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(cookies);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { rosterMemberId, newName, newEmail } = body ?? {};

  // --- Path A: link to an existing unclaimed roster member ---
  if (rosterMemberId) {
    const { error } = await supabase
      .from('roster_members')
      .update({ claimed_user_id: session.user.id })
      .eq('id', rosterMemberId)
      .is('claimed_user_id', null);

    if (error) return new Response(error.message, { status: 500 });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Path B: create a brand-new roster member and self-claim it ---
  if (newName) {
    const { error } = await supabase
      .from('roster_members')
      .insert({
        full_name: newName.trim(),
        email: session.user.email ?? null,
        claimed_user_id: session.user.id,
      });

    if (error) return new Response(error.message, { status: 500 });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Missing rosterMemberId or newName', { status: 400 });
};
