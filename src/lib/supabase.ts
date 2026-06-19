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

// Query Builder simulator class for mock actions
class MockQueryBuilder {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  opData: any = null;
  filters: { field: string; value: any }[] = [];
  isSingle = false;

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
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  order(field: string, options?: any) {
    return this;
  }

  single() {
    this.isSingle = true;
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

    if (this.operation === 'select') {
      let result = [...dataset];
      for (const filter of this.filters) {
        result = result.filter(item => item[filter.field] === filter.value);
      }
      if (this.isSingle) {
        return { data: result[0] || null, error: null };
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
          item => item.event_id === row.event_id && item.roster_member_id === row.roster_member_id
        );
        if (existingIdx > -1) {
          dataset[existingIdx] = { ...dataset[existingIdx], ...row };
          upserted.push(dataset[existingIdx]);
        } else {
          const newRow = { 
            id: row.id || crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
            status: 'present',
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
          if (dataset[i][filter.field] !== filter.value) match = false;
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
