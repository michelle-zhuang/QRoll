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
  { id: 'roster-id-7', full_name: 'Eva Black', email: 'eva@example.com', claimed_user_id: null }
];

const mockEvents = [
  {
    id: 'event-id-1',
    title: 'Beginner Hip Hop Class',
    description: 'Weekly hip hop class for beginners.',
    cancelled_at: null,
    starts_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    checkin_opens_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
    late_after_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    checkin_closes_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    qr_token: 'token-hiphop-1',
    created_by: mockAdminId,
    created_at: new Date().toISOString()
  },
  {
    id: 'event-id-2',
    title: 'Intermediate Contemporary Dance',
    description: 'Contemporary technique session.',
    cancelled_at: null,
    starts_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    checkin_opens_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
    late_after_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    checkin_closes_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    qr_token: 'token-contemporary-2',
    created_by: mockAdminId,
    created_at: new Date().toISOString()
  },
  {
    id: 'event-id-3',
    title: 'Advanced Ballet Workshop',
    cancelled_at: null,
    description: 'Intense ballet session.',
    starts_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    checkin_opens_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
    late_after_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    checkin_closes_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    qr_token: 'token-ballet-3',
    created_by: mockAdminId,
    created_at: new Date().toISOString()
  }
];

const mockAttendance = [
  { event_id: 'event-id-1', roster_member_id: 'roster-id-1', status: 'present', note: 'Awesome energy', checked_in_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString() },
  { event_id: 'event-id-1', roster_member_id: 'roster-id-2', status: 'late', note: 'Traffic issue', checked_in_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString() },
  { event_id: 'event-id-1', roster_member_id: 'roster-id-3', status: 'present', note: null, checked_in_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString() },
  { event_id: 'event-id-1', roster_member_id: 'roster-id-4', status: 'absent', note: 'Injured ankle', checked_in_at: null },
  { event_id: 'event-id-1', roster_member_id: 'roster-id-5', status: 'present', note: null, checked_in_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },

  { event_id: 'event-id-2', roster_member_id: 'roster-id-1', status: 'present', note: null, checked_in_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 8 * 60 * 1000).toISOString() },
  { event_id: 'event-id-2', roster_member_id: 'roster-id-2', status: 'present', note: null, checked_in_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString() },
  { event_id: 'event-id-2', roster_member_id: 'roster-id-3', status: 'absent', note: 'School exam', checked_in_at: null },
  { event_id: 'event-id-2', roster_member_id: 'roster-id-4', status: 'present', note: null, checked_in_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { event_id: 'event-id-2', roster_member_id: 'roster-id-5', status: 'late', note: 'Worked late', checked_in_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString() }
];

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
