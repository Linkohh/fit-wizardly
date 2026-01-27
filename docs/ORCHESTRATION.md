# Orchestration & DevOps Context

## Environment Variables
Required in `.env.local` (Frontend) and resolved by server:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Build Pipeline
- **Dev**: `npm run dev` (Frontend: 8080, Proxying to Server: 3001).
- **Production Build**: `npm run build`.
- **Preview**: `npm run preview`.

## Database Management
- **Supabase**: Managed via dashboard or CLI.
- **Migrations**: Stored in `supabase/migrations/`.
- **Types**: Auto-generated via `src/integrations/supabase/types.ts`.

## Server
- **Path**: `server/` directory.
- **Runtime**: Node.js / Express.
- **Port**: 3001 (default).
- **Health Check**: `GET /health`.
