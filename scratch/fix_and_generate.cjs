const fs = require('fs');
const path = require('path');

const updatedSeedsPath = 'C:\\Users\\Carol\\Downloads\\seed_stickers_atualizado.ts';
const projectSeedsPath = path.join(__dirname, '..', 'src', 'lib', 'seeds.ts');
const replicaSeedsPath = path.join(__dirname, '..', '..', 'perfect-replica', 'src', 'lib', 'seeds.ts');
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260719000100_seed_all_360_stickers.sql');

try {
  // 1. Read updated stickers content from downloads
  let updatedContent = fs.readFileSync(updatedSeedsPath, 'utf8');

  // Normalize quotes and smart characters
  updatedContent = updatedContent
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/‘/g, "'")
    .replace(/’/g, "'");

  // Fix specific known syntax errors in user's pasted content:
  // - Sticker 55 missing comma: 'author: "Liliane Reis"\r?\n    type:'
  updatedContent = updatedContent.replace(
    /author:\s*"Liliane Reis"\s*[\r\n]+\s*type:/g,
    'author: "Liliane Reis",\n    type:'
  );
  
  // - Sticker 57 stray 'l': 'author: "Nicoly Pacheco"l,'
  updatedContent = updatedContent.replace(
    /author:\s*"Nicoly Pacheco"\s*l\s*,/g,
    'author: "Nicoly Pacheco",'
  );

  // Extract the SEED_STICKERS block
  const searchStr = 'export const SEED_STICKERS: SeedSticker[] = [';
  const startIndex = updatedContent.indexOf(searchStr);
  if (startIndex === -1) {
    throw new Error('Could not find SEED_STICKERS start in seed_stickers_atualizado.ts');
  }

  // Bracket match to extract the array correctly
  let bracketCount = 0;
  let arrayEndIndex = -1;
  let inString = false;
  let stringChar = '';

  // Scan starts after the open bracket '['
  for (let i = startIndex + searchStr.length; i < updatedContent.length; i++) {
    const char = updatedContent[i];
    
    if (inString) {
      if (char === stringChar && updatedContent[i - 1] !== '\\') {
        inString = false;
      }
    } else if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
    } else if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount === -1) {
        arrayEndIndex = i + 1;
        break;
      }
    }
  }

  if (arrayEndIndex === -1) {
    throw new Error('Could not find matching closing bracket for SEED_STICKERS in downloads file.');
  }

  const newArrayText = updatedContent.substring(startIndex, arrayEndIndex);

  // 2. Read existing seeds.ts
  let seedsFileContent = fs.readFileSync(projectSeedsPath, 'utf8');

  // Replace SeedSticker interface definition to support new types
  const interfaceStart = 'export interface SeedSticker {';
  const interfaceEnd = '}';
  const oldInterfaceIndex = seedsFileContent.indexOf(interfaceStart);
  
  if (oldInterfaceIndex !== -1) {
    const nextCloseBracket = seedsFileContent.indexOf(interfaceEnd, oldInterfaceIndex);
    const newInterface = `export interface SeedSticker {
  number: number;
  slug: string;
  name: string;
  author: string | null;
  type: "quiz" | "sorteio" | "ls" | "frase" | "loja" | "exclusiva";
  cover_url: string | null;
  amazon_url?: string | null;
  ilustrator?: string | null;
}`;
    seedsFileContent = seedsFileContent.substring(0, oldInterfaceIndex) + newInterface + seedsFileContent.substring(nextCloseBracket + 1);
  }

  // Replace SEED_STICKERS array
  const oldArrayStart = seedsFileContent.indexOf('export const SEED_STICKERS: SeedSticker[] = [');
  const oldArrayEnd = seedsFileContent.indexOf('export const SEED_QUESTIONS: SeedQuestion[]');

  if (oldArrayStart === -1 || oldArrayEnd === -1) {
    throw new Error('Could not find old SEED_STICKERS or SEED_QUESTIONS boundaries in project seeds.ts');
  }

  seedsFileContent = seedsFileContent.substring(0, oldArrayStart) + newArrayText + '\n\n' + seedsFileContent.substring(oldArrayEnd);

  // 3. Write updated seeds.ts back to both projects
  fs.writeFileSync(projectSeedsPath, seedsFileContent, 'utf8');
  console.log(`Updated project seeds: ${projectSeedsPath}`);

  if (fs.existsSync(path.dirname(replicaSeedsPath))) {
    fs.writeFileSync(replicaSeedsPath, seedsFileContent, 'utf8');
    console.log(`Updated perfect-replica seeds: ${replicaSeedsPath}`);
  }

  // 4. Evaluate the new array to generate SQL
  const cleanedJs = newArrayText
    .replace('export const SEED_STICKERS: SeedSticker[] =', 'const SEED_STICKERS =')
    .trim();

  let SEED_STICKERS;
  eval(cleanedJs + '\n; globalThis.evaluatedStickers = SEED_STICKERS;');
  SEED_STICKERS = globalThis.evaluatedStickers;

  if (!Array.isArray(SEED_STICKERS)) {
    throw new Error('Failed to evaluate stickers array.');
  }

  // 5. Generate migration SQL
  let sql = `-- Migration: Seed all 360 stickers from seed_stickers_atualizado.ts\n`;
  sql += `-- This updates placeholders to the real names, authors, slugs, covers, categories, and amazon urls.\n\n`;

  for (const s of SEED_STICKERS) {
    const number = s.number;
    const slug = s.slug.replace(/'/g, "''");
    const name = s.name.replace(/'/g, "''");
    const author = s.author ? `'${s.author.replace(/'/g, "''")}'` : 'NULL';
    const type = s.type;
    const cover_url = s.cover_url ? `'${s.cover_url.replace(/'/g, "''")}'` : 'NULL';
    const amazon_url = s.amazon_url ? `'${s.amazon_url.replace(/'/g, "''")}'` : 'NULL';

    // Compute category
    let category = 'comum';
    if (number >= 1 && number <= 20) {
      category = 'quiz';
    } else if (number >= 330 && number <= 360) {
      category = 'exclusiva';
    }

    sql += `insert into public.stickers (number, slug, name, author, type, cover_url, amazon_url, category)\n`;
    sql += `values (${number}, '${slug}', '${name}', ${author}, '${type}', ${cover_url}, ${amazon_url}, '${category}')\n`;
    sql += `on conflict (number) do update set\n`;
    sql += `  slug = excluded.slug,\n`;
    sql += `  name = excluded.name,\n`;
    sql += `  author = excluded.author,\n`;
    sql += `  type = excluded.type,\n`;
    sql += `  cover_url = excluded.cover_url,\n`;
    sql += `  amazon_url = excluded.amazon_url,\n`;
    sql += `  category = excluded.category;\n\n`;
  }

  fs.writeFileSync(migrationPath, sql, 'utf8');
  console.log(`Generated migration SQL: ${migrationPath}`);
  console.log(`Total stickers processed: ${SEED_STICKERS.length}`);

} catch (err) {
  console.error('Error during generation:', err);
}
