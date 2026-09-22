create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.portfolio_admin_config (
  singleton boolean primary key default true check (singleton),
  token_sha256 text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists portfolio_one_active_knowledge_version
  on public.portfolio_knowledge_versions (is_active) where is_active;

create table if not exists public.portfolio_documents (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.portfolio_knowledge_versions(id) on delete cascade,
  chunk_key text not null,
  content text not null,
  embedding extensions.vector(1536) not null,
  category text not null,
  source text not null,
  company text,
  role text,
  project text,
  section text,
  document_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(version_id, chunk_key)
);

create index if not exists portfolio_documents_active_version_idx
  on public.portfolio_documents (version_id, visibility, category);
create index if not exists portfolio_documents_embedding_hnsw_idx
  on public.portfolio_documents using hnsw (embedding extensions.vector_cosine_ops);

alter table public.portfolio_admin_config enable row level security;
alter table public.portfolio_knowledge_versions enable row level security;
alter table public.portfolio_documents enable row level security;
revoke all on public.portfolio_admin_config, public.portfolio_knowledge_versions, public.portfolio_documents from public, anon, authenticated;

