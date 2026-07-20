-- ============================================================
-- MIGRATION: ALBUM COMPLETION REWARD & MURAL FIX (360 STICKERS)
-- Atualização do Mural para 360 figurinhas e RPC de recompensa 100%
-- ============================================================

-- 1. Atualizar RPC do Mural com o total real de 360 figurinhas
CREATE OR REPLACE FUNCTION public.get_public_mural()
RETURNS TABLE(id uuid, nick text, avatar text, count bigint, pct integer, quiz_correct bigint, rare_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH mural_data AS (
    SELECT 
      p.id, 
      p.nick, 
      coalesce(p.avatar_url, p.avatar_emoji) AS avatar,
      count(distinct us.sticker_number) FILTER (WHERE us.copies > 0) AS count,
      round((count(distinct us.sticker_number) FILTER (WHERE us.copies > 0) * 100.0) / 360)::integer AS pct,
      coalesce((SELECT count(*) FROM public.quiz_answers qa WHERE qa.user_id = p.id AND qa.correct = true), 0) AS quiz_correct,
      count(distinct us.sticker_number) FILTER (WHERE us.copies > 0 AND us.is_rare) AS rare_count,
      p.created_at
    FROM public.profiles p 
    LEFT JOIN public.user_stickers us ON us.user_id = p.id
    WHERE p.mural_opt_in 
    GROUP BY p.id, p.nick, p.avatar_url, p.avatar_emoji, p.created_at
  )
  SELECT id, nick, avatar, count, pct, quiz_correct, rare_count
  FROM mural_data
  ORDER BY pct DESC, count DESC, rare_count DESC, quiz_correct DESC, created_at ASC 
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_mural() TO anon, authenticated;

-- 2. Tabela de resgates de recompensa de 100% do álbum
CREATE TABLE IF NOT EXISTS public.album_completion_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.album_completion_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprio resgate de álbum completo"
  ON public.album_completion_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. RPC para verificar status e resgatar a recompensa de 100% do álbum (todas as 30 raras)
CREATE OR REPLACE FUNCTION public.claim_album_completion_reward()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_distinct_count INTEGER;
  v_already_claimed BOOLEAN;
  v_rare_numbers INTEGER[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,45,47,79,112,164,167,194,258,292,298];
  v_num INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  -- 1. Verificar contagem de figurinhas distintas
  SELECT count(distinct sticker_number) INTO v_distinct_count
  FROM public.user_stickers
  WHERE user_id = v_uid AND copies > 0;

  IF coalesce(v_distinct_count, 0) < 360 THEN
    RAISE EXCEPTION 'É necessário possuir 100%% das 360 figurinhas do álbum para resgatar a recompensa de Raras.';
  END IF;

  -- 2. Verificar se já foi resgatado
  SELECT EXISTS(
    SELECT 1 FROM public.album_completion_rewards WHERE user_id = v_uid
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RAISE EXCEPTION 'A recompensa de 100%% do álbum já foi resgatada anteriormente.';
  END IF;

  -- 3. Converter todas as 30 figurinhas elegíveis para a versão Rara no álbum
  FOREACH v_num IN ARRAY v_rare_numbers LOOP
    IF EXISTS(SELECT 1 FROM public.user_stickers WHERE user_id = v_uid AND sticker_number = v_num) THEN
      UPDATE public.user_stickers
      SET is_rare = true
      WHERE user_id = v_uid AND sticker_number = v_num;
    ELSE
      INSERT INTO public.user_stickers(user_id, sticker_number, copies, is_rare)
      VALUES(v_uid, v_num, 1, true);
    END IF;
  END LOOP;

  -- 4. Registrar o resgate
  INSERT INTO public.album_completion_rewards(user_id)
  VALUES(v_uid);

  RETURN jsonb_build_object(
    'claimed', true,
    'message', 'Recompensa de 100% do álbum resgatada com sucesso! Todas as Raras foram coladas em seu álbum.',
    'rare_numbers', to_jsonb(v_rare_numbers)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_album_completion_reward() TO authenticated;
