-- ============================================================
-- PATCH MIGRATION: FIX CLONED USERS
-- Repara usuárias clonadas que não aparecem na UI do Supabase
-- e não conseguem logar. Adiciona as identidades e confirma emails.
-- ============================================================

DO $$
DECLARE
  v_user record;
BEGIN
  -- 1. Confirma o email de todas as usuárias que ainda não estão confirmadas
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE email_confirmed_at IS NULL;

  -- 2. Garante que os metadados do app estão corretos
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider": "email", "providers": ["email"]}'::jsonb
  WHERE raw_app_meta_data IS NULL OR NOT (raw_app_meta_data ? 'provider');

  -- 3. Insere a identidade de email para as usuárias que não têm na tabela auth.identities
  FOR v_user IN
    SELECT id, email, created_at, updated_at
    FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.identities WHERE user_id = auth.users.id AND provider = 'email'
    )
  LOOP
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user.id,
      jsonb_build_object('sub', v_user.id, 'email', v_user.email, 'email_verified', true),
      'email',
      v_user.id::text,
      v_user.created_at,
      v_user.created_at,
      v_user.updated_at
    );
  END LOOP;
END $$;
