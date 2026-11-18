// Only allow same-origin (relative, single-slash) redirect targets so the
// `next` query param can't send users to an external domain after auth.
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
