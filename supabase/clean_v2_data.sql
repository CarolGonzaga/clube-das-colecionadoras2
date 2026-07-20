-- Script para limpar todos os dados transacionais de usuários, pontos, compras e registros de teste na V2.
-- Execute no SQL Editor do Supabase V2.

truncate table public.purchase_payments cascade;
truncate table public.purchase_events cascade;
truncate table public.purchase_pack_stickers cascade;
truncate table public.purchase_packs cascade;
truncate table public.purchase_order_items cascade;
truncate table public.purchase_orders cascade;
truncate table public.mercado_pago_webhook_events cascade;

truncate table public.point_transactions cascade;
truncate table public.user_points cascade;

truncate table public.donations cascade;
truncate table public.quiz_answers cascade;
truncate table public.mission_completions cascade;
truncate table public.daily_claims cascade;
truncate table public.user_styles cascade;
truncate table public.user_stickers cascade;
truncate table public.profiles cascade;

-- Mantém as tabelas estáticas de stickers, shop_products e quiz_questions intactas.
