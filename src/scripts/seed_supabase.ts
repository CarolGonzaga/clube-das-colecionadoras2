import { createClient } from "@supabase/supabase-js";
import { SEED_QUESTIONS, SEED_REDEEM_CODES, SEED_REDEEM_POOLS } from "../lib/seeds.js";

// Load env variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const useServiceKey = !!serviceKey;
const activeKey = serviceKey || supabaseAnonKey;

if (!supabaseUrl || !activeKey) {
  console.error(
    "Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) precisam estar configurados no ambiente.",
  );
  console.error("Por favor, configure-os e tente rodar o script novamente.");
  process.exit(1);
}

if (!useServiceKey) {
  console.log("\n⚠️  AVISO IMPORTANTE DE SEGURANÇA (RLS):");
  console.log("Você está executando o seeding usando a chave pública Anon Key.");
  console.log(
    "Se o RLS (Row Level Security) estiver ativo nas tabelas estáticas, a inserção falhará.",
  );
  console.log("Para resolver, você tem duas opções:");
  console.log('1. Adicione a chave secreta "SUPABASE_SERVICE_ROLE_KEY=..." no seu arquivo .env');
  console.log(
    "2. Desative temporariamente o RLS nas tabelas estáticas executando o seguinte SQL no console da Supabase:",
  );
  console.log("   ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;");
  console.log("   ALTER TABLE redeem_codes DISABLE ROW LEVEL SECURITY;");
  console.log("   ALTER TABLE redeem_pools DISABLE ROW LEVEL SECURITY;\n");
}

console.log("Conectando ao Supabase em:", supabaseUrl);
console.log(
  "Utilizando chave:",
  useServiceKey ? "Service Role Key (Bypass RLS)" : "Anon Key (Subject to RLS)",
);
const supabase = createClient(supabaseUrl, activeKey);

async function seed() {
  try {
    console.log("Iniciando carga de dados no Supabase...");

    // 0. Seed App Settings
    console.log("Configurando data de lançamento no app_settings...");
    const { error: settingsError } = await supabase
      .from("app_settings")
      .upsert([{ key: "release_date", value: "2026-07-02" }]);
    if (settingsError) {
      console.warn("Alerta ao configurar app_settings:", settingsError.message);
    }

    // 1. Seed Quiz Questions
    console.log(`Limpando tabela quiz_questions...`);
    const { error: clearQError } = await supabase
      .from("quiz_questions")
      .delete()
      .neq("sticker_number", 0);
    if (clearQError) {
      console.warn("Alerta ao limpar quiz_questions:", clearQError.message);
    }

    console.log(`Inserindo ${SEED_QUESTIONS.length} perguntas de quiz...`);
    // Insert in chunks of 50 to avoid any request limit size constraints
    const chunkSize = 50;
    for (let i = 0; i < SEED_QUESTIONS.length; i += chunkSize) {
      const chunk = SEED_QUESTIONS.slice(i, i + chunkSize).map((q) => ({
        sticker_number: q.sticker_number,
        q_index: q.q_index,
        text: q.text,
        options: q.options,
        correct_index: q.correct_index,
      }));
      const { error } = await supabase.from("quiz_questions").insert(chunk);
      if (error) throw new Error(`Falha ao inserir quiz_questions: ${error.message}`);
    }
    console.log("Perguntas de quiz inseridas com sucesso.");

    // 2. Seed Redeem Codes
    console.log(`Limpando tabela redeem_codes...`);
    const { error: clearCError } = await supabase.from("redeem_codes").delete().neq("code", "");
    if (clearCError) {
      console.warn("Alerta ao limpar redeem_codes:", clearCError.message);
    }

    console.log(`Inserindo ${SEED_REDEEM_CODES.length} códigos de resgate...`);
    const codesToInsert = SEED_REDEEM_CODES.map((c) => ({
      code: c.code.toUpperCase(),
      element: c.element,
      active: c.active,
      release_day: c.release_day,
    }));
    const { error: codesError } = await supabase.from("redeem_codes").insert(codesToInsert);
    if (codesError) throw new Error(`Falha ao inserir redeem_codes: ${codesError.message}`);
    console.log("Códigos de resgate inseridos com sucesso.");

    // 3. Seed Redeem Pools
    console.log(`Limpando tabela redeem_pools...`);
    const { error: clearPError } = await supabase
      .from("redeem_pools")
      .delete()
      .neq("sticker_number", 0);
    if (clearPError) {
      console.warn("Alerta ao limpar redeem_pools:", clearPError.message);
    }

    console.log(`Inserindo ${SEED_REDEEM_POOLS.length} associações de pool de códigos...`);
    for (let i = 0; i < SEED_REDEEM_POOLS.length; i += chunkSize) {
      const chunk = SEED_REDEEM_POOLS.slice(i, i + chunkSize).map((p) => ({
        code: p.code.toUpperCase(),
        sticker_number: p.sticker_number,
      }));
      const { error } = await supabase.from("redeem_pools").insert(chunk);
      if (error) throw new Error(`Falha ao inserir redeem_pools: ${error.message}`);
    }
    console.log("Associações de pool inseridas com sucesso.");

    console.log("🎉 Carga de sementes (seeding) concluída com sucesso!");
  } catch (err: any) {
    console.error("❌ Erro durante o seeding:", err.message || err);
    process.exit(1);
  }
}

seed();
