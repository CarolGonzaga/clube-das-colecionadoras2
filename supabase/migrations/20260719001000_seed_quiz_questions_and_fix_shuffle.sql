-- Migration: Seed all 40 quiz questions and fix option shuffle hash consistency in answer_quiz_legacy

-- 1. Upsert all 40 official quiz questions (matching SEED_QUESTIONS from V1/V2 seeds.ts)
INSERT INTO public.quiz_questions (sticker_number, q_index, text, options, correct_index)
VALUES
  (1, 0, 'Em um romance de G.B. Baldassari, qual acontecimento coloca Abby e Eva em uma confusão familiar inesperada?', ARRAY['Uma advogada precisa defender uma lutadora acusada injustamente', 'Uma menina procura a mãe biológica e aproxima duas mulheres com vidas muito diferentes', 'Uma campeã de boxe reencontra uma rival do passado dentro de uma academia', 'Uma jornalista investiga o desaparecimento de uma criança adotada'], 1),
  (1, 1, 'Em qual cidade Eva e Lily, personagens de um livro de G.B. Baldassari, moram?', ARRAY['Baddeck (Canadá)', 'Vancouver (Canadá)', 'Halifax (Canadá)', 'Hamilton (Canadá)'], 0),
  (2, 0, 'Qual dilema melhor combina com uma protagonista de Clara Alves que decide bancar o cupido na faculdade?', ARRAY['Jess quer provar que o amor não existe, mas acaba escrevendo cartas românticas para desconhecidas', 'Chiara acredita que talvez o amor não seja para ela, então decide ajudar outras pessoas a se apaixonarem', 'Helena tenta reconquistar a ex da melhor amiga, mas acaba se envolvendo com uma professora', 'Chiara entra no curso de direito para fugir da família, mas se apaixona pela própria chefe'], 1),
  (2, 1, 'A sinopse do livro mais recente de Clara Alves apresenta a história como uma comédia romântica divertida e perfeita para fãs de qual filme?', ARRAY['Meninas Malvadas', 'As patricinhas de Beverly Hills', 'Legalmente Loira', '10 coisas que eu odeio em você'], 1),
  (3, 0, 'Em uma história de Bia Crespo, qual situação coloca Antônia no centro de uma confusão romântica?', ARRAY['Ela aceita fingir um namoro com a chefe para não perder o emprego', 'Ela se apaixona pela professora de literatura da faculdade', 'Ela aceita um namoro de mentira com a própria crush, mesmo sabendo que a garota quer se aproximar da irmã dela', 'Ela descobre que a irmã mais nova está namorando sua ex-namorada da adolescência'], 2),
  (3, 1, 'Qual combinação de elementos ajuda a reconhecer a história de Bia Crespo?', ARRAY['Faculdade, namoro de mentira, crush inalcançável e uma irmã popular demais', 'Viagem de verão, reencontro de ex, amizade de infância e amor à distância', 'Rivais no trabalho, competição esportiva, fama e romance à distância', 'Intercâmbio, segredo de família, chantagem e festa de gala'], 0),
  (4, 0, 'Qual dilema melhor combina com uma protagonista de Victoria Mendes que se vê presa a um acordo profissional?', ARRAY['Liz aceita fingir um namoro com a chefe em troca da chance de ter seu livro lido por uma agente importante', 'Liz precisa fingir que conhece Esther desde a infância', 'Liz descobre que a dona da empresa é sua ex-namorada de infância', 'Liz tenta esconder que é a autora secreta de uma série de livros de sucesso'], 0),
  (4, 1, 'Na farsa romântica vivida por Liz na história de Victoria Mendes, qual é o interesse da chefe ao propor o namoro falso?', ARRAY['Evitar um escândalo de imprensa sobre sua vida pessoal', 'Chamar atenção da diretoria e agradar o comitê de diversidade da empresa', 'Provocar ciúmes em uma ex-noiva que voltou para a cidade', 'Conseguir uma herança familiar que exige um relacionamento estável'], 1),
  (5, 0, 'O que faz uma jornalista prestes a ser demitida aceitar um trabalho no México em uma história de Line Cunha?', ARRAY['Uma investigação sobre o tráfico de artes no Caribe', 'Uma missão no México para escrever sobre um hotel, que acaba colocando Belladonna diante dos segredos de Iliana', 'Um convite para cobrir o casamento de uma celebridade local', 'A promessa de uma entrevista exclusiva com uma herdeira misteriosa'], 1),
  (5, 1, 'Em uma história de Line Cunha, qual aposta nasce com cara de desastre anunciado?', ARRAY['Bella passar um verão no Mondragón Hotel para tentar transformá-lo em capa da revista', 'Bella fingir que é noiva da dona do hotel durante uma inspeção internacional', 'Iliana tentar ensinar Bella a surfar em troca de publicidade gratuita', 'Bella e Iliana disputarem quem consegue manter um segredo profissional por mais tempo'], 0),
  (6, 0, 'Em um livro de Mariana Rosa, depois da morte misteriosa da avó, o que Ophélia encontra ao voltar para sua cidade natal?', ARRAY['Uma carta antiga revelando um romance proibido com a prefeita', 'Um clube clandestino ligado a mulheres sáficas dos anos 60 e a uma série de segredos violentos', 'Uma lista de suspeitas registradas em um diário de infância', 'Uma herança disputada por uma família que ela não conhecia'], 1),
  (6, 1, 'Quais tropes ajudam a identificar essa história de Mariana Rosa?', ARRAY['Investigação, clube secreto, diferença de idade e relação cão e gato', 'Fake dating, comédia universitária, segredo de família e reconquista', 'Grumpy x sunshine, viagem de negócios, boss x employee e casamento arranjado', 'Amizade de infância, romance esportivo, reencontro e segredo de estado'], 0),
  (7, 0, 'Amanda e Pamela não se suportam, mas acabam aceitando qual loucura em uma história de Ju Mesquita?', ARRAY['Dividir o mesmo apartamento por um ano inteiro', 'Um casamento falso que pode ajudar as duas a resolverem suas vidas', 'Participar juntas de um reality show de sobrevivência', 'Fingir que são irmãs para conseguir uma bolsa de estudos'], 1),
  (7, 1, 'Antes da aliança entrar na história, qual dinâmica define Amanda e Pamela nesse romance de Ju Mesquita?', ARRAY['Duas amigas de infância que se reencontram no dia do casamento', 'Uma chefe e uma funcionária que se desafiam o tempo todo e não se suportam', 'Duas atletas competindo pelo mesmo patrocínio', 'Uma advogada e uma cliente tentando resolver um acordo financeiro'], 1),
  (8, 0, 'No livro de D. Barreto, o que faz Roberta quebrar a distância que costuma manter entre trabalho e vida pessoal?', ARRAY['A chegada de Brenda, uma herdeira impulsiva que volta ao Brasil e passa a morar no hotel', 'O pedido desesperado de uma cliente VIP que precisa de proteção', 'Uma tempestade que isola as duas dentro de uma casa de campo', 'A necessidade de cuidar da filha pequena de uma funcionária'], 0),
  (8, 1, 'Qual combinação de tropes combina com essa história de D. Barreto?', ARRAY['Age gap, grumpy x sunshine, maternidade e opostas que se atraem', 'Fake dating, namoro por conveniência, rivalidade e comédia universitária', 'Romance histórico, clube secreto, suspense e reencontro', 'Inimigas no esporte, proximidade forçada, viagem e segredo familiar'], 0),
  (9, 0, 'Em um romance de V.S. Vilela, o que Victoria guarda com carinho sem saber a verdade sobre a autoria?', ARRAY['Cartas de um admirador secreto, sem imaginar que foram escritas por uma garota que ela detesta', 'Um diário antigo encontrado na biblioteca da faculdade', 'Um colar com iniciais que pertenciam à sua melhor amiga', 'Uma coleção de bilhetes anônimos deixados em seu armário do treino'], 0),
  (9, 1, 'Qual contraste melhor descreve Victoria e Rayka nessa história de V.S. Vilela?', ARRAY['Victoria é vista como a “garota de ouro” da faculdade, enquanto Rayka é a garota debochada que ela detesta', 'Victoria é uma advogada veterana, enquanto Rayka é uma nova estagiária tímida', 'Victoria tenta fugir dos holofotes, enquanto Rayka é uma influenciadora famosa', 'Victoria vive para o esporte, enquanto Rayka é uma artista reclusa'], 0),
  (10, 0, 'O que o primeiro livro de poemas de Karoline Mandu explora em sua narrativa?', ARRAY['A descoberta de uma garota que gosta de garotas, passando por inseguranças, beleza e orgulho', 'A dor de um luto familiar durante a adolescência', 'A rotina de uma jovem mudando para uma metrópole sozinha', 'As cartas não enviadas para um amor da época da escola'], 0),
  (10, 1, 'Qual elemento da capa do livro de Karoline Mandu dialoga diretamente com a ideia de segredo e descoberta presente nessa obra?', ARRAY['Um armário aberto, com roupas à mostra e o título escrito sobre ele', 'Uma janela aberta para o oceano durante o pôr do sol', 'Uma carta queimada na ponta sobre uma mesa de madeira', 'Um espelho quebrado refletindo duas sombras'], 0),
  (11, 0, 'Em um romance de Sarah Oliveira ambientado no esporte, o que aproxima duas jogadoras de vôlei que não se suportam?', ARRAY['A contratação de uma nova técnica que exige convivência diária', 'Um documentário sobre paz e Jogos Olímpicos que coloca as rivais em proximidade forçada', 'A necessidade de dividirem o mesmo quarto de hotel durante uma turnê', 'Um projeto social organizado pelo clube em que jogam'], 1),
  (11, 1, 'Duas jogadoras de vôlei, rivais nas seleções do Brasil e da Itália, precisam conviver em um documentário. Qual o nome do livro?', ARRAY['Jogos do Amor', 'Apenas Rivais', 'Opostas em Guerra', 'O Lado Oposto do Quadra'], 2),
  (12, 0, 'Na história de Englantine, o que Atena e Laura descobrem ao tentarem entender a rivalidade de suas famílias?', ARRAY['Que a rivalidade começou por causa de um terreno disputado na infância', 'Elas acham que a hostilidade é uma invenção exagerada dos familiares', 'Que uma carta antiga guardava um segredo de negócios entre os avôs', 'Que as famílias já foram sócias em uma grande vinícola'], 1),
  (12, 1, 'Duas jovens de famílias rivais, uma cidade pequena, segredos do passado e um sentimento proibido. Qual o nome da história?', ARRAY['Segredos de Família', 'O Peso da Tempestade', 'Em todas as gotas de chuva', 'Rivalidade e Desejo'], 2),
  (13, 0, 'Natalie chega ao Colégio Madre Cordélia pronta para passar despercebida. Qual reviravolta muda os planos dela?', ARRAY['Ela precisa dividir o quarto com Esther, a filha da diretora', 'Ela é escolhida como representante de turma contra sua vontade', 'Ela descobre que a escola pertence à família de sua ex-namorada', 'Ela é flagrada quebrando uma regra rígida na primeira semana'], 0),
  (13, 1, 'Uma aluna nova, a filha da diretora, um colégio católico e uma proximidade perigosa. Qual o nome do livro?', ARRAY['Segredos do Convento', 'A Filha da Diretora', 'Colegas de Quarto', 'Regras da Paixão'], 2),
  (14, 0, 'No romance de Zey Shelsea, como Eva e Renata se conhecem por acaso?', ARRAY['Renata é a nova médica que atende o avô de Eva', 'Eva contrata Renata para um projeto de pesquisa universitária', 'Eva tropeça em Renata ao sair de sua livraria favorita', 'Elas se esbarram no aeroporto durante o extravio de uma mala'], 2),
  (14, 1, 'Uma estudante de letras, uma neurocirurgiã, um encontro acidental e um amor inesperado. Qual o nome do livro?', ARRAY['O Destino das Palavras', 'Conexões Ocultas', 'Razão e Sentimento', 'Imensurável'], 3),
  (15, 0, 'No romance de Victoria Moon, qual regra do intercâmbio complica a relação entre Malu e Georgia?', ARRAY['A intercambista não pode viajar sozinha pela Europa', 'A intercambista não pode se envolver amorosamente com ninguém da host-family', 'A intercambista precisa manter notas máximas para não perder a bolsa', 'A intercambista não pode trabalhar fora da faculdade'], 1),
  (15, 1, 'Uma carioca ganha uma bolsa para estudar na Itália e vai morar com a família de uma garota inesquecível. Qual o nome do livro?', ARRAY['Verão em Florença', 'Cartas para Geórgia', 'Georgia Rose: Segredos de Florença', 'Proibido na Itália'], 2),
  (16, 0, 'No romance de Helena Nolasco, qual desafio dá início ao envolvimento entre as protagonistas?', ARRAY['Nikki desafia Jamie a seduzir Alicia, a nova integrante do clube de Decatlo Acadêmico', 'Jamie desafia Nikki a vencer o campeonato estadual de torcida', 'Alicia desafia Jamie a passar de ano na matéria de física', 'Nikki aposta que consegue fazer Jamie se apaixonar por ela'], 0),
  (16, 1, 'Uma cientista carioca, uma líder de torcida, uma aposta e um campeonato acadêmico. Qual o nome do livro?', ARRAY['Aposta de Amor', 'A garota do topo', 'Desafio Acadêmico', 'Líderes e Cientistas'], 1),
  (17, 0, 'No romance de Yasmim Mahmud Kader, qual segredo cerca a relação entre Gabriela e Sky?', ARRAY['Gabriela não sabe que Céu também é Sky, a e-girl por quem ela se apaixonou online', 'Sky finge ser uma estudante universitária quando na verdade já se formou', 'Gabriela esconde que escreve resenhas anônimas sobre os vídeos de Sky', 'Sky vive em outra cidade e finge morar no mesmo bairro que Gabriela'], 0),
  (17, 1, 'Uma garota cria um disfarce online para fugir da timidez e acaba se apaixonando pela vizinha. Qual o nome do livro?', ARRAY['Amor por Telas', 'Não é só de amor que eu sei falar', 'Identidade Secreta', 'Vozes da Internet'], 1),
  (18, 0, 'Antes de se envolver com Eleanor, qual dilema pessoal deixa Natalie sobrecarregada?', ARRAY['Ela tenta esconder dos pais que desistiu da faculdade de medicina', 'Ela faz hora extra em um sábado tentando evitar uma possível demissão', 'Ela descobre que a empresa onde trabalha vai fechar as portas', 'Ela disputa uma promoção direta com sua melhor amiga'], 1),
  (18, 1, 'Um romance entre Natalie e Eleanor, um passado guardado a sete chaves e um reencontro no litoral. Qual o nome do livro?', ARRAY['Cartas do Passado', 'Marés da Vida', 'Os segredos que contei ao oceano', 'Litoral do Desejo'], 2),
  (19, 0, 'No livro de Fernanda V., qual é a relação de Aurora com os irmãos mais novos de Helena?', ARRAY['Aurora é vizinha e cuida deles aos fins de semana', 'Aurora é professora deles', 'Aurora é a médica pediatra responsável pelo tratamento deles', 'Aurora é a tutora de artes da escola deles'], 1),
  (19, 1, 'Uma mulher metódica, uma professora expansiva, crianças adoráveis e uma convivência inesperada. Qual o nome do livro?', ARRAY['Métodos do Amor', 'A Professora e a Vizinha', 'Família por Escolha', 'Opostos Complementares'], 3),
  (20, 0, 'Na fantasia gótica de Giu Domingues, como os demônios são invocados no Conservatório?', ARRAY['Por meio do canto das sopranos', 'Através de um espelho antigo escondido na biblioteca', 'Com a leitura de partituras proibidas no porão', 'Ao tocar um órgão de tubos feito de ossos'], 0),
  (20, 1, 'Uma soprano ambiciosa, um Conservatório sombrio e um pacto misterioso com o sobrenatural. Qual o nome do livro?', ARRAY['Pacto de Soprano', 'A Lenda do Conservatório', 'Canção dos ossos', 'Vozes das Sombras'], 2)
ON CONFLICT (sticker_number, q_index) DO UPDATE SET
  text = EXCLUDED.text,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index;


-- 2. Update answer_quiz_legacy to retrieve current_day directly from quiz_attempts
--    Guaranteeing that option shuffle in answer_quiz_legacy matches get_quiz_questions_for_today

create or replace function public.answer_quiz_legacy(
  sticker_number_param integer,
  q_index_param integer,
  chosen_index_param integer
)
returns jsonb as $$
declare
  user_id_param uuid;
  current_day text;
  attempt_count integer;
  correct_idx_val integer;
  is_correct boolean;
  new_is_rare boolean;
  was_new boolean;
  final_is_rare boolean;
  reveals jsonb := '[]'::jsonb;
  reveal_item jsonb;
  new_errors integer;
  target_slug text;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  -- Derive session current_day directly from public.quiz_attempts (ensures 100% hash shuffle consistency)
  select ultimo_dia_acesso, tentativas_hoje_count
  into current_day, attempt_count
  from public.quiz_attempts
  where user_id = user_id_param;

  if current_day is null then
    current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');
    attempt_count := 0;
  end if;

  if attempt_count >= 4 then
    raise exception 'Você já esgotou suas 4 tentativas de hoje! Volte amanhã ⏳';
  end if;

  -- Verify if question is in today's pending session
  if not exists (
    select 1 from public.quiz_attempts
    where user_id = user_id_param and sticker_number_param = any(perguntas_pendentes)
  ) then
    raise exception 'Esta pergunta não está disponível para ser respondida hoje.';
  end if;

  -- Check if already answered in this session
  if exists (
    select 1 from public.quiz_answers
    where user_id = user_id_param
      and sticker_number = sticker_number_param
      and q_index = q_index_param
      and attempt_day = current_day::date
  ) then
    raise exception 'Você já respondeu a esta pergunta hoje.';
  end if;

  -- Retrieve correct index from secure quiz_questions table
  select correct_index into correct_idx_val
  from public.quiz_questions
  where sticker_number = sticker_number_param and q_index = q_index_param;

  if correct_idx_val is null then
    raise exception 'Pergunta não encontrada.';
  end if;

  -- Apply same deterministic shuffle as get_quiz_questions_for_today
  declare
    h integer;
    perm0 integer; perm1 integer; perm2 integer; perm3 integer;
    tmp_int integer;
    shuffled_correct_index integer;
  begin
    h := abs(hashtext(user_id_param::text || sticker_number_param::text || current_day));
    perm0 := 0; perm1 := 1; perm2 := 2; perm3 := 3;

    case (h % 4)
      when 0 then tmp_int := perm0; perm0 := perm3; perm3 := tmp_int;
      when 1 then tmp_int := perm1; perm1 := perm3; perm3 := tmp_int;
      when 2 then tmp_int := perm2; perm2 := perm3; perm3 := tmp_int;
      else null;
    end case;
    h := h / 4;
    case (h % 3)
      when 0 then tmp_int := perm0; perm0 := perm2; perm2 := tmp_int;
      when 1 then tmp_int := perm1; perm1 := perm2; perm2 := tmp_int;
      else null;
    end case;
    h := h / 3;
    if (h % 2) = 0 then
      tmp_int := perm0; perm0 := perm1; perm1 := tmp_int;
    end if;

    if perm0 = correct_idx_val then shuffled_correct_index := 0;
    elsif perm1 = correct_idx_val then shuffled_correct_index := 1;
    elsif perm2 = correct_idx_val then shuffled_correct_index := 2;
    else shuffled_correct_index := 3;
    end if;

    is_correct := (chosen_index_param <> -1 and chosen_index_param = shuffled_correct_index);
  end;

  -- Update attempts count
  update public.quiz_attempts
  set tentativas_hoje_count = tentativas_hoje_count + 1
  where user_id = user_id_param;

  -- Record user answer
  insert into public.quiz_answers (
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    correct,
    attempt_day
  )
  values (
    user_id_param,
    sticker_number_param,
    q_index_param,
    chosen_index_param,
    is_correct,
    current_day::date
  );

  select 
    case sticker_number_param
      when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
      when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
      when 7 then 'o-casamento' when 8 then 'como-nao-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
      when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
      when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
      when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
      when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
      else 'slug'
    end into target_slug;

  if is_correct then
    -- Roll for 40% chance of Rare
    new_is_rare := (random() < 0.40);

    -- Grant sticker in inventory
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (user_id_param, sticker_number_param, 1, new_is_rare, now())
    on conflict (user_id, sticker_number) do update set 
      copies = public.user_stickers.copies + 1,
      is_rare = public.user_stickers.is_rare or new_is_rare
    returning public.user_stickers.is_rare, (copies = 1) into final_is_rare, was_new;

    reveal_item := jsonb_build_object(
      'slug', target_slug,
      'number', sticker_number_param,
      'wasNew', was_new,
      'isRare', new_is_rare,
      'repeat', false,
      'reward', null
    );
    reveals := reveals || reveal_item;

    -- Trigger Milestone check
    progression_reveals := public.check_and_grant_rewards(user_id_param);
    reveals := reveals || progression_reveals;

    return jsonb_build_object(
      'correct', true,
      'reveals', reveals
    );
  else
    select count(*) into new_errors
    from public.quiz_answers
    where user_id = user_id_param and sticker_number = sticker_number_param and correct = false;

    return jsonb_build_object(
      'correct', false,
      'errors', new_errors
    );
  end if;
end;
$$ language plpgsql security definer;
