# DevMind AI

AI-powered developer intelligence platform with four specialized modules: Security Scanner, Workflow Builder, Codebase Knowledge AI, and Root Cause Analyzer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TailwindCSS 4, Radix UI, Framer Motion |
| Backend | Express 5, TypeScript 5.9, Pino logger |
| Database | PostgreSQL 16, Drizzle ORM |
| AI | OpenAI GPT-4o |
| Auth | Local email/password with bcrypt |
| Monorepo | pnpm workspaces |

## Prerequisites

- **Node.js** 22+
- **pnpm** 9+ (`npm install -g pnpm`)
- **PostgreSQL** 16+ (or Docker)
- **OpenAI API key** from [platform.openai.com](https://platform.openai.com/api-keys)

---

## Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone <your-repo-url> devmind-ai
cd devmind-ai
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/devmind
OPENAI_API_KEY=sk-your-key-here
PORT=8080
NODE_ENV=development
```

### 3. Set Up Database

Create a PostgreSQL database, then push the schema:

```bash
# Create database (if using local PostgreSQL)
createdb devmind

# Push Drizzle schema to database
pnpm db:push
```

### 4. Run Development Server

```bash
pnpm dev
```

This starts both the Vite frontend dev server and the Express API server concurrently.

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api

### 5. Build for Production

```bash
pnpm build
pnpm start
```

The production server serves both the API and the built frontend at http://localhost:8080.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | Override for OpenAI-compatible APIs |
| `PORT` | ❌ | `8080` | Server port |
| `NODE_ENV` | ❌ | `development` | `development` or `production` |
| `BASE_PATH` | ❌ | `/` | Frontend base path (for subdirectory hosting) |
| `STATIC_DIR` | ❌ | auto-detected | Path to built frontend files |
| `LOG_LEVEL` | ❌ | `info` | Pino log level (debug, info, warn, error) |

---

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Set your OpenAI key
export OPENAI_API_KEY=sk-your-key-here

# Start the app + PostgreSQL
docker compose up -d

# Push database schema
docker compose exec app node -e "
  // Schema is pushed automatically on first run
  // Or run: pnpm db:push
"
```

The app will be available at http://localhost:8080.

### Using Dockerfile Only

```bash
docker build -t devmind-ai .
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/devmind \
  -e OPENAI_API_KEY=sk-your-key \
  -e NODE_ENV=production \
  -e STATIC_DIR=/app/artifacts/devmind/dist/public \
  devmind-ai
```

---

## Platform Deployment

### Railway

1. Connect your GitHub repository
2. Set environment variables in the Railway dashboard:
   - `DATABASE_URL` (use Railway's PostgreSQL add-on)
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`
3. Set build command: `pnpm install && pnpm build`
4. Set start command: `pnpm start`

### Render

1. Create a new **Web Service** from your repo
2. Set **Build Command**: `pnpm install && pnpm build`
3. Set **Start Command**: `pnpm start`
4. Add environment variables in the dashboard
5. Add a **PostgreSQL** database and link the `DATABASE_URL`

### DigitalOcean App Platform

1. Create a new App from your repo
2. Set build command: `pnpm install && pnpm build`
3. Set run command: `pnpm start`
4. Add a **PostgreSQL** database component
5. Set environment variables

### VPS (Ubuntu/Debian)

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt-get install -y postgresql
sudo -u postgres createuser devmind
sudo -u postgres createdb devmind -O devmind

# Clone and build
git clone <your-repo> /opt/devmind-ai
cd /opt/devmind-ai
pnpm install
cp .env.example .env
# Edit .env with your values
pnpm build
pnpm db:push

# Run with systemd or pm2
pm2 start "pnpm start" --name devmind-ai
```

---

## Project Structure

```
DevMind-AI/
├── artifacts/
│   ├── api-server/         # Express backend
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers
│   │   │   ├── middlewares/ # Auth middleware
│   │   │   └── lib/        # AI logic, auth, logger
│   │   └── build.mjs       # esbuild config
│   └── devmind/            # React frontend
│       ├── src/
│       │   ├── pages/      # Page components
│       │   ├── components/ # UI components
│       │   └── hooks/      # React hooks
│       └── vite.config.ts
├── lib/
│   ├── db/                 # Drizzle ORM schema + connection
│   ├── api-spec/           # OpenAPI 3.1 spec
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod validators
│   └── integrations-openai-ai-server/  # OpenAI client
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + backend dev servers |
| `pnpm build` | Build frontend and backend for production |
| `pnpm start` | Start production server |
| `pnpm db:push` | Push Drizzle schema to database |
| `pnpm db:push:force` | Force push schema (drops conflicting tables) |
| `pnpm typecheck` | Run TypeScript type checking |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/healthz` | ❌ | Health check |
| `POST` | `/api/auth/register` | ❌ | Create account |
| `POST` | `/api/auth/login` | ❌ | Sign in |
| `POST` | `/api/auth/logout` | ✅ | Sign out |
| `GET` | `/api/auth/user` | ❌ | Get current user |
| `GET` | `/api/security/scans` | ✅ | List security scans |
| `POST` | `/api/security/scans` | ✅ | Create security scan |
| `GET` | `/api/security/scans/:id` | ✅ | Get scan details |
| `GET` | `/api/security/stats` | ✅ | Security statistics |
| `GET` | `/api/workflows` | ✅ | List workflows |
| `POST` | `/api/workflows` | ✅ | Generate workflow |
| `GET` | `/api/workflows/:id` | ✅ | Get workflow details |
| `GET` | `/api/codebase/projects` | ✅ | List codebase projects |
| `POST` | `/api/codebase/projects` | ✅ | Index codebase |
| `POST` | `/api/codebase/projects/:id/query` | ✅ | Query codebase |
| `GET` | `/api/codebase/projects/:id/questions` | ✅ | Question history |
| `GET` | `/api/analyzer/incidents` | ✅ | List incidents |
| `POST` | `/api/analyzer/incidents` | ✅ | Analyze incident |
| `GET` | `/api/analyzer/incidents/:id` | ✅ | Get incident details |
| `GET` | `/api/dashboard/stats` | ✅ | Dashboard statistics |
| `GET` | `/api/dashboard/recent` | ✅ | Recent activity |

---

## Troubleshooting

### `pnpm install` fails
- Ensure you're using pnpm 9+: `pnpm --version`
- Delete `node_modules` and `pnpm-lock.yaml`, then retry

### Database connection errors
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/dbname`
- Ensure PostgreSQL is running: `pg_isready`
- Run `pnpm db:push` to create tables

### OpenAI errors
- Verify `OPENAI_API_KEY` is set and valid
- Check your OpenAI account has API credits
- For Azure OpenAI, set `OPENAI_BASE_URL` to your endpoint

### Build errors
- Run `pnpm typecheck` to find TypeScript issues
- Ensure Node.js 22+: `node --version`
- Clear caches: `rm -rf node_modules && pnpm install`

### Frontend not loading in production
- Ensure you ran `pnpm build` before `pnpm start`
- Check `STATIC_DIR` points to the correct frontend build directory
- Verify files exist: `ls artifacts/devmind/dist/public/`

---

## License

MIT
