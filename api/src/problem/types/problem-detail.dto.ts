import { Prisma } from '../../generated/prisma';

export const problemDetailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  difficulty: true,
  timeLimit: true,
  memoryLimit: true,
  starterCode: true,
  testCases: {
    where: { isPublic: true },
    select: {
      input: true,
      output: true,
    },
  },
} as const satisfies Prisma.ProblemSelect;

export type ProblemDetail = Prisma.ProblemGetPayload<{
  select: typeof problemDetailSelect;
}>;
