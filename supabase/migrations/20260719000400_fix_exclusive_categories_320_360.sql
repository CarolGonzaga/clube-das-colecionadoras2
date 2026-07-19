-- Ajusta a faixa final de figurinhas exclusivas para 320-360.
-- A loja regular usa apenas 194-319.
update public.stickers
set category = 'exclusiva',
    type = 'exclusiva'
where number between 320 and 360;

update public.stickers
set category = 'comum',
    type = 'loja'
where number between 194 and 319;
