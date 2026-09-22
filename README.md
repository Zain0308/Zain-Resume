# Zain Ali — Full Stack .NET Developer Portfolio

This repository contains the source for Zain Ali's responsive developer portfolio, its NVIDIA-powered portfolio assistant, owner-only knowledge manager, and Supabase knowledge-index migrations.

## Technology stack

- **Frontend:** semantic HTML5, modern CSS3, responsive layouts, CSS animations, and browser-native JavaScript ES modules
- **3D and motion:** Three.js 0.185.1 with WebGL2, a procedural interactive developer workspace, mouse movement, parallax, and reduced-motion support
- **Visual design:** dark developer theme, glassmorphism panels, neon blue and purple accents, animated network/API background, and progressive fallback graphics
- **AI assistant:** NVIDIA NIM chat completions with streaming responses and NVIDIA Nemotron 3 Embed 1B embeddings
- **RAG pipeline:** curated portfolio knowledge, semantic chunk matching, PDF resume indexing, and streaming answers grounded in portfolio data
- **Database:** Supabase Postgres, SQL migrations, RPC functions, vector embeddings, cosine similarity search, and HNSW indexing
- **Backend:** Cloudflare Worker APIs for chat, embeddings, knowledge management, resume upload, and secure server-side secret handling
- **Admin tools:** owner-only knowledge manager for skills, experience, projects, and resume replacement
- **Build and validation:** Node.js ES module build script and worker validation script

## Build

Before building, place your own PDF at `dist/ZainResume.pdf`, then run `node scripts/build-worker.mjs` to generate the Cloudflare Worker at `dist/server/index.js`. The CV and generated worker are intentionally not included because the worker embeds the CV.

## Runtime configuration

Set runtime credentials as secrets in the hosting provider. Do not commit API keys, Supabase credentials, admin tokens, or personal CV files. The application uses NVIDIA NIM and Supabase for embeddings, chat, and portfolio knowledge; it also needs the configured private resume-storage bucket.

The production Site is hosted separately from this repository. The source in this repository does not contain the production secrets.
