// ============================================
// delete-account Edge Function (Deno). Contract #4.
// ============================================
// Deploy: see README.md in this folder. The logic lives in handler.ts so it can be
// unit-tested without a network or a Supabase project (index.test.ts).
//
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided to
// every function by Supabase. ALLOWED_ORIGINS is a secret you set yourself.
// This is the ONLY place in the project that uses the service-role key.

import { createClient } from 'npm:@supabase/supabase-js@2.105.1';
import { createHandler, type CreateClient } from './handler.ts';

Deno.serve(
  createHandler({
    createClient: createClient as unknown as CreateClient,
    getEnv: (name) => Deno.env.get(name),
  }),
);
