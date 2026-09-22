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
         d.metadata, 1 - (d.embedding OPERATOR(extensions.<=>) (query_embedding::text::extensions.vector(1536))) as similarity
  from public.portfolio_documents d
  join public.portfolio_knowledge_versions v on v.id = d.version_id and v.is_active
  where d.visibility = 'public'
    and 1 - (d.embedding OPERATOR(extensions.<=>) (query_embedding::text::extensions.vector(1536))) >= greatest(0, least(match_threshold, 1))
  order by d.embedding OPERATOR(extensions.<=>) (query_embedding::text::extensions.vector(1536))
  limit greatest(1, least(match_count, 8));
$$;
grant execute on function public.match_portfolio_documents(jsonb, integer, double precision) to anon, authenticated;

