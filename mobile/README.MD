# Mobile — Expo App

The primary workspace: an Expo app wired to the project's Supabase-style database. It starts clean — layouts, providers, and hooks are in place; screens and tables are added as the app grows.

## Tech Stack

- **Expo 57** with React Native 0.86
- **Expo Router 57** for file-based routing
- **TanStack Query 5** for server state (+ offline persistence)
- **NativeWind 4** for Tailwind CSS styling
- **Supabase** (`@supabase/supabase-js`) for data and auth — served by tinbase in the RapidNative editor and by `npx tinbase@0.11.1 start` or a real Supabase project elsewhere; the same code runs against all of them
- **TypeScript** strict mode, **lucide-react-native** for icons

## Getting Started

```bash
bun install
npx expo start        # press i (iOS), a (Android), or scan with Expo Go
```

The app needs a database to talk to — see the repo-root `README.md` for running Supabase locally (`npx tinbase@0.11.1 start` at the repo root) or pointing at a hosted Supabase project.

## Configuration

Two env vars, read at bundle time from `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=       # e.g. http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=       # the anon key (public by design)
```

In the RapidNative editor these are wired automatically at preview boot; downloads ship a pre-filled `.env`. If they're missing the app still boots and renders — data calls fail with a console warning instead of a white screen.

## Project Structure
