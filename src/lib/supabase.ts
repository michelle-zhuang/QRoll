import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

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
    const mockAdminId = 'ff8de013-6287-4794-a49c-b9b84f739c1a';
    return new Proxy(client, {
      get(target, prop, receiver) {
        if (prop === 'auth') {
          const auth = Reflect.get(target, prop, receiver);
          return new Proxy(auth, {
            get(authTarget, authProp, authReceiver) {
              if (authProp === 'getSession') {
                return async () => {
                  const actual = await Reflect.get(authTarget, authProp, authReceiver).call(authTarget);
                  if (actual.data.session) return actual;

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
          const fromFn = Reflect.get(target, prop, receiver);
          return function(table: string) {
            if (table === 'profiles') {
              const queryBuilder = fromFn.call(target, table);
              return new Proxy(queryBuilder, {
                get(qbTarget, qbProp) {
                  if (qbProp === 'select') {
                    return function(...args: any[]) {
                      const filterBuilder = qbTarget.select(...args);
                      return new Proxy(filterBuilder, {
                        get(fbTarget, fbProp) {
                          if (fbProp === 'single') {
                            return async function() {
                              return {
                                data: {
                                  id: mockAdminId,
                                  email: 'michellezhuang1014@gmail.com',
                                  full_name: 'Dev Admin (Bypass)',
                                  role: 'admin',
                                },
                                error: null,
                              };
                            };
                          }
                          return Reflect.get(fbTarget, fbProp);
                        }
                      });
                    };
                  }
                  return Reflect.get(qbTarget, qbProp);
                }
              });
            }
            return fromFn.call(target, table);
          };
        }

        return Reflect.get(target, prop, receiver);
      }
    });
  }

  return client;
}
