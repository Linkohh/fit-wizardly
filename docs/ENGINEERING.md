# Software Engineering Context

## Core Stack
- **Frontend**: React 19, TypeScript 5.8, Vite 7 (SWC).
- **State Management**: Zustand 5.
- **Data Fetching**: TanStack React Query.
- **Routing**: React Router 7.
- **Backend API**: Express (Port 3001) in `server/`.
- **Database**: Supabase (Auth + PostgreSQL).

## State Management (Zustand)
All global state lives in `src/stores/`.
- **Persistence**: Most stores use logic to persist to `localStorage` via `persist` middleware.
- **Pattern**:
  ```typescript
  import { create } from 'zustand';
  import { persist } from 'zustand/middleware';

  interface MyState {
    value: string;
    setValue: (v: string) => void;
  }

  export const useMyStore = create<MyState>()(
    persist(
      (set) => ({
        value: 'default',
        setValue: (v) => set({ value: v }),
      }),
      { name: 'store-name' }
    )
  );
  ```

## API Interactions
- **Client**: Use `src/lib/apiClient.ts` (or direct `fetch` if needed, but prefer client).
- **Validation**:
  - The backend (`server/src/index.ts`) heavily uses `zod` for runtime validation.
  - **Rule**: Always define a Zod schema for any new POST/PATCH endpoint.
- **Error Handling**:
  - API returns `{ error: string, details?: any }`.
  - Frontend should handle non-200 responses gracefully, showing `toast.error()`.

## Testing
- **Runner**: Vitest (Jest-compatible).
- **Integration**: `src/pages/MCLIntegrationTest.tsx` serves as a live functionality test page.
- **Commands**:
  - `npm run test`: Watch mode.
  - `npm run test:run`: CI mode (single run).
