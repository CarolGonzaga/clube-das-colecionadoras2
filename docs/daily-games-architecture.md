# Padrão obrigatório para jogos diários

Este padrão se aplica a todo jogo novo, salvo quando a regra do produto disser explicitamente o
contrário.

1. Carregar tabuleiro e ativos da partida uma única vez.
2. Manter seleção, animações e tentativas sem efeito no navegador.
3. Não consultar o banco para erros que não alteram progresso, pontuação ou recompensa.
4. Persistir somente acertos ou marcos relevantes em uma RPC transacional e autoritativa.
5. Retornar deltas pequenos; nunca recarregar o tabuleiro completo depois de cada jogada.
6. Servir imagens estáticas pelo hosting/CDN da aplicação, não pelo banco.
7. Carregar somente os ativos da partida atual; não pré-carregar o catálogo inteiro.
8. Não usar polling ou Realtime quando a partida for individual e puder ser local.
9. Manter no servidor as travas de acesso, data, sessão, vitória e recompensa.
10. Aplicar a política compartilhada de uma sessão e uma vitória por dia.

## Implementações atuais

- Jogo da Memória: erros são locais; somente pares corretos são persistidos (6, 8 ou 12 chamadas).
- Caça-Palavras: sequências erradas são locais; somente palavras corretas são persistidas (5 ou 7
  chamadas).
