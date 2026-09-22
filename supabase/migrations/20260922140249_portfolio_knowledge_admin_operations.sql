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

  insert into public.portfolio_documents(version_id, chunk_key, content, embedding, category, source, company, role, project, section, document_id, metadata, visibility)
  values (
    active_version,
    p_chunk->>'chunk_key', p_chunk->>'content',
    (p_chunk->'embedding')::text::extensions.vector(1536),
    coalesce(p_chunk->>'category', 'manual'), 'manual',
    nullif(p_chunk->>'company', ''), nullif(p_chunk->>'role', ''), nullif(p_chunk->>'project', ''),
    coalesce(p_chunk->>'section', 'manual'), p_chunk->>'document_id',
    coalesce(p_chunk->'metadata', '{}'::jsonb), 'public'
  )
  on conflict (version_id, chunk_key) do update set
    content = excluded.content,
    embedding = excluded.embedding,
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

create or replace function public.portfolio_delete_manual_knowledge(p_admin_token text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.portfolio_admin_authorized(p_admin_token) then raise exception 'Unauthorized'; end if;
  delete from public.portfolio_documents d using public.portfolio_knowledge_versions v
  where d.version_id = v.id and v.is_active and d.id = p_id and d.source = 'manual';
  return found;
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
  category_rows jsonb;
  manual_rows jsonb;
begin
  if not public.portfolio_admin_authorized(p_admin_token) then raise exception 'Unauthorized'; end if;
  select * into version_row from public.portfolio_knowledge_versions where is_active limit 1;
  active_version := version_row.id;
  select count(*) into total_chunks from public.portfolio_documents where version_id = active_version;
  select coalesce(jsonb_agg(jsonb_build_object('name', category, 'count', n) order by category), '[]'::jsonb)
  into category_rows from (select category, count(*) n from public.portfolio_documents where version_id = active_version group by category) c;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'chunkKey', chunk_key, 'title', metadata->>'title', 'content', content, 'category', category, 'company', company, 'role', role, 'project', project) order by created_at desc), '[]'::jsonb)
  into manual_rows from public.portfolio_documents where version_id = active_version and source = 'manual';
  return jsonb_build_object(
    'activeVersion', active_version,
    'sourceName', version_row.source_name,
    'updatedAt', version_row.created_at,
    'indexedChunks', coalesce(total_chunks, 0),
    'categories', category_rows,
    'manualDocuments', manual_rows
  );
end;
$$;

revoke all on function public.portfolio_replace_curated_knowledge(text, jsonb) from public;
revoke all on function public.portfolio_replace_resume(text, text, jsonb) from public;
revoke all on function public.portfolio_upsert_manual_knowledge(text, jsonb) from public;
revoke all on function public.portfolio_delete_manual_knowledge(text, uuid) from public;
revoke all on function public.portfolio_knowledge_status(text) from public;
grant execute on function public.portfolio_replace_curated_knowledge(text, jsonb) to anon, authenticated;
grant execute on function public.portfolio_replace_resume(text, text, jsonb) to anon, authenticated;
grant execute on function public.portfolio_upsert_manual_knowledge(text, jsonb) to anon, authenticated;
grant execute on function public.portfolio_delete_manual_knowledge(text, uuid) to anon, authenticated;
grant execute on function public.portfolio_knowledge_status(text) to anon, authenticated;
