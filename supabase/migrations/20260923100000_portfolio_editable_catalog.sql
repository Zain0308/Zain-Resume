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
    active_version,
    p_chunk->>'chunk_key', p_chunk->>'content',
    (p_chunk->'embedding')::text::extensions.halfvec(2048),
    coalesce(p_chunk->>'category', 'manual'), 'manual',
    nullif(p_chunk->>'company', ''), nullif(p_chunk->>'role', ''), nullif(p_chunk->>'project', ''),
    coalesce(p_chunk->>'section', 'manual'), p_chunk->>'document_id',
    coalesce(p_chunk->'metadata', '{}'::jsonb),
    coalesce(nullif(p_chunk->'metadata'->>'visibility', ''), 'public')
  )
  on conflict (version_id, chunk_key) do update set
    content = excluded.content,
    embedding_nvidia = excluded.embedding_nvidia,
    category = excluded.category,
    company = excluded.company,
    role = excluded.role,
    project = excluded.project,
    section = excluded.section,
    document_id = excluded.document_id,
    metadata = excluded.metadata,
    visibility = excluded.visibility,
    updated_at = now()
  returning id into result_id;
  return result_id;
end;
$$;

create or replace function public.portfolio_knowledge_status(p_admin_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  active_version uuid;
  version_row public.portfolio_knowledge_versions%rowtype;
  total_chunks integer;
  nvidia_chunks integer;
  category_rows jsonb;
  manual_rows jsonb;
begin
  if not public.portfolio_admin_authorized(p_admin_token) then raise exception 'Unauthorized'; end if;
  select * into version_row from public.portfolio_knowledge_versions where is_active limit 1;
  active_version := version_row.id;
  select count(*) into total_chunks from public.portfolio_documents where version_id = active_version;
  select count(*) into nvidia_chunks from public.portfolio_documents where version_id = active_version and embedding_nvidia is not null;
  select coalesce(jsonb_agg(jsonb_build_object('name', category, 'count', n) order by category), '[]'::jsonb)
  into category_rows from (select category, count(*) n from public.portfolio_documents where version_id = active_version group by category) c;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'chunkKey', chunk_key,
    'title', metadata->>'title',
    'content', content,
    'category', category,
    'company', company,
    'role', role,
    'project', project,
    'kind', metadata->>'kind',
    'contentKey', metadata->>'contentKey',
    'hidden', coalesce(metadata->>'hidden', 'false'),
    'draft', coalesce(metadata->>'draft', 'false'),
    'featured', coalesce(metadata->>'featured', 'false'),
    'sortOrder', coalesce(metadata->>'sortOrder', '0'),
    'sectionVisible', coalesce(metadata->>'sectionVisible', 'true'),
    'siteValue', metadata->>'siteValue',
    'stack', metadata->'stack',
    'mediaUrl', metadata->>'mediaUrl',
    'institution', metadata->>'institution',
    'startDate', metadata->>'startDate',
    'endDate', metadata->>'endDate',
    'contactValue', metadata->>'contactValue',
    'contactUrl', metadata->>'contactUrl',
    'githubUrl', metadata->>'githubUrl',
    'demoUrl', metadata->>'demoUrl',
    'history', coalesce(metadata->'history', '[]'::jsonb)
  ) order by case when metadata->>'sortOrder' ~ '^[0-9]+$' then (metadata->>'sortOrder')::integer else 0 end, created_at desc), '[]'::jsonb)
  into manual_rows from public.portfolio_documents where version_id = active_version and source = 'manual';
  return jsonb_build_object(
    'activeVersion', active_version,
    'sourceName', version_row.source_name,
    'updatedAt', version_row.created_at,
    'indexedChunks', coalesce(total_chunks, 0),
    'nvidiaEmbeddedChunks', coalesce(nvidia_chunks, 0),
    'categories', category_rows,
    'manualDocuments', manual_rows
  );
end;
$$;

revoke all on function public.portfolio_upsert_manual_knowledge(text, jsonb) from public;
revoke all on function public.portfolio_knowledge_status(text) from public;
grant execute on function public.portfolio_upsert_manual_knowledge(text, jsonb) to anon, authenticated;
grant execute on function public.portfolio_knowledge_status(text) to anon, authenticated;

create or replace function public.portfolio_update_manual_metadata(p_admin_token text, p_id uuid, p_metadata jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed boolean;
  affected integer;
begin
  if not public.portfolio_admin_authorized(p_admin_token) then raise exception 'Unauthorized'; end if;
  update public.portfolio_documents
  set metadata = metadata || coalesce(p_metadata, '{}'::jsonb),
      visibility = case
        when coalesce((metadata || coalesce(p_metadata, '{}'::jsonb))->>'hidden', 'false') = 'true'
          or coalesce((metadata || coalesce(p_metadata, '{}'::jsonb))->>'draft', 'false') = 'true'
          or coalesce((metadata || coalesce(p_metadata, '{}'::jsonb))->>'sectionVisible', 'true') = 'false'
        then 'private' else 'public' end,
      updated_at = now()
  where id = p_id and source = 'manual';
  get diagnostics affected = row_count;
  changed := affected > 0;
  return changed;
end;
$$;

revoke all on function public.portfolio_update_manual_metadata(text, uuid, jsonb) from public;
grant execute on function public.portfolio_update_manual_metadata(text, uuid, jsonb) to anon, authenticated;
