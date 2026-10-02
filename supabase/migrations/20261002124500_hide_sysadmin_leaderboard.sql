drop policy if exists square_leaderboard_select on public.square_leaderboard;
create policy square_leaderboard_select
  on public.square_leaderboard
  for select
  to anon, authenticated
  using (lower(regexp_replace(btrim(team), '[^[:alnum:]]', '', 'g')) <> 'sysadmin');

drop policy if exists square_leaderboard_insert on public.square_leaderboard;
create policy square_leaderboard_insert
  on public.square_leaderboard
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(team)) between 1 and 60
    and lower(regexp_replace(btrim(team), '[^[:alnum:]]', '', 'g')) <> 'sysadmin'
    and score >= 0
    and score <= 2800
    and rating >= 0
    and rating <= 5
    and char_length(comment) <= 150
  );
