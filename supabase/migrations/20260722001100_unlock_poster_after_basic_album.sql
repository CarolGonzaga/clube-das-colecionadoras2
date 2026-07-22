-- O Gerador de Pôster passa a ser concedido somente quando todas as
-- figurinhas do Álbum Básico (1 a 193) estiverem coladas.
-- Grants ja existentes sao preservados para nao retirar uma recompensa
-- anteriormente liberada.
DO $migration$
DECLARE
  function_definition text;
  updated_definition text;
BEGIN
  SELECT pg_get_functiondef('public.check_and_grant_rewards(uuid)'::regprocedure)
    INTO function_definition;

  IF function_definition !~ 'count\(\*\).*user_stickers.*copies > 0\) >= 100' THEN
    RAISE EXCEPTION
      'Unexpected check_and_grant_rewards definition; basic album patch cancelled without changes.';
  END IF;

  updated_definition := regexp_replace(
    function_definition,
    'ELSIF \(SELECT count\(\*\) FROM public\.user_stickers WHERE user_id = user_id_param AND copies > 0\) >= 100[[:space:]]+AND NOT EXISTS \(SELECT 1 FROM public\.reward_grants WHERE user_id = user_id_param AND reward_key = ''poster''\) THEN',
    'ELSIF (SELECT count(DISTINCT sticker_number) FROM public.user_stickers WHERE user_id = user_id_param AND sticker_number BETWEEN 1 AND 193 AND copies > 0) = 193
      AND NOT EXISTS (SELECT 1 FROM public.reward_grants WHERE user_id = user_id_param AND reward_key = ''poster'') THEN'
  );

  updated_definition := regexp_replace(
    updated_definition,
    '''rewardMessage'', ''Parab[^'']*100 figurinhas[^'']*Gerador de P[^'']*!''',
    '''rewardMessage'', ''Parabéns! Você completou o Álbum Básico, com todas as figurinhas de 1 a 193, e desbloqueou o Gerador de Pôster!'''
  );

  IF updated_definition = function_definition
     OR updated_definition !~ 'sticker_number BETWEEN 1 AND 193 AND copies > 0\) = 193' THEN
    RAISE EXCEPTION
      'The basic album rule was not changed; migration cancelled without changes.';
  END IF;

  EXECUTE updated_definition;

  COMMENT ON FUNCTION public.check_and_grant_rewards(uuid) IS
    'Concede recompensas; o pôster exige todas as figurinhas distintas de 1 a 193.';
END
$migration$;

GRANT EXECUTE ON FUNCTION public.check_and_grant_rewards(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
