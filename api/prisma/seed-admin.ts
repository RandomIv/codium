import { PrismaClient, Role } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  const hashedPassword = await bcrypt.hash('12345678', 10);

  await prisma.user.upsert({
    where: { email: 'john@gmail.com' },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      email: 'john@gmail.com',
      password: hashedPassword,
      name: 'John Admin',
      role: Role.ADMIN,
    },
  });

  console.log('Admin user john@gmail.com created/updated successfully');
}

main()
  .catch((e) => {
    console.error('Failed to create admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
