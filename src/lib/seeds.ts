export interface SeedSticker {
  number: number;
  slug: string;
  name: string;
  author: string | null;
  type: "quiz" | "sorteio" | "ls" | "frase";
  cover_url: string | null;
  amazon_url?: string | null;
}

export interface SeedQuestion {
  sticker_number: number;
  q_index: number;
  text: string;
  options: string[];
  correct_index: number;
}

export interface SeedRedeemCode {
  code: string;
  element: string | null;
  active: boolean;
  release_day: number;
}

export interface SeedRedeemPool {
  code: string;
  sticker_number: number;
}

export const SEED_STICKERS: SeedSticker[] = [
  {
    number: 1,
    slug: "amor-fati",
    name: "Amor Fati",
    author: "G.B. Baldassari",
    type: "quiz",
    cover_url: "amor-fati.jpg",
    amazon_url: "https://link.amazon/B04QsFxvd",
  },
  {
    number: 2,
    slug: "cupidos-nao-se-apaixonam",
    name: "Cupidos não se apaixonam",
    author: "Clara Alves",
    type: "quiz",
    cover_url: "cupidos-nao-se-apaixonam.jpg",
    amazon_url: "https://link.amazon/B0aMON6CM",
  },
  {
    number: 3,
    slug: "eu-minha-crush-e-minha-irma",
    name: "Eu, minha crush e minha irmã",
    author: "Bia Crespo",
    type: "quiz",
    cover_url: "eu-minha-crush-e-minha-irma.jpg",
    amazon_url: "https://link.amazon/B0gHZl9q6",
  },
  {
    number: 4,
    slug: "liz-flores-e-uma-farsa",
    name: "Liz Flores é uma farsa",
    author: "Victoria Mendes",
    type: "quiz",
    cover_url: "liz-flores-e-uma-farsa.jpg",
    amazon_url: "https://link.amazon/B05Ayf9iA",
  },
  {
    number: 5,
    slug: "segundo-cliche",
    name: "Segundo Clichê (Frutaverso Livro 1)",
    author: "Line Cunha",
    type: "quiz",
    cover_url: "segundo-cliche.jpg",
    amazon_url: "https://link.amazon/B0hSXOXJx",
  },
  {
    number: 6,
    slug: "desejos-ocultos-das-violetas",
    name: "Desejos Ocultos das Violetas",
    author: "Mariana Rosa",
    type: "quiz",
    cover_url: "desejos-ocultos-das-violetas.jpg",
    amazon_url: "https://link.amazon/B0iwzpQsy",
  },
  {
    number: 7,
    slug: "o-casamento",
    name: "O Casamento",
    author: "Ju Mesquita",
    type: "quiz",
    cover_url: "o-casamento.jpg",
    amazon_url: "https://link.amazon/B07RMb9et",
  },
  {
    number: 8,
    slug: "como-não-se-apaixonar",
    name: "Como (não) se apaixonar",
    author: "D. Barreto",
    type: "quiz",
    cover_url: "como-não-se-apaixonar.jpg",
    amazon_url: "https://link.amazon/B012VqDsq",
  },
  {
    number: 9,
    slug: "ela-e-mais-do-que-voce-imagina",
    name: "Ela é mais do que você imagina",
    author: "V.S. Vilela",
    type: "quiz",
    cover_url: "ela-e-mais-do-que-voce-imagina.jpg",
    amazon_url: "https://link.amazon/B0iyUjTD5",
  },
  {
    number: 10,
    slug: "nao-conta-pra-ela",
    name: "(Não) conta pra ela",
    author: "Karoline Mandu",
    type: "quiz",
    cover_url: "nao-conta-pra-ela.jpg",
    amazon_url: "https://link.amazon/B0ihxjwaN",
  },
  {
    number: 11,
    slug: "opostas-em-guerra",
    name: "Opostas em Guerra",
    author: "Sarah Oliveira",
    type: "quiz",
    cover_url: "opostas-em-guerra.jpg",
    amazon_url: "https://link.amazon/B0aB3FcnO",
  },
  {
    number: 12,
    slug: "em-todas-as-gotas-de-chuva",
    name: "Em todas as gotas de chuva",
    author: "Englantine",
    type: "quiz",
    cover_url: "em-todas-as-gotas-de-chuva.jpg",
    amazon_url: "https://link.amazon/B03fZPEe3",
  },
  {
    number: 13,
    slug: "colegas-de-quarto",
    name: "Colegas de Quarto",
    author: "Marina Basso",
    type: "quiz",
    cover_url: "colegas-de-quarto.jpg",
    amazon_url: "https://link.amazon/B04Li75y5",
  },
  {
    number: 14,
    slug: "imensuravel-uma-nova-chance-para-amar",
    name: "Imensurável: Uma nova chance para amar",
    author: "Zey Shelsea",
    type: "quiz",
    cover_url: "imensuravel-uma-nova-chance-para-amar.jpg",
    amazon_url: "https://link.amazon/B08HyxVyX",
  },
  {
    number: 15,
    slug: "georgia-rose",
    name: "Georgia Rose: Segredos de Florença",
    author: "Victoria Moon",
    type: "quiz",
    cover_url: "georgia-rose.jpg",
    amazon_url: "https://link.amazon/B0cgvqwcH",
  },
  {
    number: 16,
    slug: "a-garota-do-topo",
    name: "A Garota do Topo",
    author: "Helena Nolasco",
    type: "quiz",
    cover_url: "a-garota-do-topo.jpg",
    amazon_url: "https://link.amazon/B0aCQG15A",
  },
  {
    number: 17,
    slug: "nao-e-so-de-amor-que-eu-sei-falar",
    name: "Não é só de amor que eu sei falar",
    author: "Yasmim Mahmud Kader",
    type: "quiz",
    cover_url: "nao-e-so-de-amor-que-eu-sei-falar.jpg",
    amazon_url: "https://link.amazon/B08XPOF7V",
  },
  {
    number: 18,
    slug: "os-segredos-que-contei-ao-oceano",
    name: "Os Segredos Que Contei Ao Oceano",
    author: "Camilla Giordanno",
    type: "quiz",
    cover_url: "os-segredos-que-contei-ao-oceano.jpg",
    amazon_url: "https://link.amazon/B01StrwX7",
  },
  {
    number: 19,
    slug: "opostos-complementares",
    name: "Opostos Complementares (Opostos Co. Livro 1)",
    author: "Fernanda V.",
    type: "quiz",
    cover_url: "opostos-complementares.jpg",
    amazon_url: "https://link.amazon/B0fTuoQV8",
  },
  {
    number: 20,
    slug: "cancao-dos-ossos",
    name: "Canção dos Ossos",
    author: "Giu Domingues",
    type: "quiz",
    cover_url: "cancao-dos-ossos.jpg",
    amazon_url: "https://link.amazon/B0aYElcl2",
  },
  {
    number: 21,
    slug: "os-sete-maridos-de-evelyn-hugo",
    name: "Os sete maridos de Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    type: "sorteio",
    cover_url: "os-sete-maridos-de-evelyn-hugo.jpg",
    amazon_url: "https://link.amazon/B0ci4Vbq1",
  },
  {
    number: 22,
    slug: "delilah-green-nao-esta-nem-ai",
    name: "Delilah Green não está nem aí (Bright Falls)",
    author: "Ashley Herring Blake",
    type: "sorteio",
    cover_url: "delilah-green-nao-esta-nem-ai.jpg",
    amazon_url: "https://link.amazon/B04jA353t",
  },
  {
    number: 23,
    slug: "pressagios-do-amor",
    name: "Presságios do amor",
    author: "Alexandria Bellefleur",
    type: "sorteio",
    cover_url: "pressagios-do-amor.jpg",
    amazon_url: "https://link.amazon/B056W8BF4",
  },
  {
    number: 24,
    slug: "fortuna-e- ascensao",
    name: "Fortuna & Ascensão",
    author: "Marcella M.",
    type: "sorteio",
    cover_url: "fortuna-e- ascensao.jpg",
    amazon_url: "https://link.amazon/B0aopido8",
  },
  {
    number: 25,
    slug: "o-amor-nao-e-obvio",
    name: "O amor não é óbvio",
    author: "Elayne Baeta",
    type: "sorteio",
    cover_url: "o-amor-nao-e-obvio.jpg",
    amazon_url: "https://link.amazon/B0cuzA7YO",
  },
  {
    number: 26,
    slug: "sementes-podres",
    name: "Sementes Podres",
    author: "Debora Carvalho",
    type: "sorteio",
    cover_url: "sementes-podres.jpg",
    amazon_url: "https://link.amazon/B057ruPlZ",
  },
  {
    number: 27,
    slug: "ice-quinn",
    name: "Ice Quinn",
    author: "Carol Barra",
    type: "sorteio",
    cover_url: "ice-quinn.jpg",
    amazon_url: "https://link.amazon/B02qznLoM",
  },
  {
    number: 28,
    slug: "salik-amor-e-ruina",
    name: "Salik: Amor & Ruína",
    author: "Bia R.D. Ramos",
    type: "sorteio",
    cover_url: "salik-amor-e-ruina.jpg",
    amazon_url: "https://link.amazon/B0bBabHzi",
  },
  {
    number: 29,
    slug: "alem-das-cameras",
    name: "Além das Câmeras",
    author: "Gina Milbradt",
    type: "sorteio",
    cover_url: "alem-das-cameras.jpg",
    amazon_url: "https://link.amazon/B0iQ32vab",
  },
  {
    number: 30,
    slug: "skips-drops",
    name: "Skips, Drops",
    author: "Tessa Reis",
    type: "sorteio",
    cover_url: "skips-drops.jpg",
    amazon_url: "https://link.amazon/B01e9AESA",
  },
  {
    number: 31,
    slug: "sem-palavra-de-seguranca",
    name: "Sem palavra de segurança",
    author: "Leila Venturini",
    type: "sorteio",
    cover_url: "sem-palavra-de-seguranca.jpg",
    amazon_url: "https://link.amazon/B00QZrBwV",
  },
  {
    number: 32,
    slug: "aguas-de-marco",
    name: "Águas de Março",
    author: "Gisele Carvalho e Hannah Kaiser",
    type: "sorteio",
    cover_url: "aguas-de-marco.jpg",
    amazon_url: "https://link.amazon/B01qjR1Ii",
  },
  {
    number: 33,
    slug: "os-4-espelhos",
    name: "Os 4 Espelhos",
    author: "Marina Porteclis",
    type: "sorteio",
    cover_url: "os-4-espelhos.jpg",
    amazon_url: "https://link.amazon/B0bPXOC1h",
  },
  {
    number: 34,
    slug: "um-traco-ate-voce",
    name: "Um traço até você",
    author: "Olívia Pilar",
    type: "sorteio",
    cover_url: "um-traco-ate-voce.jpg",
    amazon_url: "https://link.amazon/B03O8W0R6",
  },
  {
    number: 35,
    slug: "herdeiras-de-pedra-e-ar",
    name: "Herdeiras de pedra e ar",
    author: "Mar Freitas",
    type: "sorteio",
    cover_url: "herdeiras-de-pedra-e-ar.jpg",
    amazon_url: "https://link.amazon/B0hsZOXsN",
  },
  {
    number: 36,
    slug: "ultima-parada",
    name: "Última parada",
    author: "Casey McQuiston",
    type: "sorteio",
    cover_url: "ultima-parada.jpg",
    amazon_url: "https://link.amazon/B03JavGBa",
  },
  {
    number: 37,
    slug: "vitrine",
    name: "Vitrine: Um contrato pode mudar tudo",
    author: "Ingrid Paranhos",
    type: "sorteio",
    cover_url: "vitrine.jpg",
    amazon_url: "https://link.amazon/B06XYVmBg",
  },
  {
    number: 38,
    slug: "as-vantagens-de-ser-voce",
    name: "As vantagens de ser você",
    author: "Ray Tavares",
    type: "sorteio",
    cover_url: "as-vantagens-de-ser-voce.jpg",
    amazon_url: "https://link.amazon/B0g3Un09w",
  },
  {
    number: 39,
    slug: "o-nome-dela-e-sophia",
    name: "O Nome Dela é Sophia",
    author: "Vanessa Freitas",
    type: "sorteio",
    cover_url: "o-nome-dela-e-sophia.jpg",
    amazon_url: "https://link.amazon/B0h1b3T05",
  },
  {
    number: 40,
    slug: "galaxia-desconhecida",
    name: "Galáxia Desconhecida",
    author: "Raquel Alves",
    type: "sorteio",
    cover_url: "galaxia-desconhecida.jpg",
    amazon_url: "https://link.amazon/B02X3X0ul",
  },
  {
    number: 41,
    slug: "ela-fica-com-a-garota",
    name: "Ela fica com a garota",
    author: "Rachael Lippincott e Alyson Derrick",
    type: "sorteio",
    cover_url: "ela-fica-com-a-garota.jpg",
    amazon_url: "https://link.amazon/B04PSvTjs",
  },
  {
    number: 42,
    slug: "borboletas-da-morte",
    name: "Borboletas da Morte",
    author: "Lari Alcantara",
    type: "sorteio",
    cover_url: "borboletas-da-morte.jpg",
    amazon_url: "https://link.amazon/B02OJFJgm",
  },
  {
    number: 43,
    slug: "alem-do-silencio",
    name: "Além do Silêncio",
    author: "Jéssica Batista",
    type: "sorteio",
    cover_url: "alem-do-silencio.jpg",
    amazon_url: "https://link.amazon/B0cf0CiCx",
  },
  {
    number: 44,
    slug: "que-a-melhor-mordida-venca",
    name: "Que a melhor mordida vença",
    author: "Rina Rodriguez",
    type: "sorteio",
    cover_url: "que-a-melhor-mordida-venca.jpg",
    amazon_url: "https://link.amazon/B08nVTXCG",
  },
  {
    number: 45,
    slug: "cerejas-do-inferno",
    name: "Cerejas do inferno",
    author: "Thais Boito",
    type: "sorteio",
    cover_url: "cerejas-do-inferno.jpg",
    amazon_url: "https://link.amazon/B07bmVSa1",
  },
  {
    number: 46,
    slug: "xeque-mate",
    name: "Xeque-Mate",
    author: "Evelin Sousa",
    type: "sorteio",
    cover_url: "xeque-mate.jpg",
    amazon_url: "https://link.amazon/B0gB54D3g",
  },
  {
    number: 47,
    slug: "a-beira-de-nos",
    name: "À Beira de Nós",
    author: "Laila Zago",
    type: "sorteio",
    cover_url: "a-beira-de-nos.jpg",
    amazon_url: "https://link.amazon/B08k93R1X",
  },
  {
    number: 48,
    slug: "garota-de-programa",
    name: "Garota de Programa",
    author: "Rebecca Nobre",
    type: "sorteio",
    cover_url: "garota-de-programa.jpg",
    amazon_url: "https://link.amazon/B0cCEh252",
  },
  {
    number: 49,
    slug: "dona-do-meu-pecado-ruina",
    name: "Dona do meu pecado",
    author: "Fernanda Moser",
    type: "sorteio",
    cover_url: "dona-do-meu-pecado-ruina.jpg",
    amazon_url: "https://link.amazon/B0a1E9oWd",
  },
  {
    number: 50,
    slug: "overdrive",
    name: "Overdrive",
    author: "Agatha Menezes",
    type: "sorteio",
    cover_url: "overdrive.jpg",
    amazon_url: "https://link.amazon/B0cggcJZt",
  },
  {
    number: 51,
    slug: "astrid-parker-nunca-falha",
    name: "Astrid Parker nunca falha (Bright Falls)",
    author: null,
    type: "sorteio",
    cover_url: "astrid-parker-nunca-falha.jpg",
    amazon_url: "https://link.amazon/B0b2BXX3e",
  },
  {
    number: 52,
    slug: "iris-kelly-nao-namora",
    name: "Iris Kelly não namora (Bright Falls)",
    author: null,
    type: "sorteio",
    cover_url: "iris-kelly-nao-namora.jpg",
    amazon_url: "https://link.amazon/B0gv8pOcI",
  },
  {
    number: 53,
    slug: "so-por-um-verao",
    name: "Só por um verão (Família Lancelloti Livro 1)",
    author: null,
    type: "sorteio",
    cover_url: "so-por-um-verao.jpg",
    amazon_url: "https://link.amazon/B013Gv9HT",
  },
  {
    number: 54,
    slug: "de-repente-namoradas",
    name: "⁠De Repente, Namoradas (Família Lancellotti Livro 2)",
    author: null,
    type: "sorteio",
    cover_url: "de-repente-namoradas.jpg",
    amazon_url: "https://link.amazon/B0fotnKAJ",
  },
  {
    number: 55,
    slug: "paixao-platonica",
    name: "Paixão platônica",
    author: null,
    type: "sorteio",
    cover_url: "paixao-platonica.jpg",
    amazon_url: "https://link.amazon/B01efxW70",
  },
  {
    number: 56,
    slug: "entre-livros-e-fios-dourados",
    name: "⁠Entre Livros e Fios Dourados",
    author: null,
    type: "sorteio",
    cover_url: "entre-livros-e-fios-dourados.jpg",
    amazon_url: "https://link.amazon/B07of9W0q",
  },
  {
    number: 57,
    slug: "o-abanar-do-amor",
    name: "O Abanar do Amor",
    author: null,
    type: "sorteio",
    cover_url: "o-abanar-do-amor.jpg",
    amazon_url: "https://link.amazon/B0f4HvhKM",
  },
  {
    number: 58,
    slug: "a-melhor-amiga-do-meu-namorado",
    name: "A melhor amiga do meu namorado",
    author: null,
    type: "sorteio",
    cover_url: "a-melhor-amiga-do-meu-namorado.jpg",
    amazon_url: "https://link.amazon/B0c9m2QpI",
  },
  {
    number: 59,
    slug: "terceiro-croqui",
    name: "Terceiro Croqui (Frutaverso Livro 2)",
    author: null,
    type: "sorteio",
    cover_url: "terceiro-croqui.jpg",
    amazon_url: "https://link.amazon/B0hkj4k39",
  },
  {
    number: 60,
    slug: "operacao-conves",
    name: "Operação Convés (Frutaverso Livro 3)",
    author: null,
    type: "sorteio",
    cover_url: "operacao-conves.jpg",
    amazon_url: "https://link.amazon/B08Pn5mVJ",
  },
  {
    number: 61,
    slug: "princesa-apaixonada",
    name: "⁠Princesa apaixonada",
    author: null,
    type: "sorteio",
    cover_url: "princesa-apaixonada.jpg",
    amazon_url: "https://link.amazon/B0gW0gLh8",
  },
  {
    number: 62,
    slug: "garotas-de-cristal",
    name: "Garotas de Cristal",
    author: null,
    type: "sorteio",
    cover_url: "garotas-de-cristal.jpg",
    amazon_url: "https://link.amazon/B05zoRLDL",
  },
  {
    number: 63,
    slug: "maes-por-acidente",
    name: "⁠Mães por Acidente",
    author: null,
    type: "sorteio",
    cover_url: "maes-por-acidente.jpg",
    amazon_url: "https://link.amazon/B04vBGeuo",
  },
  {
    number: 64,
    slug: "cartas-para-pior-garota-do-mundo-ps-eu-te-odeio",
    name: "⁠Cartas Para Pior Garota do Mundo: PS: Eu te Odeio",
    author: null,
    type: "sorteio",
    cover_url: "cartas-para-pior-garota-do-mundo-ps-eu-te-odeio.jpg",
    amazon_url: "https://link.amazon/B04YJcE8A",
  },
  {
    number: 65,
    slug: "como-seduzir-a-novata",
    name: "Como Seduzir A Novata",
    author: null,
    type: "sorteio",
    cover_url: "como-seduzir-a-novata.jpg",
    amazon_url: "https://link.amazon/B0cFE1NJH",
  },
  {
    number: 66,
    slug: "clausula-da-paixao",
    name: "Cláusula da Paixão",
    author: null,
    type: "sorteio",
    cover_url: "clausula-da-paixao.jpg",
    amazon_url: "https://link.amazon/B08x079rq",
  },
  {
    number: 67,
    slug: "patinando-ate-voce",
    name: "Patinando até Você",
    author: null,
    type: "sorteio",
    cover_url: "patinando-ate-voce.jpg",
    amazon_url: "https://link.amazon/B00NunQDy",
  },
  {
    number: 68,
    slug: "proibido-se-apaixonar-de-novo",
    name: "Proibido se apaixonar de novo",
    author: null,
    type: "sorteio",
    cover_url: "proibido-se-apaixonar-de-novo.jpg",
    amazon_url: "https://link.amazon/B05f82cDM",
  },
  {
    number: 69,
    slug: "a-filha-proibida-do-meu-chefe",
    name: "A Filha Proibida do Meu Chefe",
    author: null,
    type: "sorteio",
    cover_url: "a-filha-proibida-do-meu-chefe.jpg",
    amazon_url: "https://link.amazon/B0giLWGbJ",
  },
  {
    number: 70,
    slug: "volte-pra-superficie",
    name: "Volte pra Superfície",
    author: null,
    type: "sorteio",
    cover_url: "volte-pra-superficie.jpg",
    amazon_url: "https://link.amazon/B03aE147Z",
  },
  {
    number: 71,
    slug: "nao-somos-melhores-amigas",
    name: "⁠Não somos melhores amigas",
    author: null,
    type: "sorteio",
    cover_url: "nao-somos-melhores-amigas.jpg",
    amazon_url: "https://link.amazon/B0dSLFTN8",
  },
  {
    number: 72,
    slug: "enfim-esposas",
    name: "Enfim, esposas",
    author: null,
    type: "sorteio",
    cover_url: "enfim-esposas.jpg",
    amazon_url: "https://link.amazon/B05wzI32N",
  },
  {
    number: 73,
    slug: "opostos-concomitantes",
    name: "Opostos Concomitantes (Opostos Co. Livro 2)",
    author: null,
    type: "sorteio",
    cover_url: "opostos-concomitantes.jpg",
    amazon_url: "https://link.amazon/B0hA8MPQK",
  },
  {
    number: 74,
    slug: "opostos-contingentes",
    name: "⁠Opostos Contingentes (Opostos Co. Livro 3)",
    author: null,
    type: "sorteio",
    cover_url: "opostos-contingentes.jpg",
    amazon_url: "https://link.amazon/B08V6ouSb",
  },
  {
    number: 75,
    slug: "alianca-em-campo-ganhando-o-jogo",
    name: "⁠Aliança em Campo: Ganhando o Jogo",
    author: null,
    type: "sorteio",
    cover_url: "alianca-em-campo-ganhando-o-jogo.jpg",
    amazon_url: "https://link.amazon/B09z94Ff9",
  },
  {
    number: 76,
    slug: "a-sociedade-de-eva-parte-1",
    name: "⁠A Sociedade de Eva: Parte I : a dança",
    author: null,
    type: "sorteio",
    cover_url: "a-sociedade-de-eva-parte-1.jpg",
    amazon_url: "https://link.amazon/B0bDngD5Q",
  },
  {
    number: 77,
    slug: "a-sociedade-de-eva-parte-2",
    name: "⁠A Sociedade de Eva: Parte II: a queda",
    author: null,
    type: "sorteio",
    cover_url: "a-sociedade-de-eva-parte-2.jpg",
    amazon_url: "https://link.amazon/B02bWAANJ",
  },
  {
    number: 78,
    slug: "medusa",
    name: "Medusa",
    author: null,
    type: "sorteio",
    cover_url: "medusa.jpg",
    amazon_url: "https://link.amazon/B0fQVqGkL",
  },
  {
    number: 79,
    slug: "ultimo-romance",
    name: "⁠Último Romance",
    author: null,
    type: "sorteio",
    cover_url: "ultimo-romance.jpg",
    amazon_url: "https://link.amazon/B08Ongwam",
  },
  {
    number: 80,
    slug: "monte-belalis",
    name: "⁠Monte Belalis",
    author: null,
    type: "sorteio",
    cover_url: "monte-belalis.jpg",
    amazon_url: "https://link.amazon/B0f3CGMWR",
  },
  {
    number: 81,
    slug: "retrato-de-amor",
    name: "⁠Retrato de Amor",
    author: null,
    type: "sorteio",
    cover_url: "retrato-de-amor.jpg",
    amazon_url: "https://link.amazon/B0gxRAUJd",
  },
  {
    number: 82,
    slug: "uma-familia-ao-acaso",
    name: "⁠Uma família ao acaso",
    author: null,
    type: "sorteio",
    cover_url: "uma-familia-ao-acaso.jpg",
    amazon_url: "https://link.amazon/B05AIsohv",
  },
  {
    number: 83,
    slug: "o-trono-de-jasmim",
    name: "O trono de jasmim (Vol. 1 Os Reinos em Chamas)",
    author: null,
    type: "sorteio",
    cover_url: "o-trono-de-jasmim.jpg",
    amazon_url: "https://link.amazon/B071mr0uF",
  },
  {
    number: 84,
    slug: "o-cara-que-estou-a-fim-nao-e-um-cara-volume-1",
    name: "⁠O cara que estou a fim não é um cara?! - Volume 1",
    author: null,
    type: "sorteio",
    cover_url: "o-cara-que-estou-a-fim-nao-e-um-cara-volume-1.jpg",
    amazon_url: "https://link.amazon/B05ebJnYN",
  },
  {
    number: 85,
    slug: "a-garota-do-mar",
    name: "⁠A garota do mar",
    author: null,
    type: "sorteio",
    cover_url: "a-garota-do-mar.jpg",
    amazon_url: "https://link.amazon/B0dqrP1PM",
  },
  {
    number: 86,
    slug: "girls-like-girls",
    name: "⁠Girls Like Girls",
    author: null,
    type: "sorteio",
    cover_url: "girls-like-girls.jpg",
    amazon_url: "https://link.amazon/B0cRRvbYi",
  },
  {
    number: 87,
    slug: "full-shift",
    name: "Full Shift: A transformação total",
    author: null,
    type: "sorteio",
    cover_url: "full-shift.jpg",
    amazon_url: "https://link.amazon/B0iXT6Xwp",
  },
  {
    number: 88,
    slug: "jardim-para-duas",
    name: "⁠Jardim para duas",
    author: null,
    type: "sorteio",
    cover_url: "jardim-para-duas.jpg",
    amazon_url: "https://link.amazon/B0i5SQiYk",
  },
  {
    number: 89,
    slug: "imogen-obviamente",
    name: "⁠Imogen, obviamente",
    author: null,
    type: "sorteio",
    cover_url: "imogen-obviamente.jpg",
    amazon_url: "https://link.amazon/B0aQp39A7",
  },
  {
    number: 90,
    slug: "ninguem-especial",
    name: "⁠Ninguém especial",
    author: null,
    type: "sorteio",
    cover_url: "ninguem-especial.jpg",
    amazon_url: "https://link.amazon/B0bXVQdha",
  },
  {
    number: 91,
    slug: "frases-1",
    name: "Obcecada por mulheres fictícias",
    author: null,
    type: "frase",
    cover_url: "frases-1.jpeg",
    amazon_url: null,
  },
  {
    number: 92,
    slug: "frases-2",
    name: "Fã nº 1 de personagens sáficas trambiqueiras",
    author: null,
    type: "frase",
    cover_url: "frases-2.jpeg",
    amazon_url: null,
  },
  {
    number: 93,
    slug: "frases-3",
    name: "Me pergunte sobre meus livros sáficos favoritos",
    author: null,
    type: "frase",
    cover_url: "frases-3.jpeg",
    amazon_url: null,
  },
  {
    number: 94,
    slug: "frases-4",
    name: "Status: em relacionamento sério com várias personagens sáficas",
    author: null,
    type: "frase",
    cover_url: "frases-4.jpeg",
    amazon_url: null,
  },
  {
    number: 95,
    slug: "frases-5",
    name: "0days 0hours 0minutes Since last falling in love with a fictional woman",
    author: null,
    type: "frase",
    cover_url: "frases-5.jpeg",
    amazon_url: null,
  },
  {
    number: 96,
    slug: "ls-1",
    name: "enemies to lovers",
    author: null,
    type: "ls",
    cover_url: "ls-1.jpeg",
    amazon_url: null,
  },
  {
    number: 97,
    slug: "ls-2",
    name: "friends to lovers",
    author: null,
    type: "ls",
    cover_url: "ls-2.jpeg",
    amazon_url: null,
  },
  {
    number: 98,
    slug: "ls-3",
    name: "só tem uma cama",
    author: null,
    type: "ls",
    cover_url: "ls-3.jpeg",
    amazon_url: null,
  },
  {
    number: 99,
    slug: "ls-4",
    name: "grumpy x sunshine",
    author: null,
    type: "ls",
    cover_url: "ls-4.jpeg",
    amazon_url: null,
  },
  {
    number: 100,
    slug: "ls-5",
    name: "found family",
    author: null,
    type: "ls",
    cover_url: "ls-5.jpeg",
    amazon_url: null,
  },
];

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    sticker_number: 1,
    q_index: 0,
    text: "Em um romance de G.B. Baldassari, qual acontecimento coloca Abby e Eva em uma confusão familiar inesperada?",
    options: [
      "Uma advogada precisa defender uma lutadora acusada injustamente",
      "Uma menina procura a mãe biológica e aproxima duas mulheres com vidas muito diferentes",
      "Uma campeã de boxe reencontra uma rival do passado dentro de uma academia",
      "Uma jornalista investiga o desaparecimento de uma criança adotada",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 1,
    q_index: 1,
    text: "Em qual cidade Eva e Lily, personagens de um livro de G.B. Baldassari, moram?",
    options: ["Baddeck (Canadá)", "Vancouver (Canadá)", "Halifax (Canadá)", "Hamilton (Canadá)"],
    correct_index: 2,
  },
  {
    sticker_number: 2,
    q_index: 0,
    text: "Qual dilema melhor combina com uma protagonista de Clara Alves que decide bancar o cupido na faculdade?",
    options: [
      "Jess quer provar que o amor não existe, mas acaba escrevendo cartas românticas para desconhecidas",
      "Chiara acredita que talvez o amor não seja para ela, então decide ajudar outras pessoas a se apaixonarem",
      "Helena tenta reconquistar a ex da melhor amiga, mas acaba se envolvendo com uma professora",
      "Chiara entra no curso de direito para fugir da família, mas se apaixona pela própria chefe",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 2,
    q_index: 1,
    text: "A sinopse do livro mais recente de Clara Alves apresenta a história como uma comédia romântica divertida e perfeita para fãs de qual filme?",
    options: [
      "Meninas Malvadas",
      "As patricinhas de Beverly Hills",
      "Legalmente Loira",
      "10 coisas que eu odeio em você",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 3,
    q_index: 0,
    text: "Em uma história de Bia Crespo, qual situação coloca Antônia no centro de uma confusão romântica?",
    options: [
      "Ela começa a namorar Júlia para fazer ciúmes em Camila, a garota mais disputada da faculdade",
      "Ela finge gostar de Tamires para esconder que está apaixonada por uma colega do curso de cinema",
      "Ela aceita um namoro de mentira com a própria crush, mesmo sabendo que a garota quer se aproximar da irmã dela",
      "Ela inventa um relacionamento falso com a amiga para conseguir frequentar os eventos universitários",
    ],
    correct_index: 2,
  },
  {
    sticker_number: 3,
    q_index: 1,
    text: "Qual combinação de elementos ajuda a reconhecer esse romance de estreia de Bia Crespo?",
    options: [
      "Faculdade, namoro de mentira, crush inalcançável e uma irmã popular demais",
      "Viagem de verão, reencontro de ex, amizade de infância e amor à distância",
      "Competição gastronômica, rivalidade familiar, namoro secreto e uma chefe exigente",
      "Curso de cinema, casamento falso, investigação escolar e uma irmã desaparecida",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 4,
    q_index: 0,
    text: "Qual dilema melhor combina com uma protagonista de Victoria Mendes que sonha em entrar no mercado literário?",
    options: [
      "Liz aceita fingir um namoro com a chefe em troca da chance de ter seu livro lido por uma agente importante",
      "Liz abandona a carreira de escritora para trabalhar como agente literária na Faria Lima",
      "Liz inventa que publicou um best-seller para conseguir uma vaga em uma editora famosa",
      "Liz finge ser assistente pessoal de uma autora para descobrir os segredos do mercado editorial",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 4,
    q_index: 1,
    text: "Na farsa romântica vivida por Liz na história de Victoria Mendes, qual é o interesse da chefe ao propor o namoro falso?",
    options: [
      "Fazer ciúmes em uma ex-namorada que trabalha na mesma empresa",
      "Chamar atenção da diretoria e agradar o comitê de diversidade da empresa",
      "Conseguir uma promoção para Liz no departamento editorial",
      "Convencer Valentina Rosa a representar as duas como autoras",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 5,
    q_index: 0,
    text: "O que faz uma jornalista prestes a ser demitida atravessar o caminho de uma atriz que tentava viver longe dos holofotes?",
    options: [
      "Uma entrevista cancelada com Rihanna, que a obriga a procurar outra celebridade para salvar a edição da revista",
      "Uma missão no México para escrever sobre um hotel, que acaba colocando Belladonna diante dos segredos de Iliana",
      "Uma cobertura da maior premiação de Hollywood, onde Belladonna descobre por que Iliana abandonou a fama",
      "Uma viagem de férias que se transforma em investigação quando Belladonna encontra uma atriz desaparecida",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 5,
    q_index: 1,
    text: "Em uma história de Line Cunha, qual aposta nasce com cara de desastre anunciado?",
    options: [
      "Bella passar um verão no Mondragón Hotel para tentar transformá-lo em capa da revista",
      "Iliana voltar para Hollywood e conceder sua primeira entrevista depois de oito anos",
      "Bella escrever uma matéria elogiando a Revista Verity para evitar a própria demissão",
      "Iliana contratar uma jornalista para fingir que o hotel é um sucesso entre celebridades",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 6,
    q_index: 0,
    text: "Em um livro de Mariana Rosa, depois da morte misteriosa da avó, o que Ophélia encontra ao voltar para sua cidade natal?",
    options: [
      "Um diário que revela a existência de uma família falsa criada para esconder crimes políticos",
      "Um clube clandestino ligado a mulheres sáficas dos anos 60 e a uma série de segredos violentos",
      "Uma rede de jornalistas que investigava desaparecimentos em premiações literárias antigas",
      "Uma casa abandonada onde a prefeita escondia provas contra a própria família",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 6,
    q_index: 1,
    text: "Quais tropes ajudam a identificar essa história de Mariana Rosa?",
    options: [
      "Investigação, clube secreto, diferença de idade e relação cão e gato",
      "Namoro de mentira, faculdade, melhores amigas e amadurecimento",
      "Segunda chance, viagem de verão, ex-namoradas e found family",
      "Rivais no trabalho, competição esportiva, fama e romance à distância",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 7,
    q_index: 0,
    text: "Amanda e Pamela não se suportam, mas acabam vendo na aliança uma saída para problemas bem diferentes. No livro de Ju Mesquita, qual é a base desse acordo?",
    options: [
      "Uma aposta entre funcionárias que vira casamento de verdade",
      "Um casamento falso que pode ajudar as duas a resolverem suas vidas",
      "Uma exigência da empresa para manter as duas no mesmo cargo",
      "Uma tentativa de esconder um antigo relacionamento das famílias",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 7,
    q_index: 1,
    text: "Antes da aliança entrar na história, qual dinâmica define Amanda e Pamela nesse romance de Ju Mesquita?",
    options: [
      "Duas melhores amigas que trabalham juntas e fingem se odiar para esconder a atração",
      "Uma chefe e uma funcionária que se desafiam o tempo todo e não se suportam",
      "Duas ex-namoradas que precisam dividir a mesma casa depois de anos afastadas",
      "Uma designer e uma cliente que se conhecem durante os preparativos de um casamento",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 8,
    q_index: 0,
    text: "No livro de D. Barreto, o que faz Roberta quebrar a distância que costuma manter entre trabalho e vida pessoal?",
    options: [
      "A chegada de Brenda, uma herdeira impulsiva que volta ao Brasil e passa a morar no hotel",
      "A chance de assumir a direção de outro hotel fora de Campinas",
      "O reencontro com uma ex-namorada que se hospeda no hotel com a família",
      "A descoberta de que sua filha pequena criou amizade com uma funcionária nova",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 8,
    q_index: 1,
    text: "Qual combinação de tropes combina com esse romance de D. Barreto?",
    options: [
      "Age gap, grumpy x sunshine, maternidade e opostas que se atraem",
      "Casamento falso, chefe x funcionária, herança e elas não se suportam",
      "Investigação, clube secreto, diferença de idade e relação cão e gato",
      "Namoro de mentira, faculdade, crush inalcançável e irmã popular",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 9,
    q_index: 0,
    text: "Em um romance de V.S. Vilela, o que Victoria passa a receber depois de um incidente na faculdade?",
    options: [
      "Cartas de um admirador secreto, sem imaginar que foram escritas por uma garota que ela detesta",
      "Convites para concursos de artes plásticas enviados por uma rival misteriosa",
      "Bilhetes anônimos revelando segredos da Fraternidade das Minervas",
      "Mensagens de uma ex-amiga tentando se aproximar depois de anos afastadas",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 9,
    q_index: 1,
    text: "Qual contraste melhor descreve Victoria e Rayka nessa história de V.S. Vilela?",
    options: [
      "Victoria é vista como a “garota de ouro” da faculdade, enquanto Rayka é a garota debochada que ela detesta",
      "Victoria é uma artista anônima, enquanto Rayka é a líder popular da Fraternidade das Minervas",
      "Victoria tenta esconder que escreve cartas, enquanto Rayka acredita que o admirador secreto é um homem",
      "Victoria quer abandonar a faculdade, enquanto Rayka tenta convencê-la a participar de concursos de artes plásticas",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 10,
    q_index: 0,
    text: "O que o primeiro livro de poemas de Karoline Mandu convida a acompanhar?",
    options: [
      "A descoberta de uma garota que gosta de garotas, passando por inseguranças, beleza e orgulho",
      "A história de duas melhores amigas que fingem não se conhecer depois de uma viagem",
      "A rotina de uma escritora que transforma cartas antigas em um romance universitário",
      "A trajetória de uma jovem que esconde da família o sonho de publicar seu primeiro livro",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 10,
    q_index: 1,
    text: "Qual elemento da capa do livro de Karoline Mandu dialoga diretamente com a ideia de segredo e descoberta presente nessa obra?",
    options: [
      "Um armário aberto, com roupas à mostra e o título escrito sobre ele",
      "Uma janela fechada, com cartas espalhadas pelo chão",
      "Uma porta de escola, com bilhetes colados na parede",
      "Uma estante de livros, com páginas rasgadas e flores secas",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 11,
    q_index: 0,
    text: "Em um romance de Sarah Oliveira ambientado nas Olimpíadas de 1988, o que aproxima Leona e Zoya fora das quadras?",
    options: [
      "Uma lesão inesperada que obriga as duas a treinarem juntas antes da final",
      "Um documentário sobre paz e Jogos Olímpicos que coloca as rivais em proximidade forçada",
      "Uma troca de uniformes entre seleções que faz as duas serem confundidas pela imprensa",
      "Uma entrevista polêmica que transforma as atletas em símbolos da rivalidade entre países",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 11,
    q_index: 1,
    text: "Duas jogadoras de vôlei, rivais nas seleções dos Estados Unidos e da União Soviética, vivem um romance proibido em meio às Olimpíadas. Qual é o nome desse livro?",
    options: ["Opostas na quadra", "Olimpíadas do coração", "Opostas em guerra", "Rivais em Seul"],
    correct_index: 2,
  },
  {
    sticker_number: 12,
    q_index: 0,
    text: "Na história de Englantine, o que Atena Lisboa e Cordélia Salgueiro pensam sobre a rivalidade entre suas famílias?",
    options: [
      "Elas acreditam que a rivalidade é perigosa demais para ser questionada",
      "Elas acham que a hostilidade é uma invenção exagerada dos familiares",
      "Elas querem continuar a disputa para provar quem tem mais influência na cidade",
      "Elas descobrem que a rivalidade começou durante uma antiga viagem de trem",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 12,
    q_index: 1,
    text: "Duas jovens de famílias rivais, uma cidade do interior e uma viagem de trem que retoma um trajeto nostálgico e mágico: qual é o nome desse livro?",
    options: [
      "Entre trilhos e promessas",
      "Vila das Íris",
      "Em todas as gotas de chuva",
      "O último assento do trem",
    ],
    correct_index: 2,
  },
  {
    sticker_number: 13,
    q_index: 0,
    text: "Natalie chega ao Colégio Madre Cordélia esperando um recomeço, mas qual detalhe bagunça tudo logo de cara no romance de Marina Basso?",
    options: [
      "Ela precisa dividir o quarto com Esther, a filha da diretora",
      "Ela descobre que foi transferida para outro internato",
      "Ela é escolhida para liderar os trotes do último ano",
      "Ela precisa fingir que conhece Esther desde a infância",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 13,
    q_index: 1,
    text: "Uma aluna nova, a filha da diretora, um internato no Brasil e um primeiro beijo causado por um trote fazem parte de qual livro?",
    options: [
      "Último ano no Madre Cordélia",
      "Regras para beijar sua rival",
      "Colegas de quarto",
      "A filha da diretora",
    ],
    correct_index: 2,
  },
  {
    sticker_number: 14,
    q_index: 0,
    text: "No romance de Zey Shelsea, como Eva e Renata se conhecem?",
    options: [
      "Eva procura Renata depois de uma indicação na faculdade de letras",
      "Renata encontra Eva trabalhando em uma livraria e oferece ajuda com um livro",
      "Eva tropeça em Renata ao sair de sua livraria favorita",
      "Renata atende Eva depois de um acidente no hospital",
    ],
    correct_index: 2,
  },
  {
    sticker_number: 14,
    q_index: 1,
    text: "Uma estudante de letras, uma neurocirurgiã, um tropeço inesperado e um romance slow burn com age gap fazem parte de qual livro?",
    options: [
      "Quando o sol tropeça",
      "A neurocirurgiã e a livreira",
      "Entre livros e muros",
      "Imensurável",
    ],
    correct_index: 3,
  },
  {
    sticker_number: 15,
    q_index: 0,
    text: "No romance de Victoria Moon, qual regra do intercâmbio complica a relação entre Malu e Georgia?",
    options: [
      "A intercambista não pode estudar fora da universidade indicada pela host-family",
      "A intercambista não pode se envolver amorosamente com ninguém da host-family",
      "A intercambista precisa morar sozinha depois do primeiro mês em Florença",
      "A intercambista deve evitar contato com estudantes de outras nacionalidades",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 15,
    q_index: 1,
    text: "Uma carioca ganha uma bolsa para estudar em Florença, é recebida por uma família italiana e descobre uma integrante que nunca havia sido mencionada. Qual é o nome desse livro?",
    options: [
      "Intercâmbio em Florença",
      "As regras da host-family",
      "Georgia Rose: Segredos de Florença",
      "Entre cartas e vinho italiano",
    ],
    correct_index: 2,
  },
  {
    sticker_number: 16,
    q_index: 0,
    text: "No romance de Helena Nolasco, qual desafio aproxima Alicia e Jamie na nova escola?",
    options: [
      "Nikki desafia Jamie a seduzir Alicia, a nova integrante do clube de Decatlo Acadêmico",
      "Alicia desafia Jamie a entrar no clube de ciências para melhorar suas notas",
      "Jamie precisa treinar Alicia para entrar na equipe de líderes de torcida",
      "Nikki convence Alicia a fingir interesse por Jamie para se tornar popular",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 16,
    q_index: 1,
    text: "Uma cientista carioca, uma líder de torcida, uma nova escola na Califórnia e um desafio cruel que vira romance fazem parte de qual livro?",
    options: [
      "A líder de torcida",
      "A garota do topo",
      "O clube do Decatlo",
      "Opostos na Califórnia",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 17,
    q_index: 0,
    text: "No romance de Yasmim Mahmud Kader, qual segredo complica a relação entre Gabriela e Céu?",
    options: [
      "Gabriela não sabe que Céu também é Sky, a e-girl por quem ela se apaixonou online",
      "Céu esconde que joga no mesmo time de basquete que Gabriela",
      "Gabriela descobre que Sky escreveu uma fanfic inspirada em sua ex-namorada",
      "Céu finge ser capitã do time para se aproximar de Gabriela na faculdade",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 17,
    q_index: 1,
    text: "Uma garota cria um disfarce online para escrever fanfics sáficas, enquanto uma capitã do basquete se apaixona por essa versão misteriosa dela. Qual é o nome desse livro?",
    options: [
      "Amor em transmissão",
      "Não é só de amor que eu sei falar",
      "A garota por trás da live",
      "Fanfics de nós duas",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 18,
    q_index: 0,
    text: "Antes de se envolver com Eleanor, qual decisão coloca Natalie no caminho da nova agente literária no livro de Camilla Giordanno?",
    options: [
      "Ela aceita revisar um manuscrito misterioso deixado por Eleanor",
      "Ela faz hora extra em um sábado tentando evitar uma possível demissão",
      "Ela viaja para investigar o passado do futuro ex-marido de Eleanor",
      "Ela abandona o emprego para procurar pistas sobre crimes antigos",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 18,
    q_index: 1,
    text: "Um romance entre Natalie e Eleanor, um passado misterioso, pistas que levam ao futuro ex-marido e uma trama de mentiras, segredos e crimes fazem parte de qual livro?",
    options: [
      "O labirinto de Eleanor",
      "As mentiras que guardamos",
      "Os segredos que contei ao oceano",
      "Quando o amor vira vingança",
    ],
    correct_index: 2,
  },
  {
    sticker_number: 19,
    q_index: 0,
    text: "No livro de Fernanda V., qual é a relação de Aurora com os irmãos mais novos de Helena?",
    options: [
      "Aurora é vizinha deles",
      "Aurora é professora deles",
      "Aurora é prima deles",
      "Aurora é colega de faculdade deles",
    ],
    correct_index: 1,
  },
  {
    sticker_number: 19,
    q_index: 1,
    text: "Uma mulher metódica, uma professora expansiva, irmãos mais novos como ponto de contato e uma conexão que tira a protagonista do controle apontam para qual título?",
    options: [
      "Entre aulas e encontros",
      "A professora dos meus irmãos",
      "Rotina interrompida",
      "Opostos Complementares",
    ],
    correct_index: 3,
  },
  {
    sticker_number: 20,
    q_index: 0,
    text: "Na fantasia gótica de Giu Domingues, como a magia é criada dentro do Conservatório de Vermília?",
    options: [
      "Por meio do canto das sopranos",
      "Através de pinturas feitas pelas Prodígios",
      "Com feitiços escritos em cartas antigas",
      "Pela dança das alunas da Orquestra",
    ],
    correct_index: 0,
  },
  {
    sticker_number: 20,
    q_index: 1,
    text: "Uma soprano ambiciosa, um Conservatório onde o canto cria magia, uma hierarquia na Orquestra e uma voz misteriosa no espelho fazem parte de qual livro?",
    options: [
      "A soprano de Vermília",
      "Melodia das sombras",
      "Canção dos ossos",
      "A ópera das Prodígios",
    ],
    correct_index: 2,
  },
];

export const SEED_REDEEM_CODES: SeedRedeemCode[] = [
  {
    code: "WE34ER4T",
    element: null,
    active: true,
    release_day: 1,
  },
  {
    code: "324RFS31",
    element: null,
    active: true,
    release_day: 1,
  },
  {
    code: "B7K9P2X5",
    element: null,
    active: true,
    release_day: 1,
  },
  {
    code: "H4M8N5Q1",
    element: null,
    active: true,
    release_day: 2,
  },
  {
    code: "C3D6E9F2",
    element: null,
    active: true,
    release_day: 2,
  },
  {
    code: "J1K4L7M8",
    element: null,
    active: true,
    release_day: 2,
  },
  {
    code: "P3Q6R9S2",
    element: null,
    active: true,
    release_day: 3,
  },
  {
    code: "T1U4V7W2",
    element: null,
    active: true,
    release_day: 3,
  },
  {
    code: "X8Y1Z4A2",
    element: null,
    active: true,
    release_day: 3,
  },
  {
    code: "F3G6H9J2",
    element: null,
    active: true,
    release_day: 4,
  },
  {
    code: "K1L4M7N2",
    element: null,
    active: true,
    release_day: 4,
  },
  {
    code: "P8Q1R4S2",
    element: null,
    active: true,
    release_day: 4,
  },
  {
    code: "V3W6X9Y2",
    element: null,
    active: true,
    release_day: 5,
  },
  {
    code: "Z1A4B7C2",
    element: null,
    active: true,
    release_day: 5,
  },
  {
    code: "D8E1F4G2",
    element: null,
    active: true,
    release_day: 5,
  },
];

export const SEED_REDEEM_POOLS: SeedRedeemPool[] = [
  {
    code: "WE34ER4T",
    sticker_number: 21,
  },
  {
    code: "WE34ER4T",
    sticker_number: 23,
  },
  {
    code: "WE34ER4T",
    sticker_number: 24,
  },
  {
    code: "WE34ER4T",
    sticker_number: 25,
  },
  {
    code: "WE34ER4T",
    sticker_number: 26,
  },
  {
    code: "WE34ER4T",
    sticker_number: 27,
  },
  {
    code: "WE34ER4T",
    sticker_number: 28,
  },
  {
    code: "WE34ER4T",
    sticker_number: 29,
  },
  {
    code: "WE34ER4T",
    sticker_number: 30,
  },
  {
    code: "WE34ER4T",
    sticker_number: 31,
  },
  {
    code: "WE34ER4T",
    sticker_number: 32,
  },
  {
    code: "WE34ER4T",
    sticker_number: 33,
  },
  {
    code: "WE34ER4T",
    sticker_number: 34,
  },
  {
    code: "WE34ER4T",
    sticker_number: 35,
  },
  {
    code: "WE34ER4T",
    sticker_number: 36,
  },
  {
    code: "WE34ER4T",
    sticker_number: 37,
  },
  {
    code: "WE34ER4T",
    sticker_number: 38,
  },
  {
    code: "WE34ER4T",
    sticker_number: 39,
  },
  {
    code: "WE34ER4T",
    sticker_number: 40,
  },
  {
    code: "WE34ER4T",
    sticker_number: 41,
  },
  {
    code: "WE34ER4T",
    sticker_number: 42,
  },
  {
    code: "WE34ER4T",
    sticker_number: 43,
  },
  {
    code: "WE34ER4T",
    sticker_number: 44,
  },
  {
    code: "WE34ER4T",
    sticker_number: 45,
  },
  {
    code: "WE34ER4T",
    sticker_number: 46,
  },
  {
    code: "WE34ER4T",
    sticker_number: 47,
  },
  {
    code: "WE34ER4T",
    sticker_number: 48,
  },
  {
    code: "WE34ER4T",
    sticker_number: 49,
  },
  {
    code: "WE34ER4T",
    sticker_number: 50,
  },
  {
    code: "WE34ER4T",
    sticker_number: 53,
  },
  {
    code: "WE34ER4T",
    sticker_number: 54,
  },
  {
    code: "WE34ER4T",
    sticker_number: 55,
  },
  {
    code: "WE34ER4T",
    sticker_number: 56,
  },
  {
    code: "WE34ER4T",
    sticker_number: 57,
  },
  {
    code: "WE34ER4T",
    sticker_number: 58,
  },
  {
    code: "WE34ER4T",
    sticker_number: 59,
  },
  {
    code: "WE34ER4T",
    sticker_number: 60,
  },
  {
    code: "WE34ER4T",
    sticker_number: 61,
  },
  {
    code: "WE34ER4T",
    sticker_number: 62,
  },
  {
    code: "WE34ER4T",
    sticker_number: 63,
  },
  {
    code: "WE34ER4T",
    sticker_number: 64,
  },
  {
    code: "WE34ER4T",
    sticker_number: 65,
  },
  {
    code: "WE34ER4T",
    sticker_number: 66,
  },
  {
    code: "WE34ER4T",
    sticker_number: 67,
  },
  {
    code: "WE34ER4T",
    sticker_number: 68,
  },
  {
    code: "WE34ER4T",
    sticker_number: 69,
  },
  {
    code: "WE34ER4T",
    sticker_number: 70,
  },
  {
    code: "WE34ER4T",
    sticker_number: 71,
  },
  {
    code: "WE34ER4T",
    sticker_number: 72,
  },
  {
    code: "WE34ER4T",
    sticker_number: 73,
  },
  {
    code: "WE34ER4T",
    sticker_number: 74,
  },
  {
    code: "WE34ER4T",
    sticker_number: 75,
  },
  {
    code: "WE34ER4T",
    sticker_number: 76,
  },
  {
    code: "WE34ER4T",
    sticker_number: 77,
  },
  {
    code: "WE34ER4T",
    sticker_number: 78,
  },
  {
    code: "WE34ER4T",
    sticker_number: 79,
  },
  {
    code: "WE34ER4T",
    sticker_number: 80,
  },
  {
    code: "WE34ER4T",
    sticker_number: 81,
  },
  {
    code: "WE34ER4T",
    sticker_number: 82,
  },
  {
    code: "WE34ER4T",
    sticker_number: 83,
  },
  {
    code: "324RFS31",
    sticker_number: 21,
  },
  {
    code: "324RFS31",
    sticker_number: 23,
  },
  {
    code: "324RFS31",
    sticker_number: 24,
  },
  {
    code: "324RFS31",
    sticker_number: 25,
  },
  {
    code: "324RFS31",
    sticker_number: 26,
  },
  {
    code: "324RFS31",
    sticker_number: 27,
  },
  {
    code: "324RFS31",
    sticker_number: 28,
  },
  {
    code: "324RFS31",
    sticker_number: 29,
  },
  {
    code: "324RFS31",
    sticker_number: 30,
  },
  {
    code: "324RFS31",
    sticker_number: 31,
  },
  {
    code: "324RFS31",
    sticker_number: 32,
  },
  {
    code: "324RFS31",
    sticker_number: 33,
  },
  {
    code: "324RFS31",
    sticker_number: 34,
  },
  {
    code: "324RFS31",
    sticker_number: 35,
  },
  {
    code: "324RFS31",
    sticker_number: 36,
  },
  {
    code: "324RFS31",
    sticker_number: 37,
  },
  {
    code: "324RFS31",
    sticker_number: 38,
  },
  {
    code: "324RFS31",
    sticker_number: 39,
  },
  {
    code: "324RFS31",
    sticker_number: 40,
  },
  {
    code: "324RFS31",
    sticker_number: 41,
  },
  {
    code: "324RFS31",
    sticker_number: 42,
  },
  {
    code: "324RFS31",
    sticker_number: 43,
  },
  {
    code: "324RFS31",
    sticker_number: 44,
  },
  {
    code: "324RFS31",
    sticker_number: 45,
  },
  {
    code: "324RFS31",
    sticker_number: 46,
  },
  {
    code: "324RFS31",
    sticker_number: 47,
  },
  {
    code: "324RFS31",
    sticker_number: 48,
  },
  {
    code: "324RFS31",
    sticker_number: 49,
  },
  {
    code: "324RFS31",
    sticker_number: 50,
  },
  {
    code: "324RFS31",
    sticker_number: 53,
  },
  {
    code: "324RFS31",
    sticker_number: 54,
  },
  {
    code: "324RFS31",
    sticker_number: 55,
  },
  {
    code: "324RFS31",
    sticker_number: 56,
  },
  {
    code: "324RFS31",
    sticker_number: 57,
  },
  {
    code: "324RFS31",
    sticker_number: 58,
  },
  {
    code: "324RFS31",
    sticker_number: 59,
  },
  {
    code: "324RFS31",
    sticker_number: 60,
  },
  {
    code: "324RFS31",
    sticker_number: 61,
  },
  {
    code: "324RFS31",
    sticker_number: 62,
  },
  {
    code: "324RFS31",
    sticker_number: 63,
  },
  {
    code: "324RFS31",
    sticker_number: 64,
  },
  {
    code: "324RFS31",
    sticker_number: 65,
  },
  {
    code: "324RFS31",
    sticker_number: 66,
  },
  {
    code: "324RFS31",
    sticker_number: 67,
  },
  {
    code: "324RFS31",
    sticker_number: 68,
  },
  {
    code: "324RFS31",
    sticker_number: 69,
  },
  {
    code: "324RFS31",
    sticker_number: 70,
  },
  {
    code: "324RFS31",
    sticker_number: 71,
  },
  {
    code: "324RFS31",
    sticker_number: 72,
  },
  {
    code: "324RFS31",
    sticker_number: 73,
  },
  {
    code: "324RFS31",
    sticker_number: 74,
  },
  {
    code: "324RFS31",
    sticker_number: 75,
  },
  {
    code: "324RFS31",
    sticker_number: 76,
  },
  {
    code: "324RFS31",
    sticker_number: 77,
  },
  {
    code: "324RFS31",
    sticker_number: 78,
  },
  {
    code: "324RFS31",
    sticker_number: 79,
  },
  {
    code: "324RFS31",
    sticker_number: 80,
  },
  {
    code: "324RFS31",
    sticker_number: 81,
  },
  {
    code: "324RFS31",
    sticker_number: 82,
  },
  {
    code: "324RFS31",
    sticker_number: 83,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 21,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 23,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 24,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 25,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 26,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 27,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 28,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 29,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 30,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 31,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 32,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 33,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 34,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 35,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 36,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 37,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 38,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 39,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 40,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 41,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 42,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 43,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 44,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 45,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 46,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 47,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 48,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 49,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 50,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 53,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 54,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 55,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 56,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 57,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 58,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 59,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 60,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 61,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 62,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 63,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 64,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 65,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 66,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 67,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 68,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 69,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 70,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 71,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 72,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 73,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 74,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 75,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 76,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 77,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 78,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 79,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 80,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 81,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 82,
  },
  {
    code: "B7K9P2X5",
    sticker_number: 83,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 21,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 23,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 24,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 25,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 26,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 27,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 28,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 29,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 30,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 31,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 32,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 33,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 34,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 35,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 36,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 37,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 38,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 39,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 40,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 41,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 42,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 43,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 44,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 45,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 46,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 47,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 48,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 49,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 50,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 53,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 54,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 55,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 56,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 57,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 58,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 59,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 60,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 61,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 62,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 63,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 64,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 65,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 66,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 67,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 68,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 69,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 70,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 71,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 72,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 73,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 74,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 75,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 76,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 77,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 78,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 79,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 80,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 81,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 82,
  },
  {
    code: "H4M8N5Q1",
    sticker_number: 83,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 21,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 23,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 24,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 25,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 26,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 27,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 28,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 29,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 30,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 31,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 32,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 33,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 34,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 35,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 36,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 37,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 38,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 39,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 40,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 41,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 42,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 43,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 44,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 45,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 46,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 47,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 48,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 49,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 50,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 53,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 54,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 55,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 56,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 57,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 58,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 59,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 60,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 61,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 62,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 63,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 64,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 65,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 66,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 67,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 68,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 69,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 70,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 71,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 72,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 73,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 74,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 75,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 76,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 77,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 78,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 79,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 80,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 81,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 82,
  },
  {
    code: "C3D6E9F2",
    sticker_number: 83,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 21,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 23,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 24,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 25,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 26,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 27,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 28,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 29,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 30,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 31,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 32,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 33,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 34,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 35,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 36,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 37,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 38,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 39,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 40,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 41,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 42,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 43,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 44,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 45,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 46,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 47,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 48,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 49,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 50,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 53,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 54,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 55,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 56,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 57,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 58,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 59,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 60,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 61,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 62,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 63,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 64,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 65,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 66,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 67,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 68,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 69,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 70,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 71,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 72,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 73,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 74,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 75,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 76,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 77,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 78,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 79,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 80,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 81,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 82,
  },
  {
    code: "J1K4L7M8",
    sticker_number: 83,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 21,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 23,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 24,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 25,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 26,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 27,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 28,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 29,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 30,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 31,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 32,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 33,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 34,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 35,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 36,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 37,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 38,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 39,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 40,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 41,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 42,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 43,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 44,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 45,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 46,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 47,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 48,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 49,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 50,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 53,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 54,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 55,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 56,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 57,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 58,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 59,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 60,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 61,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 62,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 63,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 64,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 65,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 66,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 67,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 68,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 69,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 70,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 71,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 72,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 73,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 74,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 75,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 76,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 77,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 78,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 79,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 80,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 81,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 82,
  },
  {
    code: "P3Q6R9S2",
    sticker_number: 83,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 21,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 23,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 24,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 25,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 26,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 27,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 28,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 29,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 30,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 31,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 32,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 33,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 34,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 35,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 36,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 37,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 38,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 39,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 40,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 41,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 42,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 43,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 44,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 45,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 46,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 47,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 48,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 49,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 50,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 53,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 54,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 55,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 56,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 57,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 58,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 59,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 60,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 61,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 62,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 63,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 64,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 65,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 66,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 67,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 68,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 69,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 70,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 71,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 72,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 73,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 74,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 75,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 76,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 77,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 78,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 79,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 80,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 81,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 82,
  },
  {
    code: "T1U4V7W2",
    sticker_number: 83,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 21,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 23,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 24,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 25,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 26,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 27,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 28,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 29,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 30,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 31,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 32,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 33,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 34,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 35,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 36,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 37,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 38,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 39,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 40,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 41,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 42,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 43,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 44,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 45,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 46,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 47,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 48,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 49,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 50,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 53,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 54,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 55,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 56,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 57,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 58,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 59,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 60,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 61,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 62,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 63,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 64,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 65,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 66,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 67,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 68,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 69,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 70,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 71,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 72,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 73,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 74,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 75,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 76,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 77,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 78,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 79,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 80,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 81,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 82,
  },
  {
    code: "X8Y1Z4A2",
    sticker_number: 83,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 21,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 23,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 24,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 25,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 26,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 27,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 28,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 29,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 30,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 31,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 32,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 33,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 34,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 35,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 36,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 37,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 38,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 39,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 40,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 41,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 42,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 43,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 44,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 45,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 46,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 47,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 48,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 49,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 50,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 53,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 54,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 55,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 56,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 57,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 58,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 59,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 60,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 61,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 62,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 63,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 64,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 65,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 66,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 67,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 68,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 69,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 70,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 71,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 72,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 73,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 74,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 75,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 76,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 77,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 78,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 79,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 80,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 81,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 82,
  },
  {
    code: "F3G6H9J2",
    sticker_number: 83,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 21,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 23,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 24,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 25,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 26,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 27,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 28,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 29,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 30,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 31,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 32,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 33,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 34,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 35,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 36,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 37,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 38,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 39,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 40,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 41,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 42,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 43,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 44,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 45,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 46,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 47,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 48,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 49,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 50,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 53,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 54,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 55,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 56,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 57,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 58,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 59,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 60,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 61,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 62,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 63,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 64,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 65,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 66,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 67,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 68,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 69,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 70,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 71,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 72,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 73,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 74,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 75,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 76,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 77,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 78,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 79,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 80,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 81,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 82,
  },
  {
    code: "K1L4M7N2",
    sticker_number: 83,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 21,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 23,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 24,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 25,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 26,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 27,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 28,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 29,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 30,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 31,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 32,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 33,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 34,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 35,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 36,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 37,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 38,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 39,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 40,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 41,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 42,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 43,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 44,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 45,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 46,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 47,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 48,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 49,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 50,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 53,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 54,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 55,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 56,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 57,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 58,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 59,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 60,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 61,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 62,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 63,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 64,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 65,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 66,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 67,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 68,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 69,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 70,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 71,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 72,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 73,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 74,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 75,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 76,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 77,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 78,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 79,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 80,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 81,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 82,
  },
  {
    code: "P8Q1R4S2",
    sticker_number: 83,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 21,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 23,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 24,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 25,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 26,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 27,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 28,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 29,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 30,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 31,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 32,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 33,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 34,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 35,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 36,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 37,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 38,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 39,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 40,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 41,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 42,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 43,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 44,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 45,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 46,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 47,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 48,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 49,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 50,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 53,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 54,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 55,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 56,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 57,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 58,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 59,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 60,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 61,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 62,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 63,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 64,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 65,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 66,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 67,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 68,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 69,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 70,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 71,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 72,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 73,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 74,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 75,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 76,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 77,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 78,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 79,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 80,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 81,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 82,
  },
  {
    code: "V3W6X9Y2",
    sticker_number: 83,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 21,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 23,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 24,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 25,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 26,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 27,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 28,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 29,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 30,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 31,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 32,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 33,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 34,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 35,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 36,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 37,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 38,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 39,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 40,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 41,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 42,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 43,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 44,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 45,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 46,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 47,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 48,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 49,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 50,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 53,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 54,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 55,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 56,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 57,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 58,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 59,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 60,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 61,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 62,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 63,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 64,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 65,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 66,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 67,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 68,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 69,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 70,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 71,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 72,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 73,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 74,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 75,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 76,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 77,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 78,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 79,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 80,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 81,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 82,
  },
  {
    code: "Z1A4B7C2",
    sticker_number: 83,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 21,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 23,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 24,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 25,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 26,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 27,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 28,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 29,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 30,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 31,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 32,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 33,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 34,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 35,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 36,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 37,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 38,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 39,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 40,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 41,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 42,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 43,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 44,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 45,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 46,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 47,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 48,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 49,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 50,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 53,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 54,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 55,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 56,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 57,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 58,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 59,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 60,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 61,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 62,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 63,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 64,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 65,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 66,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 67,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 68,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 69,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 70,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 71,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 72,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 73,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 74,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 75,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 76,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 77,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 78,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 79,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 80,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 81,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 82,
  },
  {
    code: "D8E1F4G2",
    sticker_number: 83,
  },
];

// Every promotional code draws from the complete non-quiz collection.
// Keep the explicit legacy pool above for compatibility, then fill any gaps
// (including 22, 51, 52 and 84-100) without creating duplicate rows.
const redeemPoolKeys = new Set(
  SEED_REDEEM_POOLS.map(({ code, sticker_number }) => `${code}:${sticker_number}`),
);

for (const { code } of SEED_REDEEM_CODES) {
  for (let sticker_number = 21; sticker_number <= 100; sticker_number += 1) {
    const key = `${code}:${sticker_number}`;
    if (!redeemPoolKeys.has(key)) {
      SEED_REDEEM_POOLS.push({ code, sticker_number });
      redeemPoolKeys.add(key);
    }
  }
}
