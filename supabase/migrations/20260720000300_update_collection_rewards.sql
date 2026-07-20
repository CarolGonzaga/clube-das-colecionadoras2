-- Redefine check_and_grant_rewards to dynamically check all 34 collections
create or replace function public.check_and_grant_rewards(user_id_param uuid)
returns jsonb as $$
declare
  reveals jsonb := '[]'::jsonb;
  granted_in_loop boolean := true;
  total_count integer;
  count_1_193 integer;
  
  -- Definição de todas as coleções
  collections jsonb := '[
    {"tag": "Coleção fã Zey Shelsea", "stickers": [14, 130, 212, 149, 198, 205, 225]},
    {"tag": "Coleção fã Victoria Mendes", "stickers": [4, 70, 181, 166, 315, 238, 281]},
    {"tag": "Coleção fã V.S. Vilela", "stickers": [115, 264, 237, 9, 68]},
    {"tag": "Coleção fã Mariana Rosa", "stickers": [6, 287, 172, 179, 319, 236]},
    {"tag": "Coleção fã Victoria Moon", "stickers": [251, 256, 15, 80, 177]},
    {"tag": "Coleção fã Tessa Reis", "stickers": [30, 160, 176, 200, 269, 295, 300, 314]},
    {"tag": "Coleção fã Carol Barra", "stickers": [27, 182, 206, 221]},
    {"tag": "Coleção fã D.Barreto", "stickers": [8, 272, 288]},
    {"tag": "Coleção fã Danda Odeleci", "stickers": [123, 199, 246]},
    {"tag": "Coleção fã Elayne Baeta", "stickers": [25, 125, 146]},
    {"tag": "Coleção fã Emely Luiza Curcio", "stickers": [129, 162, 195, 239, 263]},
    {"tag": "Coleção fã Englantine", "stickers": [12, 124, 215, 253, 273]},
    {"tag": "Coleção fã Helena Nolasco", "stickers": [16, 127, 285, 299, 308]},
    {"tag": "Coleção fã Ingrid Paranhos", "stickers": [37, 197, 282]},
    {"tag": "Coleção fã Ju Mesquita", "stickers": [7, 63, 240]},
    {"tag": "Coleção fã Lari Alcantara", "stickers": [42, 254, 303]},
    {"tag": "Coleção fã Carol e Liliane", "stickers": [155, 210, 291]},
    {"tag": "Coleção fã Lis Selwyn", "stickers": [112, 163, 222, 293]},
    {"tag": "Coleção fã Luisa Landre", "stickers": [164, 219, 229, 301]},
    {"tag": "Coleção fã Raquel Alves", "stickers": [40, 189, 233, 304, 317]},
    {"tag": "Coleção fã Sarah Oliveira", "stickers": [11, 227, 249]},
    {"tag": "Coleção fã Vanessa Freitas", "stickers": [39, 118, 165, 262, 270, 290]},
    {"tag": "Coleção fã Yasmim Mahmud Kader", "stickers": [17, 153, 211, 234]},
    {"tag": "Coleção Destinos Entrelaçados", "stickers": [106, 224, 313]},
    {"tag": "Coleção Bruxas", "stickers": [141, 231]},
    {"tag": "Coleção Sereia", "stickers": [259, 207, 250]},
    {"tag": "Coleção Amores Possíveis", "stickers": [305, 235, 79]},
    {"tag": "Coleção Sáficas de Verão", "stickers": [170, 309, 312]},
    {"tag": "Coleção Sementes", "stickers": [26, 271]},
    {"tag": "Coleção Bright Falls", "stickers": [22, 51, 52]},
    {"tag": "Coleção Opostos Co.", "stickers": [19, 73, 74]},
    {"tag": "Coleção Baldaverso", "stickers": [1, 53, 54, 111, 122, 156, 274, 284, 318]},
    {"tag": "Coleção Frutaverso", "stickers": [5, 59, 60]},
    {"tag": "Coleção HQ", "stickers": [84, 85, 87]}
  ]';
  coll record;
  coll_tag text;
  missing_count integer;
begin
  while granted_in_loop loop
    granted_in_loop := false;

    -- Count total owned stickers
    select count(*) into total_count
    from public.user_stickers us
    where us.user_id = user_id_param and us.copies > 0;

    -- Count distinct stickers between 1 and 193
    select count(distinct sticker_number) into count_1_193
    from public.user_stickers us
    where us.user_id = user_id_param and us.sticker_number between 1 and 193 and us.copies > 0;

    -- 0. Coleção 1 a 193 -> Sticker Extra 361
    if count_1_193 >= 193 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'collection_1_193') then
      insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'collection_1_193');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 361, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1;

      reveals := reveals || jsonb_build_object(
        'slug', 'extra',
        'number', 361,
        'wasNew', true,
        'isRare', false,
        'repeat', false,
        'reward', 'collection_1_193',
        'rewardMessage', 'Parabéns! Você completou as figurinhas de 1 a 193 e desbloqueou uma figurinha extra secreta de agradecimento!'
      );
      granted_in_loop := true;

    -- 1. Total 100 -> Poster Reward
    elsif total_count >= 100 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'poster') then
      insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'poster');
      reveals := reveals || jsonb_build_object(
        'slug', 'poster',
        'number', 0,
        'wasNew', true,
        'isRare', false,
        'repeat', false,
        'reward', 'poster',
        'rewardMessage', 'Parabéns! Você alcançou 100 figurinhas no seu álbum e desbloqueou um pôster exclusivo!'
      );
      granted_in_loop := true;

    -- 2. Coleções Dinâmicas (Famílias)
    else
      for coll in select * from jsonb_array_elements(collections) loop
        coll_tag := coll.value->>'tag';
        
        -- Verifica quantas figurinhas dessa coleção o usuário NÃO possui
        select count(*) into missing_count
        from jsonb_array_elements_text(coll.value->'stickers') as s(st_num)
        where not exists (
          select 1 from public.user_stickers 
          where user_id = user_id_param and sticker_number = (s.st_num)::integer and copies > 0
        );

        if missing_count = 0 and not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = coll_tag) then
          insert into public.completed_tags (user_id, tag_name, claimed) values (user_id_param, coll_tag, false);
          reveals := reveals || jsonb_build_object(
            'slug', 'tag-' || coll_tag,
            'number', 0,
            'wasNew', false,
            'isRare', false,
            'repeat', true,
            'reward', 'tag_' || coll_tag,
            'rewardMessage', 'Parabéns! Você completou a coleção ' || coll_tag || ' e ganhou um Selo Super Fã! Vá na aba Coleções para resgatar seu prêmio.'
          );
          granted_in_loop := true;
          exit; -- exit inner loop to start while loop again since reveals changed
        end if;
      end loop;
    end if;

  end loop;

  return reveals;
end;
$$ language plpgsql;

-- Redefine claim_collection_reward to dynamically verify rigourously and give 1 random sticker
create or replace function public.claim_collection_reward(tag_name_param text)
returns jsonb as $$
declare
  caller_id uuid;
  tag_rec record;
  target_number integer;
  was_new boolean;
  available_pool integer[];
  reveals jsonb := '[]'::jsonb;
  missing_count integer := -1;
  coll record;
  
  -- Mesma definição do check_and_grant_rewards
  collections jsonb := '[
    {"tag": "Coleção fã Zey Shelsea", "stickers": [14, 130, 212, 149, 198, 205, 225]},
    {"tag": "Coleção fã Victoria Mendes", "stickers": [4, 70, 181, 166, 315, 238, 281]},
    {"tag": "Coleção fã V.S. Vilela", "stickers": [115, 264, 237, 9, 68]},
    {"tag": "Coleção fã Mariana Rosa", "stickers": [6, 287, 172, 179, 319, 236]},
    {"tag": "Coleção fã Victoria Moon", "stickers": [251, 256, 15, 80, 177]},
    {"tag": "Coleção fã Tessa Reis", "stickers": [30, 160, 176, 200, 269, 295, 300, 314]},
    {"tag": "Coleção fã Carol Barra", "stickers": [27, 182, 206, 221]},
    {"tag": "Coleção fã D.Barreto", "stickers": [8, 272, 288]},
    {"tag": "Coleção fã Danda Odeleci", "stickers": [123, 199, 246]},
    {"tag": "Coleção fã Elayne Baeta", "stickers": [25, 125, 146]},
    {"tag": "Coleção fã Emely Luiza Curcio", "stickers": [129, 162, 195, 239, 263]},
    {"tag": "Coleção fã Englantine", "stickers": [12, 124, 215, 253, 273]},
    {"tag": "Coleção fã Helena Nolasco", "stickers": [16, 127, 285, 299, 308]},
    {"tag": "Coleção fã Ingrid Paranhos", "stickers": [37, 197, 282]},
    {"tag": "Coleção fã Ju Mesquita", "stickers": [7, 63, 240]},
    {"tag": "Coleção fã Lari Alcantara", "stickers": [42, 254, 303]},
    {"tag": "Coleção fã Carol e Liliane", "stickers": [155, 210, 291]},
    {"tag": "Coleção fã Lis Selwyn", "stickers": [112, 163, 222, 293]},
    {"tag": "Coleção fã Luisa Landre", "stickers": [164, 219, 229, 301]},
    {"tag": "Coleção fã Raquel Alves", "stickers": [40, 189, 233, 304, 317]},
    {"tag": "Coleção fã Sarah Oliveira", "stickers": [11, 227, 249]},
    {"tag": "Coleção fã Vanessa Freitas", "stickers": [39, 118, 165, 262, 270, 290]},
    {"tag": "Coleção fã Yasmim Mahmud Kader", "stickers": [17, 153, 211, 234]},
    {"tag": "Coleção Destinos Entrelaçados", "stickers": [106, 224, 313]},
    {"tag": "Coleção Bruxas", "stickers": [141, 231]},
    {"tag": "Coleção Sereia", "stickers": [259, 207, 250]},
    {"tag": "Coleção Amores Possíveis", "stickers": [305, 235, 79]},
    {"tag": "Coleção Sáficas de Verão", "stickers": [170, 309, 312]},
    {"tag": "Coleção Sementes", "stickers": [26, 271]},
    {"tag": "Coleção Bright Falls", "stickers": [22, 51, 52]},
    {"tag": "Coleção Opostos Co.", "stickers": [19, 73, 74]},
    {"tag": "Coleção Baldaverso", "stickers": [1, 53, 54, 111, 122, 156, 274, 284, 318]},
    {"tag": "Coleção Frutaverso", "stickers": [5, 59, 60]},
    {"tag": "Coleção HQ", "stickers": [84, 85, 87]}
  ]';
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Unauthorized';
  end if;

  select * into tag_rec
  from public.completed_tags
  where user_id = caller_id and tag_name = tag_name_param;

  if not found then
    raise exception 'Você ainda não completou essa coleção.';
  end if;

  if tag_rec.claimed = true then
    raise exception 'Prêmio já resgatado para essa coleção.';
  end if;

  -- Controle Rígido: Verifica se a usuária REALMENTE possui as figurinhas
  -- no momento do resgate, já que coleções antigas podem ter ganho novas figurinhas
  for coll in select * from jsonb_array_elements(collections) loop
    if coll.value->>'tag' = tag_name_param then
      select count(*) into missing_count
      from jsonb_array_elements_text(coll.value->'stickers') as s(st_num)
      where not exists (
        select 1 from public.user_stickers 
        where user_id = caller_id and sticker_number = (s.st_num)::integer and copies > 0
      );
      exit;
    end if;
  end loop;

  if missing_count = -1 then
    raise exception 'Coleção inválida.';
  end if;

  if missing_count > 0 then
    raise exception 'Sua coleção está Incompleta! Colete as novas figurinhas adicionadas para conseguir resgatar.';
  end if;

  -- Update claimed status
  update public.completed_tags
  set claimed = true, claimed_at = now()
  where user_id = caller_id and tag_name = tag_name_param;

  -- Dá 1 figurinha aleatória (21-193) de prêmio extra
  available_pool := public.pack_available_pool(array(select generate_series(21, 193)), array[]::integer[]);
  target_number := public.draw_non_quiz_sticker(caller_id, available_pool);

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (caller_id, target_number, 1, false, now())
  on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', 'extra-1',
    'number', target_number,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new
  );

  return reveals;
end;
$$ language plpgsql security definer;
