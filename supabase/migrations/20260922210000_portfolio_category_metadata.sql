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
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'chunkKey', chunk_key,
    'title', metadata->>'title',
    'content', content,
    'category', category,
    'company', company,
    'role', role,
    'project', project,
    'stack', metadata->'stack',
    'mediaUrl', metadata->>'mediaUrl',
    'institution', metadata->>'institution',
    'startDate', metadata->>'startDate',
    'endDate', metadata->>'endDate',
    'contactValue', metadata->>'contactValue',
    'contactUrl', metadata->>'contactUrl'
  ) order by created_at desc), '[]'::jsonb)
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

revoke all on function public.portfolio_knowledge_status(text) from public;
grant execute on function public.portfolio_knowledge_status(text) to anon, authenticated;
