import { User } from '../../generated/prisma';
export type UserWithoutPassword = Omit<User, 'password'>;
