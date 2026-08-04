import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("URL:", url);
console.log("Has Key:", Boolean(key));

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from("memory_game_stickers").select("id, title, front_image_path").eq("id", 391);
  console.log("Sticker 391:", data, error);
}

check();
