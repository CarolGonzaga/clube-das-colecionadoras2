begin;
do $$
declare v_definition text;
begin
  if not exists(
    select 1 from pg_constraint
    where conname='daily_game_rewards_user_reward_game_key'
      and conrelid='public.daily_game_rewards'::regclass
  ) then raise exception 'A unicidade de uma recompensa por jogo/dia esta ausente.'; end if;

  if has_function_privilege('authenticated','public.claim_cover_guesser_reward(uuid,uuid,double precision,double precision)','EXECUTE')
  then raise exception 'A RPC de recompensa do Adivinhe a Capa esta exposta ao navegador.'; end if;

  v_definition:=pg_get_functiondef('public.claim_daily_game_reward(uuid,text,uuid,double precision,double precision)'::regprocedure);
  if position('v_new_roll<0.60' in v_definition)=0
     or position('v_rare_roll<0.70' in v_definition)=0
     or position('not v_prev_rare' in v_definition)=0
  then raise exception 'A distribuicao 60/40, a chance rara ou a alternancia rara/comum esta ausente.'; end if;

  if position('game_access_grants' in v_definition)>0
     or position('is_memory_game_tester' in v_definition)>0
  then raise exception 'A recompensa ainda depende das antigas contas de teste.'; end if;
end $$;
rollback;
