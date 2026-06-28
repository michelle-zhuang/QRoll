# Multi-Company/Team Architecture for QRoll

## Overview
This spec defines the architecture to extend QRoll from single-organization events to multi-company/team structures while preserving all existing functionality and adding new company/team management capabilities.

## Problem Statement
QRoll currently supports events within organizations but lacks multi-level organization support. Users need to:
1. Work across multiple companies/partner organizations  
2. Manage teams within companies with unique QR codes
3. Migrate existing "party people" data to new structure
4. Join teams via unique invite links

## Solution Architecture

### 1. Database Schema Evolution

**New Tables:**

#### Companies (top-level containers, migrate existing data)
```sql
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Teams (unique QR codes, per-company)
```sql
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  qr_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Team Members (extends roster_members concept)
```sql
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  notes text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Team Events (events belong to teams)
```sql
CREATE TABLE public.team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  checkin_opens_at timestamptz NOT NULL,
  late_after_at timestamptz NOT NULL,
  checkin_closes_at timestamptz NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Database Migration Updates:**
```sql
-- Attendance foreign keys updated
ALTER TABLE public.attendance DROP CONSTRAINT attendance_event_id_user_id_key;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_event_roster_unique UNIQUE (event_id, roster_member_id);
ALTER TABLE public.attendance ADD COLUMN roster_member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE;
```

### 2. Migration Strategy

**Phase 1 - Data Migration:**

```sql
-- Create company "party people"
INSERT INTO public.companies (name) VALUES ('party people') RETURNING id;

-- Create team "Summer 2026" under company
INSERT INTO public.teams (company_id, name, qr_code) 
VALUES ((SELECT id FROM public.companies WHERE name = 'party people'), 'Summer 2026', 'TEAM-SUMMER-2026') RETURNING id;

-- Migrate roster_members to team_members
UPDATE public.roster_members 
SET company_id = (SELECT id FROM public.companies WHERE name = 'party people'),
    team_id = (SELECT id FROM public.teams WHERE name = 'Summer 2026')
WHERE claimed_user_id IS NOT NULL OR email IS NOT NULL;

-- Convert events to team_events
UPDATE public.events 
SET team_id = (SELECT id FROM public.teams WHERE name = 'Summer 2026')
WHERE qr_token IS NOT NULL;

-- Migrate attendance foreign keys
UPDATE public.attendance 
SET roster_member_id = tm.id
FROM public.team_members tm 
WHERE tm.email = public.attendance.user_id::text;
```

### 3. Data Access Pattern

**Current API endpoints updated:**
- `GET /api/events` → Query team_events filtered by user's teams
- `POST /api/roster/link` → Updated to handle team_members
- `POST /api/auth/signin` → Auto-claim to team_members
- `POST /api/attendance/note` → New team_members specific endpoint

**New API endpoints:**
- `GET /api/companies` → List available companies
- `GET /api/companies/:id/teams` → List teams in company
- `POST /api/teams/join` → Join team via QR code
- `GET /api/user/teams` → Get teams user belongs to

### 4. Frontend Architecture Changes

**Landing Page:**
```
Browse Companies → [Company Card with logo, mission, team count]
  ↓
View Teams → [Team Card showing: team name, QR code, member count]
  ↓
Join Team → [QR scanner or invite link input]
  ↓
Team Dashboard → [Team-specific events list, member roster]
  ↓
Event Check-in → [Normal QR roll, but team-filtered]
```

**Key Components:**
- **CompanyBrowser** - Browse/search companies
- **TeamSelector** - Display team QR codes and join functionality  
- **TeamDashboard** - Team-specific views (replace admin/events for team context)
- **TeamEventList** - Events filtered by team
- **TeamRoster** - Team member management

### 5. User Experience Flow

**New User Journey:**
1. Landing: "Browse companies or create team"
2. Company Selection: Filter by industry/location, see team count
3. Team Discovery: View team QR codes, member testimonials
4. Join Process: Scan QR or enter invite code
5. Team Access: Enter team dashboard with immediate event access

**Admin Experience (Multi-Company):**
- Company switcher in navigation
- Company-level visibility (admin of one company)
- Team management within owned companies
- Cross-company event analytics

**Existing Features (Preserved):**
- All attendance matrix functionality
- Import/export capabilities  
- Profile management
- Event details and notes
- Mobile QR scanning unchanged

### 6. Backward Compatibility

**Migration Phasing:**
1. **Week 1** - Database schema deployed
2. **Week 2** - Migration scripts run (data moved from old tables)
3. **Week 3** - Company/team selection UI launched  
4. **Week 4** - Team features stabilized
5. **Week 5** - Gradual migration of existing users

**Fallback Options:**
- Users can bypass company/team selection temporarily
- Legacy event access maintained during transition
- Gradual rollout by region/company

### Risk Mitigation

**Data Integrity:**
- Transaction-based migrations
- Rollback procedures for failed migrations
- Data validation checkpoints

**User Experience:**
- Clear onboarding for new multi-company paradigm
- Familiar UI patterns maintained
- Company/team switching clearly indicated

**Performance:**
- Optimized queries for team filtering
- Indexing on company_id and team_id columns
- Caching for frequently accessed team data

### Success Criteria

**Functional:**
- Users can join teams via QR codes
- Team-specific dashboards display correctly
- All existing features continue to work
- Migration completes with zero data loss

**Technical:**
- Database schema changes deploy cleanly
- API endpoints return expected data
- Frontend loads quickly with team filtering
- Mobile app compatibility maintained

**User Adoption:**
- 80% of existing users continue using system
- New team creation is intuitive
- Cross-company workflows are seamless

### Implementation Priorities

1. **Database Schema** - Core table structures and relationships
2. **Data Migration** - Transfer existing "party people" data
3. **API Layer** - New endpoints for company/team operations
4. **Frontend Components** - Company/team selection and dashboard
5. **Team Features** - QR code generation and member management
6. **Integration** - Connect existing features to new structure

### Technical Dependencies

- Supabase database with proper indexing
- Frontend framework with React hooks
- Mobile QR scanning capabilities
- Real-time updates for team membership changes
- Email verification for team joins

---

*Spec created: 2026-06-27*
*Status: Ready for implementation*
*Next step: Execute implementation plan with writing-plans skill*
