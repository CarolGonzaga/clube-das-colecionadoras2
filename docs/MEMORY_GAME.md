# Jogo da Memória

## Arquitetura

- `memory_game_stickers`: catálogo privado de 70 cartas (IDs 361–430), com título, autora, links, frente, verso, status e jogos permitidos.
- `memory_game_sessions`: sessão persistente por usuária, dificuldade e estado.
- `memory_game_cards`: relação privada de pares, instâncias e posições. Sem acesso para `anon` ou `authenticated`.
- `start_memory_game`: seleciona cartas ativas e embaralha o tabuleiro no banco.
- `compare_memory_cards`: compara duas instâncias e contabiliza o par sob lock transacional.
- `claim_daily_game_reward`: sorteio compartilhado e idempotente para todos os jogos.
- TanStack Server Functions autenticam a usuária e projetam somente dados seguros ao navegador.

O verso oficial é `/verso-card.webp`. As frentes ficam em `/covers-jogos`.

## Recompensa global

`daily_game_rewards` mantém `unique (user_id, reward_date)`. Um lock consultivo por usuária serializa resgates concorrentes. O número da figurinha nunca é recebido do cliente.

O sorteio preserva:

- coleção incompleta: 60% de nova e 40% de repetida;
- coleção 21–193 completa: 70% de rara, quando a recompensa anterior não foi rara;
- depois de uma rara, a próxima recompensa é obrigatoriamente comum.

## Implantação

1. Fazer backup do banco.
2. Aplicar `20260731000300_memory_game.sql` em homologação.
3. Executar `supabase/tests/verify_word_search_security.sql` e `supabase/tests/verify_memory_game_security.sql`.
4. Aplicar `20260731000400_activate_memory_game_testers.sql` somente quando o teste fechado for autorizado.
5. Essa migration ativa a flag e concede acesso exclusivamente aos três UUIDs de teste do Caça-Palavras.
6. Novos acessos podem ser concedidos posteriormente pelo painel administrativo.
7. Validar os níveis Fácil, Médio e Difícil, atualização de página, duas abas e resgate concorrente com o Caça-Palavras.

Não há nova variável de ambiente. Permanecem necessárias `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY`; a chave privilegiada é carregada somente no servidor.

## Operação

O painel administrativo possui controles independentes para:

- ativar/desativar globalmente o Jogo da Memória;
- conceder/revogar acesso por usuária.

Todas essas operações geram registro em `admin_audit_logs`.

## Rollback

O rollback operacional é desligar `memory_game_enabled`. Isso bloqueia novas sessões, revelações, comparações e resgates sem apagar partidas ou recompensas.

Depois, o frontend pode ser revertido sem remover tabelas. Não excluir sessões, cartas, recompensas ou inventário como primeira medida. A remoção física das estruturas deve ser feita somente em uma migration posterior, após retenção/backup e confirmação de que não há dependências.

## Limitações da validação local

Os testes TypeScript e o build podem ser executados localmente. Os testes SQL, RLS e concorrência real exigem um banco Supabase de homologação com as migrations aplicadas; não devem ser declarados aprovados antes dessa execução.
