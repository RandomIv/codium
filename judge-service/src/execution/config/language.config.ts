import LanguageConfig from '../interfaces/language-config.interface';

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    image: 'node:18-slim-time',
    extension: 'js',
    command: (file) => ['/usr/bin/time', '-v', 'node', file],
    template: `
const fs = require('fs');

// --- USER SOLUTION START ---
{{USER_CODE}}
// --- USER SOLUTION END ---

try {
  const input = fs.readFileSync(0, 'utf-8');
  const args = JSON.parse(input);
  const result = solution(...args);
  console.log(JSON.stringify(result));
} catch (e) {
  process.exit(1);
}
`,
  },
  python: {
    image: 'python:3.9-slim-time',
    extension: 'py',
    command: (file) => ['/usr/bin/time', '-v', 'python3', '-u', file],
    template: `
import sys
import json
from typing import *

# --- USER SOLUTION START ---
{{USER_CODE}}
# --- USER SOLUTION END ---

if __name__ == '__main__':
    try:
        input_str = sys.stdin.read()
        if not input_str.strip():
            sys.exit(0)
            
        args = json.loads(input_str)
        result = solution(*args)
        
        print(json.dumps(result, separators=(',', ':')))
    except Exception:
        sys.exit(1)
`,
  },
};

export default function getLanguageConfig(language: string): LanguageConfig {
  const config = LANGUAGE_CONFIGS[language.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return config;
}
