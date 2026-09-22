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
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding, category, source, company, role, project, section, document_id, metadata, visibility)
    select new_version, chunk_key, content, embedding, category, source, company, role, project, section, document_id, metadata, visibility
    from public.portfolio_documents where version_id = old_version and source <> 'portfolio-profile';
  end if;

  for chunk in select value from jsonb_array_elements(p_chunks) loop
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding, category, source, company, role, project, section, document_id, metadata, visibility)
    values (
      new_version,
      chunk->>'chunk_key',
      chunk->>'content',
      (chunk->'embedding')::text::extensions.vector(1536),
      coalesce(chunk->>'category', 'profile'),
      'portfolio-profile',
      nullif(chunk->>'company', ''), nullif(chunk->>'role', ''), nullif(chunk->>'project', ''),
      coalesce(chunk->>'section', 'profile'),
      coalesce(chunk->>'document_id', 'portfolio-profile'),
      coalesce(chunk->'metadata', '{}'::jsonb),
      coalesce(chunk->>'visibility', 'public')
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
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding, category, source, company, role, project, section, document_id, metadata, visibility)
    select new_version, chunk_key, content, embedding, category, source, company, role, project, section, document_id, metadata, visibility
    from public.portfolio_documents where version_id = old_version and source <> 'resume';
  end if;

  for chunk in select value from jsonb_array_elements(p_chunks) loop
    insert into public.portfolio_documents(version_id, chunk_key, content, embedding, category, source, company, role, project, section, document_id, metadata, visibility)
    values (
      new_version, chunk->>'chunk_key', chunk->>'content',
      (chunk->'embedding')::text::extensions.vector(1536), 'experience', 'resume',
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

