
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.sticker_kind AS ENUM ('quiz', 'capa', 'ls', 'frase');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  show_in_mural BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Stickers catalog (60 total)
CREATE TABLE public.stickers (
  id INT PRIMARY KEY,
  kind sticker_kind NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  image_url TEXT,
  amazon_url TEXT,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stickers TO anon, authenticated;
GRANT ALL ON public.stickers TO service_role;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stickers are public"
  ON public.stickers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage stickers"
  ON public.stickers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User stickers (collection)
CREATE TABLE public.user_stickers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sticker_id INT NOT NULL REFERENCES public.stickers(id) ON DELETE CASCADE,
  count INT NOT NULL DEFAULT 1,
  is_autographed BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sticker_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stickers TO authenticated;
GRANT ALL ON public.user_stickers TO service_role;
ALTER TABLE public.user_stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read mural collections"
  ON public.user_stickers FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_stickers.user_id AND p.show_in_mural = true)
  );
CREATE POLICY "Users manage own stickers"
  ON public.user_stickers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, show_in_mural)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'show_in_mural')::boolean, true)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed the 60 stickers (placeholders)
DO $$
DECLARE i INT;
BEGIN
  -- 20 quiz stickers (positions 1-20)
  FOR i IN 1..20 LOOP
    INSERT INTO public.stickers (id, kind, title, author, position)
    VALUES (i, 'quiz', 'Livro do Quiz #' || i, 'Autora ' || i, i);
  END LOOP;
  -- 30 capas sortidas (positions 21-50)
  FOR i IN 1..30 LOOP
    INSERT INTO public.stickers (id, kind, title, author, position)
    VALUES (20 + i, 'capa', 'Capa Sortida #' || i, 'Autora ' || (20 + i), 20 + i);
  END LOOP;
  -- 5 LS (positions 51-55)
  FOR i IN 1..5 LOOP
    INSERT INTO public.stickers (id, kind, title, position)
    VALUES (50 + i, 'ls', 'Lendo Sáficos #' || i, 50 + i);
  END LOOP;
  -- 5 frases (positions 56-60)
  FOR i IN 1..5 LOOP
    INSERT INTO public.stickers (id, kind, title, position)
    VALUES (55 + i, 'frase', 'Frase Sáfica #' || i, 55 + i);
  END LOOP;
END $$;
