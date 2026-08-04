-- Enriquece o catalogo compartilhado e remove A vinganca do cupido sem quebrar FKs.
begin;

alter table public.memory_game_stickers
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists author text,
  add column if not exists amazon_url text,
  add column if not exists alt_text text;

alter table public.memory_game_stickers drop constraint if exists memory_game_stickers_id_check;

-- ID temporario: partidas que usavam 426/427 passam a apontar para Inefavel.
insert into public.memory_game_stickers
  (id,front_image_path,back_image_path,is_active,allowed_game_keys,title,slug,author,amazon_url,alt_text)
select 1431,'/covers-jogos/__renumbering-inefavel.jpg',back_image_path,is_active,allowed_game_keys,
  'Inefável: Uma paixão inesquecível','inefavel-uma-paixao-inesquecivel','Zey Shelsea',
  'https://link.amazon/B0iArvIIc','Capa do livro Inefável: Uma paixão inesquecível'
from public.memory_game_stickers where id=427
on conflict (id) do nothing;

update public.memory_game_cards set source_sticker_id=1431 where source_sticker_id in (426,427);
update public.puzzle_game_sessions set sticker_id=1431 where sticker_id in (426,427);
update public.cover_guesser_sessions set sticker_id=1431 where sticker_id in (426,427);
delete from public.memory_game_stickers where id in (426,427);

with catalog(id,title,author,cover,amazon_url) as (values
  (361,'O despertar do desejo','A.N. SILVA','o-despertar-do-desejo.jpg','https://link.amazon/B046BAaJK'),
  (362,'Na Órbita do Amor','Madu Oliveira','na-orbita-do-amor.jpg','https://link.amazon/B0bb65UEf'),
  (363,'Como Reconquistar uma Nerd','Madu Oliveira','como-reconquistar-uma-nerd.jpg','https://link.amazon/B0gtNa4IY'),
  (364,'Só mais um poema épico de amor','Parisa Akhbari','so-mais-um-poema-epico-de-amor.jpg','https://link.amazon/B0dUJW9Zu'),
  (365,'O diabo veste cor-de-rosa','Alexandria Bellefleur','o-diabo-veste-cor-de-rosa.jpg','https://link.amazon/B0d0Vak4y'),
  (366,'Uma pitada de sorte','Baldassari G. B.','uma-pitada-de-sorte.jpg','https://link.amazon/B0fgf6vob'),
  (367,'A namorada do meu primo','Bia Crespo','a-namorada-do-meu-primo.jpg','https://link.amazon/B0bgRYv9p'),
  (368,'Alguém que te faz sorrir','Bianca da Silva','alguem-que-te-faz-sorrir.jpg','https://link.amazon/B06lDqAh6'),
  (369,'GAP: A Teoria Rosa','Chaoplanoy','gap-a-teoria-rosa.jpg','https://link.amazon/B06NAdWdD'),
  (370,'Sombras e Luzes de Nós','Cristinne Ceccon','sombras-e-luzes-de-nos.jpg','https://link.amazon/B04v9rme8'),
  (371,'Tipo flores e unicórnios','Debora Carvalho','tipo-flores-e-unicornios.jpg','https://link.amazon/B0hFdSs1e'),
  (372,'Presa em você','Debora Carvalho','presa-em-voce.jpg','https://link.amazon/B0igpHw3i'),
  (373,'Mau Agouro','Debora Carvalho','mau-agouro.jpg','https://link.amazon/B0iqZ5DVV'),
  (374,'Terapia Bar','Debora Carvalho','terapia-bar.jpg','https://link.amazon/B0efiInBp'),
  (375,'Tudo o que eu sei sobre amar','Debora Carvalho','tudo-o-que-eu-sei-sobre-amar.jpg','https://link.amazon/B039cHTRD'),
  (376,'Às cegas com você','Ferrazz','as-cegas-com-voce.jpg','https://link.amazon/B00Iq5BjM'),
  (377,'Os fantasmas entre nós','Gih Alves','os-fantasmas-entre-nos.jpg','https://link.amazon/B06Z8JWzL'),
  (378,'Duologia Boreal','Giu Domingues','duologia-boreal.jpg','https://link.amazon/B00gJ4bva'),
  (379,'Me Apaixonei pela Vilã','Inori','me-apaixonei-pela-vila.jpg','https://link.amazon/B00Tf2hPz'),
  (380,'Seu Pequeno Segredo','Jessica Batista','seu-pequeno-segredo.jpg','https://link.amazon/B0hl7GQsw'),
  (381,'Classe 309','Jessica Batista','classe-309.jpg','https://link.amazon/B01cys5Xb'),
  (382,'Charlotte Delamori','Jéssica Batista','charlotte-delamori.jpg','https://link.amazon/B0bwB4crM'),
  (383,'Amor Expresso','Jéssica Batista','amor-expresso.jpg','https://link.amazon/B0bs7N8U5'),
  (384,'Itinerário do Tempo','Jéssica Batista','itinerario-do-tempo.jpg','https://link.amazon/B0aMDCfG0'),
  (385,'Amor em 12 meses sem juros','Juliana Reis','amor-em-12-meses-sem-juros.jpg','https://link.amazon/B08Gf5qKM'),
  (386,'MASTERMIND','Juliana Reis','mastermind.jpg','https://link.amazon/B047vXUtu'),
  (387,'Amora','Juliana Reis','amora.jpg','https://link.amazon/B01DE5jYH'),
  (388,'Oitavo Andar','Juliana Reis','oitavo-andar.jpg','https://link.amazon/B0iHizUAT'),
  (389,'Flores Me Lembram Você','Juliana Reis','flores-me-lembram-voce.jpg','https://link.amazon/B06db3OY1'),
  (390,'Minha Experiência Lésbica com a Solidão','Kabi Nagata','minha-experiencia-lesbica-com-a-solidao.jpg','https://link.amazon/B08W6JQCC'),
  (391,'Alda','Karina Dias','alda.jpg','https://link.amazon/B0bDxqClw'),
  (392,'Minha querida escuridão','Kayla Cottingham','minha-querida-escuridao.jpg','https://link.amazon/B0b7EH310'),
  (393,'Dias de Princesa','L.S Englantine','dias-de-princesa.jpg','https://link.amazon/B08nurOMo'),
  (394,'Data Vênia','Laura Rodrigues','data-venia.jpg','https://link.amazon/B01sTzOHd'),
  (395,'Como NÃO ressuscitar uma ex-namorada MORTA','Leblon Carter','como-nao-ressuscitar-uma-ex-namorada-morta.jpg','https://link.amazon/B0cX33dxa'),
  (396,'Olhe para mim','Lena M','olhe-para-mim.jpg','https://link.amazon/B0fsg6AOG'),
  (397,'Só para os fortes de coração','Lex Croucher','so-para-os-fortes-de-coracao.jpg','https://link.amazon/B0hopuM3z'),
  (398,'Coisas incríveis acontecem','Lia Rocha','coisas-incriveis-acontecem.jpg','https://link.amazon/B0feGJpER'),
  (399,'if(true); //O Código da Atração','Linier Farias','if-true-o-codigo-da-atracao.jpg','https://link.amazon/B06Z0b8LN'),
  (400,'Selfie Sem Filtro','Linier Farias','selfie-sem-filtro.jpg','https://link.amazon/B09KmHfy3'),
  (401,'Traiçoeiro','Linier Farias, Diedra Roiz','traicoeiro.jpg','https://link.amazon/B05Okb0MS'),
  (402,'Seis é Demais','Lizzy Lesueur','seis-e-demais.jpg','https://link.amazon/B01k2IBFr'),
  (403,'Você não é minha','Mar Freitas','voce-nao-e-minha.jpg','https://link.amazon/B0baeOMXf'),
  (404,'Até logo, Violeta','Maria Freitas','ate-logo-violeta.jpg','https://link.amazon/B02ic3fae'),
  (405,'O Sim das nossas vidas','Mona Devil','o-sim-das-nossas-vidas.jpg','https://link.amazon/B07M3agar'),
  (406,'Meus Dias na Vila das Gaivotas','Naoko Kodama','meus-dias-na-vila-das-gaivotas.jpg','https://link.amazon/B0aiEnSYw'),
  (407,'Capítulo Extra: Virando o Jogo','Nick Martins','capitulo-extra-virando-o-jogo.jpg','https://link.amazon/B04TBcK9v'),
  (408,'Entre estantes','Olívia Pilar','entre-estantes.jpg','https://link.amazon/B0e1oyW0N'),
  (409,'Trevos do Destino','Priscilla Bacellar','trevos-do-destino.jpg','https://link.amazon/B03QIQBP4'),
  (410,'O Último Voo','Priscilla Bacellar','o-ultimo-voo.jpg','https://link.amazon/B0b5Pjy4O'),
  (411,'Hexágono - Memórias de Seis Vidas Entrelaçadas','Priscilla Bacellar','hexagono-memorias-de-seis-vidas-entrelacadas.jpg','https://link.amazon/B0fvsKOp9'),
  (412,'Vestígios de uma Tempestade','R. B. Nobre','vestigios-de-uma-tempestade.jpg','https://link.amazon/B04EAM6Zu'),
  (413,'Na ponta dos dedos','Sarah Waters','na-ponta-dos-dedos.jpg','https://link.amazon/B00YDoHV0'),
  (414,'Nada Convencional','Stephanie Cruz','nada-convencional.jpg','https://link.amazon/B04i4LY6z'),
  (415,'A espada de oleandro','Tasha Suri','a-espada-de-oleandro.jpg','https://link.amazon/B09rw4h9k'),
  (416,'Bali: Encontre a Luz','Tessa Reis','bali-encontre-a-luz.jpg','https://link.amazon/B09ldjvno'),
  (417,'Terra-47: A Sobrevivente','Tessa Reis','terra-47-a-sobrevivente.jpg','https://link.amazon/B01Wj5JQO'),
  (418,'6.am: a hora mais curta','Tessa Reis','6-am-a-hora-mais-curta.jpg','https://link.amazon/B06E5ZM4Y'),
  (419,'Angra: Sempre Houve Algo Sobre Ela','Tessa Reis','angra-sempre-houve-algo-sobre-ela.jpg','https://link.amazon/B0caWHqLX'),
  (420,'Unbreakable','Valéria de Paulo','unbreakable.jpg','https://link.amazon/B0aEv2zsM'),
  (421,'Twister','Valéria de Paulo','twister.jpg','https://link.amazon/B07ff2djn'),
  (422,'Se Permitindo Amar','Van Rodrigues','se-permitindo-amar.jpg','https://link.amazon/B0dXuL3V2'),
  (423,'O caso Daphne Fontaine','Vanessa Airallis','o-caso-daphne-fontaine.jpg','https://link.amazon/B07tLFNrP'),
  (424,'Como se fosse Fanfic','Victoria Mendes','como-se-fosse-fanfic.jpg','https://link.amazon/B0cRtPSJO'),
  (425,'Boa Sorte, Querida!','Victoria Mendes','boa-sorte-querida.jpg','https://link.amazon/B07hI4JoD'),
  (426,'Inefável: Uma paixão inesquecível','Zey Shelsea','inefavel-uma-paixao-inesquecivel.jpg','https://link.amazon/B0iArvIIc'),
  (427,'Sua próxima novela das sete','Diedra Roiz','sua-proxima-novela-das-sete.jpg','https://link.amazon/B09SFEeP6'),
  (428,'Entre Nós','Laura Rodrigues','entre-nos.jpg','https://link.amazon/B01u8tvHR'),
  (429,'Amor Fora do Palco','Isadora Vianna','amor-fora-do-palco.jpg','https://link.amazon/B06iMsOg3'),
  (430,'Oi, Novo Amor','Ana Gabi Vasconcellos','oi-novo-amor.jpg','https://link.amazon/B083xzvOK')
)
insert into public.memory_game_stickers
  (id,title,slug,author,front_image_path,amazon_url,alt_text,is_active,allowed_game_keys,updated_at)
select id,title,regexp_replace(cover,'\.[^.]+$',''),author,'/covers-jogos/'||cover,amazon_url,
  'Capa do livro '||title,true,array['memory_game','puzzle_game','cover_guesser']::text[],now() from catalog
on conflict (id) do update set title=excluded.title,slug=excluded.slug,author=excluded.author,
  front_image_path=excluded.front_image_path,amazon_url=excluded.amazon_url,
  alt_text=excluded.alt_text,is_active=true,allowed_game_keys=excluded.allowed_game_keys,updated_at=now();

update public.memory_game_cards set source_sticker_id=426 where source_sticker_id=1431;
update public.puzzle_game_sessions set sticker_id=426 where sticker_id=1431;
update public.cover_guesser_sessions set sticker_id=426 where sticker_id=1431;
delete from public.memory_game_stickers where id=1431;

alter table public.memory_game_stickers
  alter column title set not null,
  alter column slug set not null,
  alter column author set not null,
  add constraint memory_game_stickers_id_check check (id between 361 and 430),
  add constraint memory_game_stickers_slug_key unique (slug);

commit;
