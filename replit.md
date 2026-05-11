# DevMind AI

A unified developer intelligence SaaS platform with 4 AI-powered modules that help teams ship safer, smarter, and faster.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/devmind run dev` — run the frontend (Vite, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit OpenAI integration

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- AI: OpenAI via Replit AI integration (no user key needed)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas (server-side validation)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (frontend)
- `lib/db/src/schema/` — Drizzle table definitions (security, workflows, codebase, incidents)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/ai.ts` — AI analysis functions (all 4 modules)
- `artifacts/devmind/src/pages/` — React pages (dashboard, security, workflows, codebase, analyzer)
- `artifacts/devmind/src/components/layout.tsx` — sidebar navigation layout

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks + Zod schemas. Never write fetch calls manually.
- AI processing is async: POST endpoint returns a pending record immediately, background async IIFE does AI analysis and updates DB. Frontend polls with `refetchInterval`.
- Single Express router at `/api` — all routes share the base path per proxy rules.
- Deep indigo dark-first theme (light mode also supported via ThemeProvider).
- Vulnerability/pipeline results stored as JSON strings in the DB for flexibility.

## Product

Four AI-powered modules accessible via the left sidebar:

1. **AI Security Scanner** — Paste code, select language. AI detects SQL injection, XSS, CSRF, OWASP Top 10, and more. Results show severity score, per-line findings, and specific fix suggestions.
2. **AI Workflow Builder** — Describe an automation in plain English. AI generates a visual step-by-step pipeline with service icons and arrows connecting GitHub, Slack, Notion, JIRA, etc.
3. **Codebase Knowledge AI** — Create a project, paste codebase content, then ask natural language questions. AI answers with file and line references.
4. **Root Cause Analyzer** — Paste error logs or stack traces. AI identifies root cause, affected component, confidence score, and numbered remediation steps.

**Dashboard** shows aggregated stats across all 4 modules plus a unified recent activity feed.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema change before testing routes.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before using new hooks.
- AI routes return 201 immediately with `status: "pending"` — frontend polls until `status: "complete"`.
- The `vulnerabilities`, `pipelineJson`, `diagramJson`, `sources` fields are JSON strings (not parsed objects) in the DB and API response — parse on the frontend with `JSON.parse()`.
- Body size limit is 10mb (set in `app.ts`) to support large codebase pastes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
