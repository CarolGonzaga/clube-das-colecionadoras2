-- ============================================================
-- PATCH MIGRATION: ADD TRADE CLAIMING FLOW
-- Adiciona colunas de controle de resgate e RPC para resgate
-- ============================================================

-- 1. Adicionar colunas na tabela trade_requests
ALTER TABLE public.trade_requests
  ADD COLUMN IF NOT EXISTS initiator_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS receiver_claimed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Atualizar RPC get_outgoing_trades para retornar os campos de resgate
CREATE OR REPLACE FUNCTION public.get_outgoing_trades()
RETURNS JSONB AS $$
DECLARE
  caller_id UUID;
  result    JSONB;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Expire old trades first
  UPDATE public.trade_requests
  SET status = 'expired', resolved_at = now()
  WHERE status = 'pending' AND expires_at < now();

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',                tr.id,
      'receiver_id',       tr.receiver_id,
      'receiver_nick',     p.nick,
      'initiator_sticker', tr.initiator_sticker,
      'receiver_sticker',  tr.receiver_sticker,
      'sticker_category',  tr.sticker_category,
      'status',            tr.status,
      'created_at',        tr.created_at,
      'expires_at',        tr.expires_at,
      'initiator_claimed', tr.initiator_claimed,
      'receiver_claimed',  tr.receiver_claimed,
      'initiator_sticker_name', COALESCE(si.name, 'Figurinha #' || tr.initiator_sticker::text),
      'receiver_sticker_name',  COALESCE(sr.name, 'Figurinha #' || tr.receiver_sticker::text)
    ) ORDER BY tr.created_at DESC
  )
  INTO result
  FROM public.trade_requests tr
  JOIN public.profiles p ON p.id = tr.receiver_id
  LEFT JOIN public.stickers si ON si.number = tr.initiator_sticker
  LEFT JOIN public.stickers sr ON sr.number = tr.receiver_sticker
  WHERE tr.initiator_id = caller_id;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Atualizar RPC get_resolved_trades para retornar os campos de resgate
CREATE OR REPLACE FUNCTION public.get_resolved_trades()
RETURNS JSONB AS $$
DECLARE
  caller_id UUID;
  result    JSONB;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',                 tr.id,
      'initiator_id',       tr.initiator_id,
      'receiver_id',        tr.receiver_id,
      'initiator_nick',     pi.nick,
      'receiver_nick',      pr.nick,
      'initiator_sticker',  tr.initiator_sticker,
      'receiver_sticker',   tr.receiver_sticker,
      'sticker_category',   tr.sticker_category,
      'status',             tr.status,
      'created_at',         tr.created_at,
      'resolved_at',        tr.resolved_at,
      'initiator_claimed',  tr.initiator_claimed,
      'receiver_claimed',   tr.receiver_claimed,
      'initiator_sticker_name', COALESCE(si.name, 'Figurinha #' || tr.initiator_sticker::text),
      'receiver_sticker_name',  COALESCE(sr.name, 'Figurinha #' || tr.receiver_sticker::text)
    ) ORDER BY tr.resolved_at DESC
  )
  INTO result
  FROM public.trade_requests tr
  JOIN public.profiles pi ON pi.id = tr.initiator_id
  JOIN public.profiles pr ON pr.id = tr.receiver_id
  LEFT JOIN public.stickers si ON si.number = tr.initiator_sticker
  LEFT JOIN public.stickers sr ON sr.number = tr.receiver_sticker
  WHERE (tr.initiator_id = caller_id OR tr.receiver_id = caller_id)
    AND tr.status <> 'pending';

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Criar RPC claim_trade_reward para efetivar o resgate visual
CREATE OR REPLACE FUNCTION public.claim_trade_reward(trade_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  caller_id   UUID;
  trade_row   RECORD;
  sticker_val INT;
  is_rare_val BOOLEAN;
  sticker_name_val TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO trade_row
  FROM public.trade_requests
  WHERE id = trade_id_param
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Troca não encontrada.';
  END IF;

  IF trade_row.status <> 'accepted' THEN
    RAISE EXCEPTION 'Apenas trocas concluídas podem ser resgatadas.';
  END IF;

  IF trade_row.initiator_id = caller_id THEN
    IF trade_row.initiator_claimed THEN
      RAISE EXCEPTION 'Você já resgatou esta figurinha.';
    END IF;
    
    UPDATE public.trade_requests
    SET initiator_claimed = TRUE
    WHERE id = trade_id_param;

    sticker_val := trade_row.receiver_sticker;
  ELSIF trade_row.receiver_id = caller_id THEN
    IF trade_row.receiver_claimed THEN
      RAISE EXCEPTION 'Você já resgatou esta figurinha.';
    END IF;

    UPDATE public.trade_requests
    SET receiver_claimed = TRUE
    WHERE id = trade_id_param;

    sticker_val := trade_row.initiator_sticker;
  ELSE
    RAISE EXCEPTION 'Você não faz parte desta troca.';
  END IF;

  -- Obter os detalhes da figurinha para a animação
  SELECT s.name, COALESCE(us.is_rare, false) INTO sticker_name_val, is_rare_val
  FROM public.stickers s
  LEFT JOIN public.user_stickers us ON us.sticker_number = s.number AND us.user_id = caller_id
  WHERE s.number = sticker_val;

  RETURN jsonb_build_object(
    'success', true,
    'sticker_number', sticker_val,
    'sticker_name', COALESCE(sticker_name_val, 'Figurinha #' || sticker_val::text),
    'is_rare', COALESCE(is_rare_val, false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
