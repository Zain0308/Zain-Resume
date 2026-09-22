alter table public.portfolio_documents
  add column if not exists embedding_nvidia extensions.halfvec(2048);
alter table public.portfolio_documents alter column embedding drop not null;

create index if not exists portfolio_documents_embedding_nvidia_hnsw_idx
  on public.portfolio_documents using hnsw (embedding_nvidia extensions.halfvec_cosine_ops);

create or replace function public.match_portfolio_documents(
  query_embedding jsonb,
  match_count integer default 6,
  match_threshold double precision default 0.60
)
returns table (
  content text,
  category text,
  source text,
  company text,
  role text,
  project text,
  section text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.content, d.category, d.source, d.company, d.role, d.project, d.section,
         d.metadata, 1 - (d.embedding_nvidia OPERATOR(extensions.<=>) (query_embedding::text::extensions.halfvec(2048))) as similarity
  from public.portfolio_documents d
  join public.portfolio_knowledge_versions v on v.id = d.version_id and v.is_active
  where d.visibility = 'public'
    and d.embedding_nvidia is not null
    and 1 - (d.embedding_nvidia OPERATOR(extensions.<=>) (query_embedding::text::extensions.halfvec(2048))) >= greatest(0, least(match_threshold, 1))
  order by d.embedding_nvidia OPERATOR(extensions.<=>) (query_embedding::text::extensions.halfvec(2048))
  limit greatest(1, least(match_count, 8));
$$;

create or replace function public.portfolio_replace_curated_knowledge(
  p_admin_token text,
  p_chunks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_version uuid;
  new_version uuid;
  chunk jsonb;
begin
  if not public.portfolio_admin_authorized(p_admin_token) then raise exception 'Unauthorized'; end if;
  if jsonb_typeof(p_chunks) <> 'array' or jsonb_array_length(p_chunks) < 1 then raise exception 'At least one knowledge chunk is required'; end if;

  select id into old_version from public.portfolio_knowledge_versions where is_active for update;
  insert into public.portfolio_knowledge_versions(source, source_name, is_active)
  values ('portfolio-profile', 'Zain Ali portfolio knowledge', false) returning id into new_version;

  if old_version is not null then
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding, embedding_nvidia, category, source, company, role, project, section, document_id, metadata, visibility)
    select new_version, chunk_key, content, embedding, embedding_nvidia, category, source, company, role, project, section, document_id, metadata, visibility
    from public.portfolio_documents where version_id = old_version and source <> 'portfolio-profile';
  end if;

  for chunk in select value from jsonb_array_elements(p_chunks) loop
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding_nvidia, category, source, company, role, project, section, document_id, metadata, visibility)
    values (
      new_version, chunk->>'chunk_key', chunk->>'content',
      (chunk->'embedding')::text::extensions.halfvec(2048),
      coalesce(chunk->>'category', 'profile'), 'portfolio-profile',
      nullif(chunk->>'company', ''), nullif(chunk->>'role', ''), nullif(chunk->>'project', ''),
      coalesce(chunk->>'section', 'profile'), coalesce(chunk->>'document_id', 'portfolio-profile'),
      coalesce(chunk->'metadata', '{}'::jsonb), coalesce(chunk->>'visibility', 'public')
    );
  end loop;

  update public.portfolio_knowledge_versions set is_active = false where is_active;
  update public.portfolio_knowledge_versions set is_active = true where id = new_version;
  return new_version;
end;
$$;

create or replace function public.portfolio_replace_resume(
  p_admin_token text,
  p_source_name text,
  p_chunks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_version uuid;
  new_version uuid;
  chunk jsonb;
begin
  if not public.portfolio_admin_authorized(p_admin_token) then raise exception 'Unauthorized'; end if;
  if jsonb_typeof(p_chunks) <> 'array' or jsonb_array_length(p_chunks) < 1 then raise exception 'No searchable text was extracted from this résumé'; end if;

  select id into old_version from public.portfolio_knowledge_versions where is_active for update;
  insert into public.portfolio_knowledge_versions(source, source_name, is_active)
  values ('resume', left(coalesce(p_source_name, 'Zain-Ali-Resume.pdf'), 120), false) returning id into new_version;

  if old_version is not null then
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding, embedding_nvidia, category, source, company, role, project, section, document_id, metadata, visibility)
    select new_version, chunk_key, content, embedding, embedding_nvidia, category, source, company, role, project, section, document_id, metadata, visibility
    from public.portfolio_documents where version_id = old_version and source <> 'resume';
  end if;

  for chunk in select value from jsonb_array_elements(p_chunks) loop
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding_nvidia, category, source, company, role, project, section, document_id, metadata, visibility)
    values (
      new_version, chunk->>'chunk_key', chunk->>'content',
      (chunk->'embedding')::text::extensions.halfvec(2048), 'experience', 'resume',
      nullif(chunk->>'company', ''), nullif(chunk->>'role', ''), nullif(chunk->>'project', ''),
      coalesce(chunk->>'section', 'resume'), coalesce(chunk->>'document_id', 'resume'),
      coalesce(chunk->'metadata', '{}'::jsonb), 'public'
    );
  end loop;

  update public.portfolio_knowledge_versions set is_active = false where is_active;
  update public.portfolio_knowledge_versions set is_active = true where id = new_version;
  return new_version;
end;
$$;

create or replace function public.portfolio_upsert_manual_knowledge(
  p_admin_token text,
  p_chunk jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_version uuid;
  result_id uuid;
begin
  if not public.portfolio_admin_authorized(p_admin_token) then raise exception 'Unauthorized'; end if;
  select id into active_version from public.portfolio_knowledge_versions where is_active for update;
  if active_version is null then raise exception 'Index the portfolio profile before adding manual knowledge'; end if;

  insert into public.portfolio_documents(version_id, chunk_key, content, embedding_nvidia, category, source, company, role, project, section, document_id, metadata, visibility)
  values (
    active_version, p_chunk->>'chunk_key', p_chunk->>'content',
    (p_chunk->'embedding')::text::extensions.halfvec(2048),
    coalesce(p_chunk->>'category', 'manual'), 'manual',
    nullif(p_chunk->>'company', ''), nullif(p_chunk->>'role', ''), nullif(p_chunk->>'project', ''),
    coalesce(p_chunk->>'section', 'manual'), p_chunk->>'document_id',
    coalesce(p_chunk->'metadata', '{}'::jsonb), 'public'
  )
  on conflict (version_id, chunk_key) do update set
    content = excluded.content,
    embedding_nvidia = excluded.embedding_nvidia,
    category = excluded.category,
    company = excluded.company,
    role = excluded.role,
    project = excluded.project,
    section = excluded.section,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into result_id;
  return result_id;
end;
$$;
