-- ============================================================
-- PATCH MIGRATION: FIX & EXPAND TRADE SYSTEM FUNCTIONS
-- 1. Remove a cláusula ORDER BY inválida de get_outgoing_trades
-- 2. Adiciona o RPC get_resolved_trades para histórico de trocas
-- ============================================================

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
