-- ============================================================
-- MIGRATION: COUPONS SYSTEM
-- Tabela de cupons, campos na purchase_orders e RPC de validação
-- ============================================================

-- 1. Tabela de Cupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilita RLS na tabela de cupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para cupons ativos (ou via RPC)
CREATE POLICY "Leitura de cupons ativos"
  ON public.coupons
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- 2. Novas colunas em purchase_orders para registro do cupom
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coupon_discount_cents INTEGER NOT NULL DEFAULT 0;

-- 3. Função RPC para validação de cupom
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_clean_code TEXT;
BEGIN
  v_clean_code := upper(trim(coalesce(coupon_code_param, '')));

  IF v_clean_code = '' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Por favor, informe o código do cupom.'
    );
  END IF;

  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE upper(code) = v_clean_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Cupom inválido ou inexistente.'
    );
  END IF;

  IF NOT v_coupon.is_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Este cupom não está mais ativo.'
    );
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Este cupom já expirou.'
    );
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Este cupom atingiu o limite máximo de utilizações.'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'discount_percent', v_coupon.discount_percent,
    'discount_cents', v_coupon.discount_cents,
    'message', 'Cupom aplicado com sucesso!'
  );
END;
$$;

-- Permite chamada por usuários autenticados e anônimos
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT) TO authenticated, anon;

-- 4. Inserção do cupom de teste LENDOSAFICOS10 (10% de desconto)
INSERT INTO public.coupons (code, discount_percent, is_active)
VALUES ('LENDOSAFICOS10', 10, true)
ON CONFLICT (code) 
DO UPDATE SET 
  discount_percent = 10,
  is_active = true;
