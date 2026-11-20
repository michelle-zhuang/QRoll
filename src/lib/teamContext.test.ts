import { describe, it, expect } from 'vitest';
import { resolveUserTeamContext } from './teamContext';

describe('resolveUserTeamContext', () => {
  it('returns guest context when no user session exists', async () => {
    const mockSupabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null })
      }
    };
    const mockCookies = {
      get: () => undefined,
      set: () => {}
    } as any;

    const ctx = await resolveUserTeamContext(mockSupabase, mockCookies);
    expect(ctx.role).toBe('guest');
    expect(ctx.accessibleTeams).toEqual([]);
    expect(ctx.selectedTeamId).toBeNull();
  });

  it('resolves accessible teams for global admin', async () => {
    const mockUser = { id: 'admin-1', email: 'admin@example.com' };
    const mockSupabase = {
      auth: {
        getSession: async () => ({ data: { session: { user: mockUser } }, error: null })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === 'profiles') return { data: { id: 'admin-1', role: 'admin' }, error: null };
              return { data: null, error: null };
            },
            single: async () => ({ data: null, error: null })
          }),
          order: () => ({
            then: (resolve: any) => {
              if (table === 'companies') {
                return Promise.resolve(resolve({ data: [{ id: 'c1', name: 'Party People', slug: 'party-people' }], error: null }));
              }
              if (table === 'teams') {
                return Promise.resolve(resolve({ data: [{ id: 't1', name: 'Season 1', company_id: 'c1' }, { id: 't2', name: 'Season 2', company_id: 'c1' }], error: null }));
              }
              return Promise.resolve(resolve({ data: [], error: null }));
            }
          })
        })
      })
    };

    const cookieMap = new Map<string, string>();
    const mockCookies = {
      get: (key: string) => cookieMap.get(key) ? { value: cookieMap.get(key)! } : undefined,
      set: (key: string, val: string) => { cookieMap.set(key, val); }
    } as any;

    const ctx = await resolveUserTeamContext(mockSupabase, mockCookies);
    expect(ctx.isGlobalAdmin).toBe(true);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.role).toBe('admin');
    expect(ctx.accessibleTeams.length).toBe(2);
    expect(ctx.selectedTeamId).toBe('t1');
    expect(ctx.selectedTeam?.name).toBe('Season 1');
    expect(cookieMap.get('qroll_team_id')).toBe('t1');
    expect(cookieMap.get('active_team_id')).toBe('t1');
  });
});
