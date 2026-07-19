const fs = require('fs');
const logPath = 'C:\\Users\\Carol\\.gemini\\antigravity-ide\\brain\\a5494055-b6cf-48b4-97f3-7accf17a22d5\\.system_generated\\logs\\transcript.jsonl';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  console.log("File length:", content.length);
  const lines = content.split('\n');
  console.log("Lines count:", lines.length);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(`Line ${i}:`, lines[i].substring(0, 150));
  }
} else {
  console.log("File not found");
}
