-- Quiz V1 flow for the clean V2 Supabase project.
-- Run this in Supabase SQL Editor after bootstrap_empty_v2_project.sql.

create table if not exists public.quiz_questions (
  sticker_number integer not null,
  q_index integer not null,
  text text not null,
  options text[] not null,
  correct_index integer not null,
  primary key (sticker_number, q_index)
);

create table if not exists public.quiz_question_timers (
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_number integer not null,
  q_index integer not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (user_id, sticker_number, q_index)
);

create table if not exists public.quiz_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ultimo_dia_acesso text not null,
  tentativas_hoje_count integer not null default 0,
  dia_atual integer not null default 1,
  perguntas_pendentes integer[] not null default '{}'::integer[]
);

alter table public.quiz_answers
  add column if not exists attempt_day date;

alter table public.quiz_answers
  add column if not exists reward_is_rare boolean not null default false;

update public.quiz_answers
set attempt_day = (answered_at at time zone 'America/Sao_Paulo')::date
where attempt_day is null;

alter table public.quiz_answers
  alter column attempt_day set default ((now() at time zone 'America/Sao_Paulo')::date);

alter table public.quiz_answers
  alter column attempt_day set not null;

alter table public.quiz_answers
  drop constraint if exists quiz_answers_pkey;

alter table public.quiz_answers
  add constraint quiz_answers_pkey primary key (user_id, sticker_number, q_index, attempt_day);

alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_question_timers enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_questions_read_all" on public.quiz_questions;
create policy "quiz_questions_read_all" on public.quiz_questions
  for select to authenticated using (true);

drop policy if exists "quiz_answers_own_all" on public.quiz_answers;
create policy "quiz_answers_own_all" on public.quiz_answers
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quiz_timers_own_all" on public.quiz_question_timers;
create policy "quiz_timers_own_all" on public.quiz_question_timers
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quiz_attempts_own_all" on public.quiz_attempts;
create policy "quiz_attempts_own_all" on public.quiz_attempts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.quiz_questions (sticker_number, q_index, text, options, correct_index)
select
  n,
  q,
  case
    when q = 0 then 'Qual alternativa combina com esta figurinha exclusiva do quiz?'
    else 'Escolha a resposta correta para desbloquear esta figurinha.'
  end,
  array[
    'Resposta correta',
    'Alternativa incorreta',
    'Outra alternativa',
    'Quase, mas nao e essa'
  ],
  0
from generate_series(1, 20) as n
cross join generate_series(0, 1) as q
on conflict (sticker_number, q_index) do update
set text = excluded.text,
    options = excluded.options,
    correct_index = excluded.correct_index;

create or replace function public.get_quiz_questions_for_today()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  local_day date := ((now() at time zone 'America/Sao_Paulo')::date);
  local_day_text text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');
  attempt_row public.quiz_attempts%rowtype;
  final_pool integer[];
  questions_list jsonb := '[]'::jsonb;
  temp_sticker_number integer;
  temp_q_index integer;
  temp_question public.quiz_questions%rowtype;
  temp_sticker public.stickers%rowtype;
  temp_answer public.quiz_answers%rowtype;
  today_count integer := 0;
  correct_count integer := 0;
  error_count integer := 0;
  account_day integer := 1;
begin
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  select count(*) into today_count
  from public.quiz_answers qa
  where qa.user_id = uid
    and qa.attempt_day = local_day;

  select count(distinct us.sticker_number) into correct_count
  from public.user_stickers us
  where us.user_id = uid
    and us.sticker_number between 1 and 20
    and us.copies > 0;

  select greatest(
    1,
    (local_day - ((coalesce(p.created_at, now()) at time zone 'America/Sao_Paulo')::date)) + 1
  )
  into account_day
  from public.profiles p
  where p.id = uid;

  account_day := coalesce(account_day, 1);

  select * into attempt_row
  from public.quiz_attempts
  where user_id = uid;

  if not found or attempt_row.ultimo_dia_acesso <> local_day_text then
    select coalesce(array_agg(sticker_number), '{}'::integer[]) into final_pool
    from (
      select candidate.sticker_number
      from (
        select distinct qq.sticker_number
        from public.quiz_questions qq
        where qq.sticker_number between 1 and 20
          and not exists (
            select 1
            from public.user_stickers us
            where us.user_id = uid
              and us.sticker_number = qq.sticker_number
              and us.copies > 0
          )
      ) candidate
      order by random()
      limit 4
    ) shuffled;

    insert into public.quiz_attempts (
      user_id,
      ultimo_dia_acesso,
      tentativas_hoje_count,
      dia_atual,
      perguntas_pendentes
    )
    values (
      uid,
      local_day_text,
      today_count,
      account_day,
      final_pool
    )
    on conflict (user_id) do update
    set ultimo_dia_acesso = excluded.ultimo_dia_acesso,
        tentativas_hoje_count = excluded.tentativas_hoje_count,
        dia_atual = account_day,
        perguntas_pendentes = excluded.perguntas_pendentes
    returning * into attempt_row;
  else
    update public.quiz_attempts
    set tentativas_hoje_count = today_count,
        dia_atual = account_day
    where user_id = uid
    returning * into attempt_row;
  end if;

  if today_count >= 4 then
    return jsonb_build_object(
      'diaAtual', attempt_row.dia_atual,
      'tentativasHojeCount', today_count,
      'perguntasRespondidasCorretasCount', correct_count,
      'questions', '[]'::jsonb
    );
  end if;

  foreach temp_sticker_number in array coalesce(attempt_row.perguntas_pendentes, '{}'::integer[]) loop
    select * into temp_answer
    from public.quiz_answers qa
    where qa.user_id = uid
      and qa.sticker_number = temp_sticker_number
      and qa.attempt_day = local_day
    order by qa.answered_at desc
    limit 1;

    select count(*) into error_count
    from public.quiz_answers qa
    where qa.user_id = uid
      and qa.sticker_number = temp_sticker_number
      and qa.correct = false;

    select qq.q_index into temp_q_index
    from public.quiz_questions qq
    where qq.sticker_number = temp_sticker_number
    order by random()
    limit 1;

    select * into temp_question
    from public.quiz_questions qq
    where qq.sticker_number = temp_sticker_number
      and qq.q_index = temp_q_index;

    select * into temp_sticker
    from public.stickers s
    where s.number = temp_sticker_number;

    questions_list := questions_list || jsonb_build_array(
      jsonb_build_object(
        'sticker_number', temp_sticker_number,
        'slug', coalesce(temp_sticker.slug, 'quiz-' || temp_sticker_number::text),
        'title', coalesce(temp_sticker.name, 'Figurinha ' || temp_sticker_number::text),
        'author', temp_sticker.author,
        'q_index', temp_question.q_index,
        'text', temp_question.text,
        'options', to_jsonb(temp_question.options),
        'errors', error_count,
        'answered', temp_answer.user_id is not null,
        'correct', coalesce(temp_answer.correct, false),
        'chosenIndex', temp_answer.chosen_index,
        'correct_index', case when temp_answer.user_id is not null then temp_question.correct_index else null end,
        'options_to_hide', null
      )
    );
  end loop;

  return jsonb_build_object(
    'diaAtual', attempt_row.dia_atual,
    'tentativasHojeCount', today_count,
    'perguntasRespondidasCorretasCount', correct_count,
    'questions', questions_list
  );
end;
$$;

create or replace function public.start_quiz_question_timer(
  sticker_number_param integer,
  q_index_param integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  timer_row public.quiz_question_timers%rowtype;
begin
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  select * into timer_row
  from public.quiz_question_timers
  where user_id = uid
    and sticker_number = sticker_number_param
    and q_index = q_index_param;

  if found then
    return jsonb_build_object(
      'success', true,
      'started_at', timer_row.started_at,
      'expires_at', timer_row.expires_at,
      'expired', timer_row.expires_at <= now()
    );
  end if;

  insert into public.quiz_question_timers (user_id, sticker_number, q_index, expires_at)
  values (uid, sticker_number_param, q_index_param, now() + interval '3 minutes')
  returning * into timer_row;

  return jsonb_build_object(
    'success', true,
    'started_at', timer_row.started_at,
    'expires_at', timer_row.expires_at,
    'expired', false
  );
end;
$$;

create or replace function public.answer_quiz(
  sticker_number_param integer,
  q_index_param integer,
  chosen_index_param integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  local_day date := ((now() at time zone 'America/Sao_Paulo')::date);
  correct_answer integer;
  is_correct boolean;
  today_count integer := 0;
  error_count integer := 0;
  sticker_row public.stickers%rowtype;
  was_new boolean := false;
  quiz_rare_count integer := 0;
  rare_reward_today boolean := false;
  reward_is_rare boolean := false;
begin
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  if exists (
    select 1
    from public.quiz_answers qa
    where qa.user_id = uid
      and qa.sticker_number = sticker_number_param
      and qa.q_index = q_index_param
      and qa.attempt_day = local_day
  ) then
    raise exception 'Pergunta ja respondida hoje.';
  end if;

  select count(*) into today_count
  from public.quiz_answers qa
  where qa.user_id = uid
    and qa.attempt_day = local_day;

  if today_count >= 4 then
    raise exception 'Limite diario do quiz atingido.';
  end if;

  select qq.correct_index into correct_answer
  from public.quiz_questions qq
  where qq.sticker_number = sticker_number_param
    and qq.q_index = q_index_param;

  if correct_answer is null then
    raise exception 'Pergunta nao encontrada.';
  end if;

  is_correct := chosen_index_param = correct_answer;

  if is_correct then
    select count(*) into quiz_rare_count
    from public.user_stickers us
    where us.user_id = uid
      and us.sticker_number between 1 and 20
      and us.copies > 0
      and us.is_rare = true;

    select exists (
      select 1
      from public.quiz_answers qa
      where qa.user_id = uid
        and qa.attempt_day = local_day
        and qa.correct = true
        and qa.reward_is_rare = true
    )
    into rare_reward_today;

    reward_is_rare := quiz_rare_count < 12 and not rare_reward_today;
  end if;

  insert into public.quiz_answers (
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    correct,
    answered_at,
    attempt_day,
    reward_is_rare
  )
  values (
    uid,
    sticker_number_param,
    q_index_param,
    chosen_index_param,
    is_correct,
    now(),
    local_day,
    reward_is_rare
  );

  update public.quiz_attempts
  set tentativas_hoje_count = today_count + 1
  where user_id = uid;

  delete from public.quiz_question_timers
  where user_id = uid
    and sticker_number = sticker_number_param
    and q_index = q_index_param;

  select count(*) into error_count
  from public.quiz_answers qa
  where qa.user_id = uid
    and qa.sticker_number = sticker_number_param
    and qa.correct = false;

  if not is_correct then
    return jsonb_build_object(
      'correct', false,
      'errors', error_count,
      'reveals', '[]'::jsonb
    );
  end if;

  was_new := not exists (
    select 1
    from public.user_stickers us
    where us.user_id = uid
      and us.sticker_number = sticker_number_param
      and us.copies > 0
  );

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (uid, sticker_number_param, 1, reward_is_rare, now())
  on conflict (user_id, sticker_number) do update
  set copies = public.user_stickers.copies + 1,
      is_rare = public.user_stickers.is_rare or excluded.is_rare;

  select * into sticker_row
  from public.stickers s
  where s.number = sticker_number_param;

  return jsonb_build_object(
    'correct', true,
    'errors', error_count,
    'reveals', jsonb_build_array(
      jsonb_build_object(
        'number', sticker_number_param,
        'slug', coalesce(sticker_row.slug, 'quiz-' || sticker_number_param::text),
        'title', coalesce(sticker_row.name, 'Figurinha ' || sticker_number_param::text),
        'author', sticker_row.author,
        'wasNew', was_new,
        'isRare', reward_is_rare,
        'repeat', not was_new
      )
    )
  );
end;
$$;

grant execute on function public.get_quiz_questions_for_today() to authenticated;
grant execute on function public.start_quiz_question_timer(integer, integer) to authenticated;
grant execute on function public.answer_quiz(integer, integer, integer) to authenticated;
