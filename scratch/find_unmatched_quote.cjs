const fs = require('fs');

const updatedSeedsPath = 'C:\\Users\\Carol\\Downloads\\seed_stickers_atualizado.ts';
let content = fs.readFileSync(updatedSeedsPath, 'utf8');

// Replace curly quotes first
content = content
  .replace(/“/g, '"')
  .replace(/”/g, '"')
  .replace(/‘/g, "'")
  .replace(/’/g, "'");

const searchStr = 'export const SEED_STICKERS: SeedSticker[] = [';
const startIndex = content.indexOf(searchStr);

let bracketCount = 0;
let inString = false;
let stringChar = '';
let lastStringStart = -1;

for (let i = startIndex + searchStr.length - 1; i < content.length; i++) {
  const char = content[i];
  
  if (inString) {
    if (char === stringChar && content[i - 1] !== '\\') {
      inString = false;
    }
  } else if (char === '"' || char === "'" || char === '`') {
    inString = true;
    stringChar = char;
    lastStringStart = i;
  } else if (char === '[') {
    bracketCount++;
  } else if (char === ']') {
    bracketCount--;
    if (bracketCount === -1) {
      console.log('Successfully matched all brackets!');
      process.exit(0);
    }
  }
}

if (inString) {
  console.log('Unmatched quote found!');
  console.log('Quote char:', stringChar);
  console.log('Position:', lastStringStart);
  console.log('Context around quote start:');
  console.log(content.substring(lastStringStart - 100, lastStringStart + 100));
} else {
  console.log('No unmatched quote found, but bracket count is:', bracketCount);
}
