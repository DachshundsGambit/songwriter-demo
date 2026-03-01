# Songwriter Demo

Upload raw recordings (voice + instrument) and get polished demos powered by AI. The app processes audio through a 5-step pipeline: stem separation, pitch correction, vocal enhancement, recombination, and mastering.

Two quality tiers: **Free** (open-source models via Replicate, ~$0.05/demo) and **Premium** (Kits.ai, ElevenLabs, LANDR, ~$1-2/demo).

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database**: Prisma 6 + Neon (PostgreSQL) with PrismaPg adapter
- **File Storage**: Vercel Blob
- **Job Queue**: Upstash QStash (step-based pipeline orchestration)
- **AI Processing**: Replicate (free), Kits.ai + ElevenLabs + LANDR (premium)
- **Frontend**: WaveSurfer.js, Zustand, React Query, Axios

## Quick Start

```bash
cd ~/songwriter-demo
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Prerequisites

- Node.js 18+
- A Neon database (already provisioned — see `.env`)
- API keys for the processing services you want to use

## Environment Variables

Copy `.env.local` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon pooler connection string |
| `DIRECT_URL` | Yes | Neon direct connection string (for migrations) |
| `JWT_SECRET` | Yes | Secret for signing auth tokens |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Vercel Blob token |
| `QSTASH_TOKEN` | For production | Upstash QStash token |
| `QSTASH_CURRENT_SIGNING_KEY` | For production | QStash webhook verification |
| `QSTASH_NEXT_SIGNING_KEY` | For production | QStash webhook verification |
| `REPLICATE_API_TOKEN` | Free tier | Replicate API token |
| `KITSAI_API_KEY` | Premium tier | Kits.ai API key |
| `ELEVENLABS_API_KEY` | Premium tier | ElevenLabs API key |
| `LANDR_API_KEY` | Premium tier | LANDR API key |
| `NEXT_PUBLIC_APP_URL` | For QStash callbacks | App URL (default: `http://localhost:3000`) |

## Database

The Prisma schema is at `prisma/schema.prisma`. To push schema changes:

```bash
npx prisma db push       # push changes to Neon
npx prisma generate      # regenerate client
npx prisma studio        # GUI at localhost:5555
```

### Models

- **User** — id, email, passwordHash, name, timestamps
- **Project** — id, userId, title, tier (`FREE`/`PREMIUM`), status (`UPLOADING`/`PROCESSING`/`COMPLETED`/`FAILED`), originalUrl, finalUrl, duration
- **ProcessingStep** — id, projectId, stepName, stepOrder (1-5), status, provider, externalId, inputUrl, outputUrl, errorMsg, costCents, metadata (JSON)
- **Track** — id, projectId, label (`original`/`vocals`/`instruments`/`vocals_corrected`/`final`), blobUrl

`ProcessingStep` is a separate model (not embedded JSON) to enable per-step retry, polling via `externalId`, and granular progress tracking.

## Project Structure

```
songwriter-demo/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar nav + auth guard
│   │   ├── dashboard/page.tsx      # Overview with stats
│   │   └── projects/
│   │       ├── page.tsx            # Project list
│   │       ├── new/page.tsx        # Upload + tier selection
│   │       └── [id]/page.tsx       # Pipeline status, playback, download
│   ├── api/
│   │   ├── auth/                   # register, login, me
│   │   ├── projects/               # CRUD + retry
│   │   ├── upload/route.ts         # Vercel Blob upload
│   │   ├── jobs/process/route.ts   # QStash-triggered step executor
│   │   └── processing/webhook/route.ts  # Replicate webhook receiver
│   ├── layout.tsx                  # Root layout + React Query provider
│   ├── page.tsx                    # Landing page
│   └── providers.tsx               # QueryClientProvider
├── components/
│   ├── WaveformPlayer.tsx          # WaveSurfer.js audio player
│   ├── UploadDropzone.tsx          # Drag-and-drop file upload
│   ├── PipelineProgress.tsx        # Vertical step tracker with retry
│   ├── TierSelector.tsx            # Free vs Premium cards
│   └── BeforeAfterPlayer.tsx       # A/B comparison toggle
├── lib/
│   ├── db.ts                       # Prisma singleton (PrismaPg adapter)
│   ├── auth.ts                     # JWT sign/verify/getAuth/requireAuth
│   ├── api/
│   │   ├── client.ts               # Axios instance with auth interceptor
│   │   ├── auth.ts                 # register, login, getMe
│   │   └── projects.ts             # getProjects, getProject, createProject, retryStep
│   ├── store/
│   │   ├── auth.ts                 # Zustand auth store (persisted)
│   │   └── player.ts               # Zustand player state
│   └── processing/
│       ├── orchestrator.ts         # Pipeline dispatch + step advancement
│       ├── types.ts                # StepResult, StepHandler interfaces
│       ├── replicate-client.ts     # Replicate SDK + Blob upload helper
│       ├── free/                   # Free tier handlers
│       │   ├── stem-separation.ts
│       │   ├── pitch-correction.ts
│       │   ├── enhancement.ts      # Pass-through (no-op)
│       │   ├── recombine.ts        # FFmpeg audio mix
│       │   └── mastering.ts        # FFmpeg loudnorm + EQ
│       └── premium/                # Premium tier handlers
│           ├── stem-separation.ts  # Kits.ai
│           ├── pitch-correction.ts # Kits.ai
│           ├── enhancement.ts      # ElevenLabs Voice Isolator
│           └── mastering.ts        # LANDR
└── prisma/schema.prisma
```

## Processing Pipeline

```
Raw Upload (voice + guitar)
    │
    ▼
1. Stem Separation ──► isolated vocals + instruments
    │
    ▼
2. Pitch Correction ──► auto-tuned vocals
    │
    ▼
3. Enhancement ──► noise removal, cleanup
    │
    ▼
4. Recombine ──► corrected vocals + original instruments
    │
    ▼
5. Mastering ──► loudness normalization, EQ, polish
    │
    ▼
Final Demo (downloadable)
```

### Provider Comparison

| Step | Free Tier | Premium Tier |
|------|-----------|-------------|
| Stem Separation | Replicate Demucs (`htdemucs_ft`) | Kits.ai Vocal Separation |
| Pitch Correction | Replicate `nateraw/autotune` | Kits.ai AI Pitch Correction |
| Enhancement | Pass-through (skipped) | ElevenLabs Voice Isolator |
| Recombine | Replicate FFmpeg (`amix`) | Replicate FFmpeg (`amix`) |
| Mastering | Replicate FFmpeg (`loudnorm` + EQ) | LANDR Mastering |

### Orchestration

The pipeline uses **QStash step-based orchestration** to handle long-running audio processing within Vercel's serverless timeout limits:

1. **Project created** — `POST /api/projects` creates a project with 5 `ProcessingStep` rows, then publishes a QStash message for step 1
2. **QStash invokes** `/api/jobs/process` with `{ projectId, stepName }`
3. **Step handler** calls the external API (Replicate/Kits.ai/etc.), waits for the result, saves output to Vercel Blob
4. **Orchestrator advances** to the next step automatically
5. **Final step** — project status set to `COMPLETED`, final track saved

**Local dev fallback**: When `QSTASH_TOKEN` is not set, steps execute directly in sequence (no QStash needed).

**Webhook support**: `/api/processing/webhook` handles async Replicate prediction callbacks. Steps with an `externalId` are matched and advanced when the webhook fires.

**Retry**: Any failed step can be retried from the project detail UI. The retry endpoint resets the step to `PENDING` and re-executes it.

## API Routes

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account (name, email, password) |
| POST | `/api/auth/login` | Sign in (email, password) |
| GET | `/api/auth/me` | Get current user (requires auth) |

All other routes require a `Bearer` token in the `Authorization` header.

### Projects

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project + start pipeline |
| GET | `/api/projects/[id]` | Get project with steps and tracks |
| POST | `/api/projects/[id]/retry/[stepId]` | Retry a failed step |

### Upload

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Upload audio file to Vercel Blob (multipart/form-data) |

Accepts MP3 and WAV files up to 50MB.

### Internal

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/jobs/process` | QStash-triggered step executor |
| POST | `/api/processing/webhook` | Replicate webhook receiver |

## Frontend

### Pages

- **`/`** — Landing page with sign-in/sign-up links
- **`/login`** — Email + password sign-in
- **`/register`** — Create account
- **`/dashboard`** — Overview with project counts
- **`/projects`** — List all projects with status badges
- **`/projects/new`** — Upload recording, choose tier, create project
- **`/projects/[id]`** — Live pipeline progress, waveform playback, A/B comparison, download

### Components

- **`WaveformPlayer`** — WaveSurfer.js wrapper with play/pause and time display
- **`BeforeAfterPlayer`** — Toggle between original and final recordings
- **`PipelineProgress`** — Vertical timeline showing step status with retry buttons for failed steps
- **`UploadDropzone`** — Drag-and-drop file upload with progress bar and validation
- **`TierSelector`** — Side-by-side Free vs Premium cards with feature lists

### State Management

- **Auth**: Zustand store persisted to `localStorage`. Axios interceptor auto-attaches Bearer token and redirects to `/login` on 401.
- **Data**: React Query with `refetchInterval` — polls every 3 seconds while a project's status is `PROCESSING`.

## Deployment

Built for Vercel:

```bash
npm run build
```

- `postinstall` script runs `prisma generate` automatically
- `serverExternalPackages: ['pg']` configured in `next.config.ts` for the Neon adapter
- No `output: "standalone"` — standard Vercel serverless deployment

Set all variables from the environment table above in your Vercel project settings. The `DATABASE_URL` should use the Neon **pooler** URL; `DIRECT_URL` should use the **direct** URL.

## Notes

- **Kits.ai** was acquired by Splice in January 2026. Their API may change. The free tier works as a complete fallback if premium APIs become unavailable.
- **File size limit**: 50MB. Supported formats: MP3, WAV.
- **Cost tracking**: Each `ProcessingStep` records `costCents` for billing visibility.
- **QStash signature verification** is enabled in production when signing keys are configured; disabled in local dev.
