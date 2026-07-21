const fs = require('fs');
const path = require('path');

const seedsPath = path.join(__dirname, '../src/lib/seeds.ts');
let content = fs.readFileSync(seedsPath, 'utf8');

// Match all sticker objects in SEED_STICKERS
const qIndex = content.indexOf('export const SEED_QUESTIONS');
let stickersSection = content.substring(0, qIndex);

// 1. Remove sticker 331 object block
// Find position of number: 331,
const pos331 = stickersSection.indexOf('number: 331,');
if (pos331 === -1) {
  console.error('Sticker 331 not found!');
  process.exit(1);
}

// Find preceding '{' and following '},'
const blockStart = stickersSection.lastIndexOf('{', pos331);
const blockEnd = stickersSection.indexOf('},', pos331) + 2;

console.log('Removing block for sticker 331...');
stickersSection = stickersSection.substring(0, blockStart) + stickersSection.substring(blockEnd);

// 2. Renumber numbers from 332 to 361 down by 1
for (let num = 332; num <= 361; num++) {
  const oldStr = `number: ${num},`;
  const newStr = `number: ${num - 1},`;
  stickersSection = stickersSection.replace(oldStr, newStr);
}

// 3. For slug: "extra" (former 361, now 360), change type: "bonus" to type: "exclusiva"
stickersSection = stickersSection.replace(
  `number: 360,\n    slug: "extra",\n    name: "Agradecimentos",\n    author: null,\n    type: "bonus",`,
  `number: 360,\n    slug: "extra",\n    name: "Agradecimentos",\n    author: null,\n    type: "exclusiva",`
);
// Handle CRLF version as well just in case
stickersSection = stickersSection.replace(
  `number: 360,\r\n    slug: "extra",\r\n    name: "Agradecimentos",\r\n    author: null,\r\n    type: "bonus",`,
  `number: 360,\r\n    slug: "extra",\r\n    name: "Agradecimentos",\r\n    author: null,\r\n    type: "exclusiva",`
);

const newContent = stickersSection + content.substring(qIndex);
fs.writeFileSync(seedsPath, newContent, 'utf8');
console.log('Successfully updated seeds.ts!');
