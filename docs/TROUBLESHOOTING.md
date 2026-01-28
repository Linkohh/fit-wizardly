# TROUBLESHOOTING.md - Common Issues and Solutions

> **Purpose**: Quick reference for diagnosing and resolving common development issues.
> **Audience**: Developers debugging issues, AI assistants helping users.

---

## Table of Contents

1. [Build Issues](#build-issues)
2. [Runtime Errors](#runtime-errors)
3. [Authentication Issues](#authentication-issues)
4. [Database Issues](#database-issues)
5. [State Management Issues](#state-management-issues)
6. [API Issues](#api-issues)
7. [Styling Issues](#styling-issues)
8. [Testing Issues](#testing-issues)
9. [Debug Mode](#debug-mode)

---

## Build Issues

### TypeScript Compilation Errors

#### "Cannot find module '@/...'"

**Cause**: Path alias not resolved

**Solutions**:
1. Check `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. Verify `vite.config.ts` alias:
```typescript
resolve: {
    alias: {
        '@': path.resolve(__dirname, './src'),
    },
}
```

3. Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

#### "Type 'X' is not assignable to type 'Y'"

**Cause**: Type mismatch, often from schema changes

**Solutions**:
1. Run `npm run build` to see full error
2. Check if Zod schema was updated without updating dependent types
3. Use `z.infer<typeof Schema>` for type inference
4. Check for optional vs required field mismatches

#### "'X' refers to a value, but is being used as a type here"

**Cause**: Importing a runtime value where a type is expected

**Solution**:
```typescript
// Wrong
import { MySchema } from './schemas';
type MyType = MySchema;

// Correct
import { MySchema } from './schemas';
type MyType = z.infer<typeof MySchema>;
```

### Vite Dev Server Issues

#### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::8080`

**Solutions**:
1. Kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -i :8080
   kill -9 <PID>
   ```

2. Change port in `vite.config.ts`:
   ```typescript
   server: {
       port: 8081,
   }
   ```

#### Hot Module Replacement (HMR) Not Working

**Solutions**:
1. Clear browser cache and hard refresh (`Ctrl+Shift+R`)
2. Check for syntax errors in modified files
3. Restart dev server
4. Delete `node_modules/.vite` cache:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

#### Build Fails with Memory Error

**Error**: `JavaScript heap out of memory`

**Solution**: Increase Node.js memory limit
```bash
# Windows
set NODE_OPTIONS=--max-old-space-size=4096

# Mac/Linux
export NODE_OPTIONS=--max-old-space-size=4096
```

---

## Runtime Errors

### "Cannot read properties of undefined"

**Common Causes & Solutions**:

1. **Accessing nested object before data loads**
   ```typescript
   // Wrong
   const name = user.profile.name;

   // Correct
   const name = user?.profile?.name ?? 'Default';
   ```

2. **Array index out of bounds**
   ```typescript
   // Wrong
   const first = items[0].name;

   // Correct
   const first = items?.[0]?.name;
   ```

3. **State not initialized**
   ```typescript
   // Check loading state
   if (isLoading) return <Loading />;
   if (!data) return <Empty />;
   ```

### "Maximum update depth exceeded"

**Cause**: Infinite re-render loop

**Common Patterns**:

1. **useEffect without proper dependencies**
   ```typescript
   // Wrong - triggers on every render
   useEffect(() => {
       setData(processData(data));
   });

   // Correct
   useEffect(() => {
       setData(processData(rawData));
   }, [rawData]);
   ```

2. **State update in render**
   ```typescript
   // Wrong
   function Component() {
       const [count, setCount] = useState(0);
       setCount(count + 1); // BAD!
   }

   // Correct - use useEffect or event handler
   ```

3. **Object/array in dependency array**
   ```typescript
   // Wrong - new object reference each render
   useEffect(() => {}, [{ key: value }]);

   // Correct - use primitive or useMemo
   const config = useMemo(() => ({ key: value }), [value]);
   useEffect(() => {}, [config]);
   ```

### "Objects are not valid as a React child"

**Cause**: Trying to render an object directly

**Solutions**:
```typescript
// Wrong
<div>{user}</div>

// Correct
<div>{user.name}</div>
<div>{JSON.stringify(user)}</div>
```

---

## Authentication Issues

### Magic Link Not Received

**Checklist**:
1. Check spam/junk folder
2. Verify email address is correct
3. Check Supabase dashboard → Authentication → Logs
4. Verify SMTP settings in Supabase

**Debug**:
```typescript
const { error } = await supabase.auth.signInWithOtp({ email });
console.log('Magic link error:', error);
```

### Token Expired / 401 Errors

**Cause**: Session expired or invalid token

**Solutions**:
1. **Check session refresh**:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   if (!session) {
       // Redirect to login
   }
   ```

2. **Force session refresh**:
   ```typescript
   const { data, error } = await supabase.auth.refreshSession();
   ```

3. **Clear local storage and re-login**:
   ```typescript
   localStorage.removeItem('sb-<project-ref>-auth-token');
   ```

### Redirect After Login Not Working

**Cause**: `emailRedirectTo` URL mismatch

**Solutions**:
1. Check Supabase dashboard → Authentication → URL Configuration
2. Add your local URL to "Redirect URLs":
   - `http://localhost:8080/**`
   - `http://localhost:8080/auth/callback`

3. Verify redirect URL in code:
   ```typescript
   await supabase.auth.signInWithOtp({
       email,
       options: {
           emailRedirectTo: window.location.origin + '/auth/callback',
       },
   });
   ```

### "Invalid login credentials"

**Checklist**:
1. Verify Supabase URL and anon key in `.env`
2. Check if user exists in Supabase dashboard
3. Verify email confirmation is not required (or user is confirmed)

---

## Database Issues

### Row Level Security (RLS) Blocking Queries

**Symptoms**:
- Empty results when data exists
- Insert/update silently fails
- 403 Forbidden errors

**Debug Steps**:
1. Check RLS policies in Supabase dashboard
2. Verify user ID matches policy conditions
3. Temporarily disable RLS for testing (NOT in production!):
   ```sql
   ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
   ```

**Common Policy Issues**:
```sql
-- Policy might be missing authenticated users
CREATE POLICY "Users can view own data"
ON plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### "relation 'X' does not exist"

**Cause**: Table not created or wrong schema

**Solutions**:
1. Run migrations:
   ```bash
   npx supabase db push
   ```

2. Check table exists in correct schema (usually `public`)

3. Verify Supabase project is correct in `.env`

### Slow Queries

**Debug**:
1. Enable query logging in Supabase dashboard
2. Add indexes for frequently queried columns:
   ```sql
   CREATE INDEX idx_plans_user_id ON plans(user_id);
   ```

3. Use `.explain()` to analyze:
   ```typescript
   const { data, error } = await supabase
       .from('plans')
       .select('*')
       .eq('user_id', userId)
       .explain();
   ```

---

## State Management Issues

### Zustand State Not Persisting

**Cause**: `persist` middleware not configured correctly

**Solutions**:
1. Verify persist middleware:
   ```typescript
   import { persist } from 'zustand/middleware';

   export const useStore = create(
       persist(
           (set) => ({
               // state
           }),
           {
               name: 'store-name',
               storage: createJSONStorage(() => localStorage),
           }
       )
   );
   ```

2. Check localStorage in DevTools → Application → Local Storage

3. Verify storage key isn't being cleared elsewhere

### Store Updates Not Reflecting in UI

**Cause**: Component not subscribed to correct state slice

**Solutions**:
1. **Use selectors**:
   ```typescript
   // Wrong - re-renders on any state change
   const { user, settings, data } = useStore();

   // Correct - only re-renders when user changes
   const user = useStore((state) => state.user);
   ```

2. **Check mutation pattern**:
   ```typescript
   // Wrong - mutating state directly
   set((state) => {
       state.items.push(newItem); // BAD!
   });

   // Correct - return new state
   set((state) => ({
       items: [...state.items, newItem],
   }));
   ```

### TanStack Query Cache Issues

**Symptoms**: Stale data, not refetching

**Solutions**:
1. **Force refetch**:
   ```typescript
   const { refetch } = useQuery({ queryKey: ['plans'] });
   await refetch();
   ```

2. **Invalidate cache**:
   ```typescript
   const queryClient = useQueryClient();
   queryClient.invalidateQueries({ queryKey: ['plans'] });
   ```

3. **Check stale time**:
   ```typescript
   useQuery({
       queryKey: ['plans'],
       queryFn: fetchPlans,
       staleTime: 0, // Always consider stale
   });
   ```

---

## API Issues

### CORS Errors

**Error**: `Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy`

**Solutions**:
1. **Check server CORS config** (`server/src/index.ts`):
   ```typescript
   const ALLOWED_ORIGINS = [
       'http://localhost:8080',
       'http://localhost:5173',
   ];
   ```

2. **Add your origin to allowed list**

3. **Check if credentials are needed**:
   ```typescript
   fetch(url, {
       credentials: 'include',
       // ...
   });
   ```

### 400 Bad Request

**Cause**: Invalid request body

**Debug**:
1. Check request body matches schema
2. Look at server validation error:
   ```json
   {
       "error": "Invalid input",
       "details": {
           "splitType": { "_errors": ["Required"] }
       }
   }
   ```

3. Validate locally before sending:
   ```typescript
   const result = CreatePlanSchema.safeParse(data);
   if (!result.success) {
       console.log(result.error.format());
   }
   ```

### 500 Internal Server Error

**Debug Steps**:
1. Check server console for error stack trace
2. Add request logging:
   ```typescript
   app.use((req, res, next) => {
       console.log(`${req.method} ${req.path}`, req.body);
       next();
   });
   ```

3. Wrap handlers in try-catch:
   ```typescript
   app.post('/plans', async (req, res) => {
       try {
           // handler
       } catch (error) {
           console.error('Error:', error);
           res.status(500).json({ error: 'Internal error' });
       }
   });
   ```

---

## Styling Issues

### Tailwind Classes Not Applying

**Solutions**:
1. **Check content paths** in `tailwind.config.ts`:
   ```typescript
   content: [
       './index.html',
       './src/**/*.{js,ts,jsx,tsx}',
   ],
   ```

2. **Restart dev server** after config changes

3. **Check class name typos** - use Tailwind IntelliSense extension

4. **Dynamic classes not working**:
   ```typescript
   // Wrong - won't be detected
   className={`text-${color}-500`}

   // Correct - use safelist or full class names
   className={color === 'red' ? 'text-red-500' : 'text-blue-500'}
   ```

### Dark Mode Not Working

**Checklist**:
1. Verify `darkMode: 'class'` in `tailwind.config.ts`
2. Check `<html>` element has `class="dark"` in dark mode
3. Use `dark:` prefix correctly:
   ```html
   <div class="bg-white dark:bg-gray-900">
   ```

### Animations Not Playing

**Solutions**:
1. Check `prefers-reduced-motion` setting
2. Verify Framer Motion is imported correctly
3. Check for CSS conflicts with Tailwind's `transition` classes

---

## Testing Issues

### Tests Timing Out

**Solutions**:
1. **Increase timeout**:
   ```typescript
   it('slow test', async () => {
       // ...
   }, 10000); // 10 second timeout
   ```

2. **Check for unresolved promises**

3. **Mock network requests**

### "Cannot find module" in Tests

**Solutions**:
1. Check `vitest.config.ts` has path aliases
2. Verify setup file runs:
   ```typescript
   test: {
       setupFiles: './src/test/setup.ts',
   }
   ```

### Mock Not Working

**Common Issues**:
```typescript
// Mock must be at top level, before imports
vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabase,
}));

// Reset mocks between tests
beforeEach(() => {
    vi.clearAllMocks();
});
```

---

## Debug Mode

### Enable Verbose Logging

```typescript
// Add to main.tsx or App.tsx
if (import.meta.env.DEV) {
    // Log all state changes
    useAuthStore.subscribe((state) => {
        console.log('Auth state:', state);
    });
}
```

### React Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to App.tsx
<QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Network Debugging

```typescript
// Log all fetch requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    console.log('Fetch:', args[0], args[1]);
    const response = await originalFetch(...args);
    console.log('Response:', response.status);
    return response;
};
```

### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create(
    devtools(
        (set) => ({
            // state
        }),
        { name: 'MyStore' }
    )
);
```

---

## Quick Diagnosis Checklist

| Symptom | First Check | Quick Fix |
|---------|-------------|-----------|
| Blank page | Browser console | Fix JS error |
| 404 on routes | `vite.config.ts` base | Set base: '/' |
| API returns empty | RLS policies | Check auth + policies |
| State not updating | Component subscription | Use selector |
| Styles missing | Tailwind content paths | Add file pattern |
| Auth fails | `.env` variables | Verify Supabase keys |
| Build fails | TypeScript errors | `npm run build` |

---

*Last Updated: 2026-01-27*
