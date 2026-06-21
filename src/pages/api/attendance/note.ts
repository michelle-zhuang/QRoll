import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';
import { fromZonedTime } from 'date-fns-tz';

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

  const { roster_member_id, date, note, status } = body || {};
  if (!roster_member_id || !date) {
    return new Response('Missing roster_member_id or date', { status: 400 });
  }

  const TZ = 'America/Los_Angeles';
  const dayStart = fromZonedTime(`${date}T00:00:00`, TZ).toISOString();
  const dayEnd = fromZonedTime(`${date}T23:59:59.999`, TZ).toISOString();

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

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('event_id', eventId)
    .eq('roster_member_id', roster_member_id)
    .maybeSingle();

  if (status === 'none') {
    if (existing) {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', existing.id);
      if (error) return new Response(error.message, { status: 500 });
    }
  } else {
    const targetStatus = status || 'present';
    if (existing) {
      const { error } = await supabase
        .from('attendance')
        .update({ 
          note: noteValue || null,
          status: targetStatus
        })
        .eq('id', existing.id);
      if (error) return new Response(error.message, { status: 500 });
    } else {
      const { error } = await supabase
        .from('attendance')
        .insert({
          event_id: eventId,
          roster_member_id,
          status: targetStatus,
          note: noteValue || null,
          checked_in_at: dayStart,
        });
      if (error) return new Response(error.message, { status: 500 });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
