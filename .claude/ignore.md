# Files to Ignore

## Do Not Modify

These files should NOT be modified without explicit user request:

### UI Primitives
- `src/components/ui/*` - shadcn/ui components (managed by CLI)

### Configuration Files
- `package-lock.json` - Auto-generated
- `tsconfig.json` - Rarely needs changes
- `tailwind.config.ts` - Only for theme additions

### Third-Party
- `node_modules/` - Dependencies
- `.git/` - Version control

## Do Not Include in Context

Files that add noise without value:

### Build Artifacts
- `dist/`
- `.vite/`
- `*.log`

### Large Data Files
- `*.min.js`
- `*.map`
- Exercise database JSONs (unless specifically needed)

### Lock Files
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`

## Sensitive Files

NEVER read or expose contents of:

### Environment
- `.env`
- `.env.local`
- `.env.production`

### Credentials
- `*.pem`
- `*.key`
- `credentials*.json`
- `service-account*.json`

### Local Config
- `.claude/` (except when documenting)
- `.vscode/settings.json` (may contain secrets)

## Context Priority

When context is limited, prioritize reading:

1. **High Priority** (Always include)
   - `CLAUDE.md`
   - Relevant "Lens" document
   - File being modified
   - Related schema files

2. **Medium Priority** (Include if relevant)
   - Related test files
   - Related component files
   - API route being called

3. **Low Priority** (Include only if asked)
   - Configuration files
   - Translation files
   - Style definitions
