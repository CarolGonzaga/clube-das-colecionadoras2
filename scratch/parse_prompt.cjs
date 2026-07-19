const fs = require('fs');
const path = require('path');

const promptPath = path.join(__dirname, 'user_prompt.txt');
const promptText = fs.readFileSync(promptPath, 'utf8');

// Find the start of the SEED_STICKERS definition
const searchStr = 'export const SEED_STICKERS: SeedSticker[] = [';
const startIndex = promptText.indexOf(searchStr);

if (startIndex === -1) {
  console.error('Could not find SEED_STICKERS start index in promptText.');
  process.exit(1);
}

// Find the end of the array. We need to find the matching close bracket '];'
// Let's search from the startIndex forwards.
let bracketCount = 0;
let arrayEndIndex = -1;
let inString = false;
let stringChar = '';

for (let i = startIndex + searchStr.length - 1; i < promptText.length; i++) {
  const char = promptText[i];
  
  if (inString) {
    if (char === stringChar && promptText[i - 1] !== '\\') {
      inString = false;
    }
  } else if (char === '"' || char === "'" || char === '`' || char === '“' || char === '”') {
    inString = true;
    stringChar = char;
  } else if (char === '[') {
    bracketCount++;
  } else if (char === ']') {
    bracketCount--;
    if (bracketCount === -1) {
      // Found the end of SEED_STICKERS array
      arrayEndIndex = i + 1;
      break;
    }
  }
}

if (arrayEndIndex === -1) {
  console.error('Could not find matching closing bracket for SEED_STICKERS array.');
  process.exit(1);
}

let seedStickersStr = promptText.substring(startIndex, arrayEndIndex);

// Normalize smart quotes and other potential syntax errors from user paste
// e.g. replacing smart curly quotes with normal ones
seedStickersStr = seedStickersStr
  .replace(/“/g, '"')
  .replace(/”/g, '"')
  .replace(/‘/g, "'")
  .replace(/’/g, "'");

// Save to scratch/extracted_seeds.ts
fs.writeFileSync(path.join(__dirname, 'extracted_seeds.ts'), seedStickersStr, 'utf8');
console.log('Successfully wrote extracted_seeds.ts!');
