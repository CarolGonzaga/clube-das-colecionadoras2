/**
 * Mapeamento de IDs de stickers (361–430) para títulos corretos dos livros
 * usados no jogo "Adivinhe a Capa". Os títulos são armazenados aqui (e não
 * no banco) para evitar chamadas ao Supabase e consumo de egress.
 */

export const COVER_GUESSER_TITLES: Record<number, string> = {
  361: "O Despertar do Desejo",
  362: "Na Órbita do Amor",
  363: "Como Reconquistar uma Nerd",
  364: "Só Mais um Poema Épico de Amor",
  365: "O Diabo Veste Cor de Rosa",
  366: "Uma Pitada de Sorte",
  367: "A Namorada do Meu Primo",
  368: "Alguém que Te Faz Sorrir",
  369: "GAP – A Teoria Rosa",
  370: "Sombras e Luzes de Nós",
  371: "Tipo Flores e Unicórnios",
  372: "Presa em Você",
  373: "Mau Agouro",
  374: "Terapia Bar",
  375: "Tudo o que Eu Sei sobre Amar",
  376: "Às Cegas com Você",
  377: "Os Fantasmas Entre Nós",
  378: "Duologia Boreal",
  379: "Me Apaixonei pela Vila",
  380: "Seu Pequeno Segredo",
  381: "Classe 309",
  382: "Charlotte Delamori",
  383: "Amor Expresso",
  384: "Itinerário do Tempo",
  385: "Amor em 12 Meses sem Juros",
  386: "Mastermind",
  387: "Amora",
  388: "Oitavo Andar",
  389: "Flores Me Lembram Você",
  390: "Minha Experiência Lésbica com a Solidão",
  391: "Alda",
  392: "Minha Querida Escuridão",
  393: "Dias de Princesa",
  394: "Data Venia",
  395: "Como Não Ressuscitar uma Ex-namorada Morta",
  396: "Olhe para Mim",
  397: "Só para os Fortes de Coração",
  398: "Coisas Incríveis Acontecem",
  399: "If True – O Código da Atração",
  400: "Selfie sem Filtro",
  401: "Traiçoeiro",
  402: "Seis é Demais",
  403: "Você Não É Minha",
  404: "Até Logo, Violeta",
  405: "O Sim das Nossas Vidas",
  406: "Meus Dias na Vila das Gaivotas",
  407: "Capítulo Extra – Virando o Jogo",
  408: "Entre Estantes",
  409: "Trevos do Destino",
  410: "O Último Voo",
  411: "Hexágono – Memórias de Seis Vidas Entrelaçadas",
  412: "Vestígios de uma Tempestade",
  413: "Na Ponta dos Dedos",
  414: "Nada Convencional",
  415: "A Espada de Oleandro",
  416: "Bali – Encontre a Luz",
  417: "Terra 47 – A Sobrevivente",
  418: "6 AM – A Hora Mais Curta",
  419: "Angra – Sempre Houve Algo sobre Ela",
  420: "Unbreakable",
  421: "Twister",
  422: "Se Permitindo Amar",
  423: "O Caso Daphne Fontaine",
  424: "Como se Fosse Fanfic",
  425: "Boa Sorte, Querida",
  426: "Inefável: Uma Paixão Inesquecível",
  427: "Sua Próxima Novela das Sete",
  428: "Entre Nós",
  429: "Amor Fora do Palco",
  430: "Oi, Novo Amor",
};

/**
 * Retorna o título correto do livro dado um sticker ID (361–430).
 * Retorna null se o ID não for encontrado.
 */
export function getCoverGuesserTitle(stickerId: number): string | null {
  return COVER_GUESSER_TITLES[stickerId] ?? null;
}

/**
 * Normaliza uma string para comparação de resposta:
 * - Converte para minúsculas
 * - Remove espaços extras no início e fim
 * - Normaliza espaços internos (múltiplos espaços → um espaço)
 */
export function normalizeCoverAnswer(text: string): string {
  return text
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Verifica se a resposta digitada pelo usuário corresponde ao título correto.
 * Aceita maiúsculas, minúsculas, capitalizado etc., desde que o conteúdo
 * (sem acentos) bata com o título normalizado.
 */
export function checkCoverAnswer(userAnswer: string, correctTitle: string): boolean {
  return normalizeCoverAnswer(userAnswer) === normalizeCoverAnswer(correctTitle);
}
