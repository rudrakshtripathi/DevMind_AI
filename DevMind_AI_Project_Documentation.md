# DevMind AI — Project Documentation Report

**Project:** DevMind AI — AI-Powered Developer Intelligence Platform
**Author:** Rudraksh Tripathi
**Date:** July 2026
**Version:** 1.0.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Project Structure](#6-project-structure)
7. [Core Modules](#7-core-modules)
8. [Authentication System](#8-authentication-system)
9. [Database Design](#9-database-design)
10. [API Specification](#10-api-specification)
11. [AI Integration](#11-ai-integration)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Build System & DevOps](#13-build-system--devops)
14. [Deployment Guide](#14-deployment-guide)
15. [Environment Configuration](#15-environment-configuration)
16. [Security Considerations](#16-security-considerations)
17. [Migration from Replit](#17-migration-from-replit)
18. [Testing & Verification](#18-testing--verification)
19. [Future Roadmap](#19-future-roadmap)

---

## 1. Executive Summary

DevMind AI is an enterprise-grade, AI-powered developer intelligence platform that consolidates four critical software engineering workflows into a single unified interface. The platform leverages OpenAI's GPT-4o model to provide:

- **AI Security Scanner** — Automated vulnerability detection and remediation
- **AI Workflow Builder** — Natural language to CI/CD pipeline generation
- **Codebase Knowledge AI** — Intelligent codebase Q&A and documentation
- **AI Root Cause Analyzer** — Automated incident diagnosis and postmortem generation

The application was originally built on Replit's managed infrastructure and has been fully migrated to a standalone, self-hostable architecture with zero vendor lock-in.

---

## 2. Problem Statement

Modern software engineering teams face fragmented tooling across security analysis, CI/CD automation, codebase understanding, and incident response. Each domain typically requires separate specialized tools (e.g., Snyk for security, ChatGPT for code questions, PagerDuty for incidents), leading to:

- **Context switching** across 4–6 different tools per workflow
- **Inconsistent AI quality** — generic models lack domain-specific prompting
- **No unified view** — no single dashboard correlating security posture, workflow health, and incident trends
- **High cost** — individual SaaS subscriptions compound rapidly

DevMind AI solves this by unifying all four domains under a single platform with purpose-built AI prompting for each module.

---

## 3. Solution Overview

### Architecture Pattern
Full-stack monorepo with clear separation between frontend (React SPA) and backend (Express REST API), connected via an OpenAPI 3.1 contract.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Monorepo (pnpm workspaces)** | Shared types, schemas, and API contracts across frontend/backend |
| **OpenAPI-first** | Auto-generated Zod validators and React Query hooks ensure type safety end-to-end |
| **Server-side AI** | All OpenAI calls happen on the backend, keeping API keys secure |
| **Session-based auth** | Simpler than JWT for a server-rendered SPA; cookies are HttpOnly and secure |
| **PostgreSQL** | Production-grade RDBMS with JSON support for flexible session storage |
| **esbuild bundling** | Sub-second backend builds (300ms) vs. 10+ seconds with tsc |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              React 19 SPA (Vite 7)                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │ │
│  │  │ Security │ │ Workflow │ │ Codebase │ │Analyzer│ │ │
│  │  │  Page    │ │  Page    │ │  Page    │ │ Page   │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │ │
│  │       └─────────────┴────────────┴───────────┘      │ │
│  │                     │ React Query                    │ │
│  │                     │ (auto-generated hooks)         │ │
│  └─────────────────────┼───────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTPS / REST
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Express 5 API Server                   │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ Auth         │  │ Route Handlers │  │ AI Engine    │ │
│  │ Middleware   │──│ (per module)   │──│ (GPT-4o)     │ │
│  │ (sessions)   │  │                │  │              │ │
│  └──────┬───────┘  └────────────────┘  └──────┬───────┘ │
│         │                                      │         │
│  ┌──────▼───────┐                      ┌──────▼───────┐ │
│  │ PostgreSQL   │                      │ OpenAI API   │ │
│  │ (Drizzle ORM)│                      │ (GPT-4o)     │ │
│  └──────────────┘                      └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. User interacts with the React SPA
2. React Query hooks (auto-generated from OpenAPI spec) make API calls
3. Express middleware validates session cookies
4. Route handlers process requests and invoke the AI engine
5. AI engine sends structured prompts to OpenAI GPT-4o
6. Responses are parsed, validated against Zod schemas, and stored in PostgreSQL
7. Frontend receives typed responses and renders results

---

## 5. Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.0 | UI framework |
| Vite | 7.3.2 | Build tool and dev server |
| TypeScript | 5.9.x | Type safety |
| TailwindCSS | 4.1.14 | Utility-first CSS |
| Radix UI | Latest | Accessible UI primitives |
| Framer Motion | 12.x | Animations |
| Wouter | 3.3.5 | Client-side routing |
| React Query | 5.90.x | Server state management |
| Lucide React | 0.545.x | Icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22.x | Runtime |
| Express | 5.x | HTTP framework |
| Drizzle ORM | 0.45.x | Database ORM |
| Pino | 9.x | Structured logging |
| bcrypt | 5.1.x | Password hashing |
| esbuild | 0.27.x | Backend bundling |
| OpenAI SDK | Latest | AI integration |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary database |
| Docker | Containerization |
| pnpm 10.x | Package management |

---

## 6. Project Structure

```
DevMind-AI/
├── artifacts/
│   ├── api-server/                 # Express backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── index.ts        # Route aggregator
│   │   │   │   ├── auth.ts         # Authentication endpoints
│   │   │   │   ├── security.ts     # Security Scanner API
│   │   │   │   ├── workflows.ts    # Workflow Builder API
│   │   │   │   ├── codebase.ts     # Codebase Knowledge API
│   │   │   │   ├── analyzer.ts     # Root Cause Analyzer API
│   │   │   │   ├── dashboard.ts    # Dashboard stats API
│   │   │   │   └── health.ts       # Health check
│   │   │   ├── middlewares/
│   │   │   │   └── authMiddleware.ts
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts         # Session management
│   │   │   │   ├── ai.ts           # AI engine (prompts, parsing)
│   │   │   │   └── logger.ts       # Pino logger
│   │   │   ├── app.ts              # Express app setup
│   │   │   └── index.ts            # Server entry point
│   │   ├── build.mjs               # esbuild configuration
│   │   └── package.json
│   │
│   └── devmind/                    # React frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── landing.tsx      # Marketing landing page
│       │   │   ├── auth-page.tsx    # Login/Register
│       │   │   ├── dashboard.tsx    # Main dashboard
│       │   │   ├── security.tsx     # Security Scanner UI
│       │   │   ├── workflows.tsx    # Workflow Builder UI
│       │   │   ├── codebase.tsx     # Codebase Knowledge UI
│       │   │   └── analyzer.tsx     # Root Cause Analyzer UI
│       │   ├── components/          # Reusable UI components
│       │   ├── hooks/
│       │   │   └── use-auth.ts      # Authentication hook
│       │   └── App.tsx              # Root component + routing
│       ├── vite.config.ts
│       └── package.json
│
├── lib/
│   ├── db/                          # Database package
│   │   └── src/schema/auth.ts       # Users + Sessions tables
│   ├── api-spec/
│   │   └── openapi.yaml             # OpenAPI 3.1 specification
│   ├── api-zod/                     # Generated Zod validators
│   ├── api-client-react/            # Generated React Query hooks
│   └── integrations-openai-ai-server/
│       └── src/client.ts            # OpenAI client singleton
│
├── .env.example                     # Environment template
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml               # App + PostgreSQL
├── package.json                     # Root workspace scripts
├── pnpm-workspace.yaml              # Monorepo configuration
└── README.md                        # Setup documentation
```

---

## 7. Core Modules

### 7.1 AI Security Scanner

**Purpose:** Analyzes source code for security vulnerabilities using AI-powered semantic analysis.

**Capabilities:**
- OWASP Top 10 vulnerability detection
- CVE pattern matching
- Severity classification (Critical, High, Medium, Low)
- Automated remediation suggestions with code fixes
- Attack path visualization
- Security posture scoring

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/security/scans` | List all security scans |
| `POST` | `/api/security/scans` | Create new scan |
| `GET` | `/api/security/scans/:id` | Get scan details |
| `GET` | `/api/security/stats` | Security statistics |

### 7.2 AI Workflow Builder

**Purpose:** Generates CI/CD and automation workflows from natural language descriptions.

**Capabilities:**
- GitHub Actions YAML generation
- Multi-stage pipeline design
- Environment variable management
- Deployment strategy recommendations
- Workflow optimization suggestions

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workflows` | List workflows |
| `POST` | `/api/workflows` | Generate workflow |
| `GET` | `/api/workflows/:id` | Get workflow details |

### 7.3 Codebase Knowledge AI

**Purpose:** Indexes and answers questions about any codebase using AI-powered understanding.

**Capabilities:**
- Code indexing and semantic analysis
- Natural language Q&A about codebase
- Architecture documentation generation
- Dependency analysis
- Question history tracking

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/codebase/projects` | List projects |
| `POST` | `/api/codebase/projects` | Index codebase |
| `POST` | `/api/codebase/projects/:id/query` | Query codebase |
| `GET` | `/api/codebase/projects/:id/questions` | Question history |

### 7.4 AI Root Cause Analyzer

**Purpose:** Diagnoses production incidents using AI-powered log analysis and error correlation.

**Capabilities:**
- Log parsing and error extraction
- Cascading failure detection
- Primary vs. secondary failure classification
- Automated remediation playbooks
- Postmortem report generation
- Service dependency tracing

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analyzer/incidents` | List incidents |
| `POST` | `/api/analyzer/incidents` | Analyze incident |
| `GET` | `/api/analyzer/incidents/:id` | Get incident details |

---

## 8. Authentication System

### Design

The authentication system uses **local email/password** with bcrypt password hashing and server-side sessions stored in PostgreSQL.

### Flow

```
Registration:
  Client → POST /api/auth/register {email, password, firstName, lastName}
    → Server hashes password with bcrypt (12 rounds)
    → Inserts user into `users` table
    → Creates session in `sessions` table (crypto.randomBytes 32-byte SID)
    → Sets HttpOnly cookie `sid`
    → Returns user object

Login:
  Client → POST /api/auth/login {email, password}
    → Server fetches user by email
    → Compares password via bcrypt.compare()
    → Creates new session + sets cookie
    → Returns user object

Session Validation (every request):
  authMiddleware reads `sid` from cookie or Authorization header
    → Queries `sessions` table
    → If valid and not expired → sets req.user
    → If expired → clears session + cookie
```

### Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 12 salt rounds |
| Session IDs | 32 bytes from `crypto.randomBytes` (256-bit entropy) |
| Cookie flags | `HttpOnly`, `Secure` (production), `SameSite=Lax` |
| Session expiry | 7 days TTL, auto-cleanup on expired reads |
| Input validation | Email format + minimum 6 character password |
| Duplicate prevention | Unique constraint on email column |

---

## 9. Database Design

### ORM: Drizzle ORM

Type-safe SQL query builder with schema-as-code. Schema is defined in TypeScript and pushed to PostgreSQL via `drizzle-kit push`.

### Schema

#### Users Table
```sql
CREATE TABLE users (
  id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR UNIQUE,
  password_hash VARCHAR,
  first_name  VARCHAR,
  last_name   VARCHAR,
  profile_image_url VARCHAR,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
  sid    VARCHAR PRIMARY KEY,
  sess   JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IDX_session_expire ON sessions(expire);
```

### Additional Module Tables

Each AI module (Security, Workflows, Codebase, Analyzer) stores analysis results in dedicated tables with foreign keys to the users table, managed through the same Drizzle schema system.

---

## 10. API Specification

The API follows the **OpenAPI 3.1** specification defined in `lib/api-spec/openapi.yaml`.

### Code Generation Pipeline

```
openapi.yaml
    │
    ├── Orval → lib/api-zod/         (Zod request/response validators)
    ├── Orval → lib/api-client-react/ (React Query hooks)
    │
    └── Used by:
        ├── Backend (validates responses with Zod)
        └── Frontend (type-safe API calls with React Query)
```

### Common Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/healthz` | ❌ | Health check |
| `POST` | `/api/auth/register` | ❌ | Create account |
| `POST` | `/api/auth/login` | ❌ | Sign in |
| `POST` | `/api/auth/logout` | ✅ | Sign out |
| `GET` | `/api/auth/user` | ❌ | Current user info |
| `GET` | `/api/dashboard/stats` | ✅ | Dashboard statistics |
| `GET` | `/api/dashboard/recent` | ✅ | Recent activity |

---

## 11. AI Integration

### OpenAI Client Configuration

```typescript
// lib/integrations-openai-ai-server/src/client.ts
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
});
```

### Design Principles

1. **Single client instance** — All modules share one OpenAI client singleton
2. **Server-side only** — API key never exposed to the browser
3. **Structured prompting** — Each module uses domain-specific system prompts
4. **Response parsing** — AI outputs are parsed into typed interfaces before storage
5. **Configurable endpoint** — `OPENAI_BASE_URL` allows Azure OpenAI or local LLM compatibility

### Sub-modules

| Module | Files | Purpose |
|--------|-------|---------|
| Text (Chat) | `client.ts` | GPT-4o chat completions |
| Image | `image/client.ts` | Image generation (gpt-image-1) |
| Audio | `audio/client.ts` | Speech-to-text, text-to-speech |

---

## 12. Frontend Architecture

### Component Hierarchy

```
App (providers: QueryClient, Theme, Tooltip, Router)
  ├── [Unauthenticated]
  │   ├── LandingPage      (marketing page with feature showcase)
  │   └── AuthPage          (login/register split-panel form)
  │
  └── [Authenticated]
      └── Layout (sidebar navigation + header)
          ├── Dashboard      (unified stats + recent activity)
          ├── SecurityPage   (scan creation + results viewer)
          ├── WorkflowsPage  (workflow generator + YAML viewer)
          ├── CodebasePage   (project indexer + Q&A interface)
          └── AnalyzerPage   (incident analyzer + postmortem viewer)
```

### State Management

| Concern | Solution |
|---------|----------|
| Server state | React Query (auto-generated hooks from OpenAPI) |
| Auth state | Custom `useAuth()` hook with `fetch` |
| UI state | React `useState` / component-local |
| Theme | Context provider with localStorage persistence |
| Routing | Wouter (lightweight, 2KB router) |

### Design System

- **Theme:** Dark mode by default (cyberpunk-inspired aesthetic)
- **Components:** Radix UI primitives with custom styling
- **Typography:** Inter font family via Google Fonts
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Icons:** Lucide React icon set

---

## 13. Build System & DevOps

### Development

```bash
pnpm dev    # Runs concurrently:
            #   Frontend → Vite dev server (port 5173)
            #   Backend  → esbuild + Node.js (port 8080)
            # Vite proxies /api → localhost:8080
```

### Production Build

```bash
pnpm build  # Sequential:
            #   1. pnpm build:frontend (Vite → dist/public/)
            #   2. pnpm build:backend  (esbuild → dist/index.mjs)
pnpm start  # Express serves API + static frontend on port 8080
```

### Backend Bundling (esbuild)

The backend is bundled into a single `dist/index.mjs` file using esbuild with:
- ESM output format
- Source maps for debugging
- Native modules externalized (`bcrypt`, `pg`, `sharp`, etc.)
- Pino worker threads handled via `esbuild-plugin-pino`
- Build time: **~300ms**

### Docker

**Multi-stage Dockerfile** with 4 stages:
1. **deps** — Install all pnpm dependencies
2. **build-frontend** — Vite production build
3. **build-backend** — esbuild bundle
4. **production** — Node.js 22 slim image with only runtime artifacts

---

## 14. Deployment Guide

### Option A: Local Development

```bash
pnpm install
cp .env.example .env       # Fill in DATABASE_URL + OPENAI_API_KEY
pnpm db:push               # Create database tables
pnpm dev                   # Start dev servers
```

### Option B: Docker Compose

```bash
export OPENAI_API_KEY=sk-your-key
docker compose up -d       # Starts app + PostgreSQL
```

### Option C: Cloud Platforms

**Railway / Render / DigitalOcean:**
- Build command: `pnpm install && pnpm build`
- Start command: `pnpm start`
- Add PostgreSQL add-on
- Set `DATABASE_URL`, `OPENAI_API_KEY`, `NODE_ENV=production`

---

## 15. Environment Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | Override for compatible APIs |
| `PORT` | ❌ | `8080` | Express server port |
| `VITE_PORT` | ❌ | `5173` | Vite dev server port |
| `NODE_ENV` | ❌ | `development` | `development` or `production` |
| `STATIC_DIR` | ❌ | auto-detected | Path to built frontend files |
| `BASE_PATH` | ❌ | `/` | Frontend base path |

Environment variables are loaded via `dotenv-cli` which reads the `.env` file from the project root and injects variables into all child processes.

---

## 16. Security Considerations

| Area | Implementation |
|------|---------------|
| **Authentication** | bcrypt (12 rounds), HttpOnly secure cookies |
| **Session management** | 256-bit random SIDs, 7-day expiry, server-side storage |
| **API keys** | Server-side only, never sent to browser |
| **Input validation** | Zod schemas validate all API inputs and outputs |
| **CORS** | Credentials-enabled, origin-validated |
| **Request limits** | 10MB body size limit |
| **Cookie security** | `Secure` flag in production, `SameSite=Lax` |
| **Password storage** | Hashed with bcrypt, never stored in plain text |
| **Supply chain** | `minimumReleaseAge: 1440` minutes for new packages |

---

## 17. Migration from Replit

### What Was Removed

| Replit Dependency | Replacement |
|-------------------|-------------|
| Replit OIDC authentication (`openid-client`) | Local email/password with bcrypt |
| `@replit/vite-plugin-runtime-error-modal` | Removed (not needed standalone) |
| `@replit/vite-plugin-cartographer` | Removed |
| `@replit/vite-plugin-dev-banner` | Removed |
| `AI_INTEGRATIONS_OPENAI_*` env vars | Standard `OPENAI_API_KEY` |
| `.replit` configuration | `Dockerfile` + `docker-compose.yml` |
| Replit-managed PostgreSQL | Self-managed PostgreSQL / Supabase |

### Files Deleted
- `.replit`, `.replitignore`, `.agents/`
- All `.replit-artifact/` directories
- `artifacts/mockup-sandbox/` (Replit-internal tool)

### Key Technical Challenges Solved

1. **Express 5 wildcard routes** — `path-to-regexp` v8 rejects `*` syntax; replaced with middleware-based SPA fallback
2. **Port conflicts** — Separated Vite (5173) and Express (8080) with proxy configuration
3. **Environment loading** — Added `dotenv-cli` to inject `.env` into pnpm workspace scripts
4. **URL-encoded passwords** — `@` in database passwords must be encoded as `%40`

---

## 18. Testing & Verification

### Build Verification

| Test | Result |
|------|--------|
| `pnpm install` | ✅ 547 packages, clean install |
| `pnpm build:frontend` | ✅ 2233 modules transformed (3.65s) |
| `pnpm build:backend` | ✅ Bundled in 304ms |
| `pnpm typecheck:libs` | ✅ Zero TypeScript errors |
| `pnpm db:push` | ✅ Schema pushed to PostgreSQL |
| Replit references in code | ✅ Zero remaining |

### Runtime Verification

| Test | Result |
|------|--------|
| Server starts on port 8080 | ✅ |
| Frontend dev server on port 5173 | ✅ |
| API proxy (`/api` → Express) | ✅ |
| Database connection (Supabase) | ✅ |

---

## 19. Future Roadmap

| Feature | Priority | Description |
|---------|----------|-------------|
| OAuth providers | Medium | Add Google/GitHub OAuth alongside email/password |
| Rate limiting | High | Add per-user API rate limits for AI endpoints |
| WebSocket support | Medium | Real-time streaming for AI analysis results |
| Team workspaces | Low | Multi-tenant team support with role-based access |
| Export/Import | Medium | Export analysis results as PDF/JSON |
| Caching layer | High | Redis cache for repeated AI queries |
| CI/CD pipeline | High | GitHub Actions for automated testing and deployment |
| Monitoring | Medium | Prometheus metrics + Grafana dashboards |

---

*This document was generated as part of the DevMind AI standalone migration project. For setup instructions, see [README.md](./README.md).*
