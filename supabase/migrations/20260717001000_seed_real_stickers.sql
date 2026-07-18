-- Migration: Seed stickers metadata from seeds.ts
-- This updates the placeholders to the real names, authors, slugs, covers, and amazon urls.

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (1, 'amor-fati', 'Amor Fati', 'G.B. Baldassari', 'quiz', 'amor-fati.jpg', 'https://link.amazon/B04QsFxvd')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (2, 'cupidos-nao-se-apaixonam', 'Cupidos não se apaixonam', 'Clara Alves', 'quiz', 'cupidos-nao-se-apaixonam.jpg', 'https://link.amazon/B0aMON6CM')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (3, 'eu-minha-crush-e-minha-irma', 'Eu, minha crush e minha irmã', 'Bia Crespo', 'quiz', 'eu-minha-crush-e-minha-irma.jpg', 'https://link.amazon/B0gHZl9q6')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (4, 'liz-flores-e-uma-farsa', 'Liz Flores é uma farsa', 'Victoria Mendes', 'quiz', 'liz-flores-e-uma-farsa.jpg', 'https://link.amazon/B05Ayf9iA')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (5, 'segundo-cliche', 'Segundo Clichê (Frutaverso Livro 1)', 'Line Cunha', 'quiz', 'segundo-cliche.jpg', 'https://link.amazon/B0hSXOXJx')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (6, 'desejos-ocultos-das-violetas', 'Desejos Ocultos das Violetas', 'Mariana Rosa', 'quiz', 'desejos-ocultos-das-violetas.jpg', 'https://link.amazon/B0iwzpQsy')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (7, 'o-casamento', 'O Casamento', 'Ju Mesquita', 'quiz', 'o-casamento.jpg', 'https://link.amazon/B07RMb9et')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (8, 'como-não-se-apaixonar', 'Como (não) se apaixonar', 'D. Barreto', 'quiz', 'como-não-se-apaixonar.jpg', 'https://link.amazon/B012VqDsq')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (9, 'ela-e-mais-do-que-voce-imagina', 'Ela é mais do que você imagina', 'V.S. Vilela', 'quiz', 'ela-e-mais-do-que-voce-imagina.jpg', 'https://link.amazon/B0iyUjTD5')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (10, 'nao-conta-pra-ela', '(Não) conta pra ela', 'Karoline Mandu', 'quiz', 'nao-conta-pra-ela.jpg', 'https://link.amazon/B0ihxjwaN')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (11, 'opostas-em-guerra', 'Opostas em Guerra', 'Sarah Oliveira', 'quiz', 'opostas-em-guerra.jpg', 'https://link.amazon/B0aB3FcnO')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (12, 'em-todas-as-gotas-de-chuva', 'Em todas as gotas de chuva', 'Englantine', 'quiz', 'em-todas-as-gotas-de-chuva.jpg', 'https://link.amazon/B03fZPEe3')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (13, 'colegas-de-quarto', 'Colegas de Quarto', 'Marina Basso', 'quiz', 'colegas-de-quarto.jpg', 'https://link.amazon/B04Li75y5')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (14, 'imensuravel-uma-nova-chance-para-amar', 'Imensurável: Uma nova chance para amar', 'Zey Shelsea', 'quiz', 'imensuravel-uma-nova-chance-para-amar.jpg', 'https://link.amazon/B08HyxVyX')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (15, 'georgia-rose', 'Georgia Rose: Segredos de Florença', 'Victoria Moon', 'quiz', 'georgia-rose.jpg', 'https://link.amazon/B0cgvqwcH')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (16, 'a-garota-do-topo', 'A Garota do Topo', 'Helena Nolasco', 'quiz', 'a-garota-do-topo.jpg', 'https://link.amazon/B0aCQG15A')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (17, 'nao-e-so-de-amor-que-eu-sei-falar', 'Não é só de amor que eu sei falar', 'Yasmim Mahmud Kader', 'quiz', 'nao-e-so-de-amor-que-eu-sei-falar.jpg', 'https://link.amazon/B08XPOF7V')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (18, 'os-segredos-que-contei-ao-oceano', 'Os Segredos Que Contei Ao Oceano', 'Camilla Giordanno', 'quiz', 'os-segredos-que-contei-ao-oceano.jpg', 'https://link.amazon/B01StrwX7')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (19, 'opostos-complementares', 'Opostos Complementares (Opostos Co. Livro 1)', 'Fernanda V.', 'quiz', 'opostos-complementares.jpg', 'https://link.amazon/B0fTuoQV8')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (20, 'cancao-dos-ossos', 'Canção dos Ossos', 'Giu Domingues', 'quiz', 'cancao-dos-ossos.jpg', 'https://link.amazon/B0aYElcl2')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (21, 'os-sete-maridos-de-evelyn-hugo', 'Os sete maridos de Evelyn Hugo', 'Taylor Jenkins Reid', 'sorteio', 'os-sete-maridos-de-evelyn-hugo.jpg', 'https://link.amazon/B0ci4Vbq1')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (22, 'delilah-green-nao-esta-nem-ai', 'Delilah Green não está nem aí (Bright Falls)', 'Ashley Herring Blake', 'sorteio', 'delilah-green-nao-esta-nem-ai.jpg', 'https://link.amazon/B04jA353t')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (23, 'pressagios-do-amor', 'Presságios do amor', 'Alexandria Bellefleur', 'sorteio', 'pressagios-do-amor.jpg', 'https://link.amazon/B056W8BF4')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (24, 'fortuna-e- ascensao', 'Fortuna & Ascensão', 'Marcella M.', 'sorteio', 'fortuna-e- ascensao.jpg', 'https://link.amazon/B0aopido8')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (25, 'o-amor-nao-e-obvio', 'O amor não é óbvio', 'Elayne Baeta', 'sorteio', 'o-amor-nao-e-obvio.jpg', 'https://link.amazon/B0cuzA7YO')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (26, 'sementes-podres', 'Sementes Podres', 'Debora Carvalho', 'sorteio', 'sementes-podres.jpg', 'https://link.amazon/B057ruPlZ')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (27, 'ice-quinn', 'Ice Quinn', 'Carol Barra', 'sorteio', 'ice-quinn.jpg', 'https://link.amazon/B02qznLoM')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (28, 'salik-amor-e-ruina', 'Salik: Amor & Ruína', 'Bia R.D. Ramos', 'sorteio', 'salik-amor-e-ruina.jpg', 'https://link.amazon/B0bBabHzi')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (29, 'alem-das-cameras', 'Além das Câmeras', 'Gina Milbradt', 'sorteio', 'alem-das-cameras.jpg', 'https://link.amazon/B0iQ32vab')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (30, 'skips-drops', 'Skips, Drops', 'Tessa Reis', 'sorteio', 'skips-drops.jpg', 'https://link.amazon/B01e9AESA')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (31, 'sem-palavra-de-seguranca', 'Sem palavra de segurança', 'Leila Venturini', 'sorteio', 'sem-palavra-de-seguranca.jpg', 'https://link.amazon/B00QZrBwV')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (32, 'aguas-de-marco', 'Águas de Março', 'Gisele Carvalho e Hannah Kaiser', 'sorteio', 'aguas-de-marco.jpg', 'https://link.amazon/B01qjR1Ii')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (33, 'os-4-espelhos', 'Os 4 Espelhos', 'Marina Porteclis', 'sorteio', 'os-4-espelhos.jpg', 'https://link.amazon/B0bPXOC1h')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (34, 'um-traco-ate-voce', 'Um traço até você', 'Olívia Pilar', 'sorteio', 'um-traco-ate-voce.jpg', 'https://link.amazon/B03O8W0R6')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (35, 'herdeiras-de-pedra-e-ar', 'Herdeiras de pedra e ar', 'Mar Freitas', 'sorteio', 'herdeiras-de-pedra-e-ar.jpg', 'https://link.amazon/B0hsZOXsN')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (36, 'ultima-parada', 'Última parada', 'Casey McQuiston', 'sorteio', 'ultima-parada.jpg', 'https://link.amazon/B03JavGBa')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (37, 'vitrine', 'Vitrine: Um contrato pode mudar tudo', 'Ingrid Paranhos', 'sorteio', 'vitrine.jpg', 'https://link.amazon/B06XYVmBg')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (38, 'as-vantagens-de-ser-voce', 'As vantagens de ser você', 'Ray Tavares', 'sorteio', 'as-vantagens-de-ser-voce.jpg', 'https://link.amazon/B0g3Un09w')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (39, 'o-nome-dela-e-sophia', 'O Nome Dela é Sophia', 'Vanessa Freitas', 'sorteio', 'o-nome-dela-e-sophia.jpg', 'https://link.amazon/B0h1b3T05')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (40, 'galaxia-desconhecida', 'Galáxia Desconhecida', 'Raquel Alves', 'sorteio', 'galaxia-desconhecida.jpg', 'https://link.amazon/B02X3X0ul')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (41, 'ela-fica-com-a-garota', 'Ela fica com a garota', 'Rachael Lippincott e Alyson Derrick', 'sorteio', 'ela-fica-com-a-garota.jpg', 'https://link.amazon/B04PSvTjs')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (42, 'borboletas-da-morte', 'Borboletas da Morte', 'Lari Alcantara', 'sorteio', 'borboletas-da-morte.jpg', 'https://link.amazon/B02OJFJgm')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (43, 'alem-do-silencio', 'Além do Silêncio', 'Jéssica Batista', 'sorteio', 'alem-do-silencio.jpg', 'https://link.amazon/B0cf0CiCx')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (44, 'que-a-melhor-mordida-venca', 'Que a melhor mordida vença', 'Rina Rodriguez', 'sorteio', 'que-a-melhor-mordida-venca.jpg', 'https://link.amazon/B08nVTXCG')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (45, 'cerejas-do-inferno', 'Cerejas do inferno', 'Thais Boito', 'sorteio', 'cerejas-do-inferno.jpg', 'https://link.amazon/B07bmVSa1')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (46, 'xeque-mate', 'Xeque-Mate', 'Evelin Sousa', 'sorteio', 'xeque-mate.jpg', 'https://link.amazon/B0gB54D3g')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (47, 'a-beira-de-nos', 'À Beira de Nós', 'Laila Zago', 'sorteio', 'a-beira-de-nos.jpg', 'https://link.amazon/B08k93R1X')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (48, 'garota-de-programa', 'Garota de Programa', 'Rebecca Nobre', 'sorteio', 'garota-de-programa.jpg', 'https://link.amazon/B0cCEh252')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (49, 'dona-do-meu-pecado-ruina', 'Dona do meu pecado', 'Fernanda Moser', 'sorteio', 'dona-do-meu-pecado-ruina.jpg', 'https://link.amazon/B0a1E9oWd')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (50, 'overdrive', 'Overdrive', 'Agatha Menezes', 'sorteio', 'overdrive.jpg', 'https://link.amazon/B0cggcJZt')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (51, 'astrid-parker-nunca-falha', 'Astrid Parker nunca falha (Bright Falls)', NULL, 'sorteio', 'astrid-parker-nunca-falha.jpg', 'https://link.amazon/B0b2BXX3e')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (52, 'iris-kelly-nao-namora', 'Iris Kelly não namora (Bright Falls)', NULL, 'sorteio', 'iris-kelly-nao-namora.jpg', 'https://link.amazon/B0gv8pOcI')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (53, 'so-por-um-verao', 'Só por um verão (Família Lancelloti Livro 1)', NULL, 'sorteio', 'so-por-um-verao.jpg', 'https://link.amazon/B013Gv9HT')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (54, 'de-repente-namoradas', '⁠De Repente, Namoradas (Família Lancellotti Livro 2)', NULL, 'sorteio', 'de-repente-namoradas.jpg', 'https://link.amazon/B0fotnKAJ')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (55, 'paixao-platonica', 'Paixão platônica', NULL, 'sorteio', 'paixao-platonica.jpg', 'https://link.amazon/B01efxW70')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (56, 'entre-livros-e-fios-dourados', '⁠Entre Livros e Fios Dourados', NULL, 'sorteio', 'entre-livros-e-fios-dourados.jpg', 'https://link.amazon/B07of9W0q')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (57, 'o-abanar-do-amor', 'O Abanar do Amor', NULL, 'sorteio', 'o-abanar-do-amor.jpg', 'https://link.amazon/B0f4HvhKM')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (58, 'a-melhor-amiga-do-meu-namorado', 'A melhor amiga do meu namorado', NULL, 'sorteio', 'a-melhor-amiga-do-meu-namorado.jpg', 'https://link.amazon/B0c9m2QpI')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (59, 'terceiro-croqui', 'Terceiro Croqui (Frutaverso Livro 2)', NULL, 'sorteio', 'terceiro-croqui.jpg', 'https://link.amazon/B0hkj4k39')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (60, 'operacao-conves', 'Operação Convés (Frutaverso Livro 3)', NULL, 'sorteio', 'operacao-conves.jpg', 'https://link.amazon/B08Pn5mVJ')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (61, 'princesa-apaixonada', '⁠Princesa apaixonada', NULL, 'sorteio', 'princesa-apaixonada.jpg', 'https://link.amazon/B0gW0gLh8')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (62, 'garotas-de-cristal', 'Garotas de Cristal', NULL, 'sorteio', 'garotas-de-cristal.jpg', 'https://link.amazon/B05zoRLDL')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (63, 'maes-por-acidente', '⁠Mães por Acidente', NULL, 'sorteio', 'maes-por-acidente.jpg', 'https://link.amazon/B04vBGeuo')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (64, 'cartas-para-pior-garota-do-mundo-ps-eu-te-odeio', '⁠Cartas Para Pior Garota do Mundo: PS: Eu te Odeio', NULL, 'sorteio', 'cartas-para-pior-garota-do-mundo-ps-eu-te-odeio.jpg', 'https://link.amazon/B04YJcE8A')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (65, 'como-seduzir-a-novata', 'Como Seduzir A Novata', NULL, 'sorteio', 'como-seduzir-a-novata.jpg', 'https://link.amazon/B0cFE1NJH')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (66, 'clausula-da-paixao', 'Cláusula da Paixão', NULL, 'sorteio', 'clausula-da-paixao.jpg', 'https://link.amazon/B08x079rq')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (67, 'patinando-ate-voce', 'Patinando até Você', NULL, 'sorteio', 'patinando-ate-voce.jpg', 'https://link.amazon/B00NunQDy')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (68, 'proibido-se-apaixonar-de-novo', 'Proibido se apaixonar de novo', NULL, 'sorteio', 'proibido-se-apaixonar-de-novo.jpg', 'https://link.amazon/B05f82cDM')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (69, 'a-filha-proibida-do-meu-chefe', 'A Filha Proibida do Meu Chefe', NULL, 'sorteio', 'a-filha-proibida-do-meu-chefe.jpg', 'https://link.amazon/B0giLWGbJ')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (70, 'volte-pra-superficie', 'Volte pra Superfície', NULL, 'sorteio', 'volte-pra-superficie.jpg', 'https://link.amazon/B03aE147Z')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (71, 'nao-somos-melhores-amigas', '⁠Não somos melhores amigas', NULL, 'sorteio', 'nao-somos-melhores-amigas.jpg', 'https://link.amazon/B0dSLFTN8')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (72, 'enfim-esposas', 'Enfim, esposas', NULL, 'sorteio', 'enfim-esposas.jpg', 'https://link.amazon/B05wzI32N')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (73, 'opostos-concomitantes', 'Opostos Concomitantes (Opostos Co. Livro 2)', NULL, 'sorteio', 'opostos-concomitantes.jpg', 'https://link.amazon/B0hA8MPQK')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (74, 'opostos-contingentes', '⁠Opostos Contingentes (Opostos Co. Livro 3)', NULL, 'sorteio', 'opostos-contingentes.jpg', 'https://link.amazon/B08V6ouSb')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (75, 'alianca-em-campo-ganhando-o-jogo', '⁠Aliança em Campo: Ganhando o Jogo', NULL, 'sorteio', 'alianca-em-campo-ganhando-o-jogo.jpg', 'https://link.amazon/B09z94Ff9')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (76, 'a-sociedade-de-eva-parte-1', '⁠A Sociedade de Eva: Parte I : a dança', NULL, 'sorteio', 'a-sociedade-de-eva-parte-1.jpg', 'https://link.amazon/B0bDngD5Q')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (77, 'a-sociedade-de-eva-parte-2', '⁠A Sociedade de Eva: Parte II: a queda', NULL, 'sorteio', 'a-sociedade-de-eva-parte-2.jpg', 'https://link.amazon/B02bWAANJ')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (78, 'medusa', 'Medusa', NULL, 'sorteio', 'medusa.jpg', 'https://link.amazon/B0fQVqGkL')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (79, 'ultimo-romance', '⁠Último Romance', NULL, 'sorteio', 'ultimo-romance.jpg', 'https://link.amazon/B08Ongwam')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (80, 'monte-belalis', '⁠Monte Belalis', NULL, 'sorteio', 'monte-belalis.jpg', 'https://link.amazon/B0f3CGMWR')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (81, 'retrato-de-amor', '⁠Retrato de Amor', NULL, 'sorteio', 'retrato-de-amor.jpg', 'https://link.amazon/B0gxRAUJd')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (82, 'uma-familia-ao-acaso', '⁠Uma família ao acaso', NULL, 'sorteio', 'uma-familia-ao-acaso.jpg', 'https://link.amazon/B05AIsohv')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (83, 'o-trono-de-jasmim', 'O trono de jasmim (Vol. 1 Os Reinos em Chamas)', NULL, 'sorteio', 'o-trono-de-jasmim.jpg', 'https://link.amazon/B071mr0uF')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (84, 'o-cara-que-estou-a-fim-nao-e-um-cara-volume-1', '⁠O cara que estou a fim não é um cara?! - Volume 1', NULL, 'sorteio', 'o-cara-que-estou-a-fim-nao-e-um-cara-volume-1.jpg', 'https://link.amazon/B05ebJnYN')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (85, 'a-garota-do-mar', '⁠A garota do mar', NULL, 'sorteio', 'a-garota-do-mar.jpg', 'https://link.amazon/B0dqrP1PM')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (86, 'girls-like-girls', '⁠Girls Like Girls', NULL, 'sorteio', 'girls-like-girls.jpg', 'https://link.amazon/B0cRRvbYi')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (87, 'full-shift', 'Full Shift: A transformação total', NULL, 'sorteio', 'full-shift.jpg', 'https://link.amazon/B0iXT6Xwp')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (88, 'jardim-para-duas', '⁠Jardim para duas', NULL, 'sorteio', 'jardim-para-duas.jpg', 'https://link.amazon/B0i5SQiYk')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (89, 'imogen-obviamente', '⁠Imogen, obviamente', NULL, 'sorteio', 'imogen-obviamente.jpg', 'https://link.amazon/B0aQp39A7')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (90, 'ninguem-especial', '⁠Ninguém especial', NULL, 'sorteio', 'ninguem-especial.jpg', 'https://link.amazon/B0bXVQdha')
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (91, 'frases-1', 'Obcecada por mulheres fictícias', NULL, 'frase', 'frases-1.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (92, 'frases-2', 'Fã nº 1 de personagens sáficas trambiqueiras', NULL, 'frase', 'frases-2.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (93, 'frases-3', 'Me pergunte sobre meus livros sáficos favoritos', NULL, 'frase', 'frases-3.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (94, 'frases-4', 'Status: em relacionamento sério com várias personagens sáficas', NULL, 'frase', 'frases-4.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (95, 'frases-5', '0days 0hours 0minutes Since last falling in love with a fictional woman', NULL, 'frase', 'frases-5.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (96, 'ls-1', 'enemies to lovers', NULL, 'ls', 'ls-1.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (97, 'ls-2', 'friends to lovers', NULL, 'ls', 'ls-2.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (98, 'ls-3', 'só tem uma cama', NULL, 'ls', 'ls-3.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (99, 'ls-4', 'grumpy x sunshine', NULL, 'ls', 'ls-4.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)
values (100, 'ls-5', 'found family', NULL, 'ls', 'ls-5.jpeg', NULL)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  type = excluded.type,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

