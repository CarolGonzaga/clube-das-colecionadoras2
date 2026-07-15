# Clube das Colecionadoras 2.0

Protótipo inicial da V2 com entrada única em `/clubedascolecionadoras`, inventário V2 próprio,
pagamento verificável por email, resgate V1 único e pacotes seguros.

## Primeiros passos

1. Crie `.env` a partir de `.env.example`.
2. Cole a `anon public key` do Supabase.
3. Instale dependências com `npm install`.
4. Rode `npm run dev`.

## Fluxos prototipados

- Gateway de versão V1/V2.
- Aceite de termos.
- Verificação de pagamento por email.
- Resgate V1 uma única vez.
- Página de pacotes com histórico.
- Repetidas separadas para crédito/troca.
- Regras de raras.

## Banco

A migration inicial está em:

`supabase/migrations/20260715000100_v2_foundation.sql`

Ela cria as tabelas centrais da V2, RLS inicial e funções auxiliares.
