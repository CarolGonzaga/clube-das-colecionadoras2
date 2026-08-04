-- O nível difícil usa uma grade 6x5 (30 peças). A restrição original
-- aceitava no máximo cinco linhas e rejeitava a criação dessa sessão.
begin;

alter table public.puzzle_game_sessions
  drop constraint if exists puzzle_game_sessions_grid_rows_check;

alter table public.puzzle_game_sessions
  add constraint puzzle_game_sessions_grid_rows_check
  check (grid_rows in (3, 4, 5, 6));

commit;
