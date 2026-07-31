export function normalizeMemoryCoverPath(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const withoutQuery = value.trim().split(/[?#]/, 1)[0];
  const filename = withoutQuery.split(/[\\/]/).filter(Boolean).pop();
  if (!filename || !/^[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(filename)) return null;
  return `/covers-jogos/${filename}`;
}

const MEMORY_COVER_FILENAMES = [
  "o-despertar-do-desejo.jpg",
  "na-orbita-do-amor.jpg",
  "como-reconquistar-uma-nerd.jpg",
  "so-mais-um-poema-epico-de-amor.jpg",
  "o-diabo-veste-cor-de-rosa.jpg",
  "uma-pitada-de-sorte.jpg",
  "a-namorada-do-meu-primo.jpg",
  "alguem-que-te-faz-sorrir.jpg",
  "gap-a-teoria-rosa.jpg",
  "sombras-e-luzes-de-nos.jpg",
  "tipo-flores-e-unicornios.jpg",
  "presa-em-voce.jpg",
  "mau-agouro.jpg",
  "terapia-bar.jpg",
  "tudo-o-que-eu-sei-sobre-amar.jpg",
  "as-cegas-com-voce.jpg",
  "os-fantasmas-entre-nos.jpg",
  "duologia-boreal.jpg",
  "me-apaixonei-pela-vila.jpg",
  "seu-pequeno-segredo.jpg",
  "classe-309.jpg",
  "charlotte-delamori.jpg",
  "amor-expresso.jpg",
  "itinerario-do-tempo.jpg",
  "amor-em-12-meses-sem-juros.jpg",
  "mastermind.jpg",
  "amora.jpg",
  "oitavo-andar.jpg",
  "flores-me-lembram-voce.jpg",
  "minha-experiencia-lesbica-com-a-solidao.jpg",
  "alda.jpg",
  "minha-querida-escuridao.jpg",
  "dias-de-princesa.jpg",
  "data-venia.jpg",
  "como-nao-ressuscitar-uma-ex-namorada-morta.jpg",
  "olhe-para-mim.jpg",
  "so-para-os-fortes-de-coracao.jpg",
  "coisas-incriveis-acontecem.jpg",
  "if-true-o-codigo-da-atracao.jpg",
  "selfie-sem-filtro.jpg",
  "traicoeiro.jpg",
  "seis-e-demais.jpg",
  "voce-nao-e-minha.jpg",
  "ate-logo-violeta.jpg",
  "o-sim-das-nossas-vidas.jpg",
  "meus-dias-na-vila-das-gaivotas.jpg",
  "capitulo-extra-virando-o-jogo.jpg",
  "entre-estantes.jpg",
  "trevos-do-destino.jpg",
  "o-ultimo-voo.jpg",
  "hexagono-memorias-de-seis-vidas-entrelacadas.jpg",
  "vestigios-de-uma-tempestade.jpg",
  "na-ponta-dos-dedos.jpg",
  "nada-convencional.jpg",
  "a-espada-de-oleandro.jpg",
  "bali-encontre-a-luz.jpg",
  "terra-47-a-sobrevivente.jpg",
  "6-am-a-hora-mais-curta.jpg",
  "angra-sempre-houve-algo-sobre-ela.jpg",
  "unbreakable.jpg",
  "twister.jpg",
  "se-permitindo-amar.jpg",
  "o-caso-daphne-fontaine.jpg",
  "como-se-fosse-fanfic.jpg",
  "boa-sorte-querida.jpg",
  "a-vinganca-do-cupido.jpg",
  "inefavel-uma-paixao-inesquecivel.jpg",
] as const;

export function getMemoryCoverPath(stickerId: unknown) {
  const id = Number(stickerId);
  if (!Number.isInteger(id) || id < 361 || id > 427) return null;
  return `/covers-jogos/${MEMORY_COVER_FILENAMES[id - 361]}`;
}
