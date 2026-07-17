-- Add avatar fields to trade RPC functions

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
      'receiver_avatar_emoji', p.avatar_emoji,
      'receiver_avatar_url',   p.avatar_url,
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
      'initiator_avatar_emoji', pi.avatar_emoji,
      'initiator_avatar_url',   pi.avatar_url,
      'receiver_nick',      pr.nick,
      'receiver_avatar_emoji', pr.avatar_emoji,
      'receiver_avatar_url',   pr.avatar_url,
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

grant execute on function public.get_outgoing_trades() to authenticated;
grant execute on function public.get_resolved_trades() to authenticated;
