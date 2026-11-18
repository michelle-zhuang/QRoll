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

async function run() {
  const { data, error } = await supabase
    .from('attendance')
    .select('team_member_id, status, team_members(full_name)')
    .eq('event_id', '60530969-66ec-477b-a460-6fee8025f9f4');

  console.log('Error:', error);
  console.log('Attendance JOIN team_members:', data);
}

run();
