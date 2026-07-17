-- Corrige textos que foram gravados com mojibake na função de resgate.
-- A definição atual é preservada para não alterar as regras de sorteio,
-- repetidas ou o limite de duas figurinhas iguais por pacote.
do $migration$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.redeem_code(text)'::regprocedure)
    into function_definition;

  function_definition := replace(function_definition, 'CÃƒÂ³digo invÃƒÂ¡lido.', 'Código inválido.');
  function_definition := replace(function_definition, 'CÃ³digo invÃ¡lido.', 'Código inválido.');

  function_definition := replace(
    function_definition,
    'Este cÃƒÂ³digo promocional ainda nÃƒÂ£o estÃƒÂ¡ ativo! SerÃƒÂ¡ liberado no dia % do lanÃƒÂ§amento.',
    'Este código promocional ainda não está ativo! Será liberado no dia % do lançamento.'
  );
  function_definition := replace(
    function_definition,
    'Este cÃ³digo promocional ainda nÃ£o estÃ¡ ativo! SerÃ¡ liberado no dia % do lanÃ§amento.',
    'Este código promocional ainda não está ativo! Será liberado no dia % do lançamento.'
  );

  function_definition := replace(function_definition, 'VocÃƒÂª jÃƒÂ¡ usou esse cÃƒÂ³digo.', 'Você já usou esse código.');
  function_definition := replace(function_definition, 'VocÃª jÃ¡ usou esse cÃ³digo.', 'Você já usou esse código.');

  function_definition := replace(function_definition, 'Pool do cÃƒÂ³digo vazia.', 'Pool do código vazia.');
  function_definition := replace(function_definition, 'Pool do cÃ³digo vazia.', 'Pool do código vazia.');

  function_definition := replace(function_definition, 'como-nÃƒÂ£o-se-apaixonar', 'como-nao-se-apaixonar');
  function_definition := replace(function_definition, 'como-nÃ£o-se-apaixonar', 'como-nao-se-apaixonar');

  execute function_definition;
end;
$migration$;

