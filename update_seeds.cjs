const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'seeds.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace `active: true,` with `active: false,` inside SEED_REDEEM_CODES
const startIndex = content.indexOf('export const SEED_REDEEM_CODES: SeedRedeemCode[] = [');
if (startIndex !== -1) {
    const endIndex = content.indexOf('export const SEED_REDEEM_POOLS: SeedRedeemPool[] = [');
    const before = content.substring(0, startIndex);
    let target = content.substring(startIndex, endIndex);
    const after = content.substring(endIndex);

    target = target.replace(/active:\s*true,/g, 'active: false,');

    content = before + target + after;
}

// 2. Add the new 21 codes into SEED_REDEEM_CODES array.
const newCodes = [
    'K9P2X5Y1', 'M8N5Q1R7', 'D6E9F2G8', 'J1K4L7M3', 'P3Q6R9S5',
    'B2V8C5X1', 'F9H4J7K2', 'W3E6R9T1', 'Y5U8I1O4', 'Z2X5C8V1',
    'N7M3L9K2', 'G8F4D2S6', 'H1J4K7L3', 'Q9W5E1R8', 'T2Y5U8I1',
    'A6S3D9F2', 'P8O4I2U7', 'V2B5N8M1', 'C9X5Z1A7', 'K3L7J9H2',
    'X8Y2Z5W1'
];

let newCodesString = '';
for (const code of newCodes) {
    newCodesString += `  {
    code: "${code}",
    element: null,
    active: true,
    release_day: 1,
  },\n`;
}

// insert newCodesString right before `];\n\nexport const SEED_REDEEM_POOLS: SeedRedeemPool[] = [`
content = content.replace(/\];\s*export const SEED_REDEEM_POOLS/, newCodesString + '];\n\nexport const SEED_REDEEM_POOLS');

// 3. Update the pool generation loop at the bottom.
const newLoop = `for (const { code } of SEED_REDEEM_CODES) {
  let minSticker = 21;
  let maxSticker = 100;

  if ([
    "K9P2X5Y1", "M8N5Q1R7", "D6E9F2G8", "J1K4L7M3", "P3Q6R9S5",
    "B2V8C5X1", "F9H4J7K2", "W3E6R9T1", "Y5U8I1O4", "Z2X5C8V1",
    "N7M3L9K2", "G8F4D2S6", "H1J4K7L3", "Q9W5E1R8", "T2Y5U8I1",
    "A6S3D9F2", "P8O4I2U7", "V2B5N8M1", "C9X5Z1A7", "K3L7J9H2"
  ].includes(code)) {
    minSticker = 21;
    maxSticker = 193;
  } else if (code === "X8Y2Z5W1") {
    minSticker = 101;
    maxSticker = 193;
  }

  for (let sticker_number = minSticker; sticker_number <= maxSticker; sticker_number += 1) {
    const key = \`\${code}:\${sticker_number}\`;
    if (!redeemPoolKeys.has(key)) {
      SEED_REDEEM_POOLS.push({ code, sticker_number });
      redeemPoolKeys.add(key);
    }
  }
}\n`;

content = content.replace(/for \(const \{ code \} of SEED_REDEEM_CODES\) \{[\s\S]*\}\s*$/, newLoop);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('updated seeds.ts');
