const fs = require('fs');
const content = fs.readFileSync('src/lib/seeds.ts', 'utf8');

const startIndex = content.indexOf('export const SEED_STICKERS: SeedSticker[] = [');
const endIndex = content.indexOf('export const SEED_QUESTIONS: SeedQuestion[]');
const arrayText = content.substring(startIndex, endIndex);

const cleanedJs = arrayText
  .replace('export const SEED_STICKERS: SeedSticker[] =', 'var evaluatedArray =')
  .trim();

let SEED_STICKERS;
eval(cleanedJs + '\n; SEED_STICKERS = evaluatedArray;');

const types = {};
for (const s of SEED_STICKERS) {
  if (!types[s.type]) types[s.type] = [];
  types[s.type].push(s.number);
}

for (const type in types) {
  const nums = types[type];
  console.log(`Type "${type}": Count = ${nums.length}, Min = ${Math.min(...nums)}, Max = ${Math.max(...nums)}`);
}
