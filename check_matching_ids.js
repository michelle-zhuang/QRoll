import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    envVars[parts[0].trim()] = parts[1].trim();
  }
});

const supabase = createClient(
  envVars.PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SECRET_KEY
);

const selectedTeamId = '1726a429-393b-40c8-a899-656be8bdeb08';

async function run() {
  const eventId = 'c4984a5d-094c-48f3-955b-d21fc37a94be'; // Thursday 6/25

  const [rosterRes, attendanceRes, eventRes] = await Promise.all([
    supabase.from('team_members').select('id, full_name').eq('team_id', selectedTeamId),
    supabase.from('attendance').select('event_id, team_member_id, status, checked_in_at').eq('event_id', eventId),
    supabase.from('events').select('*').eq('id', eventId).single()
  ]);

  const roster = rosterRes.data || [];
  const attendance = attendanceRes.data || [];
  const event = eventRes.data;

  // Let's print the event late threshold
  console.log(`Event: ${event.title}`);
  console.log(`  starts_at: ${event.starts_at}`);
  console.log(`  late_after_at: ${event.late_after_at}`);

  // How the single event page determines if someone is late:
  console.log('\n--- SINGLE EVENT PAGE EVALUATION ---');
  attendance.forEach(record => {
    const member = roster.find(r => r.id === record.team_member_id);
    const isPresent = record.status === 'present' || record.status === 'on_time';
    const isLate = record.status === 'late';
    console.log(`  Member: ${member?.full_name} | DB Status: ${record.status} | isPresent: ${isPresent} | isLate: ${isLate}`);
  });

  // How the dashboard page determines if someone is late:
  console.log('\n--- DASHBOARD PAGE EVALUATION ---');
  const attendanceMap = new Map();
  attendance.forEach(a => {
    attendanceMap.set(`${a.team_member_id}:${a.event_id}`, a);
  });

  roster.forEach(m => {
    const key = `${m.id}:${eventId}`;
    const a = attendanceMap.get(key);
    if (a) {
      const status = (a.status === 'on_time' ? 'present' : a.status);
      console.log(`  Member: ${m.full_name} | Mapped Status: ${status}`);
    }
  });
}

run();
