# Vercel deployment

This repository is ready to import into Vercel. The public portfolio is served from `dist/`; the API function in `api/index.js` adapts the existing Worker endpoints for Vercel.

## Required Vercel environment variables

Add these as **server-side** environment variables in Vercel (Production, Preview and Development as needed):

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
KNOWLEDGE_ADMIN_TOKEN=<existing portfolio knowledge admin token>
NVIDIA_NIM_API_KEY=nvapi-...
ADMIN_EMAIL=<your owner email>
VERCEL_ADMIN_PASSWORD=<strong unique password>
ADMIN_SESSION_SECRET=<long random secret, 32+ characters>
SUPABASE_SERVICE_ROLE_KEY=<server-only Supabase secret key>
SUPABASE_STORAGE_BUCKET=portfolio-media
```

Optional AI settings:

```text
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_CHAT_MODEL=z-ai/glm-5.3-flash
NVIDIA_NIM_EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b
NVIDIA_NIM_EMBEDDING_DIMENSIONS=2048
RAG_SIMILARITY_THRESHOLD=0.42
```

Create the `portfolio-media` bucket in Supabase Storage before using CV/image uploads, and keep it server-accessible. Never put `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_NIM_API_KEY`, `KNOWLEDGE_ADMIN_TOKEN`, or `ADMIN_SESSION_SECRET` in frontend code or `NEXT_PUBLIC_*` variables.

## Admin access

After deployment open `/admin/knowledge`. Sign in with `ADMIN_EMAIL` and `VERCEL_ADMIN_PASSWORD`. The session is an HTTP-only, Secure cookie; all `/api/admin/*` endpoints require the same owner session.

## Vercel settings

Use the repository root as the project root and let `vercel.json` configure the static assets and API function. No build command is required. The function uses Node 20+.
