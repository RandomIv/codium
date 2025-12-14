import { Language } from './enums';

export type CreateSubmissionDto = {
  problemId: string;
  code: string;
  language: Language;
  userId: string;
};
export type LoginDto = {
  email: string;
  password: string;
};
export type RegisterDto = LoginDto & {
  name: string;
};
