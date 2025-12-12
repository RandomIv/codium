import { Role } from './enums';
import type { Submission } from './submission';

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  submissions?: Submission[];
  createdAt: string;
  updatedAt: string;
};
