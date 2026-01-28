# MIGRATION.md - Version Upgrades and Breaking Changes

> **Purpose**: Guide for handling schema versions, dependency upgrades, and breaking changes.
> **Audience**: Developers upgrading the application, AI assistants managing migrations.

---

## Table of Contents

1. [Schema Versioning](#schema-versioning)
2. [Data Migration Patterns](#data-migration-patterns)
3. [Dependency Upgrades](#dependency-upgrades)
4. [Breaking Changes Log](#breaking-changes-log)
5. [Migration Checklist](#migration-checklist)

---

## Schema Versioning

### Current Schema Version

| Entity | Version | Location |
|--------|---------|----------|
| Plan | 1 | `PlanSchema.schemaVersion` |
| Profile | 1 | `profiles` table |
| Exercise | 1 | Exercise database |

### Version History

#### Plan Schema

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2024-01-01 | Initial schema with workout days, volume tracking, RIR progression |

### Adding a New Schema Version

When making breaking changes to a schema:

1. **Increment the version number**:
```typescript
export const PlanSchema = z.object({
    // ... fields
    schemaVersion: z.number().int().optional().default(2), // Increment
});
```

2. **Create a migration function**:
```typescript
// src/lib/migrations/planMigrations.ts
export function migratePlanV1ToV2(v1Plan: PlanV1): PlanV2 {
    return {
        ...v1Plan,
        // Add new fields with defaults
        newField: v1Plan.oldField ?? 'default',
        // Transform existing fields
        transformedField: transformV1ToV2(v1Plan.existingField),
        schemaVersion: 2,
    };
}
```

3. **Create a migration router**:
```typescript
export function migratePlan(plan: unknown): Plan {
    const version = (plan as any).schemaVersion ?? 1;

    switch (version) {
        case 1:
            return migratePlanV1ToV2(plan as PlanV1);
        case 2:
            return plan as Plan;
        default:
            throw new Error(`Unknown plan version: ${version}`);
    }
}
```

4. **Apply migration when loading**:
```typescript
export function usePlan(id: string) {
    return useQuery({
        queryKey: ['plan', id],
        queryFn: async () => {
            const data = await fetchPlan(id);
            return migratePlan(data);
        },
    });
}
```

---

## Data Migration Patterns

### Lazy Migration (Recommended)

Migrate data when it's accessed, not all at once.

```typescript
// Migrate on read
async function getPlan(id: string): Promise<Plan> {
    const raw = await db.get('plans', id);
    const migrated = migratePlan(raw);

    // Optionally persist the migration
    if (raw.schemaVersion !== migrated.schemaVersion) {
        await db.put('plans', migrated);
    }

    return migrated;
}
```

**Pros**:
- No downtime
- Gradual migration
- Easy rollback

**Cons**:
- Must support multiple versions temporarily
- Slight performance overhead on first access

### Eager Migration

Migrate all data during deployment.

```typescript
// migration script
async function migrateAllPlans() {
    const plans = await db.getAll('plans');

    for (const plan of plans) {
        if (plan.schemaVersion < CURRENT_VERSION) {
            const migrated = migratePlan(plan);
            await db.put('plans', migrated);
            console.log(`Migrated plan ${plan.id}`);
        }
    }
}
```

**Pros**:
- Clean database state
- Simpler application code

**Cons**:
- Potential downtime
- Risk of data loss if migration fails

### Handling Missing Fields

```typescript
// Use Zod defaults for backwards compatibility
export const PlanSchema = z.object({
    id: z.string(),
    // New field with default for old data
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    // Optional field for gradual adoption
    tags: z.array(z.string()).optional(),
});
```

---

## Dependency Upgrades

### Major Version Upgrade Checklist

Before upgrading major versions:

1. **Read the changelog** for breaking changes
2. **Check peer dependencies**
3. **Create a branch** for the upgrade
4. **Run tests** after upgrade
5. **Test critical user flows manually**

### React 19 Migration

If upgrading from React 18 to React 19:

**Key Changes**:
- Automatic batching changes
- Concurrent features stable
- Server Components (if using SSR)

**Action Items**:
```bash
# Upgrade React
npm install react@19 react-dom@19

# Update types
npm install -D @types/react@19 @types/react-dom@19
```

**Code Changes**:
```typescript
// React 19 - use is for promises/context
import { use } from 'react';

function Component() {
    const data = use(fetchData()); // Suspense-compatible
}
```

### Zod 4 Migration

If upgrading from Zod 3 to Zod 4:

**Breaking Changes**:
- `z.coerce` behavior changes
- Error formatting changes
- Some deprecated methods removed

**Action Items**:
```bash
npm install zod@4
```

**Code Changes**:
```typescript
// Zod 4 - error access
const result = schema.safeParse(data);
if (!result.success) {
    // New error format
    result.error.issues.forEach(issue => {
        console.log(issue.path, issue.message);
    });
}
```

### TanStack Query v5 Migration

If upgrading from v4 to v5:

**Key Changes**:
- `cacheTime` renamed to `gcTime`
- `useQuery` options restructured
- `onSuccess`/`onError` removed from `useQuery`

**Code Changes**:
```typescript
// v4
useQuery(['key'], fetchFn, {
    cacheTime: 5000,
    onSuccess: (data) => console.log(data),
});

// v5
useQuery({
    queryKey: ['key'],
    queryFn: fetchFn,
    gcTime: 5000,
});
// Handle success in the component
```

### Zustand 5 Migration

If upgrading from v4 to v5:

**Key Changes**:
- TypeScript improvements
- Middleware type changes
- `persist` middleware changes

**Code Changes**:
```typescript
// v5 persist middleware
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set) => ({
            // state
        }),
        {
            name: 'store',
            storage: createJSONStorage(() => localStorage), // Required in v5
        }
    )
);
```

### Tailwind CSS 4 Migration

If upgrading from v3 to v4:

**Key Changes**:
- CSS-first configuration
- New color system
- Simplified config

**Action Items**:
```bash
npm install tailwindcss@4
```

**Config Changes**:
```css
/* tailwind.config.css (new format) */
@theme {
  --color-primary: oklch(0.65 0.24 275);
}
```

---

## Breaking Changes Log

### [Unreleased]

*No breaking changes yet*

### [1.0.0] - Initial Release

- Initial schema version 1 for all entities
- React 19, TypeScript 5.8, Vite 7
- Zustand 5 for state management
- TanStack Query v5 for server state
- Supabase for authentication and database

---

## Migration Checklist

### Before Migration

- [ ] Backup database
- [ ] Review changelog for breaking changes
- [ ] Create migration branch
- [ ] Update `.env.example` if new variables needed
- [ ] Document new schema version

### During Migration

- [ ] Update package.json dependencies
- [ ] Run `npm install`
- [ ] Fix TypeScript errors
- [ ] Update deprecated APIs
- [ ] Run test suite
- [ ] Test critical flows manually

### After Migration

- [ ] Update documentation
- [ ] Add entry to Breaking Changes Log
- [ ] Merge to main branch
- [ ] Deploy to staging first
- [ ] Monitor for errors
- [ ] Clean up old migration code (after grace period)

---

## Database Migration Scripts

### Supabase Migrations

Location: `supabase/migrations/`

**Creating a new migration**:
```bash
npx supabase migration new migration_name
```

**Applying migrations**:
```bash
npx supabase db push
```

**Example migration**:
```sql
-- supabase/migrations/20240115_add_plan_priority.sql

-- Add priority column to plans
ALTER TABLE plans
ADD COLUMN priority TEXT DEFAULT 'medium'
CHECK (priority IN ('low', 'medium', 'high'));

-- Backfill existing rows
UPDATE plans SET priority = 'medium' WHERE priority IS NULL;
```

### Rollback Strategy

Always create a rollback script:

```sql
-- supabase/migrations/20240115_add_plan_priority_rollback.sql

-- Remove priority column
ALTER TABLE plans DROP COLUMN priority;
```

---

## Version Compatibility Matrix

| App Version | Plan Schema | React | Zustand | Zod |
|-------------|-------------|-------|---------|-----|
| 1.0.x | 1 | 19 | 5 | 4 |

---

## Support Policy

| Version | Status | Support Until |
|---------|--------|---------------|
| 1.x | Current | Active |

---

*Last Updated: 2026-01-27*
