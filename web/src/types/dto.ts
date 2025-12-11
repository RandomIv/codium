import { Language } from './enums';

export type CreateSubmissionDto = {
  problemId: string;
  code: string;
  language: Language;
};
