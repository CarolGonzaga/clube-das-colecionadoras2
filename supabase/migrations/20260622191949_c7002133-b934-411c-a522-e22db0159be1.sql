
CREATE TABLE public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  sticker_id integer not null references public.stickers(id) on delete cascade,
  position integer not null default 1,
  prompt text not null,
  accepted_answers text[] not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quiz questions readable by authenticated" ON public.quiz_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage quiz questions" ON public.quiz_questions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed: 2 perguntas genéricas para cada figurinha quiz (posições 1..20)
INSERT INTO public.quiz_questions (sticker_id, position, prompt, accepted_answers)
SELECT s.id, 1,
  'Pergunta 1 sobre a obra #' || s.position || ': qual é a palavra-chave deste livro?',
  ARRAY['surto','sáfico']
FROM public.stickers s WHERE s.kind = 'quiz';

INSERT INTO public.quiz_questions (sticker_id, position, prompt, accepted_answers)
SELECT s.id, 2,
  'Pergunta 2 sobre a obra #' || s.position || ': complete a frase — "amor é ___"',
  ARRAY['liberdade','livre']
FROM public.stickers s WHERE s.kind = 'quiz';
