import getLanguageConfig from './language.config';

describe('Language Config', () => {
  describe('getLanguageConfig', () => {
    describe('Python', () => {
      it('should return python config for "python"', () => {
        const config = getLanguageConfig('python');

        expect(config.image).toBe('python:3.9-slim-time');
        expect(config.extension).toBe('py');
        expect(config.command).toBeDefined();
      });

      it('should return python config for "Python" (case insensitive)', () => {
        const config = getLanguageConfig('Python');

        expect(config.image).toBe('python:3.9-slim-time');
        expect(config.extension).toBe('py');
      });

      it('should return python config for "PYTHON"', () => {
        const config = getLanguageConfig('PYTHON');

        expect(config.image).toBe('python:3.9-slim-time');
      });

      it('should generate correct command for python with filename', () => {
        const config = getLanguageConfig('python');
        const command = config.command('test.py');

        expect(command).toEqual([
          '/usr/bin/time',
          '-v',
          'python3',
          '-u',
          'test.py',
        ]);
      });

      it('should generate command with different filenames', () => {
        const config = getLanguageConfig('python');
        const command1 = config.command('solution.py');
        const command2 = config.command('main.py');

        expect(command1[4]).toBe('solution.py');
        expect(command2[4]).toBe('main.py');
      });
    });

    describe('JavaScript', () => {
      it('should return javascript config for "javascript"', () => {
        const config = getLanguageConfig('javascript');

        expect(config.image).toBe('node:18-slim-time');
        expect(config.extension).toBe('js');
        expect(config.command).toBeDefined();
      });

      it('should return javascript config for "JavaScript" (case insensitive)', () => {
        const config = getLanguageConfig('JavaScript');

        expect(config.image).toBe('node:18-slim-time');
        expect(config.extension).toBe('js');
      });

      it('should return javascript config for "JAVASCRIPT"', () => {
        const config = getLanguageConfig('JAVASCRIPT');

        expect(config.image).toBe('node:18-slim-time');
      });

      it('should generate correct command for javascript with filename', () => {
        const config = getLanguageConfig('javascript');
        const command = config.command('test.js');

        expect(command).toEqual(['/usr/bin/time', '-v', 'node', 'test.js']);
      });

      it('should generate command with different filenames', () => {
        const config = getLanguageConfig('javascript');
        const command1 = config.command('solution.js');
        const command2 = config.command('index.js');

        expect(command1[3]).toBe('solution.js');
        expect(command2[3]).toBe('index.js');
      });
    });

    describe('Error handling', () => {
      it('should throw error for unsupported language', () => {
        expect(() => getLanguageConfig('java')).toThrow(
          'Unsupported language: java',
        );
      });

      it('should throw error for cpp', () => {
        expect(() => getLanguageConfig('cpp')).toThrow(
          'Unsupported language: cpp',
        );
      });

      it('should throw error for empty string', () => {
        expect(() => getLanguageConfig('')).toThrow('Unsupported language: ');
      });

      it('should throw error for ruby', () => {
        expect(() => getLanguageConfig('ruby')).toThrow(
          'Unsupported language: ruby',
        );
      });

      it('should throw error for go', () => {
        expect(() => getLanguageConfig('go')).toThrow(
          'Unsupported language: go',
        );
      });
    });

    describe('Command generation', () => {
      it('should include /usr/bin/time for python', () => {
        const config = getLanguageConfig('python');
        const command = config.command('test.py');

        expect(command[0]).toBe('/usr/bin/time');
        expect(command[1]).toBe('-v');
      });

      it('should include /usr/bin/time for javascript', () => {
        const config = getLanguageConfig('javascript');
        const command = config.command('test.js');

        expect(command[0]).toBe('/usr/bin/time');
        expect(command[1]).toBe('-v');
      });

      it('should include -u flag for python', () => {
        const config = getLanguageConfig('python');
        const command = config.command('test.py');

        expect(command).toContain('-u');
      });

      it('should return array of strings', () => {
        const config = getLanguageConfig('python');
        const command = config.command('test.py');

        expect(Array.isArray(command)).toBe(true);
        command.forEach((part) => {
          expect(typeof part).toBe('string');
        });
      });
    });
  });
});
