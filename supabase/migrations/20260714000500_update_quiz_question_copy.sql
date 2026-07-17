-- Align the live quiz wording with the approved SEED_QUESTIONS copy.
update public.quiz_questions
set text = 'Em um romance de G.B. Baldassari, qual acontecimento coloca Abby e Eva em uma confusão familiar inesperada?'
where sticker_number = 1 and q_index = 0;

update public.quiz_questions
set text = 'Em qual cidade Eva e Lily, personagens de um livro de G.B. Baldassari, moram?'
where sticker_number = 1 and q_index = 1;

update public.quiz_questions
set text = 'Na farsa romântica vivida por Liz na história de Victoria Mendes, qual é o interesse da chefe ao propor o namoro falso?'
where sticker_number = 4 and q_index = 1;

update public.quiz_questions
set text = 'Em uma história de Line Cunha, qual aposta nasce com cara de desastre anunciado?'
where sticker_number = 5 and q_index = 1;

update public.quiz_questions
set text = 'Em um livro de Mariana Rosa, depois da morte misteriosa da avó, o que Ophélia encontra ao voltar para sua cidade natal?'
where sticker_number = 6 and q_index = 0;

update public.quiz_questions
set text = 'No livro de D. Barreto, o que faz Roberta quebrar a distância que costuma manter entre trabalho e vida pessoal?'
where sticker_number = 8 and q_index = 0;

update public.quiz_questions
set text = 'Qual contraste melhor descreve Victoria e Rayka nessa história de V.S. Vilela?'
where sticker_number = 9 and q_index = 1;

update public.quiz_questions
set text = 'Qual elemento da capa do livro de Karoline Mandu dialoga diretamente com a ideia de segredo e descoberta presente nessa obra?'
where sticker_number = 10 and q_index = 1;

update public.quiz_questions
set text = 'No livro de Fernanda V., qual é a relação de Aurora com os irmãos mais novos de Helena?'
where sticker_number = 19 and q_index = 0;
