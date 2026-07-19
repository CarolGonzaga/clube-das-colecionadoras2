const fs = require('fs');
const logPath = 'C:\\Users\\Carol\\.gemini\\antigravity-ide\\brain\\a5494055-b6cf-48b4-97f3-7accf17a22d5\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("Log path does not exist");
  process.exit(0);
}

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const tc of obj.tool_calls) {
        if (tc.name === 'run_command') {
          console.log(`Step ${obj.step_index}: ${tc.arguments.CommandLine}`);
        }
      }
    }
  } catch (e) {
  }
}
