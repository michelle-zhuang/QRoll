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

  const { teamId, teamMemberId, newName } = body ?? {};
  if (!teamId) return new Response('Missing teamId', { status: 400 });

  // --- Path A: link to an existing unclaimed team member ---
  if (teamMemberId) {
    const { error } = await supabase
      .from('team_members')
      .update({ user_id: session.user.id, claimed_at: new Date().toISOString() })
      .eq('id', teamMemberId)
      .eq('team_id', teamId)
      .is('user_id', null);

    if (error) return new Response(error.message, { status: 500 });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Path B: create a brand-new team member and self-claim it ---
  if (newName) {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        full_name: newName.trim(),
        email: session.user.email ?? null,
        user_id: session.user.id,
        claimed_at: new Date().toISOString(),
      });

    if (error) return new Response(error.message, { status: 500 });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Missing teamMemberId or newName', { status: 400 });
};
