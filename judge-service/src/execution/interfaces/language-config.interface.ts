type LanguageConfig = {
  command: (filename: string) => string[];
  extension: string;
  image: string;
  template: string;
};

export default LanguageConfig;
