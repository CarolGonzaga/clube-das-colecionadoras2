const fs = require('fs');
const path = require('path');

const promptPath = path.join(__dirname, 'user_prompt.txt');
const promptText = fs.readFileSync(promptPath, 'utf8');

console.log('Total text length:', promptText.length);
console.log('=== START ===');
console.log(promptText.substring(0, 500));
console.log('=== END ===');
console.log(promptText.substring(promptText.length - 500));
