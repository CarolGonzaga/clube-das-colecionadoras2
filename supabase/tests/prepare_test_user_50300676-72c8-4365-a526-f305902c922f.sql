-- Script manual de teste — NÃO é migration de produção.
-- Conta: 50300676-72c8-4365-a526-f305902c922f
--
-- Efeito:
--   1. Reinicia somente o progresso do quiz das 20 figurinhas do quiz;
--   2. Exibe as 20 perguntas ao mesmo tempo e permite responder todas hoje;
--   3. Desbloqueia os cinco estilos da recompensa diária para testar a UI.

begin;

-- Reinicia a trilha de raridade do quiz quando a migration de balanceamento
-- já estiver instalada.
do $$
begin
  if to_regclass('public.quiz_reward_rarities') is not null then
    delete from public.quiz_reward_rarities
    where user_id = '50300676-72c8-4365-a526-f305902c922f';
  end if;
end;
$$;

delete from public.quiz_answers
where user_id = '50300676-72c8-4365-a526-f305902c922f';

-- As figurinhas 1–20 pertencem exclusivamente ao quiz.
delete from public.user_stickers
where user_id = '50300676-72c8-4365-a526-f305902c922f'
  and sticker_number between 1 and 20;

delete from public.reward_grants
where user_id = '50300676-72c8-4365-a526-f305902c922f'
  and reward_key like 'quiz%';

insert into public.quiz_attempts (
  user_id,
  ultimo_dia_acesso,
  tentativas_hoje_count,
  dia_atual,
  perguntas_pendentes
)
values (
  '50300676-72c8-4365-a526-f305902c922f',
  to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
  -16, -- o limite de 4 permitirá exatamente 20 respostas nesta sessão
  1,
  array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
)
on conflict (user_id) do update set
  ultimo_dia_acesso = excluded.ultimo_dia_acesso,
  tentativas_hoje_count = excluded.tentativas_hoje_count,
  dia_atual = excluded.dia_atual,
  perguntas_pendentes = excluded.perguntas_pendentes;

-- Libera os cinco elementos diários sem ativá-los automaticamente.
insert into public.user_styles (user_id, style_id, unlocked, enabled)
values
  ('50300676-72c8-4365-a526-f305902c922f', 'lilac', true, false),
  ('50300676-72c8-4365-a526-f305902c922f', 'avatar-neon-frame', true, false),
  ('50300676-72c8-4365-a526-f305902c922f', 'new-icon', true, false),
  ('50300676-72c8-4365-a526-f305902c922f', 'theme-dark', true, false),
  ('50300676-72c8-4365-a526-f305902c922f', 'glitter', true, false)
on conflict (user_id, style_id) do update set
  unlocked = true,
  enabled = false;

commit;
