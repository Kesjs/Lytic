-- 1.1 Table site_crawl_runs et Clôture Transactionnelle
create table if not exists site_crawl_runs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'crawling', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  pages_total int not null default 0,
  pages_checked int not null default 0,
  pages_changed int not null default 0,
  version_number int,
  created_at timestamptz not null default now()
);

alter table site_crawl_runs enable row level security;

create policy "site_crawl_runs_select_own"
  on site_crawl_runs for select
  using (brand_id in (select id from brands where owner_id = auth.uid()));

create index if not exists idx_site_crawl_runs_brand_status 
  on site_crawl_runs(brand_id, status, created_at desc);

create or replace function close_crawl_run(p_run_id uuid, p_brand_id uuid)
returns site_crawl_runs language plpgsql security definer as $$
declare
  v_changed_count int;
  v_next_version int := null;
  v_result site_crawl_runs;
begin
  select count(*) into v_changed_count 
  from site_changes 
  where crawl_run_id = p_run_id;

  if v_changed_count > 0 then
    select coalesce(max(version_number), 0) + 1 into v_next_version
    from site_crawl_runs
    where brand_id = p_brand_id;
  end if;

  update site_crawl_runs
  set status = 'completed',
      completed_at = now(),
      updated_at = now(),
      pages_changed = v_changed_count,
      version_number = v_next_version
  where id = p_run_id
  returning * into v_result;

  return v_result;
end;
$$;

-- 1.2 Modification de site_pages
alter table site_pages
  add column if not exists title_hash text,
  add column if not exists meta_hash text,
  add column if not exists headings_hash text,
  add column if not exists body_hash text,
  add column if not exists pricing_hash text,
  add column if not exists cta_hash text,
  add column if not exists links_hash text,
  add column if not exists structure_hash text;

alter table site_pages drop constraint if exists site_pages_status_check;
alter table site_pages add constraint site_pages_status_check
  check (status in ('unchecked', 'ok', 'stale', 'unavailable', 'removed'));

-- 1.3 Modification de site_changes
alter table site_changes
  add column if not exists crawl_run_id uuid references site_crawl_runs(id) on delete set null,
  add column if not exists changed_fields text[];

alter table site_changes drop constraint if exists site_changes_importance_check;
alter table site_changes add constraint site_changes_importance_check
  check (importance in ('low', 'watch', 'high', 'critical'));

update site_changes set importance = 'watch' where importance = 'medium';
