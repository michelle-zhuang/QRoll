## Summary

<!-- What does this PR change and why? Link related issues. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Schema migration (Supabase)
- [ ] CI / infra
- [ ] Docs

## Readiness checklist

### Code quality
- [ ] `npm test` passes locally
- [ ] `npx astro check` passes (0 errors)
- [ ] `npm run build` succeeds locally
- [ ] No console errors or unused variables introduced
- [ ] No `TODO` / `FIXME` left without an issue link

### Security
- [ ] No secrets, API keys, or service-role tokens committed
- [ ] `.env` / `.env.local` not staged (only `.env.example` if updated)
- [ ] Any new public env var uses `PUBLIC_*` prefix; server-only vars do not
- [ ] RLS policies updated if new tables / sensitive columns added

### Database
- [ ] If schema changed, a new migration file added under `supabase/migrations/`
- [ ] Migration is idempotent (`if not exists`, `on conflict do nothing`, etc.)
- [ ] Tested with `supabase db push` against a non-prod project (or dry-run reviewed)
- [ ] Backwards-compatible with currently-deployed code, OR migration ordering documented

### UI / UX
- [ ] Verified on desktop and mobile widths
- [ ] Light / dark mode (if applicable) both look correct
- [ ] Keyboard navigation and focus states preserved
- [ ] No layout shift introduced

### Deployment
- [ ] Preview deployment URL reviewed (Vercel will post automatically)
- [ ] New env vars added in Vercel dashboard (Production + Preview) if needed
- [ ] Breaking changes called out below

## Screenshots / recordings

<!-- Drag in before/after screenshots or screen recordings of UI changes. -->

## Notes for reviewers

<!-- Anything tricky? Migration order? Manual steps post-merge? -->
