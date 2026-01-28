# Orchestration & DevOps Context

> **Lens Purpose**: This document covers build pipelines, environment configuration, deployment strategies, database management, and monitoring. Read this before setting up environments or deploying.

---

## Table of Contents
- [Environment Setup](#environment-setup)
- [Build Pipeline](#build-pipeline)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [Server Configuration](#server-configuration)
- [Deployment](#deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Prerequisites

```bash
# Required versions
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0

# Verify installations
node --version
npm --version
git --version
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd fit-wizardly

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure environment variables (see below)
```

### Environment Variables

#### Frontend (.env.local)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Configuration (optional, defaults to /api)
VITE_API_URL=http://localhost:3001/api

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

#### Backend (server/.env)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...  # Server-only, never expose!

# CORS
FRONTEND_URL=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Environment Variable Validation

```typescript
// src/lib/env.ts
function getEnvVar(key: string, required = true): string {
  const value = import.meta.env[key];

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || '';
}

export const env = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  apiUrl: getEnvVar('VITE_API_URL', false) || '/api',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
```

---

## Build Pipeline

### Available Scripts

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Start development server | Local development |
| `npm run build` | Production build | Deployment |
| `npm run build:dev` | Development build | Testing production build locally |
| `npm run preview` | Preview production build | Verify build before deploy |
| `npm run lint` | Run ESLint | Code quality check |
| `npm run test` | Run tests (watch mode) | Development testing |
| `npm run test:run` | Run tests once | CI/CD |

### Build Process

```bash
# Development build (fast, with HMR)
npm run dev
# → Starts Vite dev server on http://localhost:8080
# → Hot Module Replacement enabled
# → Source maps enabled

# Production build (optimized)
npm run build
# → TypeScript type checking
# → Minification & tree shaking
# → Asset optimization
# → Output to dist/

# Preview production build
npm run preview
# → Serves dist/ folder
# → Tests production build locally
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

---

## Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/workout-tracking

# Make changes and commit
git add .
git commit -m "feat: add workout tracking functionality"

# Push and create PR
git push -u origin feature/workout-tracking
```

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(wizard): add exercise selection step
fix(auth): resolve session persistence issue
docs(readme): update setup instructions
refactor(stores): extract common patterns to utils
```

### Development Server Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (localhost:8080)             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Vite Dev Server (Port 8080)                │
│  - React HMR                                            │
│  - TypeScript compilation                               │
│  - Proxy /api → localhost:3001                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Express Server (Port 3001)                 │
│  - API routes                                           │
│  - Auth middleware                                      │
│  - Supabase client                                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                             │
│  - PostgreSQL database                                  │
│  - Authentication                                       │
│  - Realtime subscriptions                               │
└─────────────────────────────────────────────────────────┘
```

### Running Full Stack Locally

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev

# Or use a process manager
npm install -g concurrently
concurrently "npm run dev" "cd server && npm run dev"
```

---

## Database Management

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Copy project URL and anon key to `.env.local`
3. Run migrations

### Migrations

```bash
# Location
supabase/migrations/

# Naming convention
YYYYMMDDHHMMSS_description.sql
# Example: 20240115120000_create_workouts_table.sql
```

### Migration Example

```sql
-- supabase/migrations/20240115120000_create_workouts_table.sql

-- Create workouts table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX idx_workouts_user_id ON workouts(user_id);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Type Generation

```bash
# Generate TypeScript types from database schema
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts

# Or with local Supabase
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Database Backup

```bash
# Using Supabase CLI
npx supabase db dump -f backup.sql

# Restore
npx supabase db restore backup.sql
```

---

## Server Configuration

### Express Server Structure

```
server/
├── src/
│   ├── index.ts           # Entry point
│   ├── routes/
│   │   ├── exercises.ts   # Exercise routes
│   │   └── plans.ts       # Plan routes
│   ├── middleware/
│   │   ├── auth.ts        # Authentication
│   │   ├── validation.ts  # Request validation
│   │   └── errors.ts      # Error handling
│   └── services/
│       └── supabase.ts    # Supabase client
├── package.json
└── tsconfig.json
```

### Server Entry Point

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authenticate } from './middleware/auth';
import exerciseRoutes from './routes/exercises';
import planRoutes from './routes/plans';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
app.use(authenticate);

// Routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/plans', planRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Health Check Pattern

```typescript
// Comprehensive health check
app.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: 'unknown',
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connection
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'error';
  }

  const isHealthy = checks.server === 'ok' && checks.database === 'ok';

  res.status(isHealthy ? 200 : 503).json(checks);
});
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests pass (`npm run test:run`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security review completed

### Production Build

```bash
# Build frontend
npm run build

# Output structure
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
└── ...
```

### Deployment Platforms

#### Vercel (Recommended for Frontend)

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Railway (Recommended for Backend)

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
```

#### Docker

```dockerfile
# Dockerfile (Frontend)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Environment-Specific Configuration

```typescript
// config/index.ts
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    logLevel: 'debug',
    enableMocks: true,
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    logLevel: 'info',
    enableMocks: false,
  },
  production: {
    apiUrl: 'https://api.example.com',
    logLevel: 'error',
    enableMocks: false,
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## Monitoring & Logging

### Logging Strategy

```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
    };

    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, data?: unknown) { this.log('debug', message, data); }
  info(message: string, data?: unknown) { this.log('info', message, data); }
  warn(message: string, data?: unknown) { this.log('warn', message, data); }
  error(message: string, data?: unknown) { this.log('error', message, data); }
}

export const logger = new Logger(
  import.meta.env.PROD ? 'info' : 'debug'
);
```

### Error Tracking

```typescript
// src/lib/errorTracking.ts
export function captureError(error: Error, context?: Record<string, unknown>) {
  // Log locally
  console.error('Captured error:', error, context);

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry
    // Sentry.captureException(error, { extra: context });
  }
}

// Usage
try {
  await riskyOperation();
} catch (error) {
  captureError(error as Error, {
    userId: user?.id,
    action: 'riskyOperation',
  });
}
```

### Performance Monitoring

```typescript
// src/lib/performance.ts
export function measurePerformance(name: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);

      // Track slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation: ${name}`, { duration });
      }
    },
  };
}

// Usage
const perf = measurePerformance('fetchWorkouts');
const workouts = await fetchWorkouts();
perf.end();
```

### Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time | < 200ms | > 1000ms |
| Error Rate | < 0.1% | > 1% |
| Database Query Time | < 50ms | > 500ms |
| Build Time | < 60s | > 120s |
| Bundle Size | < 500KB | > 1MB |

---

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --report

# Or use rollup-plugin-visualizer
# Add to vite.config.ts:
# import { visualizer } from 'rollup-plugin-visualizer';
# plugins: [visualizer()]
```

### Code Splitting

```typescript
// Lazy load routes
const Wizard = lazy(() => import('@/pages/Wizard'));
const Circles = lazy(() => import('@/pages/Circles'));

// In router
<Route path="/wizard" element={
  <Suspense fallback={<PageSkeleton />}>
    <Wizard />
  </Suspense>
} />
```

### Caching Strategy

```typescript
// TanStack Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});
```

### Image Optimization

```typescript
// Use optimized image formats
<img
  src="/images/hero.webp"
  srcSet="/images/hero-400.webp 400w, /images/hero-800.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  loading="lazy"
  alt="Hero image"
/>

// Or use a component
function OptimizedImage({ src, alt, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
```

---

## Troubleshooting

### Common Issues

#### Build Fails with Type Errors

```bash
# Check TypeScript errors
npx tsc --noEmit

# Common fixes:
# 1. Update type definitions
npm install @types/node@latest

# 2. Check tsconfig.json paths
# 3. Verify import aliases
```

#### Vite Dev Server Not Starting

```bash
# Check port availability
lsof -i :8080

# Kill process using port
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

#### API Requests Failing

```bash
# Check CORS configuration
# Verify proxy settings in vite.config.ts
# Ensure backend is running

# Debug API calls
curl -v http://localhost:3001/health
```

#### Database Connection Issues

```bash
# Verify environment variables
echo $VITE_SUPABASE_URL

# Test Supabase connection
npx supabase status

# Check RLS policies
# Verify user is authenticated
```

### Debug Mode

```typescript
// Enable verbose logging
if (import.meta.env.VITE_ENABLE_DEBUG) {
  // Log all state changes
  useWorkoutStore.subscribe((state) => {
    console.log('[Store] Workout state:', state);
  });

  // Log all API calls
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    console.log('[Fetch]', args[0]);
    const response = await originalFetch(...args);
    console.log('[Fetch Response]', response.status);
    return response;
  };
}
```

### Support Resources

| Resource | URL |
|----------|-----|
| React Docs | https://react.dev |
| Vite Docs | https://vitejs.dev |
| Supabase Docs | https://supabase.com/docs |
| TanStack Query | https://tanstack.com/query |
| Tailwind CSS | https://tailwindcss.com |
| shadcn/ui | https://ui.shadcn.com |
