create table if not exists public.square_leaderboard (
  id bigint generated always as identity primary key,
  team text not null,
  played_at timestamptz not null default now(),
  score integer not null,
  rating smallint not null default 0,
  comment text not null default '',
  constraint square_leaderboard_team_len check (char_length(btrim(team)) between 1 and 60),
  constraint square_leaderboard_score_range check (score >= 0 and score <= 2800),
  constraint square_leaderboard_rating_range check (rating >= 0 and rating <= 5),
  constraint square_leaderboard_comment_len check (char_length(comment) <= 150)
);

alter table public.square_leaderboard
  add column if not exists rating smallint not null default 0;

alter table public.square_leaderboard
  add column if not exists comment text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'square_leaderboard_team_len'
      and conrelid = 'public.square_leaderboard'::regclass
  ) then
    alter table public.square_leaderboard
      add constraint square_leaderboard_team_len
      check (char_length(btrim(team)) between 1 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'square_leaderboard_score_range'
      and conrelid = 'public.square_leaderboard'::regclass
  ) then
    alter table public.square_leaderboard
      add constraint square_leaderboard_score_range
      check (score >= 0 and score <= 2800);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'square_leaderboard_rating_range'
      and conrelid = 'public.square_leaderboard'::regclass
  ) then
    alter table public.square_leaderboard
      add constraint square_leaderboard_rating_range
      check (rating >= 0 and rating <= 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'square_leaderboard_comment_len'
      and conrelid = 'public.square_leaderboard'::regclass
  ) then
    alter table public.square_leaderboard
      add constraint square_leaderboard_comment_len
      check (char_length(comment) <= 150);
  end if;
end $$;

comment on table public.square_leaderboard is 'Placar do SQuaRE Quest: equipe, data, pontuação, nota e comentário.';

alter table public.square_leaderboard enable row level security;

drop policy if exists square_leaderboard_select on public.square_leaderboard;
create policy square_leaderboard_select
  on public.square_leaderboard
  for select
  to anon, authenticated
  using (true);

drop policy if exists square_leaderboard_insert on public.square_leaderboard;
create policy square_leaderboard_insert
  on public.square_leaderboard
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(team)) between 1 and 60
    and score >= 0
    and score <= 2800
    and rating >= 0
    and rating <= 5
    and char_length(comment) <= 150
  );

grant select, insert on public.square_leaderboard to anon, authenticated;
