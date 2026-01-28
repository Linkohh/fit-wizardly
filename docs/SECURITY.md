# Security Context

> **Lens Purpose**: This document defines authentication, authorization, data protection, and security best practices. Read this before implementing any feature that handles user data or authentication.

---

## Table of Contents
- [Security Principles](#security-principles)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Frontend Security](#frontend-security)
- [Backend Security](#backend-security)
- [Database Security (RLS)](#database-security-rls)
- [Input Validation](#input-validation)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Environment Variables](#environment-variables)
- [Security Checklist](#security-checklist)
- [Common Vulnerabilities](#common-vulnerabilities)

---

## Security Principles

### Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│  Input Sanitization → Auth Guards → HTTPS Only          │
├─────────────────────────────────────────────────────────┤
│                      API LAYER                           │
│  Rate Limiting → Token Validation → Request Validation  │
├─────────────────────────────────────────────────────────┤
│                      DATABASE                            │
│  RLS Policies → Encryption at Rest → Audit Logs         │
└─────────────────────────────────────────────────────────┘
```

### Core Security Rules

1. **Never Trust the Client** - Always validate on the server
2. **Principle of Least Privilege** - Grant minimum necessary access
3. **Fail Secure** - Default to denying access when in doubt
4. **Validate All Inputs** - Use Zod schemas for runtime validation
5. **Log Security Events** - Track auth failures and suspicious activity

---

## Authentication

### Provider: Supabase Auth

Magic Link / OTP authentication flow.

```typescript
// src/stores/authStore.ts manages all auth state

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
}
```

### Auth Flow

```
1. User enters email
2. Supabase sends magic link
3. User clicks link → redirected to app
4. App receives session via onAuthStateChange
5. Profile created/fetched
6. User redirected to intended page
```

### Sign In Implementation

```typescript
// Magic link sign-in
const signInWithEmail = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  return { error };
};
```

### Session Management

```typescript
// Initialize auth state on app load
const initialize = async () => {
  // Get existing session
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    set({ user: session.user, session, profile });
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // Handle sign in
    } else if (event === 'SIGNED_OUT') {
      // Clear state
    }
  });
};
```

### Sign Out

```typescript
// Always clear state even if API fails
const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
  }

  // Clear state regardless
  set({ user: null, session: null, profile: null });
};
```

---

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// server/src/middleware/auth.ts
export type UserRole = 'client' | 'trainer' | 'admin';

// Permission checks
export const permissions = {
  canViewPlan: (user, planOwnerId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'trainer') return true;
    return user.id === planOwnerId;
  },

  canEditPlan: (user, planOwnerId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.id === planOwnerId;
  },

  canManageClients: (user) => {
    if (!user) return false;
    return user.role === 'trainer' || user.role === 'admin';
  },

  canAccessAdmin: (user) => {
    return user?.role === 'admin';
  },
};
```

### Frontend Protection

#### RequireAuth Component

```typescript
// src/components/RequireAuth.tsx
interface RequireAuthProps {
  children: ReactNode;
  strict?: boolean;  // true = force login, false = allow guests
}

function RequireAuth({ children, strict = true }: RequireAuthProps) {
  const { user, isLoading, setShowAuthModal } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (strict && !user) {
    // Show auth modal instead of redirecting
    setShowAuthModal(true);
    return <AuthPrompt />;
  }

  return <>{children}</>;
}

// Usage
<RequireAuth strict={true}>
  <ProtectedPage />
</RequireAuth>
```

#### Route Guards

```typescript
// Guards for specific conditions

// TrainerGuard - requires trainer role
function TrainerGuard({ children }) {
  const { profile } = useAuthStore();

  if (profile?.role !== 'trainer') {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}

// OnboardingGuard - ensures profile is complete
function OnboardingGuard({ children }) {
  const { profile } = useAuthStore();

  if (!profile?.onboarding_complete) {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}
```

---

## Frontend Security

### XSS Prevention

React automatically escapes JSX content, providing built-in XSS protection:

```typescript
// SAFE: React escapes this automatically
<div>{userInput}</div>

// UNSAFE PATTERN TO AVOID: Directly setting inner HTML
// If you must render HTML, always sanitize with DOMPurify first:
import DOMPurify from 'dompurify';

// Only use this pattern when HTML rendering is absolutely required
const sanitizedHtml = DOMPurify.sanitize(untrustedHtml);
```

### URL Handling

```typescript
// Validate URLs before using
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

// Sanitize redirect URLs
function getSafeRedirect(url: string | null): string {
  if (!url) return '/';

  // Only allow relative URLs or same-origin
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      return '/'; // Reject cross-origin redirects
    }
    return parsed.pathname + parsed.search;
  } catch {
    return '/';
  }
}
```

### Sensitive Data Handling

```typescript
// Never log sensitive data
console.log('User:', user);  // OK
console.log('Session:', session.access_token);  // BAD!

// Clear sensitive data from memory when done
function handlePasswordChange(password: string) {
  try {
    await updatePassword(password);
  } finally {
    password = ''; // Clear from variable
  }
}

// Don't store sensitive data in localStorage
localStorage.setItem('token', token);  // BAD!
// Supabase handles token storage securely
```

---

## Backend Security

### Middleware Stack

```typescript
// server/src/index.ts
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authenticate, requireAuth } from './middleware/auth';

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

// Rate limiting
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 auth attempts per hour
  message: { error: 'Too many login attempts', code: 'RATE_LIMITED' },
});

// Apply middleware
app.use(standardLimiter);
app.use('/api/auth', authLimiter);
app.use(authenticate); // Parse auth token
```

### Token Verification

```typescript
// CRITICAL: Always verify tokens server-side
export async function verifyToken(token: string): Promise<User | null> {
  try {
    // Verify with Supabase Auth API
    const response = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.SUPABASE_ANON_KEY!,
        },
      }
    );

    if (!response.ok) return null;

    const user = await response.json();
    return user;
  } catch {
    return null;
  }
}

// CRITICAL: Never trust client-claimed user ID
router.post('/plans', requireAuth, async (req, res) => {
  // BAD: Using client-provided userId
  const { userId, ...planData } = req.body;

  // GOOD: Using verified user from auth middleware
  const userId = req.user!.id;

  await createPlan({ ...planData, user_id: userId });
});
```

### Request Validation

```typescript
import { z } from 'zod';

// Define schema
const CreatePlanSchema = z.object({
  name: z.string().min(1).max(100),
  exercises: z.array(z.string().uuid()).min(1).max(50),
  scheduledFor: z.coerce.date().optional(),
});

// Validate in route
router.post('/plans', requireAuth, async (req, res) => {
  const result = CreatePlanSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: result.error.format(),
    });
  }

  // result.data is now typed and validated
  const plan = result.data;
  // ...
});
```

---

## Database Security (RLS)

### Row Level Security Policies

RLS is **ENABLED** on all tables. Users can only access their own data.

```sql
-- Example RLS policy for workouts table
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);
```

### RLS Best Practices

```sql
-- Always use auth.uid() for user checks
USING (auth.uid() = user_id)  -- GOOD
USING (user_id = $1)          -- BAD - could be bypassed

-- For shared resources (e.g., circles)
CREATE POLICY "Members can view circle"
  ON circles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM circle_members
      WHERE circle_id = circles.id
    )
  );

-- Admin bypass (use sparingly)
CREATE POLICY "Admins can view all"
  ON workouts FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Testing RLS

```typescript
// Test RLS policies work correctly
describe('Workout RLS', () => {
  it('user can only see their own workouts', async () => {
    // Sign in as user A
    await supabase.auth.signInWithPassword({ email: userA, password });

    // Try to read user B's workout
    const { data, error } = await supabase
      .from('workouts')
      .select()
      .eq('id', userBWorkoutId);

    // Should return empty, not error
    expect(data).toEqual([]);
  });
});
```

---

## Input Validation

### Validation Strategy

```
1. Client-side (UX feedback) → Zod schema
2. API layer (security gate) → Zod schema
3. Database layer (last defense) → RLS + constraints
```

### Zod Schema Patterns

```typescript
// src/lib/validation/fitness.ts

// Reusable validators
const SafeString = z.string()
  .min(1)
  .max(1000)
  .transform(s => s.trim());

const Email = z.string()
  .email()
  .toLowerCase()
  .max(255);

const UUID = z.string().uuid();

// Enum validation (prevents injection)
const GoalSchema = z.enum(['strength', 'hypertrophy', 'general']);

// Array with limits
const ExerciseListSchema = z.array(z.string().uuid())
  .min(1, 'Add at least one exercise')
  .max(50, 'Too many exercises');

// Numeric bounds
const SetsSchema = z.number()
  .int()
  .min(1)
  .max(10);

// Complete validation
const CreateWorkoutSchema = z.object({
  name: SafeString.max(100),
  goal: GoalSchema,
  exercises: ExerciseListSchema,
  sets: SetsSchema,
});
```

### Validation Helpers

```typescript
// Safe parsing with error handling
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const message = context
      ? `${context}: ${result.error.message}`
      : result.error.message;

    console.error('Validation failed:', {
      context,
      errors: result.error.format(),
    });

    throw new ValidationError(message, result.error);
  }

  return result.data;
}

// Usage
const workout = validateOrThrow(
  CreateWorkoutSchema,
  req.body,
  'Create workout'
);
```

---

## Data Protection

### Sensitive Data Categories

| Category | Examples | Handling |
|----------|----------|----------|
| **PII** | Email, name, phone | Encrypt, minimize storage |
| **Auth** | Tokens, passwords | Never log, hash passwords |
| **Health** | Weight, injuries | RLS protected, consent required |
| **Financial** | Payment info | Use Stripe, never store cards |

### Data Minimization

```typescript
// Only request necessary data
const { data } = await supabase
  .from('profiles')
  .select('id, display_name, avatar_url')  // Only needed fields
  .eq('id', userId)
  .single();

// Don't return sensitive fields to client
const publicProfile = {
  id: profile.id,
  displayName: profile.display_name,
  avatarUrl: profile.avatar_url,
  // Omit: email, phone, role, etc.
};
```

### Audit Logging

```typescript
// Log security-relevant events
function logSecurityEvent(event: {
  type: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'ACCESS_DENIED' | 'DATA_EXPORT';
  userId?: string;
  ip?: string;
  details?: Record<string, unknown>;
}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event,
  }));

  // In production, send to logging service
  // await sendToLoggingService(event);
}

// Usage
logSecurityEvent({
  type: 'AUTH_FAILURE',
  ip: req.ip,
  details: { email: maskedEmail, reason: 'invalid_token' },
});
```

---

## API Security

### Security Headers

```typescript
// server/src/middleware/security.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.SUPABASE_URL],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

### Error Handling (Don't Leak Info)

```typescript
// DON'T: Expose internal errors
res.status(500).json({
  error: 'Database error: relation "users" does not exist',
  stack: error.stack,
});

// DO: Generic message, log details
console.error('Database error:', error);
res.status(500).json({
  error: 'An unexpected error occurred',
  code: 'INTERNAL_ERROR',
  requestId: req.id, // For support reference
});
```

### Request Signing (Future)

```typescript
// For sensitive operations, consider request signing
interface SignedRequest {
  payload: string;
  signature: string;
  timestamp: number;
}

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Environment Variables

### Required Variables

```bash
# .env.local (frontend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# server/.env (backend)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...  # Server-only!
```

### Security Rules

```typescript
// NEVER commit .env files
// .gitignore must include:
// .env
// .env.local
// .env.*.local

// NEVER expose service keys to frontend
// VITE_* variables are bundled into frontend code!
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,  // OK - anon key
  // NEVER: import.meta.env.VITE_SUPABASE_SERVICE_KEY
);

// Validate required variables on startup
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}
```

---

## Security Checklist

### Before Every PR

- [ ] All user inputs validated with Zod
- [ ] No `any` types in security-critical code
- [ ] Auth required on all protected routes
- [ ] RLS policies tested for new tables
- [ ] No sensitive data in logs
- [ ] No secrets in code or comments
- [ ] Error messages don't leak internals

### New Feature Security Review

- [ ] What user data does this touch?
- [ ] Who should have access?
- [ ] What could go wrong if input is malicious?
- [ ] Are there rate limiting needs?
- [ ] Does this need audit logging?

### Deployment Checklist

- [ ] All env vars set in production
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured (no PII)
- [ ] Database backups enabled

---

## Common Vulnerabilities

### OWASP Top 10 Coverage

| Vulnerability | Mitigation |
|---------------|------------|
| **Injection** | Zod validation, parameterized queries (Supabase) |
| **Broken Auth** | Supabase Auth, token verification |
| **Sensitive Data Exposure** | RLS, HTTPS, data minimization |
| **XXE** | Not applicable (no XML processing) |
| **Broken Access Control** | RLS policies, RBAC middleware |
| **Security Misconfiguration** | Helmet, secure defaults |
| **XSS** | React escaping, CSP headers, DOMPurify for HTML |
| **Insecure Deserialization** | Zod validation on all inputs |
| **Components with Vulnerabilities** | Regular npm audit |
| **Insufficient Logging** | Security event logging |

### Vulnerability Patterns to Avoid

```typescript
// INSECURE: SQL injection (if using raw queries)
const { data } = await supabase.rpc('search', {
  query: `%${userInput}%`,  // Could contain SQL
});

// SECURE: Use Supabase's built-in escaping
const { data } = await supabase
  .from('exercises')
  .select()
  .ilike('name', `%${userInput}%`);  // Properly escaped

// INSECURE: Prototype pollution
Object.assign(target, userInput);

// SECURE: Validate structure first
const validated = SafeObjectSchema.parse(userInput);
Object.assign(target, validated);

// INSECURE: Regex DoS
const regex = new RegExp(userInput);  // Could be evil regex

// SECURE: Escape user input in regex
const escaped = userInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(escaped);
```

### Security Testing Commands

```bash
# Check for known vulnerabilities
npm audit

# Fix automatically where safe
npm audit fix

# Check for secrets in code
git secrets --scan

# Lint for security issues (if configured)
npm run lint:security
```
