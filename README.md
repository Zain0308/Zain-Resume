# Zain Ali — Full Stack .NET Developer Portfolio

This repository contains the source for Zain Ali's responsive developer portfolio, its NVIDIA-powered portfolio assistant, owner-only knowledge manager, and Supabase knowledge-index migrations.

## Build

Before building, place your own PDF at `dist/ZainResume.pdf`, then run `node scripts/build-worker.mjs` to generate the Cloudflare Worker at `dist/server/index.js`. The CV and generated worker are intentionally not included because the worker embeds the CV.

## Runtime configuration

Set runtime credentials as secrets in the hosting provider. Do not commit API keys, Supabase credentials, admin tokens, or personal CV files. The application uses NVIDIA NIM and Supabase for embeddings, chat, and portfolio knowledge; it also needs the configured private resume-storage bucket.

The production Site is hosted separately from this repository. The source in this repository does not contain the production secrets.
