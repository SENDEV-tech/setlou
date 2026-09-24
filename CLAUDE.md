# Conventions Setlou

- App Router Next.js 16.3.
- Composants Server par défaut, "use client" uniquement si interactivité nécessaire.
- Lectures : Server Components -> src/server/queries/* (DAL + client Supabase, RLS activée).
- Écritures : Server Actions -> src/server/actions/* avec Zod -> DAL -> RPC. Retour typé { ok, data } | { ok: false, error, fieldErrors }.
- Tailwind CSS v4, shadcn/ui.
- Types TypeScript stricts. Pas de `any`.
- mobile-first design.
