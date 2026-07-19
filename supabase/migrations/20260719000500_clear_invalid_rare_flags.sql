-- Raras seguem a regra da V1/V2: apenas as figurinhas 1-20 podem ter versão rara.
-- Qualquer is_rare=true fora dessa faixa é dado contaminado e deve voltar a comum.
update public.user_stickers
set is_rare = false
where sticker_number not between 1 and 20
  and is_rare = true;
