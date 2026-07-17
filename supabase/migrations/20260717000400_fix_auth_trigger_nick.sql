-- ============================================================
-- PATCH MIGRATION: FIX AUTH TRIGGER DEFAULT NICK
-- Corrige a função handle_new_user() para gerar apelidos
-- compatíveis com a restrição profiles_nick_format (apenas
-- letras minúsculas e números) e únicos.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  clean_nick TEXT;
BEGIN
  -- Limpa o nick recebido para conter apenas letras minúsculas e números
  clean_nick := regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'nick', '')), '[^a-z0-9]', '', 'g');
  
  -- Se o nick resultante for vazio (como na criação manual via painel),
  -- usa um nick único gerado a partir do UUID da usuária
  IF clean_nick = '' THEN
    clean_nick := 'user' || lower(substring(new.id::text, 1, 8));
  END IF;

  INSERT INTO public.profiles (id, nick, avatar_emoji, mural_opt_in)
  VALUES (
    new.id,
    clean_nick,
    '📷',
    coalesce((new.raw_user_meta_data ->> 'mural_opt_in')::boolean, false)
  );

  INSERT INTO public.user_styles (user_id, style_id, unlocked, enabled) VALUES
    (new.id, 'lilac', false, false),
    (new.id, 'avatar-neon-frame', false, false),
    (new.id, 'new-icon', false, false),
    (new.id, 'theme-dark', false, false),
    (new.id, 'glitter', false, false),
    (new.id, 'story-layout', false, false),
    (new.id, 'goldframe', false, false);
    
  RETURN new;
END;
$$;
