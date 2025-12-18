import { PrismaClient, Role } from '../../src/generated/prisma';
import * as bcrypt from 'bcrypt';

export default async function seedUsers(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash('12345678', 10);

  await prisma.user.upsert({
    where: { email: 'admin@codium.com' },
    update: {},
    create: {
      email: 'admin@codium.com',
      password: hashedPassword,
      name: 'Alexander Admin',
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@codium.com' },
    update: {},
    create: {
      email: 'user@codium.com',
      password: hashedPassword,
      name: 'Regular User',
      role: Role.USER,
    },
  });
}
