begin;

do $$
begin
  if to_regclass('public.user_game_stickers') is null then
    raise exception 'Tabela public.user_game_stickers não foi criada';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'memory_game_album_covers'
      and not tgisinternal
  ) then
    raise exception 'Trigger do Jogo da Memória não foi criado';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'puzzle_game_album_covers'
      and not tgisinternal
  ) then
    raise exception 'Trigger do Quebra-Cabeça não foi criado';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'cover_guesser_album_covers'
      and not tgisinternal
  ) then
    raise exception 'Trigger do Adivinhe a Capa não foi criado';
  end if;

  if has_table_privilege('authenticated', 'public.user_game_stickers', 'select') then
    raise exception 'Usuárias autenticadas não devem ler user_game_stickers diretamente';
  end if;

  if has_table_privilege('authenticated', 'public.user_game_stickers', 'insert') then
    raise exception 'Usuárias autenticadas não devem inserir figurinhas de Jogos diretamente';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.grant_game_album_covers()',
    'execute'
  ) then
    raise exception 'Usuárias autenticadas não devem executar grant_game_album_covers';
  end if;
end
$$;

rollback;
