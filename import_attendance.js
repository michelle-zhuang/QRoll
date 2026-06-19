import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fromZonedTime } from 'date-fns-tz';

const TZ = 'America/Los_Angeles';
const DOWNLOADS_DIR = '/Users/richardluo/Downloads';

// Parse .env manually to support running with node directly
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
// Use secret/service role key if available to bypass RLS, fallback to publishable/anon key
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: PUBLIC_SUPABASE_URL and a Supabase key (SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY) must be set in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Format a date to local YYYY-MM-DD in America/Los_Angeles timezone
function getLocalDateStr(date) {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

// Hardcoded mappings for names that have typos or significant differences
const NAME_MAPPINGS = {
  'chris feliciano': "Christian 'Chris' Feliicano",
};

// Find matching roster member with fuzzy/fallback logic
function findRosterMember(sheetName, rosterMembers) {
  let cleanSheetName = sheetName.trim().toLowerCase();
  
  // 0. Check hardcoded mappings
  if (NAME_MAPPINGS[cleanSheetName]) {
    const mappedName = NAME_MAPPINGS[cleanSheetName].toLowerCase();
    const match = rosterMembers.find(rm => rm.full_name.trim().toLowerCase() === mappedName);
    if (match) return match;
  }
  
  // 1. Exact match (case insensitive, trimmed)
  let match = rosterMembers.find(rm => rm.full_name.trim().toLowerCase() === cleanSheetName);
  if (match) return match;
  
  // 2. Prefix match (e.g. DB "Bharath" matches sheet "Bharath Adishesha")
  match = rosterMembers.find(rm => {
    const cleanDbName = rm.full_name.trim().toLowerCase();
    return cleanSheetName.startsWith(cleanDbName) || cleanDbName.startsWith(cleanSheetName);
  });
  if (match) return match;
  
  // 3. First name match (first word matches)
  const sheetFirstWord = cleanSheetName.split(/\s+/)[0];
  match = rosterMembers.find(rm => {
    const dbFirstWord = rm.full_name.trim().toLowerCase().split(/\s+/)[0];
    return sheetFirstWord === dbFirstWord && dbFirstWord.length > 2; // avoid short names like "Al" matching falsely
  });
  if (match) return match;
  
  return null;
}

async function run() {
  console.log('Fetching existing roster members from Supabase...');
  const { data: dbRoster, error: rosterErr } = await supabase
    .from('roster_members')
    .select('*');
    
  if (rosterErr) {
    console.error('Error fetching roster members:', rosterErr);
    process.exit(1);
  }
  console.log(`Loaded ${dbRoster.length} roster members.`);
  const rosterMap = [...dbRoster];

  console.log('Fetching existing events from Supabase...');
  const { data: dbEvents, error: eventsErr } = await supabase
    .from('events')
    .select('*');
    
  if (eventsErr) {
    console.error('Error fetching events:', eventsErr);
    process.exit(1);
  }
  console.log(`Loaded ${dbEvents.length} events.`);
  
  // Build a map of local date (YYYY-MM-DD) to event ID
  const eventDateMap = new Map();
  for (const event of dbEvents) {
    const dateStr = getLocalDateStr(event.starts_at);
    eventDateMap.set(dateStr, event);
  }

  // Find all attendance XLSX files
  const files = fs.readdirSync(DOWNLOADS_DIR)
    .filter(file => file.endsWith('.xlsx') && file.toLowerCase().includes('responses'));
  
  console.log(`\nFound ${files.length} attendance files in ${DOWNLOADS_DIR}:`);
  for (const file of files) {
    console.log(` - ${file}`);
  }

  let totalAttendanceUpserted = 0;
  let newRosterMembersCount = 0;
  let newEventsCount = 0;
  const processedEventIds = new Set();

  for (const file of files) {
    const filePath = path.join(DOWNLOADS_DIR, file);
    console.log(`\n----------------------------------------`);
    console.log(`Processing file: ${file}`);
    
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${rows.length} rows in sheet "${firstSheetName}".`);
    
    for (const row of rows) {
      const timestampRaw = row['Timestamp'];
      const nameRaw = row['Full Name'];
      
      if (!timestampRaw || !nameRaw) {
        continue;
      }
      
      const timestamp = new Date(timestampRaw);
      const cleanName = nameRaw.trim();
      const localDate = getLocalDateStr(timestamp);
      
      // 1. Resolve Roster Member
      let member = findRosterMember(cleanName, rosterMap);
      if (!member) {
        console.log(`Roster member not found for "${cleanName}". Creating a new one...`);
        const { data: newMember, error: createRmErr } = await supabase
          .from('roster_members')
          .insert({ full_name: cleanName })
          .select()
          .single();
          
        if (createRmErr) {
          console.error(`Failed to create roster member "${cleanName}":`, createRmErr);
          continue;
        }
        
        member = newMember;
        rosterMap.push(member);
        newRosterMembersCount++;
        console.log(`Created roster member: ${member.full_name} (${member.id})`);
      }
      
      // 2. Resolve Event for this local date
      let event = eventDateMap.get(localDate);
      if (!event) {
        console.log(`Event not found for local date ${localDate}. Creating historical event...`);
        
        // Starts at 7:00 PM local time (19:00) on that day
        const startsAt = fromZonedTime(`${localDate}T19:00:00`, TZ);
        const checkinOpensAt = new Date(startsAt.getTime() - 30 * 60 * 1000);
        const lateAfterAt = new Date(startsAt.getTime() + 15 * 60 * 1000);
        const checkinClosesAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
        
        const { data: newEvent, error: createEventErr } = await supabase
          .from('events')
          .insert({
            title: `Rehearsal — ${localDate}`,
            description: 'Imported historical attendance sheet',
            starts_at: startsAt.toISOString(),
            checkin_opens_at: checkinOpensAt.toISOString(),
            late_after_at: lateAfterAt.toISOString(),
            checkin_closes_at: checkinClosesAt.toISOString(),
            is_historical: true
          })
          .select()
          .single();
          
        if (createEventErr) {
          console.error(`Failed to create event for date ${localDate}:`, createEventErr);
          continue;
        }
        
        event = newEvent;
        eventDateMap.set(localDate, event);
        newEventsCount++;
        console.log(`Created event: ${event.title} (${event.id})`);
      }
      processedEventIds.add(event.id);
      
      // 3. Calculate status (present or late)
      const checkinDate = new Date(timestamp);
      
      // Get local hour and minute in America/Los_Angeles timezone
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        hour12: false,
        hour: 'numeric',
        minute: 'numeric'
      });
      const timeParts = timeFormatter.formatToParts(checkinDate);
      const hours = parseInt(timeParts.find(p => p.type === 'hour').value, 10);
      const minutes = parseInt(timeParts.find(p => p.type === 'minute').value, 10);
      const weekdayName = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(checkinDate);
      let status = 'present';
      if (weekdayName === 'Thursday') {
        // Thursday start: 7:00pm (19:00). Late is 10+ minutes after start (19:10)
        if (hours > 19 || (hours === 19 && minutes >= 10)) {
          status = 'late';
        }
      } else if (weekdayName === 'Saturday') {
        // Saturday start: 3:30pm (15:30). Late is 10+ minutes after start (15:40)
        if (hours > 15 || (hours === 15 && minutes >= 40)) {
          status = 'late';
        }
      }
      
      // 4. Upsert Attendance Record
      const note = row['Notes'] || row['Reason'] || row['Note'] || null;
      const { error: upsertErr } = await supabase
        .from('attendance')
        .upsert({
          event_id: event.id,
          roster_member_id: member.id,
          checked_in_at: timestamp.toISOString(),
          status: status,
          note: note
        }, {
          onConflict: 'event_id,roster_member_id'
        });
        
      if (upsertErr) {
        console.error(`Failed to upsert attendance for ${member.full_name} at event ${event.title}:`, upsertErr);
      } else {
        totalAttendanceUpserted++;
      }
    }
  }

  console.log(`\nMarking absent members for the processed weeks...`);
  let totalAbsencesMarked = 0;
  
  for (const eventId of processedEventIds) {
    const event = Array.from(eventDateMap.values()).find(e => e.id === eventId);
    if (!event) continue;
    
    console.log(`Checking absences for event: ${event.title}...`);
    
    // Fetch all existing attendance records for this event
    const { data: existingAttendance, error: attErr } = await supabase
      .from('attendance')
      .select('roster_member_id')
      .eq('event_id', event.id);
      
    if (attErr) {
      console.error(`Failed to fetch attendance for event ${event.title}:`, attErr);
      continue;
    }
    
    const attendedRosterMemberIds = new Set(existingAttendance.map(a => a.roster_member_id));
    
    // Find roster members who didn't attend
    const absentMembers = rosterMap.filter(member => !attendedRosterMemberIds.has(member.id));
    
    console.log(`Found ${absentMembers.length} absent roster members out of ${rosterMap.length} total.`);
    
    for (const member of absentMembers) {
      const { error: upsertErr } = await supabase
        .from('attendance')
        .upsert({
          event_id: event.id,
          roster_member_id: member.id,
          checked_in_at: event.starts_at,
          status: 'absent',
          note: null
        }, {
          onConflict: 'event_id,roster_member_id'
        });
        
      if (upsertErr) {
        console.error(`Failed to mark ${member.full_name} as absent for event ${event.title}:`, upsertErr);
      } else {
        totalAbsencesMarked++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Import Complete!`);
  console.log(`- Created Roster Members: ${newRosterMembersCount}`);
  console.log(`- Created Events: ${newEventsCount}`);
  console.log(`- Upserted Attendance Records: ${totalAttendanceUpserted}`);
  console.log(`- Marked Absent Records: ${totalAbsencesMarked}`);
  console.log(`========================================`);
}

run().catch(console.error);
