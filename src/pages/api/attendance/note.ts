import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(cookies);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { roster_member_id, date, note } = body || {};
  if (!roster_member_id || !date) {
    return new Response('Missing roster_member_id or date', { status: 400 });
  }

  // Find the event row that matches this date (historical or live).
  // Strategy: pick the event whose starts_at falls on the same calendar date.
  const dayStart = new Date(`${date}T00:00:00.000Z`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59.999Z`).toISOString();

  const { data: events } = await supabase
    .from('events')
    .select('id')
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)
    .order('starts_at', { ascending: true });

  if (!events || events.length === 0) {
    return new Response('No event found for that date', { status: 404 });
  }

  const eventId = events[0].id;
  const noteValue = typeof note === 'string' ? note.trim() : '';

  // Upsert: update note if attendance row exists, otherwise insert with default status='absent'.
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('event_id', eventId)
    .eq('roster_member_id', roster_member_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('attendance')
      .update({ note: noteValue || null })
      .eq('id', existing.id);
    if (error) return new Response(error.message, { status: 500 });
  } else {
    const { error } = await supabase
      .from('attendance')
      .insert({
        event_id: eventId,
        roster_member_id,
        status: 'absent',
        note: noteValue || null,
        checked_in_at: dayStart,
      });
    if (error) return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
