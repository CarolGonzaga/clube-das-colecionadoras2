const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Carol\\.gemini\\antigravity-ide\\brain\\a5494055-b6cf-48b4-97f3-7accf17a22d5\\.system_generated\\logs\\transcript_full.jsonl';
const outputPath = path.join(__dirname, 'user_prompt.txt');

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  let targetPrompt = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const obj = JSON.parse(line);
      // Check if it's a USER_INPUT step containing the keyword
      if (obj.content && obj.content.includes('precisamos atualizar o banco de dados das figurinhas')) {
        targetPrompt = obj.content;
        break;
      }
    } catch (e) {
      // Ignore parse errors on incomplete lines
    }
  }
  
  if (targetPrompt) {
    fs.writeFileSync(outputPath, targetPrompt, 'utf8');
    console.log(`Successfully extracted prompt to ${outputPath}`);
  } else {
    console.log('Target prompt not found in log.');
  }
} catch (err) {
  console.error('Error:', err);
}
