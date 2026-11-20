import type { AstroCookies } from 'astro';

export interface AccessibleTeam {
  id: string;
  name: string;
  company_id: string;
  company_name?: string;
}

export interface AccessibleCompany {
  id: string;
  name: string;
  slug?: string;
}

export interface UserTeamContext {
  user: any;
  profile: any;
  isGlobalAdmin: boolean;
  isAdmin: boolean;
  role: 'admin' | 'attendee' | 'guest';
  accessibleTeams: AccessibleTeam[];
  accessibleCompanies: AccessibleCompany[];
  selectedTeamId: string | null;
  selectedCompanyId: string | null;
  selectedTeam: AccessibleTeam | null;
  selectedCompany: AccessibleCompany | null;
}

/**
 * Resolves the full team and company access hierarchy for the logged-in user.
 * Unifies cookie access across `qroll_team_id` and legacy `active_team_id`.
 */
export async function resolveUserTeamContext(
  supabase: any,
  cookies: AstroCookies,
  urlOverrideTeamId?: string | null
): Promise<UserTeamContext> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  const user = session?.user;

  if (!user) {
    return {
      user: null,
      profile: null,
      isGlobalAdmin: false,
      isAdmin: false,
      role: 'guest',
      accessibleTeams: [],
      accessibleCompanies: [],
      selectedTeamId: null,
      selectedCompanyId: null,
      selectedTeam: null,
      selectedCompany: null,
    };
  }

  // 1. Fetch user profile, company memberships, and team memberships in parallel
  const [profileRes, companyMembersRes, teamMembersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('company_members').select('company_id, role').eq('user_id', user.id),
    supabase.from('team_members').select('team_id').eq('user_id', user.id)
  ]);

  let profile = profileRes.data;
  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null
      })
      .select()
      .maybeSingle();
    if (!error && newProfile) profile = newProfile;
  }

  const isGlobalAdmin = profile?.role === 'admin';
  const companyMembers: any[] = companyMembersRes.data || [];
  const teamMembers: any[] = teamMembersRes.data || [];

  const adminCompanyIds = companyMembers
    .filter(cm => cm.role === 'admin')
    .map(cm => cm.company_id);

  const allUserCompanyIds = companyMembers.map(cm => cm.company_id);
  const memberTeamIds = teamMembers.map(tm => tm.team_id).filter(Boolean);

  // 2. Resolve accessible teams and companies based on permissions
  let rawTeams: any[] = [];
  let rawCompanies: any[] = [];

  if (isGlobalAdmin) {
    const [companiesRes, teamsRes] = await Promise.all([
      supabase.from('companies').select('id, name, slug').order('name'),
      supabase.from('teams').select('id, name, company_id').order('name')
    ]);
    rawCompanies = companiesRes.data || [];
    rawTeams = teamsRes.data || [];
  } else {
    // Collect teams from admin companies + teams the user is member of
    const teamPromises: Promise<any>[] = [];
    if (adminCompanyIds.length > 0) {
      teamPromises.push(
        supabase.from('teams').select('id, name, company_id').in('company_id', adminCompanyIds)
      );
    }
    if (memberTeamIds.length > 0) {
      teamPromises.push(
        supabase.from('teams').select('id, name, company_id').in('id', memberTeamIds)
      );
    }

    if (teamPromises.length > 0) {
      const teamResults = await Promise.all(teamPromises);
      const teamMap = new Map<string, any>();
      teamResults.forEach(res => {
        (res.data || []).forEach((t: any) => teamMap.set(t.id, t));
      });
      rawTeams = Array.from(teamMap.values());
    }

    // Collect all unique company IDs needed
    const neededCompanyIds = new Set<string>([
      ...allUserCompanyIds,
      ...rawTeams.map(t => t.company_id).filter(Boolean)
    ]);

    if (neededCompanyIds.size > 0) {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, slug')
        .in('id', Array.from(neededCompanyIds))
        .order('name');
      rawCompanies = companiesData || [];
    }
  }

  // Build company lookup map
  const companyMap = new Map<string, AccessibleCompany>();
  rawCompanies.forEach(c => companyMap.set(c.id, c));

  const accessibleCompanies: AccessibleCompany[] = rawCompanies;
  const accessibleTeams: AccessibleTeam[] = rawTeams.map(t => ({
    id: t.id,
    name: t.name,
    company_id: t.company_id,
    company_name: companyMap.get(t.company_id)?.name || 'Company'
  }));

  // 3. Resolve selected team ID (check urlOverride -> qroll_team_id cookie -> active_team_id cookie -> fallback)
  const cookieTeamId =
    urlOverrideTeamId ||
    cookies.get('qroll_team_id')?.value ||
    cookies.get('active_team_id')?.value ||
    null;

  let selectedTeam: AccessibleTeam | null = null;
  if (accessibleTeams.length > 0) {
    if (cookieTeamId) {
      selectedTeam = accessibleTeams.find(t => t.id === cookieTeamId) || null;
    }
    if (!selectedTeam) {
      selectedTeam = accessibleTeams[0];
    }
  }

  const selectedTeamId = selectedTeam ? selectedTeam.id : null;
  const selectedCompanyId = selectedTeam
    ? selectedTeam.company_id
    : (cookies.get('qroll_company_id')?.value || (accessibleCompanies[0]?.id ?? null));

  const selectedCompany = selectedCompanyId
    ? companyMap.get(selectedCompanyId) || accessibleCompanies.find(c => c.id === selectedCompanyId) || null
    : null;

  // Sync cookies so all pages stay consistent
  if (selectedTeamId) {
    cookies.set('qroll_team_id', selectedTeamId, { path: '/', maxAge: 31536000 });
    cookies.set('active_team_id', selectedTeamId, { path: '/', maxAge: 31536000 });
  }
  if (selectedCompanyId) {
    cookies.set('qroll_company_id', selectedCompanyId, { path: '/', maxAge: 31536000 });
  }

  // 4. Role determination
  let isAdmin = isGlobalAdmin;
  if (!isAdmin && selectedCompanyId) {
    const cm = companyMembers.find(m => m.company_id === selectedCompanyId);
    isAdmin = cm?.role === 'admin';
  }

  const role: 'admin' | 'attendee' = isAdmin ? 'admin' : 'attendee';

  return {
    user,
    profile,
    isGlobalAdmin,
    isAdmin,
    role,
    accessibleTeams,
    accessibleCompanies,
    selectedTeamId,
    selectedCompanyId,
    selectedTeam,
    selectedCompany
  };
}
