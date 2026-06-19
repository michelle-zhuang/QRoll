import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fromZonedTime } from 'date-fns-tz';

const TZ = 'America/Los_Angeles';
const DOWNLOADS_DIR = '/Users/richardluo/Downloads/attendance';

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

// Helper to get event timing config based on date and weekday
function getEventTiming(localDate, weekdayName) {
  let startLocalStr;
  let lateOffsetMinutes = 10;
  
  if (localDate === '2026-05-07' || localDate === '2026-05-14') {
    startLocalStr = `${localDate}T18:30:00`;
  } else if (localDate === '2026-05-30') {
    startLocalStr = `${localDate}T18:00:00`;
  } else if (localDate === '2026-06-27') {
    startLocalStr = `${localDate}T14:30:00`;
  } else if (weekdayName === 'Thursday') {
    startLocalStr = `${localDate}T19:00:00`;
  } else if (weekdayName === 'Saturday') {
    startLocalStr = `${localDate}T15:30:00`;
  } else {
    // Default fallback
    startLocalStr = `${localDate}T19:00:00`;
  }
  
  const startsAt = fromZonedTime(startLocalStr, TZ);
  const checkinOpensAt = new Date(startsAt.getTime() - 30 * 60 * 1000);
  const lateAfterAt = new Date(startsAt.getTime() + lateOffsetMinutes * 60 * 1000);
  const checkinClosesAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  
  return { startsAt, checkinOpensAt, lateAfterAt, checkinClosesAt };
}

// Hardcoded mappings for names that have typos or significant differences
const NAME_MAPPINGS = {
  'chris feliciano': "Christian 'Chris' Feliicano",
  "chris feliciano (sorry if i didnt submit this yesterday d: …)": "Christian 'Chris' Feliicano",
};

const DROPPED_MEMBERS = [
  'alexis ho',
  'brandon banks',
  'sana',
  'sana samathita zarchi',
  'joaquin',
  'joaquin villegas'
];

// Resolve event for a check-in timestamp (handling late next-day submissions)
function resolveEventForTimestamp(timestamp, eventDateMap) {
  const checkinDateStr = getLocalDateStr(timestamp);
  
  // 1. If there's an event on the exact calendar date of the check-in, use it
  if (eventDateMap.has(checkinDateStr)) {
    return eventDateMap.get(checkinDateStr);
  }
  
  // 2. Otherwise, look for the closest event in the past (up to 3 days ago)
  const checkinTime = new Date(timestamp).getTime();
  let closestEvent = null;
  let minDiff = Infinity;
  
  for (const event of eventDateMap.values()) {
    const eventTime = new Date(event.starts_at).getTime();
    const diff = checkinTime - eventTime; // positive if event is in the past
    
    // Allow matching past events within 3 days (3 * 24 * 60 * 60 * 1000)
    if (diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000) {
      if (diff < minDiff) {
        minDiff = diff;
        closestEvent = event;
      }
    }
  }
  
  return closestEvent;
}

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
    .filter(file => file.endsWith('.xlsx') && (file.toLowerCase().includes('responses') || /^\d{4}_\d{2}_\d{2}/.test(file)));
  
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
      
      // Skip dropped members
      if (DROPPED_MEMBERS.includes(cleanName.toLowerCase())) {
        continue;
      }
      
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
      
      // 2. Resolve Event for this local date (taking late submissions into account)
      let event = resolveEventForTimestamp(timestamp, eventDateMap);
      let eventLocalDate = event ? getLocalDateStr(event.starts_at) : localDate;
      const weekdayName = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(timestamp);
      
      // Use timing of the event's actual date (or checkin date if creating a new one)
      const timing = getEventTiming(eventLocalDate, weekdayName);
      
      if (!event) {
        console.log(`Event not found for local date ${localDate}. Creating historical event...`);
        const { data: newEvent, error: createEventErr } = await supabase
          .from('events')
          .insert({
            title: `Rehearsal — ${localDate}`,
            description: 'Imported historical attendance sheet',
            starts_at: timing.startsAt.toISOString(),
            checkin_opens_at: timing.checkinOpensAt.toISOString(),
            late_after_at: timing.lateAfterAt.toISOString(),
            checkin_closes_at: timing.checkinClosesAt.toISOString(),
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
      } else {
        // Event exists, update its timing in the database to align with our local starts_at / late_after_at!
        const { data: updatedEvent, error: updateEventErr } = await supabase
          .from('events')
          .update({
            starts_at: timing.startsAt.toISOString(),
            checkin_opens_at: timing.checkinOpensAt.toISOString(),
            late_after_at: timing.lateAfterAt.toISOString(),
            checkin_closes_at: timing.checkinClosesAt.toISOString()
          })
          .eq('id', event.id)
          .select()
          .single();
          
        if (updateEventErr) {
          console.error(`Failed to update timing for event ${event.title}:`, updateEventErr);
        } else {
          event = updatedEvent;
          eventDateMap.set(eventLocalDate, event);
        }
      }
      processedEventIds.add(event.id);
      
      // 3. Calculate status (present or late)
      const status = timestamp > new Date(event.late_after_at) ? 'late' : 'present';
      
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
