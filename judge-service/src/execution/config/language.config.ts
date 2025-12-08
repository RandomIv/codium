import LanguageConfig from '../interfaces/language-config.interface';

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  python: {
    image: 'python:3.9-slim',
    extension: 'py',
    command: (file) => ['python3', '-u', file],
  },
  javascript: {
    image: 'node:18-alpine',
    extension: 'js',
    command: (file) => ['node', file],
  },
};
export default function getLanguageConfig(language: string): LanguageConfig {
  const config = LANGUAGE_CONFIGS[language.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return config;
}
