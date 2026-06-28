import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

// Default Admin User ID for Mock
const mockAdminId = 'ff8de013-6287-4794-a49c-b9b84f739c1a';

// In-memory mock database
const mockProfiles = [
  {
    id: mockAdminId,
    email: 'michellezhuang1014@gmail.com',
    full_name: 'Dev Admin (Bypass)',
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-id-attendee-1',
    email: 'attendee1@example.com',
    full_name: 'John Doe',
    role: 'attendee',
    created_at: new Date().toISOString()
  }
];

const mockRosterMembers = [
  { id: 'roster-id-1', full_name: 'John Doe', email: 'john@example.com', claimed_user_id: 'user-id-attendee-1' },
  { id: 'roster-id-2', full_name: 'Jane Smith', email: 'jane@example.com', claimed_user_id: null },
  { id: 'roster-id-3', full_name: 'Alice Johnson', email: 'alice@example.com', claimed_user_id: null },
  { id: 'roster-id-4', full_name: 'Bob Brown', email: 'bob@example.com', claimed_user_id: null },
  { id: 'roster-id-5', full_name: 'Charlie Green', email: 'charlie@example.com', claimed_user_id: null },
  { id: 'roster-id-6', full_name: 'David White', email: 'david@example.com', claimed_user_id: null },
  { id: 'roster-id-7', full_name: 'Eva Black', email: 'eva@example.com', claimed_user_id: null },
  { id: 'roster-id-8', full_name: 'Alexis Owens', email: 'alexis@example.com', claimed_user_id: null },
  { id: 'roster-id-9', full_name: 'Angelina Demiroska', email: 'angelina@example.com', claimed_user_id: null },
  { id: 'roster-id-10', full_name: 'Anna Li', email: 'anna@example.com', claimed_user_id: null },
  { id: 'roster-id-11', full_name: 'Ash Fetherbay', email: 'ash@example.com', claimed_user_id: null },
  { id: 'roster-id-12', full_name: 'Ashna Reddy', email: 'ashna@example.com', claimed_user_id: null },
  { id: 'roster-id-13', full_name: 'Ava Zhang', email: 'ava@example.com', claimed_user_id: null },
  { id: 'roster-id-14', full_name: 'Bharath', email: 'bharath@example.com', claimed_user_id: null },
  { id: 'roster-id-15', full_name: 'Brendon Mak', email: 'brendon@example.com', claimed_user_id: null },
  { id: 'roster-id-16', full_name: 'Bryan Lu', email: 'bryan@example.com', claimed_user_id: null },
  { id: 'roster-id-17', full_name: 'Chelsea Chrystal', email: 'chelsea@example.com', claimed_user_id: null },
  { id: 'roster-id-18', full_name: 'Chetu Khandavilli', email: 'chetu@example.com', claimed_user_id: null },
  { id: 'roster-id-19', full_name: "Christian 'Chris' Feliciano", email: 'christian@example.com', claimed_user_id: null },
  { id: 'roster-id-20', full_name: 'Fay Yu', email: 'fay@example.com', claimed_user_id: null },
  { id: 'roster-id-21', full_name: 'Frank Zhou', email: 'frank@example.com', claimed_user_id: null },
  { id: 'roster-id-22', full_name: 'Grace Chang', email: 'grace@example.com', claimed_user_id: null },
  { id: 'roster-id-23', full_name: 'Ha-Yoon Lee', email: 'hayoon@example.com', claimed_user_id: null },
  { id: 'roster-id-24', full_name: 'Huzi', email: 'huzi@example.com', claimed_user_id: null },
  { id: 'roster-id-25', full_name: 'Ieva Bračiulytė', email: 'ieva@example.com', claimed_user_id: null },
  { id: 'roster-id-26', full_name: 'Jackson Lind', email: 'jackson@example.com', claimed_user_id: null },
  { id: 'roster-id-27', full_name: 'Jose Li', email: 'jose@example.com', claimed_user_id: null },
  { id: 'roster-id-28', full_name: 'Katie Leung', email: 'katie@example.com', claimed_user_id: null },
  { id: 'roster-id-29', full_name: 'Kelvin Chen', email: 'kelvin@example.com', claimed_user_id: null },
  { id: 'roster-id-30', full_name: 'Ken Lin', email: 'ken@example.com', claimed_user_id: null },
  { id: 'roster-id-31', full_name: 'Kevin Lin', email: 'kevin.lin@example.com', claimed_user_id: null },
  { id: 'roster-id-32', full_name: 'Kevin Yochia Lin', email: 'kevin.y.lin@example.com', claimed_user_id: null },
  { id: 'roster-id-33', full_name: 'Kine Camara', email: 'kine@example.com', claimed_user_id: null },
  { id: 'roster-id-34', full_name: 'Lex Ramirez', email: 'lex@example.com', claimed_user_id: null },
  { id: 'roster-id-35', full_name: 'Lisa Ma', email: 'lisa@example.com', claimed_user_id: null },
  { id: 'roster-id-36', full_name: 'Lucy Zhang', email: 'lucy@example.com', claimed_user_id: null },
  { id: 'roster-id-37', full_name: 'Maxine Shih', email: 'maxine@example.com', claimed_user_id: null }
];

const mockEvents = Array.from({ length: 30 }, (_, i) => {
  const daysOffset = (i - 15) * 3; // spread events across 90 days
  const eventDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  return {
    id: `event-id-${i + 1}`,
    title: `Dance Session ${i + 1}`,
    description: `Regular recurring dance session ${i + 1}.`,
    cancelled_at: null,
    starts_at: eventDate.toISOString(),
    checkin_opens_at: new Date(eventDate.getTime() - 30 * 60 * 1000).toISOString(),
    late_after_at: new Date(eventDate.getTime() + 10 * 60 * 1000).toISOString(),
    checkin_closes_at: new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    qr_token: `token-session-${i + 1}`,
    created_by: mockAdminId,
    created_at: new Date().toISOString()
  };
});

const mockAttendance: any[] = [];
// Generate attendance records for all mockEvents dynamically
mockEvents.forEach((e, i) => {
  mockRosterMembers.forEach((m, idx) => {
    // Skip some roster members for event-id-15 to allow tests to run
    if (i === 14 && idx >= 3) return;

    const statuses: ('present' | 'late' | 'absent')[] = ['present', 'late', 'absent'];
    const status = statuses[(e.id.charCodeAt(e.id.length - 1) + idx) % 3];
    const checked_in_at = status !== 'absent'
      ? new Date(new Date(e.starts_at).getTime() + (status === 'late' ? 12 : -8) * 60 * 1000).toISOString()
      : null;
    
    mockAttendance.push({
      event_id: e.id,
      roster_member_id: m.id,
      status,
      note: status === 'late' ? 'Traffic' : status === 'absent' ? 'Sick' : null,
      checked_in_at
    });
  });
});


const mockAppSettings = [
  { key: 'allow_member_dashboard', value: false }
];

const mockAdminInvites: any[] = [
  { email: 'pending_admin@example.com', created_at: new Date().toISOString() }
];

// Query Builder simulator class for mock actions
export class MockQueryBuilder {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  opData: any = null;
  upsertOptions: any = null;
  filters: { field: string; op: string; value: any }[] = [];
  isSingle = false;
  isMaybeSingle = false;
  limitCount: number | null = null;
  orderField: string | null = null;
  orderAscending = true;

  constructor(table: string) {
    this.table = table;
  }



  select(fields?: string) {
    this.operation = 'select';
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.opData = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.opData = data;
    return this;
  }

  upsert(data: any, options?: any) {
    this.operation = 'upsert';
    this.opData = data;
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  is(field: string, value: any) {
    this.filters.push({ field, op: 'is', value });
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push({ field, op: 'lte', value });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ field, op: 'gte', value });
    return this;
  }

  gt(field: string, value: any) {
    this.filters.push({ field, op: 'gt', value });
    return this;
  }

  lt(field: string, value: any) {
    this.filters.push({ field, op: 'lt', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, op: 'in', value: values });
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  execute() {
    let dataset: any[] = [];
    if (this.table === 'profiles') dataset = mockProfiles;
    else if (this.table === 'roster_members') dataset = mockRosterMembers;
    else if (this.table === 'events') dataset = mockEvents;
    else if (this.table === 'attendance') dataset = mockAttendance;
    else if (this.table === 'app_settings') dataset = mockAppSettings;
    else if (this.table === 'admin_invites') dataset = mockAdminInvites;

    if (this.operation === 'select') {
      let result = [...dataset];
      for (const filter of this.filters) {
        if (filter.op === 'eq') {
          result = result.filter(item => item[filter.field] === filter.value);
        } else if (filter.op === 'is') {
          if (filter.value === null) {
            result = result.filter(item => item[filter.field] === null || item[filter.field] === undefined);
          } else {
            result = result.filter(item => item[filter.field] === filter.value);
          }
        } else if (filter.op === 'lte') {
          result = result.filter(item => item[filter.field] <= filter.value);
        } else if (filter.op === 'gte') {
          result = result.filter(item => item[filter.field] >= filter.value);
        } else if (filter.op === 'gt') {
          result = result.filter(item => item[filter.field] > filter.value);
        } else if (filter.op === 'lt') {
          result = result.filter(item => item[filter.field] < filter.value);
        } else if (filter.op === 'in') {
          const vals = Array.isArray(filter.value) ? filter.value : [filter.value];
          result = result.filter(item => vals.includes(item[filter.field]));
        }
      }
      if (this.orderField) {
        const field = this.orderField;
        const asc = this.orderAscending;
        result.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          if (typeof valA === 'string' && typeof valB === 'string') {
            return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return asc ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
        });
      }
      if (this.limitCount !== null) result = result.slice(0, this.limitCount);
      if (this.isSingle) {
        return { data: result[0] ?? null, error: null };
      }
      if (this.isMaybeSingle) {
        return { data: result[0] ?? null, error: null };
      }
      return { data: result, error: null };
    }

    if (this.operation === 'insert') {
      const rows = Array.isArray(this.opData) ? this.opData : [this.opData];
      const inserted: any[] = [];
      for (const row of rows) {
        const newRow = { 
          id: row.id || crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          ...row 
        };
        dataset.push(newRow);
        inserted.push(newRow);
      }
      return { data: Array.isArray(this.opData) ? inserted : inserted[0], error: null };
    }

    if (this.operation === 'upsert') {
      const rows = Array.isArray(this.opData) ? this.opData : [this.opData];
      const upserted: any[] = [];
      for (const row of rows) {
        const existingIdx = dataset.findIndex(
          (item: any) => item.event_id === row.event_id && item.roster_member_id === row.roster_member_id
        );
        if (existingIdx > -1) {
          const shouldIgnoreDups = this.upsertOptions?.ignoreDuplicates || false;
          if (shouldIgnoreDups) {
            upserted.push(dataset[existingIdx]); // Don't overwrite — just acknowledge existing record
          } else {
            dataset[existingIdx] = { ...dataset[existingIdx], ...row };
            upserted.push(dataset[existingIdx]);
          }
        } else {
          const newRow = { 
            id: row.id || crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
            status: row.status || 'present',
            created_at: new Date().toISOString(),
            ...row 
          };
          dataset.push(newRow);
          upserted.push(newRow);
        }
      }
      return { data: Array.isArray(this.opData) ? upserted : upserted[0], error: null };
    }

    if (this.operation === 'update') {
      const updated: any[] = [];
      for (let i = 0; i < dataset.length; i++) {
        let match = true;
        for (const filter of this.filters) {
          const val = dataset[i][filter.field];
          if (filter.op === 'eq' && val !== filter.value) match = false;
          else if (filter.op === 'is' && (filter.value === null ? (val !== null && val !== undefined) : val !== filter.value)) match = false;
          else if (filter.op === 'lte' && !(val <= filter.value)) match = false;
          else if (filter.op === 'gte' && !(val >= filter.value)) match = false;
          else if (filter.op === 'gt' && !(val > filter.value)) match = false;
          else if (filter.op === 'lt' && !(val < filter.value)) match = false;
          else if (filter.op === 'in' && !filter.value.includes(val)) match = false;
        }
        if (match) {
          dataset[i] = { ...dataset[i], ...this.opData };
          updated.push(dataset[i]);
        }
      }
      return { data: this.isSingle ? updated[0] : updated, error: null };
    }

    if (this.operation === 'delete') {
      const remaining: any[] = [];
      const deleted: any[] = [];
      for (const item of dataset) {
        let match = true;
        for (const filter of this.filters) {
          if (item[filter.field] !== filter.value) match = false;
        }
        if (match) {
          deleted.push(item);
        } else {
          remaining.push(item);
        }
      }
      
      if (this.table === 'profiles') {
        mockProfiles.length = 0;
        mockProfiles.push(...remaining);
      } else if (this.table === 'roster_members') {
        mockRosterMembers.length = 0;
        mockRosterMembers.push(...remaining);
      } else if (this.table === 'events') {
        mockEvents.length = 0;
        mockEvents.push(...remaining);
      } else if (this.table === 'attendance') {
        mockAttendance.length = 0;
        mockAttendance.push(...remaining);
      } else if (this.table === 'app_settings') {
        mockAppSettings.length = 0;
        mockAppSettings.push(...remaining);
      } else if (this.table === 'admin_invites') {
        mockAdminInvites.length = 0;
        mockAdminInvites.push(...remaining);
      }

      return { data: deleted, error: null };
    }

    return { data: null, error: null };
  }
}

export function createSupabaseClient(cookies: AstroCookies) {
  const client = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) { return cookies.get(key)?.value; },
        set(key, value, options) { cookies.set(key, value, options as CookieOptions); },
        remove(key, options) { cookies.delete(key, options as CookieOptions); },
      },
    }
  );

  if (import.meta.env.DEV) {
    return new Proxy(client, {
      get(target, prop, receiver) {
        if (prop === 'auth') {
          const auth = Reflect.get(target, prop, receiver);
          return new Proxy(auth, {
            get(authTarget, authProp, authReceiver) {
              if (authProp === 'getSession') {
                return async () => {
                  return {
                    data: {
                      session: {
                        user: {
                          id: mockAdminId,
                          email: 'michellezhuang1014@gmail.com',
                          user_metadata: { full_name: 'Dev Admin (Bypass)' },
                        },
                      },
                    },
                    error: null,
                  };
                };
              }
              return Reflect.get(authTarget, authProp, authReceiver);
            }
          });
        }

        if (prop === 'from') {
          return function(table: string) {
            return new MockQueryBuilder(table);
          };
        }

        return Reflect.get(target, prop, receiver);
      }
    });
  }

  return client;
}

export async function markAbsentForClosedEvents(
  supabase: any,
  options?: {
    roster?: { id: string }[];
    closedEvents?: { id: string; checkin_closes_at: string; cancelled_at: string | null }[];
  }
) {
  const nowIso = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  let closedEvents = options?.closedEvents
    ? options.closedEvents.filter((e: any) => {
        return e.checkin_closes_at &&
               e.checkin_closes_at < nowIso &&
               e.checkin_closes_at > thirtyDaysAgo &&
               !e.cancelled_at;
      })
    : undefined;
  let roster = options?.roster;
  
  if (!closedEvents || !roster) {
    const [eventsRes, rosterRes] = await Promise.all([
      closedEvents ? null : supabase
        .from('events')
        .select('id')
        .is('cancelled_at', null)
        .lt('checkin_closes_at', nowIso)
        .gt('checkin_closes_at', thirtyDaysAgo),
      roster ? null : supabase
        .from('roster_members')
        .select('id')
    ]);
    
    if (eventsRes) {
      closedEvents = eventsRes.data || [];
    }
    if (rosterRes) {
      roster = rosterRes.data || [];
    }
  }

  if (!closedEvents || closedEvents.length === 0 || !roster || roster.length === 0) return;

  const closedEventIds = closedEvents.map((e: any) => e.id);

  // 3. Get all existing attendance records for these closed events
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('event_id, roster_member_id')
    .in('event_id', closedEventIds);

  if (!existingAttendance) return;

  // Create a lookup: "event_id:roster_member_id"
  const existingSet = new Set(
    existingAttendance.map((a: any) => `${a.event_id}:${a.roster_member_id}`)
  );

  // 4. Find which combinations of (closedEvent, rosterMember) are missing
  const missingInserts: { event_id: string; roster_member_id: string; status: string }[] = [];
  for (const eventId of closedEventIds) {
    for (const member of roster) {
      if (!existingSet.has(`${eventId}:${member.id}`)) {
        missingInserts.push({
          event_id: eventId,
          roster_member_id: member.id,
          status: 'absent'
        });
      }
    }
  }

  // 5. Bulk upsert the missing 'absent' records to avoid unique constraint violations
  //    and silently handle concurrent inserts (e.g., from multiple page loads or races)
  if (missingInserts.length > 0) {
    try {
      await supabase
        .from('attendance')
        .upsert(missingInserts, { onConflict: 'event_id,roster_member_id', ignoreDuplicates: true });
    } catch (err) {
      console.error('[QRoll] Failed to mark absent for closed events:', err);
    }
  }
}
