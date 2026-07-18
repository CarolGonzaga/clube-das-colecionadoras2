import fs from 'fs';
import path from 'path';

// Let's read seeds.ts directly to extract the SEED_STICKERS array
const seedsPath = 'src/lib/seeds.ts';
const content = fs.readFileSync(seedsPath, 'utf-8');

// Find the SEED_STICKERS block
const startIndex = content.indexOf('export const SEED_STICKERS: SeedSticker[] = [');
const endIndex = content.indexOf('export const SEED_QUESTIONS: SeedQuestion[]');

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find SEED_STICKERS array in seeds.ts");
  process.exit(1);
}

const arrayText = content.substring(startIndex, endIndex);

// We want to safely evaluate this array. We can clean up the Typescript annotation
// and evaluate it as Javascript.
const cleanedJs = arrayText
  .replace('export const SEED_STICKERS: SeedSticker[] =', 'const SEED_STICKERS =')
  .trim();

// Evaluate the javascript string to get the actual array object
let SEED_STICKERS;
try {
  eval(cleanedJs + '\n; globalThis.evaluatedStickers = SEED_STICKERS;');
  SEED_STICKERS = globalThis.evaluatedStickers;
} catch (e) {
  console.error("Error evaluating seeds.ts content: ", e);
  process.exit(1);
}

if (!Array.isArray(SEED_STICKERS)) {
  console.error("Evaluated stickers is not an array");
  process.exit(1);
}

// Generate the SQL statement
let sql = `-- Migration: Seed stickers metadata from seeds.ts\n`;
sql += `-- This updates the placeholders to the real names, authors, slugs, covers, and amazon urls.\n\n`;

for (const s of SEED_STICKERS) {
  const number = s.number;
  const slug = s.slug.replace(/'/g, "''");
  const name = s.name.replace(/'/g, "''");
  const author = s.author ? `'${s.author.replace(/'/g, "''")}'` : 'NULL';
  const type = s.type;
  const cover_url = s.cover_url ? `'${s.cover_url.replace(/'/g, "''")}'` : 'NULL';
  const amazon_url = s.amazon_url ? `'${s.amazon_url.replace(/'/g, "''")}'` : 'NULL';

  sql += `insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url)\n`;
  sql += `values (${number}, '${slug}', '${name}', ${author}, '${type}', ${cover_url}, ${amazon_url})\n`;
  sql += `on conflict (number) do update set\n`;
  sql += `  slug = excluded.slug,\n`;
  sql += `  name = excluded.name,\n`;
  sql += `  author = excluded.author,\n`;
  sql += `  type = excluded.type,\n`;
  sql += `  cover_url = excluded.cover_url,\n`;
  sql += `  amazon_url = excluded.amazon_url;\n\n`;
}

fs.writeFileSync('supabase/migrations/20260717001000_seed_real_stickers.sql', sql);
console.log("Successfully generated migration 20260717001000_seed_real_stickers.sql with " + SEED_STICKERS.length + " stickers!");
