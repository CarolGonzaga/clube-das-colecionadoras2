const fs = require('fs');
const logPath = 'C:\\Users\\Carol\\.gemini\\antigravity-ide\\brain\\a5494055-b6cf-48b4-97f3-7accf17a22d5\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type && obj.type.toLowerCase().includes('command')) {
        console.log(`Step ${obj.step_index} (${obj.type}):`, JSON.stringify(obj).substring(0, 300));
      }
    } catch (e) {}
  }
}
