# Vercel Secret Rotation Runbook

Use this runbook for the April 2026 Vercel security incident and future hosted-env exposure events.

## Confirmed Local Inventory

- Vercel project: `lins-projects-d5791edf/fit-wizardly`
- Vercel env names present at audit time: `ALLOWED_ORIGINS`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PLANS_PROVIDER`
- Local `.env` values were moved to ignored `.env.local`; the tracked `.env` file must contain placeholders only.
- Production, Preview, and Development currently use legacy JWT-format Supabase anon keys. Replace them with a fresh Supabase publishable key before revoking legacy key material.

## No-Downtime Rotation Order

1. Create replacement Supabase key material first.
   - Prefer a Supabase publishable key (`sb_publishable_...`) for the browser/client value.
   - Do not revoke legacy `anon`/JWT material until a deployment using the replacement is live.
2. Update Vercel env vars for future builds.
   - Update `VITE_SUPABASE_ANON_KEY` in Production, Preview, and Development.
   - Mark Production and Preview secret-like vars as sensitive where Vercel allows it.
   - Keep `VITE_SUPABASE_URL` and `VITE_PLANS_PROVIDER` as configuration, not secrets.
3. Redeploy from the hardened branch or from `main` after the branch is merged.
4. Verify login, Supabase reads/writes, plan sync, and any trainer access flow.
5. Only after the new deployment is live and verified, revoke/deactivate the old Supabase key material.
6. Delete local generated bundles that may still contain the old `VITE_SUPABASE_ANON_KEY`, then rebuild or run Capacitor sync from the rotated env.

## Vercel CLI Checks

```sh
vercel env ls
vercel env ls production
vercel env ls preview
vercel env ls development
```

Update values interactively so secrets are not stored in shell history:

```sh
vercel env update VITE_SUPABASE_ANON_KEY production --sensitive
vercel env update VITE_SUPABASE_ANON_KEY preview --sensitive
vercel env update VITE_SUPABASE_ANON_KEY development
vercel env pull .env.local --environment=development --yes
```

## Incident Follow-Up

- Review Vercel Activity Log for unexpected env reads, project setting changes, and deployments.
- Review recent deployments and delete any suspicious preview deployments.
- Enable MFA/passkeys for all Vercel team members.
- Keep Deployment Protection at Standard or stricter and rotate deployment protection tokens if configured.
- Verify Supabase Row Level Security policies, especially because browser publishable/anon keys are public by design.

References:

- Vercel April 2026 security incident: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident
- Vercel sensitive environment variables: https://vercel.com/docs/environment-variables/sensitive-environment-variables
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
