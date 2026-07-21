-- The imported V2 schema stores the wallet in user_points, not in profiles.
-- Patch the already-deployed quiz function without repeating the full function
-- body or changing any quiz attempt/reward state.

DO $$
DECLARE
  v_signature regprocedure := to_regprocedure('public.answer_quiz(integer,integer,integer)');
  v_definition text;
  v_patched_definition text;
  v_new text := E'PERFORM public.ensure_user_points(auth.uid());\n\n  UPDATE public.user_points\n  SET balance = balance + 10,\n      updated_at = now()\n  WHERE user_id = auth.uid();';
BEGIN
  IF v_signature IS NULL THEN
    RAISE EXCEPTION 'public.answer_quiz(integer,integer,integer) was not found.';
  END IF;

  SELECT pg_get_functiondef(v_signature) INTO v_definition;

  -- A clean database may already contain the corrected implementation.
  IF position('UPDATE public.user_points' IN v_definition) > 0 THEN
    RETURN;
  END IF;

  v_patched_definition := regexp_replace(
    v_definition,
    'UPDATE[[:space:]]+(public\.)?profiles[[:space:]]+SET[[:space:]]+points_balance[^;]+;',
    v_new,
    'i'
  );

  IF v_patched_definition = v_definition
     OR position('UPDATE public.user_points' IN v_patched_definition) = 0
     OR position('points_balance' IN v_patched_definition) > 0 THEN
    RAISE EXCEPTION 'Could not safely replace profiles.points_balance in answer_quiz.';
  END IF;

  EXECUTE v_patched_definition;
END;
$$;

NOTIFY pgrst, 'reload schema';
