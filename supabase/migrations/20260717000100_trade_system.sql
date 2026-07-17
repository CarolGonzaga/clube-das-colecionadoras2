-- ============================================================
-- MIGRATION: TRADE SYSTEM
-- Trocas entre usuárias, troca por pontos e carteira virtual
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. NICK FORMAT CONSTRAINT
--    Nicks devem ser apenas letras minúsculas e números (sem
--    espaços ou caracteres especiais) — usado como identificador
--    de troca entre usuárias.
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_nick_format'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_nick_format
        CHECK (nick ~ '^[a-z0-9]+$');
  END IF;
END $$;

-- Unique index on nick (case-insensitive guard — nick is already lowercase)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nick_unique ON public.profiles (lower(nick));

-- ────────────────────────────────────────────────────────────
-- 2. USER POINTS (carteira virtual)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance   INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.user_points TO authenticated;
GRANT ALL ON public.user_points TO service_role;

CREATE POLICY "Users read own points"
  ON public.user_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own points"
  ON public.user_points FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 3. POINT TRANSACTIONS (histórico de movimentações)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL,          -- positivo = ganho, negativo = gasto
  reason         TEXT NOT NULL,             -- 'trade_sell' | 'trade_buy'
  sticker_number INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.point_transactions TO authenticated;
GRANT ALL ON public.point_transactions TO service_role;

CREATE POLICY "Users read own transactions"
  ON public.point_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. TRADE REQUESTS (solicitações de troca)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initiator_sticker   INTEGER NOT NULL,  -- figurinha que o iniciador oferece
  receiver_sticker    INTEGER NOT NULL,  -- figurinha que o iniciador deseja
  sticker_category    TEXT NOT NULL      CHECK (sticker_category IN ('free', 'shop')),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected','cancelled','expired')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '48 hours',
  resolved_at         TIMESTAMPTZ,

  CONSTRAINT different_users CHECK (initiator_id <> receiver_id),
  CONSTRAINT different_stickers CHECK (initiator_sticker <> receiver_sticker)
);

CREATE INDEX IF NOT EXISTS trade_requests_receiver_pending
  ON public.trade_requests (receiver_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS trade_requests_initiator
  ON public.trade_requests (initiator_id, created_at DESC);

ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.trade_requests TO authenticated;
GRANT ALL ON public.trade_requests TO service_role;

-- Initiator and receiver can read their own trade requests
CREATE POLICY "Users see own trade requests"
  ON public.trade_requests FOR SELECT TO authenticated
  USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);

-- Only initiator can create
CREATE POLICY "Initiator creates trade"
  ON public.trade_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = initiator_id);

-- Updates happen only through RPCs (security definer)
CREATE POLICY "No direct update on trades"
  ON public.trade_requests FOR UPDATE TO authenticated
  USING (false);

-- ────────────────────────────────────────────────────────────
-- 5. HELPER: ensure user_points row exists
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_user_points(uid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_points (user_id, balance)
  VALUES (uid, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 6. RPC: lookup_user_by_nick
--    Busca usuária pelo nick e retorna suas figurinhas repetidas
--    elegíveis por categoria.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lookup_user_by_nick(nick_param TEXT)
RETURNS JSONB AS $$
DECLARE
  target_profile RECORD;
  free_dupes     JSONB;
  shop_dupes     JSONB;
BEGIN
  -- Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Cannot look up yourself
  SELECT p.id, p.nick, p.avatar_emoji, p.avatar_url
  INTO target_profile
  FROM public.profiles p
  WHERE lower(p.nick) = lower(trim(nick_param))
    AND p.id <> auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuária não encontrada. Verifique o nome de usuário.';
  END IF;

  -- Free duplicates: stickers 1-200 with copies > 1
  SELECT jsonb_agg(
    jsonb_build_object(
      'sticker_number', us.sticker_number,
      'copies', us.copies,
      'name', COALESCE(s.name, '#' || us.sticker_number::text)
    ) ORDER BY us.sticker_number
  )
  INTO free_dupes
  FROM public.user_stickers us
  LEFT JOIN public.stickers s ON s.number = us.sticker_number
  WHERE us.user_id = target_profile.id
    AND us.sticker_number BETWEEN 1 AND 200
    AND us.copies > 1;

  -- Shop duplicates: stickers 201-360 with copies > 1
  SELECT jsonb_agg(
    jsonb_build_object(
      'sticker_number', us.sticker_number,
      'copies', us.copies,
      'name', COALESCE(s.name, 'Figurinha #' || us.sticker_number::text)
    ) ORDER BY us.sticker_number
  )
  INTO shop_dupes
  FROM public.user_stickers us
  LEFT JOIN public.stickers s ON s.number = us.sticker_number
  WHERE us.user_id = target_profile.id
    AND us.sticker_number BETWEEN 201 AND 360
    AND us.copies > 1;

  RETURN jsonb_build_object(
    'user_id',      target_profile.id,
    'nick',         target_profile.nick,
    'avatar_emoji', target_profile.avatar_emoji,
    'avatar_url',   target_profile.avatar_url,
    'free_dupes',   COALESCE(free_dupes, '[]'::jsonb),
    'shop_dupes',   COALESCE(shop_dupes, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 7. RPC: create_trade_request
--    Cria uma solicitação de troca após validar todos os requisitos.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_trade_request(
  receiver_nick_param   TEXT,
  my_sticker_param      INTEGER,
  desired_sticker_param INTEGER,
  category_param        TEXT   -- 'free' | 'shop'
)
RETURNS JSONB AS $$
DECLARE
  caller_id        UUID;
  receiver_id_val  UUID;
  caller_copies    INTEGER;
  receiver_copies  INTEGER;
  open_count       INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate category
  IF category_param NOT IN ('free', 'shop') THEN
    RAISE EXCEPTION 'Categoria inválida.';
  END IF;

  -- Validate sticker ranges match category
  IF category_param = 'free' THEN
    IF my_sticker_param NOT BETWEEN 1 AND 200
       OR desired_sticker_param NOT BETWEEN 1 AND 200 THEN
      RAISE EXCEPTION 'Figurinhas gratuitas devem ser entre 1 e 200.';
    END IF;
  ELSE
    IF my_sticker_param NOT BETWEEN 201 AND 360
       OR desired_sticker_param NOT BETWEEN 201 AND 360 THEN
      RAISE EXCEPTION 'Figurinhas de loja devem ser entre 201 e 360.';
    END IF;
  END IF;

  IF my_sticker_param = desired_sticker_param THEN
    RAISE EXCEPTION 'Você não pode trocar uma figurinha pela mesma.';
  END IF;

  -- Find receiver
  SELECT id INTO receiver_id_val
  FROM public.profiles
  WHERE lower(nick) = lower(trim(receiver_nick_param))
    AND id <> caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuária não encontrada.';
  END IF;

  -- Check caller has that sticker as duplicate (copies > 1)
  SELECT copies INTO caller_copies
  FROM public.user_stickers
  WHERE user_id = caller_id AND sticker_number = my_sticker_param;

  IF caller_copies IS NULL OR caller_copies < 2 THEN
    RAISE EXCEPTION 'Você não tem essa figurinha como repetida.';
  END IF;

  -- Check receiver has desired sticker as duplicate (copies > 1)
  SELECT copies INTO receiver_copies
  FROM public.user_stickers
  WHERE user_id = receiver_id_val AND sticker_number = desired_sticker_param;

  IF receiver_copies IS NULL OR receiver_copies < 2 THEN
    RAISE EXCEPTION 'A outra usuária não tem essa figurinha como repetida.';
  END IF;

  -- Limit open trades per initiator (max 5 pending at a time)
  SELECT COUNT(*) INTO open_count
  FROM public.trade_requests
  WHERE initiator_id = caller_id AND status = 'pending';

  IF open_count >= 5 THEN
    RAISE EXCEPTION 'Você já tem 5 trocas pendentes. Aguarde a resposta ou cancele uma.';
  END IF;

  -- Insert the trade request
  INSERT INTO public.trade_requests (
    initiator_id, receiver_id,
    initiator_sticker, receiver_sticker,
    sticker_category
  ) VALUES (
    caller_id, receiver_id_val,
    my_sticker_param, desired_sticker_param,
    category_param
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 8. RPC: respond_to_trade
--    O receiver aceita ou recusa. Se aceitar, a troca ocorre
--    atomicamente: ambas perdem 1 cópia e ganham 1 cópia.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.respond_to_trade(
  trade_id_param UUID,
  accept_param   BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  caller_id        UUID;
  trade_row        RECORD;
  initiator_copies INTEGER;
  receiver_copies  INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the trade row to prevent race conditions
  SELECT * INTO trade_row
  FROM public.trade_requests
  WHERE id = trade_id_param
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação de troca não encontrada.';
  END IF;

  IF trade_row.receiver_id <> caller_id THEN
    RAISE EXCEPTION 'Você não tem permissão para responder a esta troca.';
  END IF;

  IF trade_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Esta troca não está mais pendente (%).', trade_row.status;
  END IF;

  IF trade_row.expires_at < now() THEN
    UPDATE public.trade_requests
    SET status = 'expired', resolved_at = now()
    WHERE id = trade_id_param;
    RAISE EXCEPTION 'Esta solicitação de troca expirou.';
  END IF;

  IF NOT accept_param THEN
    UPDATE public.trade_requests
    SET status = 'rejected', resolved_at = now()
    WHERE id = trade_id_param;
    RETURN jsonb_build_object('success', true, 'accepted', false);
  END IF;

  -- ── ACCEPT: validate copies still available ──

  -- Re-check initiator still has duplicate
  SELECT copies INTO initiator_copies
  FROM public.user_stickers
  WHERE user_id = trade_row.initiator_id
    AND sticker_number = trade_row.initiator_sticker
  FOR UPDATE;

  IF initiator_copies IS NULL OR initiator_copies < 2 THEN
    RAISE EXCEPTION 'A outra usuária não tem mais esta figurinha como repetida.';
  END IF;

  -- Re-check receiver (you) still has duplicate
  SELECT copies INTO receiver_copies
  FROM public.user_stickers
  WHERE user_id = trade_row.receiver_id
    AND sticker_number = trade_row.receiver_sticker
  FOR UPDATE;

  IF receiver_copies IS NULL OR receiver_copies < 2 THEN
    RAISE EXCEPTION 'Você não tem mais esta figurinha como repetida.';
  END IF;

  -- ── ATOMIC SWAP ──

  -- Initiator loses one copy of their offered sticker
  UPDATE public.user_stickers
  SET copies = copies - 1
  WHERE user_id = trade_row.initiator_id
    AND sticker_number = trade_row.initiator_sticker;

  -- Initiator gains one copy of the desired sticker
  INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  VALUES (trade_row.initiator_id, trade_row.receiver_sticker, 1, false, now())
  ON CONFLICT (user_id, sticker_number)
  DO UPDATE SET copies = public.user_stickers.copies + 1;

  -- Receiver (caller) loses one copy of their offered sticker
  UPDATE public.user_stickers
  SET copies = copies - 1
  WHERE user_id = trade_row.receiver_id
    AND sticker_number = trade_row.receiver_sticker;

  -- Receiver gains one copy of the initiator's sticker
  INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  VALUES (trade_row.receiver_id, trade_row.initiator_sticker, 1, false, now())
  ON CONFLICT (user_id, sticker_number)
  DO UPDATE SET copies = public.user_stickers.copies + 1;

  -- Mark trade as accepted
  UPDATE public.trade_requests
  SET status = 'accepted', resolved_at = now()
  WHERE id = trade_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'accepted', true,
    'received_sticker', trade_row.initiator_sticker
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 9. RPC: cancel_trade
--    Apenas o iniciador pode cancelar uma troca pendente.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_trade(trade_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  caller_id UUID;
  trade_row RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO trade_row
  FROM public.trade_requests
  WHERE id = trade_id_param FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada.';
  END IF;

  IF trade_row.initiator_id <> caller_id THEN
    RAISE EXCEPTION 'Apenas quem criou a troca pode cancelá-la.';
  END IF;

  IF trade_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Esta troca não está mais pendente.';
  END IF;

  UPDATE public.trade_requests
  SET status = 'cancelled', resolved_at = now()
  WHERE id = trade_id_param;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 10. RPC: exchange_for_points
--     Troca uma figurinha de loja repetida (201-360) por 45 pontos.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.exchange_for_points(sticker_number_param INTEGER)
RETURNS JSONB AS $$
DECLARE
  caller_id UUID;
  current_copies INTEGER;
  new_balance INTEGER;
  POINTS_PER_STICKER CONSTANT INTEGER := 45;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF sticker_number_param NOT BETWEEN 201 AND 360 THEN
    RAISE EXCEPTION 'Apenas figurinhas de loja (201-360) podem ser trocadas por pontos.';
  END IF;

  -- Lock and check copies
  SELECT copies INTO current_copies
  FROM public.user_stickers
  WHERE user_id = caller_id AND sticker_number = sticker_number_param
  FOR UPDATE;

  IF current_copies IS NULL OR current_copies < 2 THEN
    RAISE EXCEPTION 'Você não tem esta figurinha como repetida.';
  END IF;

  -- Deduct one copy
  UPDATE public.user_stickers
  SET copies = copies - 1
  WHERE user_id = caller_id AND sticker_number = sticker_number_param;

  -- Ensure points row exists and add points
  PERFORM public.ensure_user_points(caller_id);

  UPDATE public.user_points
  SET balance = balance + POINTS_PER_STICKER, updated_at = now()
  WHERE user_id = caller_id
  RETURNING balance INTO new_balance;

  -- Record transaction
  INSERT INTO public.point_transactions (user_id, amount, reason, sticker_number)
  VALUES (caller_id, POINTS_PER_STICKER, 'trade_sell', sticker_number_param);

  RETURN jsonb_build_object(
    'success', true,
    'points_earned', POINTS_PER_STICKER,
    'new_balance', new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 11. RPC: get_incoming_trades
--     Retorna trocas pendentes recebidas com detalhes enriquecidos.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_incoming_trades()
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
      'id',                 tr.id,
      'initiator_id',       tr.initiator_id,
      'initiator_nick',     p.nick,
      'initiator_avatar_emoji', p.avatar_emoji,
      'initiator_avatar_url',   p.avatar_url,
      'initiator_sticker',  tr.initiator_sticker,
      'receiver_sticker',   tr.receiver_sticker,
      'sticker_category',   tr.sticker_category,
      'status',             tr.status,
      'created_at',         tr.created_at,
      'expires_at',         tr.expires_at,
      'initiator_sticker_name', COALESCE(si.name, 'Figurinha #' || tr.initiator_sticker::text),
      'receiver_sticker_name',  COALESCE(sr.name, 'Figurinha #' || tr.receiver_sticker::text)
    ) ORDER BY tr.created_at DESC
  )
  INTO result
  FROM public.trade_requests tr
  JOIN public.profiles p ON p.id = tr.initiator_id
  LEFT JOIN public.stickers si ON si.number = tr.initiator_sticker
  LEFT JOIN public.stickers sr ON sr.number = tr.receiver_sticker
  WHERE tr.receiver_id = caller_id
    AND tr.status = 'pending';

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 12. RPC: get_outgoing_trades
--     Retorna trocas enviadas (todas as que o usuário iniciou).
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- 13. RPC: get_points_balance
--     Retorna o saldo de pontos do usuário.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_points_balance()
RETURNS INTEGER AS $$
DECLARE
  caller_id UUID;
  bal INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM public.ensure_user_points(caller_id);

  SELECT balance INTO bal FROM public.user_points WHERE user_id = caller_id;
  RETURN COALESCE(bal, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 14. RPC: count_incoming_pending_trades
--     Contagem rápida para badge na navegação.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.count_incoming_pending_trades()
RETURNS INTEGER AS $$
DECLARE
  caller_id UUID;
  cnt INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RETURN 0; END IF;

  SELECT COUNT(*) INTO cnt
  FROM public.trade_requests
  WHERE receiver_id = caller_id
    AND status = 'pending'
    AND expires_at > now();

  RETURN COALESCE(cnt, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 15. RPC: validate_and_update_nick
--     Valida e atualiza o nick do usuário (lowercase, letras+números,
--     único). Usado no fluxo de primeiro acesso pós-migração.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_and_update_nick(new_nick_param TEXT)
RETURNS JSONB AS $$
DECLARE
  caller_id  UUID;
  clean_nick TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  clean_nick := lower(trim(new_nick_param));

  -- Format validation
  IF clean_nick !~ '^[a-z0-9]+$' THEN
    RAISE EXCEPTION 'Nome de usuário inválido. Use apenas letras minúsculas e números, sem espaços.';
  END IF;

  IF length(clean_nick) < 3 THEN
    RAISE EXCEPTION 'Nome de usuário deve ter pelo menos 3 caracteres.';
  END IF;

  IF length(clean_nick) > 24 THEN
    RAISE EXCEPTION 'Nome de usuário deve ter no máximo 24 caracteres.';
  END IF;

  -- Uniqueness check
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(nick) = clean_nick AND id <> caller_id
  ) THEN
    RAISE EXCEPTION 'Este nome de usuário já está em uso. Escolha outro.';
  END IF;

  UPDATE public.profiles
  SET nick = clean_nick
  WHERE id = caller_id;

  RETURN jsonb_build_object('success', true, 'nick', clean_nick);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
