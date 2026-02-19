# Decision Log

## D-001: Separate Repository
- **Date:** 2026-02-19T22:04:00+01:00
- **Decision:** Created standalone `JarvisSterling/floorplan-editor` repo instead of building inside `bio45d3/b2b-matchmaking`
- **Why:** PRD mandates single-instance infrastructure. The floor plan editor is a large standalone module (17-week scope) with its own DB schema. Clean separation allows independent deployment and development.
- **Options:** (A) Add to existing B2 Pair repo, (B) Standalone repo
- **Chosen:** B — standalone repo. Integration with B2 Pair matchmaking will be via API/shared Supabase or future federation.
- **Reversal:** Can merge into B2 Pair monorepo later via git subtree.

## D-002: Supabase Project
- **Date:** 2026-02-19T22:04:00+01:00
- **Decision:** Created `floorplan-editor` Supabase project (ref: ztrrterfgllcnmmcwnmj, eu-central-1)
- **Why:** PRD specifies Supabase as backend. Separate project from B2 Pair for clean schema ownership.
- **Options:** (A) Share B2 Pair Supabase, (B) Dedicated project
- **Chosen:** B — dedicated project. PRD references tables (events, attendees, exhibitors) that will be created here as the floor plan editor's own schema.
- **Reversal:** Migrate tables to shared project if consolidation needed.

## D-003: Vercel Project
- **Date:** 2026-02-19T22:04:00+01:00
- **Decision:** Created `floorplan-editor` Vercel project (prj_A07x8s5LeHyZnKkcOhn79zffgmhL) linked to GitHub repo
- **Why:** PRD specifies Next.js deployment. Single Vercel project per mandate.
- **Chosen:** Hobby plan deployment with preview deploys per branch.
- **Reversal:** N/A

## D-004: Referenced Tables Strategy
- **Date:** 2026-02-19T22:04:00+01:00
- **Decision:** Create stub versions of referenced parent tables (events, attendees, exhibitors) in this project's schema
- **Why:** PRD schema references these via foreign keys but they're not defined in the PRD (they belong to B2 Pair core). We need them for FK integrity.
- **Options:** (A) Remove FK constraints, (B) Create minimal stub tables, (C) Skip and handle in app layer
- **Chosen:** B — create minimal stub tables with essential columns. This allows full FK integrity per PRD schema while remaining self-contained.
- **Reversal:** Replace stubs with cross-project references or remove FKs when integrating with B2 Pair.
