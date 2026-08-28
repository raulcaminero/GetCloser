# GetCloser

GetCloser is a WhatsApp AI lead qualification bot. Businesses configure AI agents with product catalogs and qualification scripts; the system sends bulk outbound messages via campaigns, and once a contact replies, the AI agent takes over the conversation automatically — qualifying leads, capturing interest, and handing off hot prospects.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     apps/web (Next.js)                  │
│  Dashboard · Leads · Agents · Campaigns                 │
└───────────────────────┬─────────────────────────────────┘
                        │ REST (axios)
┌───────────────────────▼─────────────────────────────────┐
│                    apps/api (NestJS)                    │
│                                                         │
│  AgentModule  ─────────────────────────────────────     │
│  LeadsModule  ──── PrismaService ──► PostgreSQL         │
│  CampaignsModule ─► Bull Queue ──► Redis                │
│  WhatsAppModule ──► Meta Graph API                      │
│                                                         │
│  Webhook: POST /whatsapp/webhook                        │
│    └─► QualificationService (Anthropic Claude)          │
└─────────────────────────────────────────────────────────┘
```

## Tech stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | Next.js 15, React 19, Tailwind CSS  |
| Backend     | NestJS 12, ESM                      |
| Database    | PostgreSQL 16 + Prisma ORM          |
| Queue       | Bull + Redis 7                      |
| AI          | Anthropic Claude (claude-3-5-sonnet)|
| Messaging   | WhatsApp Cloud API (Meta)           |
| Monorepo    | Turborepo + npm workspaces          |

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- A Meta developer app with WhatsApp Cloud API access
- An Anthropic API key

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-org/getcloser.git
cd getcloser
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` and fill in all required values (see table below).

### 4. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 5. Run database migrations

```bash
cd apps/api && npx prisma migrate dev --name init
```

### 6. Start the development servers

```bash
cd ../.. && npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

## Environment variables

### apps/api/.env

| Variable                  | Required | Description                                              |
|---------------------------|----------|----------------------------------------------------------|
| `DATABASE_URL`            | yes      | PostgreSQL connection string                             |
| `REDIS_HOST`              | yes      | Redis hostname (default: `localhost`)                    |
| `REDIS_PORT`              | yes      | Redis port (default: `6379`)                             |
| `ANTHROPIC_API_KEY`       | yes      | Anthropic API key for Claude                             |
| `WHATSAPP_PHONE_NUMBER_ID`| yes      | Meta phone number ID from WhatsApp Cloud API             |
| `WHATSAPP_ACCESS_TOKEN`   | yes      | Permanent access token for WhatsApp Cloud API            |
| `WHATSAPP_VERIFY_TOKEN`   | yes      | Arbitrary secret used to verify the Meta webhook         |
| `PORT`                    | no       | HTTP port for the API server (default: `3001`)           |
| `DEFAULT_AGENT_ID`        | no       | Fallback agent ID for inbound messages without a match   |

### apps/web/.env

| Variable               | Required | Description                        |
|------------------------|----------|------------------------------------|
| `NEXT_PUBLIC_API_URL`  | yes      | Base URL of the NestJS API          |

## API endpoints

| Method | Path                          | Description                              |
|--------|-------------------------------|------------------------------------------|
| GET    | /agents                       | List all agents                          |
| POST   | /agents                       | Create an agent                          |
| PATCH  | /agents/:id                   | Update an agent                          |
| DELETE | /agents/:id                   | Delete an agent                          |
| GET    | /leads                        | List leads (filter by temperature/agent) |
| GET    | /leads/:id/conversation       | Get full conversation history            |
| GET    | /campaigns                    | List all campaigns                       |
| GET    | /campaigns/:id                | Get a single campaign                    |
| POST   | /campaigns                    | Create and enqueue a campaign            |
| PATCH  | /campaigns/:id/pause          | Pause an active campaign                 |
| PATCH  | /campaigns/:id/resume         | Resume a paused campaign                 |
| GET    | /whatsapp/webhook             | Meta webhook verification                |
| POST   | /whatsapp/webhook             | Receive inbound WhatsApp messages        |

## Deployment

The project is structured as a Turborepo monorepo. Each app can be deployed independently.

**Railway / Render (recommended):**

1. Create two services — one for `apps/api`, one for `apps/web`.
2. Add a managed PostgreSQL database and a Redis instance.
3. Set all required environment variables in each service's settings.
4. Set the build command to `npm run build` and start command to:
   - API: `node dist/main`
   - Web: `npm start`
5. Run `npx prisma migrate deploy` as a pre-deploy step or one-off job after first deploy.

**WhatsApp webhook:**  
After deploying the API, register `https://your-api-domain/whatsapp/webhook` in your Meta app's webhook settings using the value of `WHATSAPP_VERIFY_TOKEN`.
