-- ============================================================================
-- BOUSSOLE — schéma initial
-- Système personnel : tâches, calendrier, projets (Gantt/Kanban), objectifs (OKR)
-- Usage solo : chaque ligne appartient à un seul utilisateur (auth.uid()).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PROFILES — infos complémentaires à auth.users (fuseau horaire pour les rappels)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- PROJECTS
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#5B4B8A',
  status text not null default 'active' check (status in ('active','on_hold','completed','archived')),
  start_date date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);

-- ----------------------------------------------------------------------------
-- OBJECTIVES (OKR) + KEY RESULTS
-- ----------------------------------------------------------------------------
create table if not exists public.objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'not_started' check (status in ('not_started','on_track','at_risk','behind','completed')),
  period_start date,
  period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists objectives_user_id_idx on public.objectives(user_id);
create index if not exists objectives_project_id_idx on public.objectives(project_id);

create table if not exists public.key_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  objective_id uuid not null references public.objectives(id) on delete cascade,
  title text not null,
  metric_type text not null default 'numeric' check (metric_type in ('numeric','percentage','boolean')),
  start_value numeric not null default 0,
  target_value numeric not null default 100,
  current_value numeric not null default 0,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists key_results_objective_id_idx on public.key_results(objective_id);

-- ----------------------------------------------------------------------------
-- TASKS (todo liste + éléments de projet / Gantt / Kanban)
-- ----------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  key_result_id uuid references public.key_results(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','done','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  start_date date,
  due_date timestamptz,
  duration_days numeric not null default 1,
  recurrence_rule text,
  tags text[] not null default '{}',
  position integer not null default 0,
  estimate_hours numeric,
  reminder_minutes_before integer,
  reminder_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_parent_task_id_idx on public.tasks(parent_task_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_status_idx on public.tasks(status);

-- Dépendances entre tâches (pour le Gantt : "fin-à-début")
create table if not exists public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint no_self_dependency check (task_id <> depends_on_task_id),
  constraint unique_dependency unique (task_id, depends_on_task_id)
);
create index if not exists task_dependencies_task_id_idx on public.task_dependencies(task_id);

-- ----------------------------------------------------------------------------
-- EVENTS (agenda)
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  linked_task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  recurrence_rule text,
  color text not null default '#2E7D75',
  reminder_minutes_before integer default 30,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_start_at_idx on public.events(start_at);

-- ----------------------------------------------------------------------------
-- PUSH SUBSCRIPTIONS (Web Push)
-- ----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

-- ----------------------------------------------------------------------------
-- updated_at automatique
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.objectives;
create trigger set_updated_at before update on public.objectives for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.key_results;
create trigger set_updated_at before update on public.key_results for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.tasks;
create trigger set_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.events;
create trigger set_updated_at before update on public.events for each row execute procedure public.set_updated_at();
drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY — chaque utilisateur ne voit / modifie que ses données
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.objectives enable row level security;
alter table public.key_results enable row level security;
alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.events enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "projects: own rows" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "objectives: own rows" on public.objectives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "key_results: own rows" on public.key_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks: own rows" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "task_dependencies: own rows" on public.task_dependencies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "events: own rows" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions: own rows" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Vue utilitaire : progression d'un objectif = moyenne de ses key results
-- ============================================================================
create or replace view public.objective_progress as
select
  o.id as objective_id,
  o.user_id,
  coalesce(avg(
    case
      when kr.target_value = kr.start_value then 0
      else greatest(0, least(1, (kr.current_value - kr.start_value) / nullif(kr.target_value - kr.start_value, 0)))
    end
  ), 0) as progress_ratio,
  count(kr.id) as key_result_count
from public.objectives o
left join public.key_results kr on kr.objective_id = o.id
group by o.id, o.user_id;
