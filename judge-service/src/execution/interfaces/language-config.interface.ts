export default interface LanguageConfig {
  command: (filename: string) => string[];
  extension: string;
  image: string;
}
