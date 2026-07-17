-- Three-minute quiz deadlines are stored in the database, not in the browser.
create table if not exists public.quiz_question_timers (
  user_id uuid references public.profiles(id) on delete cascade,
  sticker_number integer not null,
  q_index integer not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (user_id, sticker_number, q_index)
);
alter table public.quiz_question_timers enable row level security;
drop policy if exists "Allow users to view own quiz timers" on public.quiz_question_timers;
create policy "Allow users to view own quiz timers" on public.quiz_question_timers for select using (auth.uid() = user_id);

alter function public.answer_quiz(integer, integer, integer) rename to answer_quiz_legacy;

create or replace function public.record_quiz_timeout(uid uuid, sn integer, qi integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare errors_count integer;
begin
  if exists(select 1 from public.quiz_answers where user_id=uid and sticker_number=sn and q_index=qi) then
    delete from public.quiz_question_timers where user_id=uid and sticker_number=sn and q_index=qi;
    return jsonb_build_object('correct',false,'already_answered',true);
  end if;
  insert into public.quiz_answers(user_id,sticker_number,q_index,chosen_index,correct)
  values(uid,sn,qi,-1,false);
  update public.quiz_attempts set tentativas_hoje_count=tentativas_hoje_count+1 where user_id=uid;
  select count(*) into errors_count from public.quiz_answers where user_id=uid and sticker_number=sn and correct=false;
  delete from public.quiz_question_timers where user_id=uid and sticker_number=sn and q_index=qi;
  return jsonb_build_object('correct',false,'errors',errors_count,'timed_out',true);
end; $$;

create or replace function public.expire_quiz_question_timers()
returns void language plpgsql security definer set search_path=public as $$
declare t record;
begin
  for t in select * from public.quiz_question_timers where user_id=auth.uid() and expires_at<=now() loop
    perform public.record_quiz_timeout(t.user_id,t.sticker_number,t.q_index);
  end loop;
end; $$;

create or replace function public.start_quiz_question_timer(sticker_number_param integer, q_index_param integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); deadline timestamptz; timeout_result jsonb;
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  select expires_at into deadline from public.quiz_question_timers where user_id=uid and sticker_number=sticker_number_param and q_index=q_index_param;
  if deadline is not null and deadline<=now() then
    timeout_result:=public.record_quiz_timeout(uid,sticker_number_param,q_index_param);
    return timeout_result || jsonb_build_object('expired',true);
  end if;
  if deadline is null then
    deadline:=now()+interval '3 minutes';
    insert into public.quiz_question_timers(user_id,sticker_number,q_index,expires_at) values(uid,sticker_number_param,q_index_param,deadline);
  end if;
  return jsonb_build_object('expires_at',deadline,'expired',false);
end; $$;

create or replace function public.answer_quiz(sticker_number_param integer, q_index_param integer, chosen_index_param integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); deadline timestamptz; result jsonb;
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  select expires_at into deadline from public.quiz_question_timers where user_id=uid and sticker_number=sticker_number_param and q_index=q_index_param;
  if deadline is not null and deadline<=now() then return public.record_quiz_timeout(uid,sticker_number_param,q_index_param); end if;
  if deadline is null then insert into public.quiz_question_timers(user_id,sticker_number,q_index,expires_at) values(uid,sticker_number_param,q_index_param,now()+interval '3 minutes'); end if;
  result:=public.answer_quiz_legacy(sticker_number_param,q_index_param,chosen_index_param);
  delete from public.quiz_question_timers where user_id=uid and sticker_number=sticker_number_param and q_index=q_index_param;
  return result;
end; $$;

revoke all on function public.record_quiz_timeout(uuid,integer,integer) from public;
revoke all on function public.answer_quiz_legacy(integer,integer,integer) from public, anon, authenticated;
grant execute on function public.expire_quiz_question_timers() to authenticated;
grant execute on function public.start_quiz_question_timer(integer,integer) to authenticated;
grant execute on function public.answer_quiz(integer,integer,integer) to authenticated;
