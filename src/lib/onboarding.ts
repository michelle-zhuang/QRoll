/**
 * Team onboarding helpers.
 *
 * These functions are used by the check-in page to auto-link a signed-in user
 * to their team entry or to present a fuzzy-match selection UI.
 */

export type TeamMember = {
  id: string;
  full_name: string;
  email: string | null;
  user_id: string | null;
};

// ---------------------------------------------------------------------------
// Levenshtein distance (used for client-side fuzzy matching)
// ---------------------------------------------------------------------------
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ---------------------------------------------------------------------------
// findExactNameMatch
// ---------------------------------------------------------------------------
/**
 * Returns the first unclaimed team member whose full_name exactly matches
 * `fullName` (case-insensitive), or null if none found.
 */
export async function findExactNameMatch(
  supabase: any,
  teamId: string,
  fullName: string
): Promise<TeamMember | null> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, full_name, email, user_id')
    .eq('team_id', teamId)
    .is('user_id', null);

  if (error || !data) return null;

  const lower = fullName.toLowerCase();
  return (
    (data as TeamMember[]).find(
      (m) => m.full_name.toLowerCase() === lower
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// findFuzzyMatches
// ---------------------------------------------------------------------------
/**
 * Returns up to `limit` unclaimed team members whose full_name is "close"
 * to `fullName` (Levenshtein distance ≤ threshold or substring match).
 * Results are sorted by closeness (ascending distance).
 */
export async function findFuzzyMatches(
  supabase: any,
  teamId: string,
  fullName: string,
  limit = 5,
  threshold = 4
): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, full_name, email, user_id')
    .eq('team_id', teamId)
    .is('user_id', null);

  if (error || !data) return [];

  const lower = fullName.toLowerCase();

  return (data as TeamMember[])
    .map((m) => ({ member: m, dist: levenshtein(lower, m.full_name.toLowerCase()) }))
    .filter(
      ({ member, dist }) =>
        dist <= threshold ||
        member.full_name.toLowerCase().includes(lower) ||
        lower.includes(member.full_name.toLowerCase())
    )
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(({ member }) => member);
}

// ---------------------------------------------------------------------------
// getAllUnclaimedMembers
// ---------------------------------------------------------------------------
/**
 * Returns all unclaimed team members for the searchable dropdown.
 */
export async function getAllUnclaimedMembers(supabase: any, teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, full_name, email, user_id')
    .eq('team_id', teamId)
    .is('user_id', null)
    .order('full_name', { ascending: true });

  if (error || !data) return [];
  return data as TeamMember[];
}

// ---------------------------------------------------------------------------
// linkTeamMember
// ---------------------------------------------------------------------------
/**
 * Claims a team member entry on behalf of `userId`. Requires the authenticated user 
 * to be the one making the call (enforced by RLS as well).
 */
export async function linkTeamMember(
  supabase: any,
  userId: string,
  teamMemberId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('team_members')
    .update({ user_id: userId, claimed_at: new Date().toISOString() })
    .eq('id', teamMemberId)
    .is('user_id', null);

  return { error: error ? error.message : null };
}
