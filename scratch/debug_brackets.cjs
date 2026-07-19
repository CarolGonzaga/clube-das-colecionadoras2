const fs = require('fs');

const updatedSeedsPath = 'C:\\Users\\Carol\\Downloads\\seed_stickers_atualizado.ts';
let content = fs.readFileSync(updatedSeedsPath, 'utf8');

// Find SEED_STICKERS
const searchStr = 'export const SEED_STICKERS: SeedSticker[] = [';
const startIndex = content.indexOf(searchStr);

if (startIndex === -1) {
  console.error("No SEED_STICKERS found");
  process.exit(1);
}

let bracketCount = 0;
let inString = false;
let stringChar = '';

console.log('Scanning from index:', startIndex + searchStr.length - 1);
for (let i = startIndex + searchStr.length - 1; i < content.length; i++) {
  const char = content[i];
  
  if (inString) {
    if (char === stringChar && content[i - 1] !== '\\') {
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
      console.log('Found end of array at index:', i);
      process.exit(0);
    }
  }
}

console.log('Finished scan. Final bracketCount:', bracketCount, 'inString:', inString, 'stringChar:', stringChar);
// Let's print the last 200 characters of the file to see where it ends
console.log('Last 200 chars:', content.substring(content.length - 200));
