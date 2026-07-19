-- Migration: Seed all 360 stickers from seed_stickers_atualizado.ts
-- This updates placeholders to the real names, authors, slugs, covers, categories, and amazon urls.

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (1, 'amor-fati', 'Amor Fati', 'G.B. Baldassari', 'quiz', 'amor-fati.jpg', 'https://link.amazon/B04QsFxvd', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (2, 'cupidos-nao-se-apaixonam', 'Cupidos não se apaixonam', 'Clara Alves', 'quiz', 'cupidos-nao-se-apaixonam.jpg', 'https://link.amazon/B0aMON6CM', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (3, 'eu-minha-crush-e-minha-irma', 'Eu, minha crush e minha irmã', 'Bia Crespo', 'quiz', 'eu-minha-crush-e-minha-irma.jpg', 'https://link.amazon/B0gHZl9q6', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (4, 'liz-flores-e-uma-farsa', 'Liz Flores é uma farsa', 'Victoria Mendes', 'quiz', 'liz-flores-e-uma-farsa.jpg', 'https://link.amazon/B05Ayf9iA', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (5, 'segundo-cliche', 'Segundo Clichê (Frutaverso Livro 1)', 'Line Cunha', 'quiz', 'segundo-cliche.jpg', 'https://link.amazon/B0hSXOXJx', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (6, 'desejos-ocultos-das-violetas', 'Desejos Ocultos das Violetas', 'Mariana Rosa', 'quiz', 'desejos-ocultos-das-violetas.jpg', 'https://link.amazon/B0iwzpQsy', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (7, 'o-casamento', 'O Casamento', 'Ju Mesquita', 'quiz', 'o-casamento.jpg', 'https://link.amazon/B07RMb9et', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (8, 'como-não-se-apaixonar', 'Como (não) se apaixonar', 'D. Barreto', 'quiz', 'como-não-se-apaixonar.jpg', 'https://link.amazon/B012VqDsq', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (9, 'ela-e-mais-do-que-voce-imagina', 'Ela é mais do que você imagina', 'V.S. Vilela', 'quiz', 'ela-e-mais-do-que-voce-imagina.jpg', 'https://link.amazon/B0iyUjTD5', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (10, 'nao-conta-pra-ela', '(Não) conta pra ela', 'Karoline Mandu', 'quiz', 'nao-conta-pra-ela.jpg', 'https://link.amazon/B0ihxjwaN', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (11, 'opostas-em-guerra', 'Opostas em Guerra', 'Sarah Oliveira', 'quiz', 'opostas-em-guerra.jpg', 'https://link.amazon/B0aB3FcnO', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (12, 'em-todas-as-gotas-de-chuva', 'Em todas as gotas de chuva', 'Englantine', 'quiz', 'em-todas-as-gotas-de-chuva.jpg', 'https://link.amazon/B03fZPEe3', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (13, 'colegas-de-quarto', 'Colegas de Quarto', 'Marina Basso', 'quiz', 'colegas-de-quarto.jpg', 'https://link.amazon/B04Li75y5', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (14, 'imensuravel-uma-nova-chance-para-amar', 'Imensurável: Uma nova chance para amar', 'Zey Shelsea', 'quiz', 'imensuravel-uma-nova-chance-para-amar.jpg', 'https://link.amazon/B08HyxVyX', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (15, 'georgia-rose', 'Georgia Rose: Segredos de Florença', 'Victoria Moon', 'quiz', 'georgia-rose.jpg', 'https://link.amazon/B0cgvqwcH', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (16, 'a-garota-do-topo', 'A Garota do Topo', 'Helena Nolasco', 'quiz', 'a-garota-do-topo.jpg', 'https://link.amazon/B0aCQG15A', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (17, 'nao-e-so-de-amor-que-eu-sei-falar', 'Não é só de amor que eu sei falar', 'Yasmim Mahmud Kader', 'quiz', 'nao-e-so-de-amor-que-eu-sei-falar.jpg', 'https://link.amazon/B08XPOF7V', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (18, 'os-segredos-que-contei-ao-oceano', 'Os Segredos Que Contei Ao Oceano', 'Camilla Giordanno', 'quiz', 'os-segredos-que-contei-ao-oceano.jpg', 'https://link.amazon/B01StrwX7', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (19, 'opostos-complementares', 'Opostos Complementares (Opostos Co. Livro 1)', 'Fernanda V.', 'quiz', 'opostos-complementares.jpg', 'https://link.amazon/B0fTuoQV8', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (20, 'cancao-dos-ossos', 'Canção dos Ossos', 'Giu Domingues', 'quiz', 'cancao-dos-ossos.jpg', 'https://link.amazon/B0aYElcl2', 'quiz')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (21, 'os-sete-maridos-de-evelyn-hugo', 'Os sete maridos de Evelyn Hugo', 'Taylor Jenkins Reid', 'sorteio', 'os-sete-maridos-de-evelyn-hugo.jpg', 'https://link.amazon/B0ci4Vbq1', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (22, 'delilah-green-nao-esta-nem-ai', 'Delilah Green não está nem aí (Bright Falls)', 'Ashley Herring Blake', 'sorteio', 'delilah-green-nao-esta-nem-ai.jpg', 'https://link.amazon/B04jA353t', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (23, 'pressagios-do-amor', 'Presságios do amor', 'Alexandria Bellefleur', 'sorteio', 'pressagios-do-amor.jpg', 'https://link.amazon/B056W8BF4', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (24, 'fortuna-e- ascensao', 'Fortuna & Ascensão', 'Marcella M.', 'sorteio', 'fortuna-e- ascensao.jpg', 'https://link.amazon/B0aopido8', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (25, 'o-amor-nao-e-obvio', 'O amor não é óbvio', 'Elayne Baeta', 'sorteio', 'o-amor-nao-e-obvio.jpg', 'https://link.amazon/B0cuzA7YO', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (26, 'sementes-podres', 'Sementes Podres', 'Debora Carvalho', 'sorteio', 'sementes-podres.jpg', 'https://link.amazon/B057ruPlZ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (27, 'ice-quinn', 'Ice Quinn', 'Carol Barra', 'sorteio', 'ice-quinn.jpg', 'https://link.amazon/B02qznLoM', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (28, 'salik-amor-e-ruina', 'Salik: Amor & Ruína', 'Bia R.D. Ramos', 'sorteio', 'salik-amor-e-ruina.jpg', 'https://link.amazon/B0bBabHzi', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (29, 'alem-das-cameras', 'Além das Câmeras', 'Gina Milbradt', 'sorteio', 'alem-das-cameras.jpg', 'https://link.amazon/B0iQ32vab', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (30, 'skips-drops', 'Skips, Drops', 'Tessa Reis', 'sorteio', 'skips-drops.jpg', 'https://link.amazon/B01e9AESA', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (31, 'sem-palavra-de-seguranca', 'Sem palavra de segurança', 'Leila Venturini', 'sorteio', 'sem-palavra-de-seguranca.jpg', 'https://link.amazon/B00QZrBwV', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (32, 'aguas-de-marco', 'Águas de Março', 'Gisele Carvalho e Hannah Kaiser', 'sorteio', 'aguas-de-marco.jpg', 'https://link.amazon/B01qjR1Ii', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (33, 'os-4-espelhos', 'Os 4 Espelhos', 'Marina Porteclis', 'sorteio', 'os-4-espelhos.jpg', 'https://link.amazon/B0bPXOC1h', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (34, 'um-traco-ate-voce', 'Um traço até você', 'Olívia Pilar', 'sorteio', 'um-traco-ate-voce.jpg', 'https://link.amazon/B03O8W0R6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (35, 'herdeiras-de-pedra-e-ar', 'Herdeiras de pedra e ar', 'Mar Freitas', 'sorteio', 'herdeiras-de-pedra-e-ar.jpg', 'https://link.amazon/B0hsZOXsN', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (36, 'ultima-parada', 'Última parada', 'Casey McQuiston', 'sorteio', 'ultima-parada.jpg', 'https://link.amazon/B03JavGBa', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (37, 'vitrine', 'Vitrine: Um contrato pode mudar tudo', 'Ingrid Paranhos', 'sorteio', 'vitrine.jpg', 'https://link.amazon/B06XYVmBg', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (38, 'as-vantagens-de-ser-voce', 'As vantagens de ser você', 'Ray Tavares', 'sorteio', 'as-vantagens-de-ser-voce.jpg', 'https://link.amazon/B0g3Un09w', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (39, 'o-nome-dela-e-sophia', 'O Nome Dela é Sophia', 'Vanessa Freitas', 'sorteio', 'o-nome-dela-e-sophia.jpg', 'https://link.amazon/B0h1b3T05', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (40, 'galaxia-desconhecida', 'Galáxia Desconhecida', 'Raquel Alves', 'sorteio', 'galaxia-desconhecida.jpg', 'https://link.amazon/B02X3X0ul', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (41, 'ela-fica-com-a-garota', 'Ela fica com a garota', 'Rachael Lippincott e Alyson Derrick', 'sorteio', 'ela-fica-com-a-garota.jpg', 'https://link.amazon/B04PSvTjs', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (42, 'borboletas-da-morte', 'Borboletas da Morte', 'Lari Alcantara', 'sorteio', 'borboletas-da-morte.jpg', 'https://link.amazon/B02OJFJgm', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (43, 'alem-do-silencio', 'Além do Silêncio', 'Jéssica Batista', 'sorteio', 'alem-do-silencio.jpg', 'https://link.amazon/B0cf0CiCx', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (44, 'que-a-melhor-mordida-venca', 'Que a melhor mordida vença', 'Rina Rodriguez', 'sorteio', 'que-a-melhor-mordida-venca.jpg', 'https://link.amazon/B08nVTXCG', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (45, 'cerejas-do-inferno', 'Cerejas do inferno', 'Thais Boito', 'sorteio', 'cerejas-do-inferno.jpg', 'https://link.amazon/B07bmVSa1', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (46, 'xeque-mate', 'Xeque-Mate', 'Evelin Sousa', 'sorteio', 'xeque-mate.jpg', 'https://link.amazon/B0gB54D3g', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (47, 'a-beira-de-nos', 'À Beira de Nós', 'Laila Zago', 'sorteio', 'a-beira-de-nos.jpg', 'https://link.amazon/B08k93R1X', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (48, 'garota-de-programa', 'Garota de Programa', 'Rebecca Nobre', 'sorteio', 'garota-de-programa.jpg', 'https://link.amazon/B0cCEh252', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (49, 'dona-do-meu-pecado-ruina', 'Dona do meu pecado', 'Fernanda Moser', 'sorteio', 'dona-do-meu-pecado-ruina.jpg', 'https://link.amazon/B0a1E9oWd', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (50, 'overdrive', 'Overdrive', 'Agatha Menezes', 'sorteio', 'overdrive.jpg', 'https://link.amazon/B0cggcJZt', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (51, 'astrid-parker-nunca-falha', 'Astrid Parker nunca falha (Bright Falls)', 'Ashley Herring Blake', 'sorteio', 'astrid-parker-nunca-falha.jpg', 'https://link.amazon/B0b2BXX3e', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (52, 'iris-kelly-nao-namora', 'Iris Kelly não namora (Bright Falls)', 'Ashley Herring Blake', 'sorteio', 'iris-kelly-nao-namora.jpg', 'https://link.amazon/B0gv8pOcI', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (53, 'so-por-um-verao', 'Só por um verão (Família Lancelloti Livro 1)', 'G.B. Baldassari', 'sorteio', 'so-por-um-verao.jpg', 'https://link.amazon/B013Gv9HT', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (54, 'de-repente-namoradas', '⁠De Repente, Namoradas (Família Lancellotti Livro 2)', 'G.B. Baldassari', 'sorteio', 'de-repente-namoradas.jpg', 'https://link.amazon/B0fotnKAJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (55, 'paixao-platonica', 'Paixão platônica', 'Liliane Reis', 'sorteio', 'paixao-platonica.jpg', 'https://link.amazon/B01efxW70', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (56, 'entre-livros-e-fios-dourados', '⁠Entre Livros e Fios Dourados', 'Lolline Huntar''z', 'sorteio', 'entre-livros-e-fios-dourados.jpg', 'https://link.amazon/B07of9W0q', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (57, 'o-abanar-do-amor', 'O Abanar do Amor', 'Nicoly Pacheco', 'sorteio', 'o-abanar-do-amor.jpg', 'https://link.amazon/B0f4HvhKM', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (58, 'a-melhor-amiga-do-meu-namorado', 'A melhor amiga do meu namorado', 'Carol Cara', 'sorteio', 'a-melhor-amiga-do-meu-namorado.jpg', 'https://link.amazon/B0c9m2QpI', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (59, 'terceiro-croqui', 'Terceiro Croqui (Frutaverso Livro 2)', 'Line Cunha', 'sorteio', 'terceiro-croqui.jpg', 'https://link.amazon/B0hkj4k39', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (60, 'operacao-conves', 'Operação Convés (Frutaverso Livro 3)', 'Line Cunha', 'sorteio', 'operacao-conves.jpg', 'https://link.amazon/B08Pn5mVJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (61, 'princesa-apaixonada', '⁠Princesa apaixonada', 'Clare Lydon', 'sorteio', 'princesa-apaixonada.jpg', 'https://link.amazon/B0gW0gLh8', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (62, 'garotas-de-cristal', 'Garotas de Cristal', 'Nico Baladore', 'sorteio', 'garotas-de-cristal.jpg', 'https://link.amazon/B05zoRLDL', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (63, 'maes-por-acidente', '⁠Mães por Acidente', 'Ju Mesquita', 'sorteio', 'maes-por-acidente.jpg', 'https://link.amazon/B04vBGeuo', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (64, 'cartas-para-pior-garota-do-mundo-ps-eu-te-odeio', '⁠Cartas Para Pior Garota do Mundo: PS: Eu te Odeio', 'Evyn Mota', 'sorteio', 'cartas-para-pior-garota-do-mundo-ps-eu-te-odeio.jpg', 'https://link.amazon/B04YJcE8A', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (65, 'como-seduzir-a-novata', 'Como Seduzir A Novata', 'Helena Vieira', 'sorteio', 'como-seduzir-a-novata.jpg', 'https://link.amazon/B0cFE1NJH', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (66, 'clausula-da-paixao', 'Cláusula da Paixão', 'Madu Oliveira', 'sorteio', 'clausula-da-paixao.jpg', 'https://link.amazon/B08x079rq', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (67, 'patinando-ate-voce', 'Patinando até Você', 'Agatha Menezes', 'sorteio', 'patinando-ate-voce.jpg', 'https://link.amazon/B00NunQDy', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (68, 'proibido-se-apaixonar-de-novo', 'Proibido se apaixonar de novo', 'V.S. Vilela', 'sorteio', 'proibido-se-apaixonar-de-novo.jpg', 'https://link.amazon/B05f82cDM', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (69, 'a-filha-proibida-do-meu-chefe', 'A Filha Proibida do Meu Chefe', 'Lorena Rodrigues', 'sorteio', 'a-filha-proibida-do-meu-chefe.jpg', 'https://link.amazon/B0giLWGbJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (70, 'volte-pra-superficie', 'Volte pra Superfície', 'Victoria Mendes', 'sorteio', 'volte-pra-superficie.jpg', 'https://link.amazon/B03aE147Z', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (71, 'nao-somos-melhores-amigas', '⁠Não somos melhores amigas', 'Vanessa Airalis', 'sorteio', 'nao-somos-melhores-amigas.jpg', 'https://link.amazon/B0dSLFTN8', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (72, 'enfim-esposas', 'Enfim, esposas', 'Vanessa Airalis', 'sorteio', 'enfim-esposas.jpg', 'https://link.amazon/B05wzI32N', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (73, 'opostos-concomitantes', 'Opostos Concomitantes (Opostos Co. Livro 2)', 'Fernanda V.', 'sorteio', 'opostos-concomitantes.jpg', 'https://link.amazon/B0hA8MPQK', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (74, 'opostos-contingentes', '⁠Opostos Contingentes (Opostos Co. Livro 3)', 'Fernanda V.', 'sorteio', 'opostos-contingentes.jpg', 'https://link.amazon/B08V6ouSb', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (75, 'alianca-em-campo-ganhando-o-jogo', '⁠Aliança em Campo: Ganhando o Jogo', 'Nick Martins', 'sorteio', 'alianca-em-campo-ganhando-o-jogo.jpg', 'https://link.amazon/B09z94Ff9', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (76, 'a-sociedade-de-eva-parte-1', '⁠A Sociedade de Eva: Parte I : a dança', 'Mia Perdu', 'sorteio', 'a-sociedade-de-eva-parte-1.jpg', 'https://link.amazon/B0bDngD5Q', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (77, 'a-sociedade-de-eva-parte-2', '⁠A Sociedade de Eva: Parte II: a queda', 'Mia Perdu', 'sorteio', 'a-sociedade-de-eva-parte-2.jpg', 'https://link.amazon/B02bWAANJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (78, 'medusa', 'Medusa', 'Ana França', 'sorteio', 'medusa.jpg', 'https://link.amazon/B0fQVqGkL', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (79, 'ultimo-romance', '⁠Último Romance', 'Thais Rodrigues', 'sorteio', 'ultimo-romance.jpg', 'https://link.amazon/B08Ongwam', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (80, 'monte-belalis', '⁠Monte Belalis', 'Victoria Moon', 'sorteio', 'monte-belalis.jpg', 'https://link.amazon/B0f3CGMWR', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (81, 'retrato-de-amor', '⁠Retrato de Amor', 'Pris Santiago', 'sorteio', 'retrato-de-amor.jpg', 'https://link.amazon/B0gxRAUJd', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (82, 'uma-familia-ao-acaso', '⁠Uma família ao acaso', 'Débora Silva', 'sorteio', 'uma-familia-ao-acaso.jpg', 'https://link.amazon/B05AIsohv', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (83, 'o-trono-de-jasmim', 'O trono de jasmim (Vol. 1 Os Reinos em Chamas)', 'Tasha Suri', 'sorteio', 'o-trono-de-jasmim.jpg', 'https://link.amazon/B071mr0uF', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (84, 'o-cara-que-estou-a-fim-nao-e-um-cara-volume-1', '⁠O cara que estou a fim não é um cara?! - Volume 1', 'Sumiko Arai', 'sorteio', 'o-cara-que-estou-a-fim-nao-e-um-cara-volume-1.jpg', 'https://link.amazon/B05ebJnYN', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (85, 'a-garota-do-mar', '⁠A garota do mar', 'Molly Knox Ostertag', 'sorteio', 'a-garota-do-mar.jpg', 'https://link.amazon/B0dqrP1PM', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (86, 'girls-like-girls', '⁠Girls Like Girls', 'Hayley Kiyoko', 'sorteio', 'girls-like-girls.jpg', 'https://link.amazon/B0cRRvbYi', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (87, 'full-shift', 'Full Shift: A transformação total', 'Jennifer Dugan', 'sorteio', 'full-shift.jpg', 'https://link.amazon/B0iXT6Xwp', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (88, 'jardim-para-duas', '⁠Jardim para duas', 'Mazey Eddings', 'sorteio', 'jardim-para-duas.jpg', 'https://link.amazon/B0i5SQiYk', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (89, 'imogen-obviamente', '⁠Imogen, obviamente', 'Becky Albertalli', 'sorteio', 'imogen-obviamente.jpg', 'https://link.amazon/B0aQp39A7', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (90, 'ninguem-especial', '⁠Ninguém especial', 'Sophie Gonzales', 'sorteio', 'ninguem-especial.jpg', 'https://link.amazon/B0bXVQdha', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (91, 'frases-1', 'Obcecada por mulheres fictícias', NULL, 'frase', 'frases-1.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (92, 'frases-2', 'Fã nº 1 de personagens sáficas trambiqueiras', NULL, 'frase', 'frases-2.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (93, 'frases-3', 'Me pergunte sobre meus livros sáficos favoritos', NULL, 'frase', 'frases-3.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (94, 'frases-4', 'Status: em relacionamento sério com várias personagens sáficas', NULL, 'frase', 'frases-4.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (95, 'frases-5', '0days 0hours 0minutes Since last falling in love with a fictional woman', NULL, 'frase', 'frases-5.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (96, 'ls-1', 'enemies to lovers', NULL, 'ls', 'ls-1.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (97, 'ls-2', 'friends to lovers', NULL, 'ls', 'ls-2.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (98, 'ls-3', 'só tem uma cama', NULL, 'ls', 'ls-3.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (99, 'ls-4', 'grumpy x sunshine', NULL, 'ls', 'ls-4.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (100, 'ls-5', 'found family', NULL, 'ls', 'ls-5.jpeg', NULL, 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (101, 'jogando-no-seu-time', 'Jogando no seu time', 'Meryl Wilsner', 'sorteio', 'jogando-no-seu-time.jpg', 'https://link.amazon/B004FAXiE', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (102, 'matriz-em-risco', 'Matriz em risco', 'Evyn Mota', 'sorteio', 'matriz-em-risco.jpg', 'https://link.amazon/B00gOZSsC', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (103, 'amelia-quem-me-dera', 'Amelia, quem me dera', 'Becky Albertalli', 'sorteio', 'amelia-quem-me-dera.jpg', 'https://link.amazon/B00jRU6en', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (104, 'as-ultimas-sobreviventes', 'As últimas sobreviventes', 'Jennifer Dugan', 'sorteio', 'as-ultimas-sobreviventes.jpg', 'https://link.amazon/B00sk04xV', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (105, 'querida-penelope', 'Querida Penelope', 'Arquelana', 'sorteio', 'querida-penelope.jpg', 'https://link.amazon/B00x4dO36', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (106, 'lost-on-you-destinos-entrelacados-livro-1', 'Lost On You (Destinos Entrelaçados Livro 1)', 'Swyanne Rodriguez', 'sorteio', 'lost-on-you-destinos-entrelacados-livro-1.jpg', 'https://link.amazon/B00yLixQ5', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (107, 'guia-do-namoro-falso', 'Guia do namoro falso', 'Adiba Jaigirdar', 'sorteio', 'guia-do-namoro-falso.jpg', 'https://link.amazon/B013QWJtA', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (108, 'estrela-da-sorte', 'Estrela da sorte', 'Alexandria Bellefleur', 'sorteio', 'estrela-da-sorte.jpg', 'https://link.amazon/B017sbEx5', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (109, 'o-coracao-envenenado', 'O coração envenenado', 'Kalynn Bayron', 'sorteio', 'o-coracao-envenenado.jpg', 'https://link.amazon/B01LazciY', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (110, 'a-maldicao-da-casa-das-flores', 'A Maldição da Casa das Flores', 'Trang Thanh Tran', 'sorteio', 'a-maldicao-da-casa-das-flores.jpg', 'https://link.amazon/B01uqnsjO', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (111, 'voce-vai-lembrar-de-mim', 'Você Vai Lembrar de Mim', 'G.B. Baldassari', 'sorteio', 'voce-vai-lembrar-de-mim.jpg', 'https://link.amazon/B01wtRi1n', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (112, 'a-vida-secreta-de-isabela-esme', 'A vida secreta de Isabela Esme', 'Lis Selwyn', 'sorteio', 'a-vida-secreta-de-isabela-esme.jpg', 'https://link.amazon/B01zMQXG9', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (113, 'duelo-de-damas', 'Duelo de Damas', 'Marina Basso', 'sorteio', 'duelo-de-damas.jpg', 'https://link.amazon/B02ClFU23', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (114, 'se-ela-fosse-minha', 'Se ela fosse minha', 'Alison Cochrun', 'sorteio', 'se-ela-fosse-minha.jpg', 'https://link.amazon/B03bYluQY', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (115, 'nao-importa-o-que-digam', 'Não importa o que digam', 'V.S. Vilela', 'sorteio', 'nao-importa-o-que-digam.jpg', 'https://link.amazon/B03IfxOSd', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (116, 'uma-morte-tao-doce', 'Uma morte tão doce', 'Kayla Cottingham', 'sorteio', 'uma-morte-tao-doce.jpg', 'https://link.amazon/B03VCzIJQ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (117, 'atmosfera-uma-historia-de-amor', 'Atmosfera: Uma história de amor', 'Taylor Jenkins Reid', 'sorteio', 'atmosfera-uma-historia-de-amor.jpg', 'https://link.amazon/B044hiCpB', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (118, 'beijos-com-sabor-de-verao', 'Beijos com sabor de verão', 'Vanessa Freitas', 'sorteio', 'beijos-com-sabor-de-verao.jpg', 'https://link.amazon/B0457CQJ8', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (119, 'a-princesa-e-o-queijo-quente', 'A princesa e o queijo quente', 'Deya Muniz', 'sorteio', 'a-princesa-e-o-queijo-quente.jpg', 'https://link.amazon/B04fvsfP0', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (120, 'a-lista-da-sorte', 'A lista da sorte', 'Rachael Lippincott', 'sorteio', 'a-lista-da-sorte.jpg', 'https://link.amazon/B04giCTKg', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (121, 'o-retorno-de-saturno', 'O retorno de Saturno', 'Debora Carvalho', 'sorteio', 'o-retorno-de-saturno.jpg', 'https://link.amazon/B04jjrFZ6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (122, 'tinha-tudo-para-dar-errado', 'Tinha tudo para dar errado', 'G.B. Baldassari', 'sorteio', 'tinha-tudo-para-dar-errado.jpg', 'https://link.amazon/B053EF7n6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (123, 'wounds-o-veu-do-arcano', 'WOUNDS - O Véu do Arcano', 'Danda Odeleci', 'sorteio', 'wounds-o-veu-do-arcano.jpg', 'https://link.amazon/B05irfM29', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (124, 'me-chame-quando-puder', 'Me Chame Quando Puder', 'Englantine', 'sorteio', 'me-chame-quando-puder.jpg', 'https://link.amazon/B061d4Npl', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (125, 'oxe-baby', 'Oxe, baby', 'Elayne Baeta', 'sorteio', 'oxe-baby.jpg', 'https://link.amazon/B06gslCHJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (126, 'orgulho-e-preconceito-e-nos-duas', 'Orgulho e preconceito e nós duas', 'Rachael Lippincott', 'sorteio', 'orgulho-e-preconceito-e-nos-duas.jpg', 'https://link.amazon/B06lgfoAS', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (127, 'nas-entrelinhas', 'Nas Entrelinhas', 'Helena Nolasco', 'sorteio', 'nas-entrelinhas.jpg', 'https://link.amazon/B06oZJeT9', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (128, 'foi-mal-cara', 'Foi mal, cara', 'Taleen Voskuni', 'sorteio', 'foi-mal-cara.jpg', 'https://link.amazon/B06P1M3DO', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (129, 'um-amor-para-esquentar', 'Um Amor Para Esquentar', 'Emely Luiza Curcio', 'sorteio', 'um-amor-para-esquentar.jpg', 'https://link.amazon/B06zrEQDx', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (130, 'a-um-sim-de-voce', 'A um sim de você', 'Zey Shelsea', 'sorteio', 'a-um-sim-de-voce.jpg', 'https://link.amazon/B072h9Z9A', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (131, 'algumas-garotas-sao-assim', 'Algumas garotas são assim', 'Jennifer Dugan', 'sorteio', 'algumas-garotas-sao-assim.jpg', 'https://link.amazon/B07GGCdpC', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (132, 'nunca-confie-em-uma-geminiana', 'Nunca confie em uma geminiana', 'Freja Nicole Woolf', 'sorteio', 'nunca-confie-em-uma-geminiana.jpg', 'https://link.amazon/B087f8UFd', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (133, 'e-assim-que-se-perde-a-guerra-do-tempo', 'É assim que se perde a guerra do tempo', 'Amal El-Mohtar, Max Gladstone', 'sorteio', 'e-assim-que-se-perde-a-guerra-do-tempo.jpg', 'https://link.amazon/B088PHIey', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (134, 'o-centro-de-todo-o-caos', 'O Centro de Todo o Caos', 'Marina Feijóo', 'sorteio', 'o-centro-de-todo-o-caos.jpg', 'https://link.amazon/B08abdNji', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (135, 'presas', 'Presas', 'Debora Carvalho', 'sorteio', 'presas.jpg', 'https://link.amazon/B08aRNkvU', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (136, 'lembre-se-de-nos', 'Lembre-se de nós', 'Alyson Derrick', 'sorteio', 'lembre-se-de-nos.jpg', 'https://link.amazon/B08B4fMHG', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (137, 'fragmento', 'Fragmento', 'Andremis', 'sorteio', 'fragmento.jpg', 'https://link.amazon/B08fBJQ7s', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (138, 'ela-nao-e-tudo-isso', 'Ela (não) é tudo isso', 'Carol Cara', 'sorteio', 'ela-nao-e-tudo-isso.jpg', 'https://link.amazon/B08Gtm70U', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (139, 'todas-as-flores-que-eu-nao-te-dei', 'Todas as flores que eu não te dei', 'Sam Macedo', 'sorteio', 'todas-as-flores-que-eu-nao-te-dei.jpg', 'https://link.amazon/B08oXlode', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (140, 'eu-que-nao-amo-voce', 'Eu que não amo você', 'Mar Freitas', 'sorteio', 'eu-que-nao-amo-voce.jpg', 'https://link.amazon/B090YhO0f', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (141, 'as-bruxas-de-lugar-nenhum-entreveu-livro-1', 'As Bruxas de Lugar Nenhum: Entrevéu - Livro 1', 'Denise Flaibam', 'sorteio', 'as-bruxas-de-lugar-nenhum-entreveu-livro-1.jpg', 'https://link.amazon/B0970Ai94', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (142, 'o-toque-do-seu-olhar', 'O toque do seu olhar', 'Liliane Reis', 'sorteio', 'o-toque-do-seu-olhar.jpg', 'https://link.amazon/B09qElCpn', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (143, 'falha-critica-no-amor', 'Falha crítica no amor', 'Debora Carvalho', 'sorteio', 'falha-critica-no-amor.jpg', 'https://link.amazon/B09qVNH0I', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (144, 'vai-sonhando-ramona-riley', 'Vai sonhando, Ramona Riley', 'Ashley Herring Blake', 'sorteio', 'vai-sonhando-ramona-riley.jpg', 'https://link.amazon/B09uHXAhw', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (145, 'gideon', 'Gideon, a Nona: Saga do túmulo trancafiado', 'Tamsyn Muir', 'sorteio', 'gideon.jpg', 'https://link.amazon/B09ZMBaPF', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (146, 'coisas-obvias-sobre-o-amor', 'Coisas óbvias sobre o amor', 'Elayne Baeta', 'sorteio', 'coisas-obvias-sobre-o-amor.jpg', 'https://link.amazon/B0a2dGI1r', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (147, 'a-noite-passada-no-telegraph-club', 'A noite passada no Telegraph Club', 'Malinda Lo', 'sorteio', 'a-noite-passada-no-telegraph-club.jpg', 'https://link.amazon/B0a38jg62', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (148, 'bala-no-alvo-dente-de-leao', 'Bala no Alvo, Dente de Leão', 'Giu Domigues', 'sorteio', 'bala-no-alvo-dente-de-leao.jpg', 'https://link.amazon/B0a519xy5', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (149, 'esposa-de-mentira', 'Esposa de mentira', 'Zey Shelsea', 'sorteio', 'esposa-de-mentira.jpg', 'https://link.amazon/B0acYm4Gm', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (150, 'a-ultima-cancao-de-amor', 'A última canção de amor', 'Kalie Holford', 'sorteio', 'a-ultima-cancao-de-amor.jpg', 'https://link.amazon/B0aDpQa8G', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (151, 'yerba-buena', 'Yerba Buena', 'Nina LaCour', 'sorteio', 'yerba-buena.jpg', 'https://link.amazon/B0al0VN1Y', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (152, 'ate-ela-dizer-sim', 'Até ela dizer sim', 'Laura Alves', 'sorteio', 'ate-ela-dizer-sim.jpg', 'https://link.amazon/B0aSdkpVi', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (153, 'eles-odeiam-garotas-como-nos', 'Eles ODEIAM garotas como nós', 'Yasmim Mahmud Kader', 'sorteio', 'eles-odeiam-garotas-como-nos.jpg', 'https://link.amazon/B0aXvUN2g', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (154, 'conectadas', 'Conectadas', 'Clara Alves', 'sorteio', 'conectadas.jpg', 'https://link.amazon/B0aXyVU6r', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (155, 'belas-armadilhas', 'Belas Armadilhas', 'Carol Cara, Liliane Reis', 'sorteio', 'belas-armadilhas.jpg', 'https://link.amazon/B0b5LDyXp', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (156, 'diario-de-bordo-de-uma-impostora', 'Diário de Bordo de uma Impostora', 'G.B. Baldassari', 'sorteio', 'diario-de-bordo-de-uma-impostora.jpg', 'https://link.amazon/B0b657M15', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (157, 'os-perigos-de-brincar-com-fogo', 'Os perigos de brincar com fogo', 'Debora Carvalho', 'sorteio', 'os-perigos-de-brincar-com-fogo.jpg', 'https://link.amazon/B0bGSf5b9', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (158, 'o-que-voce-faz-aqui-heather', 'O que você faz aqui, Heather?', 'Golden Faery', 'sorteio', 'o-que-voce-faz-aqui-heather.jpg', 'https://link.amazon/B0bn8NIEd', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (159, 'shangrila', 'Shangrilá', 'Marina Porteclis', 'sorteio', 'shangrila.jpg', 'https://link.amazon/B0bNHwBMq', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (160, 'sal', 'Sal', 'Tessa Reis', 'sorteio', 'sal.jpg', 'https://link.amazon/B0bweWrfy', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (161, 'romance-real', 'Romance real', 'Clara Alves', 'sorteio', 'romance-real.jpg', 'https://link.amazon/B0bZG92Xs', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (162, 'anotacoes-do-amor', 'Anotações do Amor', 'Emely Luiza Curcio', 'sorteio', 'anotacoes-do-amor.jpg', 'https://link.amazon/B0chIKAjX', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (163, 'todo-tempo-do-mundo', 'Todo tempo do mundo', 'Lis Selwyn', 'sorteio', 'todo-tempo-do-mundo.jpg', 'https://link.amazon/B0cUENXVI', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (164, 'feras-em-campo', 'Feras em campo', 'Luisa Landre', 'sorteio', 'feras-em-campo.jpg', 'https://link.amazon/B0cvHLL07', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (165, 'tristeza', 'Tristeza', 'Vanessa Freitas', 'sorteio', 'tristeza.jpg', 'https://link.amazon/B0cZQsY8i', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (166, 'me-encontre-a-meia-noite', 'Me encontre a meia-noite', 'Victoria Mendes', 'sorteio', 'me-encontre-a-meia-noite.jpg', 'https://link.amazon/B0dbORbGn', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (167, 'segundo-ato', 'Segundo ato', 'Brenda Borges', 'sorteio', 'segundo-ato.jpg', 'https://link.amazon/B0dmDQ3T9', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (168, 'sangue-fresco', 'Sangue fresco', 'Sasha Laurens', 'sorteio', 'sangue-fresco.jpg', 'https://link.amazon/B0dPkKsqc', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (169, 'a-cortesa', 'A Cortesã', 'I.K. Prado', 'sorteio', 'a-cortesa.jpg', 'https://link.amazon/B0dVuaqLV', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (170, 'o-outro-lado-do-paraiso', 'O Outro Lado do Paraíso', 'Ana França', 'sorteio', 'o-outro-lado-do-paraiso.jpg', 'https://link.amazon/B0e5DaHv6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (171, 'carmilla-a-vampira-de-karnstein', 'Carmilla: A Vampira de Karnstein', 'Sheridan Le Fanu', 'sorteio', 'carmilla-a-vampira-de-karnstein.jpg', 'https://link.amazon/B0e5vS7Te', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (172, 'o-refugio-inquebravel-das-memorias-em-ruinas', 'O Refúgio Inquebrável das Memórias em Ruínas', 'Mariana Rosa', 'sorteio', 'o-refugio-inquebravel-das-memorias-em-ruinas.jpg', 'https://link.amazon/B0e6ndVLn', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (173, 'memorias-de-um-amor-inesperado', 'Memórias de um amor inesperado', 'Ciara Smyth', 'sorteio', 'memorias-de-um-amor-inesperado.jpg', 'https://link.amazon/B0eGG3imi', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (174, 'as-cartas', 'A(s) Carta(s)', 'Tori Lopes', 'sorteio', 'as-cartas.jpg', 'https://link.amazon/B0epn1oF0', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (175, 'eu-beijei-shara-wheeler', 'Eu beijei Shara Wheeler', 'Casey McQuiston', 'sorteio', 'eu-beijei-shara-wheeler.jpg', 'https://link.amazon/B0eQVCiJE', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (176, 'dentada', 'Dentada', 'Tessa Reis', 'sorteio', 'dentada.jpg', 'https://link.amazon/B0fBSXg8m', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (177, 'algoritmos-de-uma-paixao', 'Algoritmos de Uma Paixão', 'Victoria Moon', 'sorteio', 'algoritmos-de-uma-paixao.jpg', 'https://link.amazon/B0fjU23X4', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (178, 'enterrem-nossos-ossos-a-meia-noite', 'Enterrem nossos ossos à meia-noite', 'V. E. Schwab', 'sorteio', 'enterrem-nossos-ossos-a-meia-noite.jpg', 'https://link.amazon/B0g3ivw3f', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (179, 'a-tentacao-da-ruina-obscura', 'A Tentação da Ruína Obscura', 'Mariana Rosa', 'sorteio', 'a-tentacao-da-ruina-obscura.jpg', 'https://link.amazon/B0g6gVZE3', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (180, 'seis-vezes-em-que-a-gente-quase-ficou-e-uma-em-que-rolou', 'Seis vezes em que a gente quase ficou (e uma em que rolou)', 'Tess Sharpe', 'sorteio', 'seis-vezes-em-que-a-gente-quase-ficou-e-uma-em-que-rolou.jpg', 'https://link.amazon/B0g6KuMmX', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (181, 'maldicao-para-duas', 'Maldição para duas', 'Victoria Mendes', 'sorteio', 'maldicao-para-duas.jpg', 'https://link.amazon/B0gn65k0m', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (182, 'o-encontro-dos-sois', 'O encontro dos sóis', 'Carol Barra', 'sorteio', 'o-encontro-dos-sois.jpg', 'https://link.amazon/B0grpGQJn', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (183, 'voce-e-minha-musa', 'Você é Minha Musa', 'Liliane Reis', 'sorteio', 'voce-e-minha-musa.jpg', 'https://link.amazon/B0gWivKUh', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (184, 'completely', 'Completely', 'Golden Faery', 'sorteio', 'completely.jpg', 'https://link.amazon/B0gWiXRvu', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (185, 'cool-for-the-summer', 'Cool for the summer', 'Dahlia Adler', 'sorteio', 'cool-for-the-summer.jpg', 'https://link.amazon/B0gxnOMTV', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (186, 'minha-colega-de-quarto-e-uma-vampira', 'Minha Colega De Quarto É Uma Vampira', 'Ana França', 'sorteio', 'minha-colega-de-quarto-e-uma-vampira.jpg', 'https://link.amazon/B0hh45D70', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (187, 'corrompidas', 'Corrompidas', 'Kimmcharlie', 'sorteio', 'corrompidas.jpg', 'https://link.amazon/B0hjLreVS', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (188, 'dando-o-que-falar', 'Dando o que falar', 'Meryl Wilsner', 'sorteio', 'dando-o-que-falar.jpg', 'https://link.amazon/B0ho9SkvG', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (189, 'entre-flocos-de-neve', 'Entre Flocos de Neve', 'Raquel Alves', 'sorteio', 'entre-flocos-de-neve.jpg', 'https://link.amazon/B0hUBBk0D', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (190, 'tudo-que-ela-me-disse', 'Tudo que ela me disse', 'Bia Crespo', 'sorteio', 'tudo-que-ela-me-disse.jpg', 'https://link.amazon/B0iAX7Urx', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (191, 'pegas-de-surpresa', 'Pegas de Surpresa', 'Adiba Jaigirdar', 'sorteio', 'pegas-de-surpresa.jpg', 'https://link.amazon/B0iFIzeFY', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (192, 'recomenda-se-andar-acompanhada', 'Recomenda-se Andar Acompanhada', 'Tálita Heusi', 'sorteio', 'recomenda-se-andar-acompanhada.jpg', 'https://link.amazon/B0ipeMqlG', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (193, 'as-tres-tarefas-de-cristina-ribeiro-de-castro', 'As três tarefas de Cristina Ribeiro de Castro', 'Laura Pohl', 'sorteio', 'as-tres-tarefas-de-cristina-ribeiro-de-castro.jpg', 'https://link.amazon/B0jlYgAca', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (194, 'matalobos', 'Matalobos', 'Jules K. Florian', 'loja', 'matalobos.jpg', 'https://link.amazon/B00bzQtlv', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (195, 'de-frente-para-o-amor', 'De Frente Para O Amor', 'Emely Luiza Curcio', 'loja', 'de-frente-para-o-amor.jpg', 'https://link.amazon/B00c7Eoww', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (196, 'acordo-entre-amantes', 'Acordo Entre Amantes', 'Liliane Reis', 'loja', 'acordo-entre-amantes.jpg', 'https://link.amazon/B00dCDMUF', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (197, 'cinco-minutos', 'Cinco Minutos', 'Ingrid Paranhos', 'loja', 'cinco-minutos.jpg', 'https://link.amazon/B00FdYk3l', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (198, 'sob-os-tracos-da-paixao', 'Sob os traços da paixão', 'Zey Shelsea', 'loja', 'sob-os-tracos-da-paixao.jpg', 'https://link.amazon/B00vDcqlz', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (199, 'o-preco-da-escuridao', 'O Preço da Escuridão', 'Danda Odeleci', 'loja', 'o-preco-da-escuridao.jpg', 'https://link.amazon/B015ngQ0P', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (200, 'havana', 'Havana', 'Tessa Reis', 'loja', 'havana.jpg', 'https://link.amazon/B01ahoP1b', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (201, 'imisturaveis', 'Imisturáveis', 'Kimmcharlie', 'loja', 'imisturaveis.jpg', 'https://link.amazon/B01na1VjJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (202, 'amor-imprevisivel', 'Amor Imprevisível', 'Jess Lim', 'loja', 'amor-imprevisivel.jpg', 'https://link.amazon/B01OAdaCU', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (203, 'entre-sombras-e-verdades', 'Entre sombras e verdades', 'Debora Carvalho', 'loja', 'entre-sombras-e-verdades.jpg', 'https://link.amazon/B01ObC7P4', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (204, 'carmilla-fascinio-ebrio', 'Carmilla: Fascínio Ébrio', 'Mandy Vieira', 'loja', 'carmilla-fascinio-ebrio.jpg', 'https://link.amazon/B020aMl5w', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (205, 'apenas-por-uma-noite', 'Apenas por uma noite', 'Zey Shelsea', 'loja', 'apenas-por-uma-noite.jpg', 'https://link.amazon/B021NAOMB', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (206, 'a-unica-escolha-possivel', 'A única escolha possível', 'Carol Barra', 'loja', 'a-unica-escolha-possivel.jpg', 'https://link.amazon/B023vxFrU', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (207, 'a-lenda-da-sereia-2', 'A lenda da sereia: 2', 'Clara Alves', 'loja', 'a-lenda-da-sereia-2.jpg', 'https://link.amazon/B02CpL7Bv', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (208, 'de-admiradora-nada-secreta', 'De: Admiradora Nada Secreta', 'Tori Lopes', 'loja', 'de-admiradora-nada-secreta.jpg', 'https://link.amazon/B02GZHLpL', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (209, 'asas-negras', 'Asas Negras', 'Debora Carvalho', 'loja', 'asas-negras.jpg', 'https://link.amazon/B02i0ZbUI', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (210, 'como-sabotar-mia-espinosa', 'Como sabotar Mia Espinosa', 'Carol Cara, Liliane Reis', 'loja', 'como-sabotar-mia-espinosa.jpg', 'https://link.amazon/B02nNzKIP', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (211, 'nem-todos-os-beijos-tem-gosto-de-inverno', 'Nem todos os beijos têm gosto de inverno', 'Yasmim Mahmud Kader', 'loja', 'nem-todos-os-beijos-tem-gosto-de-inverno.jpg', 'https://link.amazon/B02RohYpY', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (212, 'um-acordo-de-dois-coracoes', 'Um acordo de dois coracões', 'Zey Shelsea, Yas Oliveira', 'loja', 'um-acordo-de-dois-coracoes.jpg', 'https://link.amazon/B02yh86Gm', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (213, 'o-espelho-da-lua', 'O Espelho da Lua', 'Jia Monure', 'loja', 'o-espelho-da-lua.jpg', 'https://link.amazon/B032QtS6N', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (214, 'a-garota-do-laco-vermelho', 'A Garota do Laço Vermelho', 'Isabella Pereira', 'loja', 'a-garota-do-laco-vermelho.jpg', 'https://link.amazon/B034tyx7f', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (215, 'eufonia', 'Eufonia', 'Englantine', 'loja', 'eufonia.jpg', 'https://link.amazon/B037oBin9', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (216, 'nuclea-a-queda-das-coroas-ancestrais', 'Nucléa: a queda das coroas ancestrais', 'Bia Freitas', 'loja', 'nuclea-a-queda-das-coroas-ancestrais.jpg', 'https://link.amazon/B038l03OJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (217, 'isso-nao-e-um conto-de-fadas', 'Isso não é um conto de fadas', 'I.K. Prado', 'loja', 'isso-nao-e-um conto-de-fadas.jpg', 'https://link.amazon/B03AriqA6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (218, 'dramaticos', 'Dramáticos', 'Giu Nascimento, Jús Saraiva, Sol Alessandri,Thaís Berlanga, Luca Vasconcelos, Turí, Sol Braga', 'loja', 'dramaticos.jpg', 'https://link.amazon/B03Bef6Sc', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (219, 'noturnas-e-natalinas', 'Noturnas e natalinas', 'Luisa Landre', 'loja', 'noturnas-e-natalinas.jpg', 'https://link.amazon/B03v3vEWz', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (220, 'primavera-de-cinzas', 'Primavera de Cinzas', 'Larissa Ferrioli', 'loja', 'primavera-de-cinzas.jpg', 'https://link.amazon/B03VOw4cP', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (221, 'fogo-cruzado', 'Fogo Cruzado', 'Carol Barra', 'loja', 'fogo-cruzado.jpg', 'https://link.amazon/B03XePKJL', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (222, 'valentina', 'Valentina', 'Lis Selwyn', 'loja', 'valentina.jpg', 'https://link.amazon/B04aoeBaR', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (223, 'mesa-pra-duas', 'Mesa Pra Duas', 'Alexia', 'loja', 'mesa-pra-duas.jpg', 'https://link.amazon/B04iNjhWt', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (224, 'lie-for-you-destinos-entrelacados-livro-2', 'Lie For You (Destinos Entrelaçados Livro 2)', 'Swyanne Rodriguez', 'loja', 'lie-for-you-destinos-entrelacados-livro-2.jpg', 'https://link.amazon/B04jKQdeg', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (225, 'o-melhor-erro-da-minha-vida', 'O melhor erro da minha vida', 'Zey Shelsea', 'loja', 'o-melhor-erro-da-minha-vida.jpg', 'https://link.amazon/B04LrAgkr', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (226, 'o-triangulo', 'O Triângulo', 'Carol Rutz', 'loja', 'o-triangulo.jpg', 'https://link.amazon/B04MgFE1j', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (227, 'nao-quero-ser-princesa', 'Não Quero Ser Princesa', 'Sarah Oliveira', 'loja', 'nao-quero-ser-princesa.jpg', 'https://link.amazon/B04mqyULW', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (228, 'quando-sol-e-lua-se-apaixonam', 'Quando Sol e Lua se Apaixonam', 'Golden Faery', 'loja', 'quando-sol-e-lua-se-apaixonam.jpg', 'https://link.amazon/B04QPX3OI', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (229, 'fios-de-sangue', 'Fios de sangue', 'Luisa Landre', 'loja', 'fios-de-sangue.jpg', 'https://link.amazon/B04TW4DQG', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (230, 'o-sol-depois-da-chuva', 'O Sol Depois Da Chuva', 'Tori Lopes', 'loja', 'o-sol-depois-da-chuva.jpg', 'https://link.amazon/B04y5yzsr', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (231, 'as-bruxas-de-lugar-nenhum-o-selo-livro-2', 'As Bruxas de Lugar Nenhum: O Selo - Livro 2', 'Denise Flaibam', 'loja', 'as-bruxas-de-lugar-nenhum-o-selo-livro-2.jpg', 'https://link.amazon/B05q7jUlr', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (232, 'eu-me-rendo-e-me-entrego-ate-depois-do-fim', 'Eu Me Rendo E Me Entrego até depois do fim', 'Márcia Camargo', 'loja', 'eu-me-rendo-e-me-entrego-ate-depois-do-fim.jpg', 'https://link.amazon/B05UIeqLR', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (233, 'quarto-119', 'Quarto 119', 'Raquel Alves', 'loja', 'quarto-119.jpg', 'https://link.amazon/B061nQJ9R', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (234, 'mil-coracoes-por-um-reino', 'Mil Corações por um Reino', 'Yasmim Mahmud Kader', 'loja', 'mil-coracoes-por-um-reino.jpg', 'https://link.amazon/B06cnrdix', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (235, 'uma-mulher-pra-chamar-de-minha', 'Uma mulher pra chamar de minha', 'Thais Rodrigues', 'loja', 'uma-mulher-pra-chamar-de-minha.jpg', 'https://link.amazon/B06CSQ3DH', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (236, 'o-toque-letal-do-corvo', 'O Toque Letal do Corvo', 'Mariana Rosa', 'loja', 'o-toque-letal-do-corvo.jpg', 'https://link.amazon/B06F7RvL7', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (237, 'sou-tudo-o-que-você-não-precisa', 'Sou tudo o que você (não) precisa', 'V.S. Vilela', 'loja', 'sou-tudo-o-que-você-não-precisa.jpg', 'https://link.amazon/B06JTmSgt', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (238, 'heartstaker', 'Heartstaker', 'Victoria Mendes', 'loja', 'heartstaker.jpg', 'https://link.amazon/B06lMtSYG', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (239, '25-de-outubro-o-preco-de-um-unico-dia', '25 de Outubro: O preço de um único dia', 'Emely Luiza Curcio', 'loja', '25-de-outubro-o-preco-de-um-unico-dia.jpg', 'https://link.amazon/B06MNs2Hm', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (240, 'inimigas-secretas', 'Inimigas Secretas', 'Ju Mesquita', 'loja', 'inimigas-secretas.jpg', 'https://link.amazon/B06NNk8we', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (241, '24-horas-para-nao-se-apaixonar', '24 horas para não se apaixonar', 'Helena Nolasco, Milly Ricardo', 'loja', '24-horas-para-nao-se-apaixonar.jpg', 'https://link.amazon/B07BgIoLU', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (242, 'stupid-wife-lembre-se-de-nos', 'Stupid Wife: Lembre-se de Nós', 'Sodré', 'loja', 'stupid-wife-lembre-se-de-nos.jpg', 'https://link.amazon/B07Gmppl3', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (243, 'aguas-de-marco-vol-2', 'Águas de Março, vol.2', 'Gisele Cerqueira, Hannah Kaiser', 'loja', 'aguas-de-marco-vol-2.jpg', 'https://link.amazon/B08EA96yg', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (244, 'um-milhao-de-maneiras-de-cacar-voce', 'Um milhão de maneiras de caçar você', 'Denise Flaibam', 'loja', 'um-milhao-de-maneiras-de-cacar-voce.jpg', 'https://link.amazon/B08hRGhaT', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (245, 'pausa-para-respirar', 'Pausa para Respirar', 'Liliane Reis', 'loja', 'pausa-para-respirar.jpg', 'https://link.amazon/B08spB9AG', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (246, 'alegoria', 'Alegoria', 'Danda Odeleci', 'loja', 'alegoria.jpg', 'https://link.amazon/B08V3TV8c', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (247, 'procura-se', 'Procura-se', 'Tattah Nascimento', 'loja', 'procura-se.jpg', 'https://link.amazon/B08WCN5A8', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (248, 'o-destino-de-tilda', 'O Destino de Tilda', 'Denise Flaibam', 'loja', 'o-destino-de-tilda.jpg', 'https://link.amazon/B09bHdwkm', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (249, 'como-seduzir-a-capita', 'Como Seduzir a Capitã', 'Sarah Oliveira', 'loja', 'como-seduzir-a-capita.jpg', 'https://link.amazon/B09GDoPwm', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (250, 'o-destino-da-sereia-3', 'O destino da sereia: 3', 'Clara Alves', 'loja', 'o-destino-da-sereia-3.jpg', 'https://link.amazon/B09gUXCWk', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (251, 'caso-perdido', 'Caso Perdido', 'Victoria Moon', 'loja', 'caso-perdido.jpg', 'https://link.amazon/B09HhiHdh', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (252, 'dona-do-meu-pecado-recomeço', 'Dona do meu pecado - Recomeço', 'Fernanda Moser', 'loja', 'dona-do-meu-pecado-recomeço.jpg', 'https://link.amazon/B0a1btptN', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (253, 'boas-maneiras', 'Boas Maneiras', 'Englantine', 'loja', 'boas-maneiras.jpg', 'https://link.amazon/B0ad7C58n', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (254, 'quebrando-as-nossas-regras', 'Quebrando as nossas regras', 'Lari Alcantara', 'loja', 'quebrando-as-nossas-regras.jpg', 'https://link.amazon/B0aDxszBF', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (255, 'entre-sussurros', 'Entre Sussurros', 'Brenda Borges', 'loja', 'entre-sussurros.jpg', 'https://link.amazon/B0ahda1UC', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (256, 'a-farsa-de-laura-beatriz', 'A Farsa de Laura Beatriz', 'Victoria Moon', 'loja', 'a-farsa-de-laura-beatriz.jpg', 'https://link.amazon/B0akoiJXn', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (257, 'sobre-namoradas-e-lobos', 'Sobre Namoradas e Lobos', 'Marina Feijóo', 'loja', 'sobre-namoradas-e-lobos.jpg', 'https://link.amazon/B0aMoID7l', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (258, 'salik-amor-ruina', 'Salik: Amor & Ruína', 'Bia R.D. Ramos', 'loja', 'salik-amor-ruina.jpg', 'https://link.amazon/B0aqpV1y5', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (259, 'a-profecia-da-sereia-1', 'A profecia da sereia: 1', 'Clara Alves', 'loja', 'a-profecia-da-sereia-1.jpg', 'https://link.amazon/B0aV8AOtB', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (260, 'atlas', 'ATLAS', 'Carol Cara', 'loja', 'atlas.jpg', 'https://link.amazon/B0b1HsQXl', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (261, 'eco-de-nos', 'Eco de nós', 'Evyn Mota', 'loja', 'eco-de-nos.jpg', 'https://link.amazon/B0b6VwHEC', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (262, 'o-corpo-na-cozinha', 'O Corpo na Cozinha', 'Vanessa Freitas', 'loja', 'o-corpo-na-cozinha.jpg', 'https://link.amazon/B0b8gdFpQ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (263, 'traicao-segredos-e-mentiras', 'Traição, Segredos e Mentiras', 'Emely Luiza Curcio', 'loja', 'traicao-segredos-e-mentiras.jpg', 'https://link.amazon/B0ba3k5x0', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (264, 'a-pior-das-boas-ideias', 'A pior das boas ideias', 'V.S. Vilela', 'loja', 'a-pior-das-boas-ideias.jpg', 'https://link.amazon/B0bCeSQcE', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (265, 'fantasma-da-meia-noite', 'Fantasma Da Meia-Noite', 'Tori Lopes', 'loja', 'fantasma-da-meia-noite.jpg', 'https://link.amazon/B0bgMEs7M', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (266, 'venenosas', 'Venenosas', 'Ana França', 'loja', 'venenosas.jpg', 'https://link.amazon/B0biCeowH', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (267, 'polaris', 'Polaris', 'Giu Nascimento', 'loja', 'polaris.jpg', 'https://link.amazon/B0bpbUwjy', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (268, 'odio-carmesim', 'Ódio Carmesim', 'Swyanne Rodriguez', 'loja', 'odio-carmesim.jpg', 'https://link.amazon/B0bpdZxeB', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (269, 'first-class', 'First Class', 'Tessa Reis', 'loja', 'first-class.jpg', 'https://link.amazon/B0bPECHse', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (270, 'a-princesa-que-eu-sempre-quis', 'A princesa que eu sempre quis', 'Vanessa Freitas', 'loja', 'a-princesa-que-eu-sempre-quis.jpg', 'https://link.amazon/B0br3jJUY', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (271, 'sementes-divinas', 'Sementes Divinas', 'Debora Carvalho', 'loja', 'sementes-divinas.jpg', 'https://link.amazon/B0bxyZSfl', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (272, 'fora-de-campo', 'Fora de campo', 'D. Barreto', 'loja', 'fora-de-campo.jpg', 'https://link.amazon/B0bZfHNl3', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (273, 'sob-nova-direcao', 'Sob Nova Direção', 'Englantine', 'loja', 'sob-nova-direcao.jpg', 'https://link.amazon/B0ciNIDG2', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (274, 'a-guarda-costas-parte-1', 'A Guarda-Costas: Parte I', 'G.B. Baldassari', 'loja', 'a-guarda-costas-parte-1.jpg', 'https://link.amazon/B0cITOsWM', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (275, 'as-regras-do-jogo', 'As regras do jogo', 'Arquelana', 'loja', 'as-regras-do-jogo.jpg', 'https://link.amazon/B0cm7egoh', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (276, 'a-ultima-luz-do-verao', 'A Última Luz do Verão', 'Gina Milbradt', 'loja', 'a-ultima-luz-do-verao.jpg', 'https://link.amazon/B0cpDl47c', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (277, 'crimes-do-amor', 'Crimes do Amor', 'Tattah Nascimento', 'loja', 'crimes-do-amor.jpg', 'https://link.amazon/B0d6taq9X', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (278, 'amor-improvisado', 'Amor Improvisado', 'Jess Lim', 'loja', 'amor-improvisado.jpg', 'https://link.amazon/B0dEAIkd4', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (279, 'imperfectely', 'Imperfectely', 'Golden Faery', 'loja', 'imperfectely.jpg', 'https://link.amazon/B0dI2yOn5', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (280, 'como-amar-uma-rainha', 'Como Amar uma Rainha', 'Milly Ricardo', 'loja', 'como-amar-uma-rainha.jpg', 'https://link.amazon/B0dT3w73K', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (281, 'garotas-boas-tambem-queimam', 'Garotas boas também queimam', 'Victoria Mendes', 'loja', 'garotas-boas-tambem-queimam.jpg', 'https://link.amazon/B0eAfDyg8', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (282, 'ponto-sem-no', 'Ponto sem nó', 'Ingrid Paranhos', 'loja', 'ponto-sem-no.jpg', 'https://link.amazon/B0efMuvqV', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (283, 'os-que-esperam-nas-sombras', 'Os Que Esperam Nas Sombras', 'Jules K. Florian', 'loja', 'os-que-esperam-nas-sombras.jpg', 'https://link.amazon/B0ejV7GKC', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (284, 'pink-lemonade', 'Pink Lemonade', 'G.B. Baldassari', 'loja', 'pink-lemonade.jpg', 'https://link.amazon/B0jlmOBSj', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (285, 'um-noivado-de-farsa-para-sofia', 'Um noivado de farsa para Sofia', 'Helena Nolasco', 'loja', 'um-noivado-de-farsa-para-sofia.jpg', 'https://link.amazon/B0emezUyB', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (286, 'eu-so-quero-ser-sua', 'Eu só quero ser sua', 'Liliane Reis', 'loja', 'eu-so-quero-ser-sua.jpg', 'https://link.amazon/B0eNmH77E', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (287, 'as-paginas-de-um-desejo-proibido', 'As Páginas de um Desejo Proibido', 'Mariana Rosa', 'loja', 'as-paginas-de-um-desejo-proibido.jpg', 'https://link.amazon/B0jaKgck6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (288, 'todas-as-verdades-que-eu-nao-te-disse', 'Todas as verdades que eu não te disse', 'D. Barreto', 'loja', 'todas-as-verdades-que-eu-nao-te-disse.jpg', 'https://link.amazon/B0eSZovXB', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (289, 'fique-comigo-para-o-jantar', 'Fique comigo para o jantar', 'I.K. Prado', 'loja', 'fique-comigo-para-o-jantar.jpg', 'https://link.amazon/B0euJmqZD', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (290, 'entre-beijos-e-flechas', 'Entre beijos e flechas', 'Vanessa Freitas', 'loja', 'entre-beijos-e-flechas.jpg', 'https://link.amazon/B0ey353aX', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (291, 'a-garota-que-eu-nunca-esqueci', 'A garota que eu nunca esqueci', 'Carol Cara, Liliane Reis', 'loja', 'a-garota-que-eu-nunca-esqueci.jpg', 'https://link.amazon/B0ezW5Ai5', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (292, 'antes-do-sim', 'Antes do sim', 'Nicole Oliveira', 'loja', 'antes-do-sim.jpg', 'https://link.amazon/B0f0DQMnx', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (293, 'garotas-como-eu', 'Garotas como eu', 'Lis Selwyn', 'loja', 'garotas-como-eu.jpg', 'https://link.amazon/B0f0Zkw7K', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (294, 'eu-me-rendo-e-me-entrego', 'Eu Me Rendo E Me Entrego', 'Márcia Camargo', 'loja', 'eu-me-rendo-e-me-entrego.jpg', 'https://link.amazon/B0fE7NPfS', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (295, 'estilazo', 'Estilazo', 'Tessa Reis', 'loja', 'estilazo.jpg', 'https://link.amazon/B0fgacHlK', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (296, 'todas-as-nossas-primeiras-vezes', 'Todas as Nossas Primeiras Vezes', 'Bia R.D. Ramos', 'loja', 'todas-as-nossas-primeiras-vezes.jpg', 'https://link.amazon/B0fKHlcsf', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (297, 'a-conquistadora-de-estrelas', 'A conquistadora de estrelas', 'Natalia Avila', 'loja', 'a-conquistadora-de-estrelas.jpg', 'https://link.amazon/B0gBWZ3qN', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (298, 'nao-foi-o-destino', 'Não foi o destino', 'Graziela Santos', 'loja', 'nao-foi-o-destino.jpg', 'https://link.amazon/B0gCU1NdH', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (299, 'meia-noite-no-parque', 'Meia-noite no Parque', 'Helena Nolasco', 'loja', 'meia-noite-no-parque.jpg', 'https://link.amazon/B0glHEbf7', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (300, 'ristretto', 'Ristretto', 'Tessa Reis', 'loja', 'ristretto.jpg', 'https://link.amazon/B0grKaSql', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (301, 'as-novas-romanticas', 'As Novas Românticas', 'Luisa Landre', 'loja', 'as-novas-romanticas.jpg', 'https://link.amazon/B0gRkOfoz', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (302, 'a-ordem-a-eleita', 'A Ordem: A Eleita', 'Tattah Nascimento', 'loja', 'a-ordem-a-eleita.jpg', 'https://link.amazon/B0gSsfX1R', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (303, 'tons-do-amor', 'Tons do Amor', 'Lari Alcantara', 'loja', 'tons-do-amor.jpg', 'https://link.amazon/B0gyoaWm4', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (304, 'desarmonia', 'Desarmonia', 'Raquel Alves', 'loja', 'desarmonia.jpg', 'https://link.amazon/B0gYRU3Ie', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (305, 'um-fake-dating-quase-perfeito', 'Um fake dating (quase) perfeito', 'Thais Rodrigues', 'loja', 'um-fake-dating-quase-perfeito.jpg', 'https://link.amazon/B0habx9xJ', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (306, '24h-para-correr', '24h Para Correr', 'Marina Dutra', 'loja', '24h-para-correr.jpg', 'https://link.amazon/B0hDlnLp7', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (307, 'pior-pesadelo-de-um-homem', 'Pior Pesadelo de um Homem', 'Marina Feijóo', 'loja', 'pior-pesadelo-de-um-homem.jpg', 'https://link.amazon/B0hTdiVYa', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (308, 'tudo-o-que-nao-toleramos', 'Tudo o que (não) toleramos', 'Helena Nolasco', 'loja', 'tudo-o-que-nao-toleramos.jpg', 'https://link.amazon/B0hUZbTZq', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (309, 'as-nossas-nuvens-de-algodao-doce', 'As Nossas Nuvens de Algodão Doce', 'Ana França', 'loja', 'as-nossas-nuvens-de-algodao-doce.jpg', 'https://link.amazon/B0hWWoyxR', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (310, 'amparia', 'Ampária', 'Júlia Raimann', 'loja', 'amparia.jpg', 'https://link.amazon/B0hXSLAeM', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (311, 'a-inquisicao-escarlate', 'A Inquisição Escarlate', 'Thaís Boito', 'loja', 'a-inquisicao-escarlate.jpg', 'https://link.amazon/B0i3ARiB6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (312, 'intemperies-de-verao', 'Intempéries de Verão', 'Ana França', 'loja', 'intemperies-de-verao.jpg', 'https://link.amazon/B0i8z4z0B', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (313, 'living-in-you-destinos-entrelacados-livro-3', 'Living In You (Destinos Entrelaçados Livro 3)', 'Swyanne Rodriguez', 'loja', 'living-in-you-destinos-entrelacados-livro-3.jpg', 'https://link.amazon/B0i9nVSwa', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (314, 'o-contrato', 'O Contrato', 'Tessa Reis', 'loja', 'o-contrato.jpg', 'https://link.amazon/B0idkR7Qs', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (315, 'joanesburgo', 'Joanesburgo', 'Victoria Mendes', 'loja', 'joanesburgo.jpg', 'https://link.amazon/B0ifH9HS6', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (316, 'o-cafe-pode-ser-a-resposta', 'O café pode ser a resposta', 'Golden Faery', 'loja', 'o-cafe-pode-ser-a-resposta.jpg', 'https://link.amazon/B0illxJCE', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (317, 'tudo-se-tornou-ela', 'Tudo se tornou ela', 'Raquel Alves', 'loja', 'tudo-se-tornou-ela.jpg', 'https://link.amazon/B0iN6aBcn', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (318, 'a-princesa-e-o-cappuccino', 'A Princesa e o Cappuccino', 'G.B. Baldassari', 'loja', 'a-princesa-e-o-cappuccino.jpg', 'https://link.amazon/B0j5M76xK', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (319, 'a-escolhida-da-deusa', 'A Escolhida da Deusa', 'Mariana Rosa', 'loja', 'a-escolhida-da-deusa.jpg', 'https://link.amazon/B0jaIxOHK', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (320, 'de-repente-casadas-ilustracao', 'De Repente Namoradas', 'G.B. Baldassari', 'exclusiva', 'de-repente-casadas-ilustracao.jpg', 'https://link.amazon/B00yWsZ55', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (321, 'polaris-ilustracao', 'Polaris (ou ela não é daqui)', 'Giu Nascimento', 'exclusiva', 'polaris-ilustracao.jpg', 'https://link.amazon/B02LbppPN', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (322, 'todas-as-verdades-que-eu-nao-te-disse-ilustracao', 'Todas as verdades que eu não te disse', 'D. Barreto', 'exclusiva', 'todas-as-verdades-que-eu-nao-te-disse-ilustracao.jpg', 'https://link.amazon/B033rHRRk', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (323, 'o-encontro-dos-sois-1-ilustracao', 'O encontro dos sóis', 'Carol Barra', 'exclusiva', 'o-encontro-dos-sois-1-ilustracao.jpg', 'https://link.amazon/B03QSC7A3', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (324, 'antes-do-sim-ilustracao', 'Antes do Sim', 'Nicole Oliveira', 'exclusiva', 'antes-do-sim-ilustracao.jpg', 'https://link.amazon/B03WvvuYj', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (325, 'living-in-you-ilustracao', 'Living In You (Destinos Entrelaçados Livro 3)', 'Swyanne Rodriguez', 'exclusiva', 'living-in-you-ilustracao.jpg', 'https://link.amazon/B04Y5T3dp', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (326, 'valentina-ilustracao', 'Valentina', 'Lis Selwyn', 'exclusiva', 'valentina-ilustracao.jpg', 'https://link.amazon/B059HSb7R', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (327, 'segundo-cliche-ilustracao', 'Segundo Clichê', 'Line Cunha', 'exclusiva', 'segundo-cliche-ilustracao.jpg', 'https://link.amazon/B0fpykQup', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (328, 'feras-em-campo-ilustracao', 'Feras em campo', 'Luisa Landre', 'exclusiva', 'feras-em-campo-ilustracao.jpg', 'https://link.amazon/B05bC3xnx', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (329, 'sou-tao-o-que-voce-nao-precisa-ilustracao', 'Sou tudo o que você (não) precisa', 'V.S. Vilela', 'exclusiva', 'sou-tao-o-que-voce-nao-precisa-ilustracao.jpg', 'https://link.amazon/B065GZUKC', 'comum')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (330, 'amor-imprevisivel-ilustracao', 'Amor Imprevisível', 'Jess Lim', 'exclusiva', 'amor-imprevisivel-ilustracao.jpg', 'https://link.amazon/B067XVJtk', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (331, '24h-para-correr-ilustracao-1', '24h Para Correr', 'Marina Dutra', 'exclusiva', '24h-para-correr-ilustracao-1.jpg', 'https://link.amazon/B09LP2VIp', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (332, 'desarmonia-ilustracao', 'Desarmonia', 'Raquel Alves', 'exclusiva', 'desarmonia-ilustracao.jpg', 'https://link.amazon/B06FsCyNJ', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (333, 'ultimo-romance-ilustracao', 'Último Romance', 'Thais Rodrigues', 'exclusiva', 'ultimo-romance-ilustracao.jpg', 'https://link.amazon/B0ggERHkt', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (334, 'romance-real-ilustracao', 'Romance real', 'Clara Alves', 'exclusiva', 'romance-real-ilustracao.jpg', 'https://link.amazon/B06KzJZ3U', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (335, 'traicao-segredos-e-mentiras-ilustracao', 'Traição, Segredos e Mentiras', 'Emely Luiza Curcio', 'exclusiva', 'traicao-segredos-e-mentiras-ilustracao.jpg', 'https://link.amazon/B079j6gRF', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (336, 'pink-lemonade-ilustracao', 'Pink Lemonade', 'G.B. Baldassari', 'exclusiva', 'pink-lemonade-ilustracao.jpg', 'https://link.amazon/B07B0KfaK', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (337, 'quarto-119-ilustracao', 'Quarto 119', 'Raquel Alves', 'exclusiva', 'quarto-119-ilustracao.jpg', 'https://link.amazon/B07wtbo3K', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (338, 'amor-fati-ilustracao', 'Amor Fati', 'G.B. Baldassari', 'exclusiva', 'amor-fati-ilustracao.jpg', 'https://link.amazon/B01nxolvw', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (339, 'como-nao-se-apaixonar-ilustracao', 'Como (não) se apaixonar', 'D. Barreto', 'exclusiva', 'como-nao-se-apaixonar-ilustracao.jpg', 'https://link.amazon/B08EySi9l', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (340, 'cerejas-do-inferno-ilustracao', 'Cerejas do Inferno', 'Thaís Boito', 'exclusiva', 'cerejas-do-inferno-ilustracao.jpg', 'https://link.amazon/B09cPwtrj', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (341, 'a-conquistadora-de-estrelas-ilustracao-1', 'A conquistadora de estrelas', 'Natalia Avila', 'exclusiva', 'a-conquistadora-de-estrelas-ilustracao-1.jpg', 'https://link.amazon/B09d1H5Yw', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (342, 'reconstrucao-ilustracao', 'Reconstrução', 'Andremis', 'exclusiva', 'reconstrucao-ilustracao.jpg', 'https://link.amazon/B09iXvqKn', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (343, 'fogo-cruzado-ilustacao', 'Fogo Cruzado', 'Carol Barra', 'exclusiva', 'fogo-cruzado-ilustacao.jpg', 'https://link.amazon/B09JcmWWq', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (344, 'as-novas-romanticas-ilustracao', 'As Novas Românticas', 'Luisa Landre', 'exclusiva', 'as-novas-romanticas-ilustracao.jpg', 'https://link.amazon/B05Ywfldr', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (345, '24h-para-correr-ilustracao-2', '24h Para Correr', 'Marina Dutra', 'exclusiva', '24h-para-correr-ilustracao-2.jpg', 'https://link.amazon/B09LP2VIp', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (346, '25-de-outubro-ilustracao', '25 de Outubro: O preço de um único dia', 'Emely Luiza Curcio', 'exclusiva', '25-de-outubro-ilustracao.jpg', 'https://link.amazon/B0aUB5g8m', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (347, 'uma-mulher-pra-chamar-de-minha-ilustracao', 'Uma mulher pra chamar de minha', 'Thais Rodrigues', 'exclusiva', 'uma-mulher-pra-chamar-de-minha-ilustracao.jpg', 'https://link.amazon/B0bGNchjo', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (348, 'lost-on-you-ilustracao', 'Lost On You (Destinos Entrelaçados Livro 1)', 'Swyanne Rodriguez', 'exclusiva', 'lost-on-you-ilustracao.jpg', 'https://link.amazon/B0c1haJRt', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (349, 'conectadas-ilustracao', 'Conectadas', 'Clara Alves', 'exclusiva', 'conectadas-ilustracao.jpg', 'https://link.amazon/B0cLLfn8I', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (350, 'a-pior-das-boas-ideias-ilustracao', 'A pior das boas ideias', 'V.S. Vilela', 'exclusiva', 'a-pior-das-boas-ideias-ilustracao.jpg', 'https://link.amazon/B0cV92ih3', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (351, 'nao-foi-o-destino-ilustracao', 'Não foi o destino', 'Graziela Santos', 'exclusiva', 'nao-foi-o-destino-ilustracao.jpg', 'https://link.amazon/B0cZO4346', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (352, 'fora-de-campo-ilustracao', 'Fora de campo', 'D. Barreto', 'exclusiva', 'fora-de-campo-ilustracao.jpg', 'https://link.amazon/B0dFdKEsf', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (353, 'proibido-se-apaixonar-de-novo-ilustracao', 'Proibido se apaixonar de novo', 'V.S. Vilela', 'exclusiva', 'proibido-se-apaixonar-de-novo-ilustracao.jpg', 'https://link.amazon/B0dQeLXYz', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (354, 'galaxia-desconhecida-ilustracao', 'Galáxia desconhecida', 'Raquel Alves', 'exclusiva', 'galaxia-desconhecida-ilustracao.jpg', 'https://link.amazon/B0erWN7xB', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (355, 'o-encontro-dos-sois-2-ilustracao', 'O encontro dos sóis', 'Carol Barra', 'exclusiva', 'o-encontro-dos-sois-2-ilustracao.jpg', 'https://link.amazon/B03QSC7A3', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (356, 'terceiro-croqui-ilustracao', 'Terceiro Croqui', 'Line Cunha', 'exclusiva', 'terceiro-croqui-ilustracao.jpg', 'https://link.amazon/B0gSXsw14', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (357, 'crimes-do-amor-ilustracao', 'Crimes do Amor', 'Táttah Nascimento', 'exclusiva', 'crimes-do-amor-ilustracao.jpg', 'https://link.amazon/B0gZLEgl8', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (358, 'um-fake-dating-quase-perfeito-ilustracao', 'Um fake dating (quase) perfeito', 'Thais Rodrigues', 'exclusiva', 'um-fake-dating-quase-perfeito-ilustracao.jpg', 'https://link.amazon/B0hMtCTyn', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (359, 'garotas-como-eu-ilustracao', 'Garotas como eu', 'Lis Selwyn', 'exclusiva', 'garotas-como-eu-ilustracao.jpg', 'https://link.amazon/B0hzm9p8I', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)
values (360, 'operacao-conves-ilustracao', 'Operação Convés', 'Line Cunha', 'exclusiva', 'operacao-conves-ilustracao.jpg', 'https://link.amazon/B080YKbsw', 'exclusiva')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url,
  category = excluded.category;

