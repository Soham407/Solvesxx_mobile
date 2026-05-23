# Solvesxx Mobile — Agent Conventions

## Project

React Native app (Expo SDK ~55) for the Facility Management Platform. Roles route to dedicated
bottom-tab navigators. All backend calls go through Supabase RPC.

## Stack

- React Native + Expo SDK 55
- React Navigation (native-stack + bottom-tabs)
- Zustand stores at `src/store/`
- `@tanstack/react-query` for server state in screens
- `supabase-js` — all backend via `supabase.rpc('function_name', params)`
- `expo-notifications` for push (~55.0.23)
- `lucide-react-native` for icons

## Architecture

```
RoleNavigator               routes AppRole → dedicated navigator
{Role}Navigator             bottom-tab shell (BuyerNavigator is the canonical pattern)
src/screens/{role}/         one file per tab screen
src/store/use{Role}Store.ts Zustand store with bootstrap(profile) + hasHydrated
src/lib/{role}Backend.ts    Supabase RPC wrappers for this role
src/lib/mobileBackend.ts    SHARED — do NOT add to this file
src/navigation/types.ts     Tab param list types — pre-declared; do NOT duplicate
qa_agent/maestro/           Maestro E2E smoke flows (one per role)
```

## Naming conventions

| Thing | Pattern | Example |
|---|---|---|
| Navigator file | `{PascalRole}Navigator.tsx` | `HODNavigator.tsx` |
| Screen file | `{PascalRole}{Feature}Screen.tsx` | `HODApprovalsScreen.tsx` |
| Store file | `use{PascalRole}Store.ts` | `useHODStore.ts` |
| Backend file | `{camelRole}Backend.ts` | `hodBackend.ts` |
| Tab testID | `qa_{prefix}_tab_{name}` | `qa_hod_tab_home` |
| Preview login testID | `qa_login_preview_{role}` | `qa_login_preview_company_hod` |
| Maestro smoke file | `{role}_smoke.yaml` | `company_hod_smoke.yaml` |

## TypeScript

There is no `typecheck` script in package.json. Run `npx tsc --noEmit` to verify.
Fix all errors before committing — do not suppress with `any` or `@ts-ignore`.

## TDD pattern

1. Write `qa_agent/maestro/{role}_smoke.yaml` FIRST (this is RED)
2. Implement navigator + screens + store + backend (this is GREEN)
3. Run `npx tsc --noEmit` (verify)

## Commit prefix

All commits from agents must start with `SOLVESXX:`.

## Files that are OFF LIMITS for parallel role agents

These files were pre-stubbed in Issue 0. Do not modify:
- `src/navigation/RoleNavigator.tsx`
- `src/navigation/types.ts`
- `src/lib/mobileBackend.ts`
- `src/screens/auth/LoginScreen.tsx`

Each role agent only creates NEW files and fills in its own stub navigator.
