import LanguageConfig from '../interfaces/language-config.interface';

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  python: {
    image: 'python:3.9-slim-time',
    extension: 'py',
    command: (file) => ['/usr/bin/time', '-v', 'python3', '-u', file],
  },
  javascript: {
    image: 'node:18-slim-time',
    extension: 'js',
    command: (file) => ['/usr/bin/time', '-v', 'node', file],
  },
};
export default function getLanguageConfig(language: string): LanguageConfig {
  const config = LANGUAGE_CONFIGS[language.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return config;
}
