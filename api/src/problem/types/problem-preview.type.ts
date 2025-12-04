import { Prisma } from '../../generated/prisma';
export const problemPreviewSelect = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
} satisfies Prisma.ProblemSelect;

export type ProblemPreview = Prisma.ProblemGetPayload<{
  select: typeof problemPreviewSelect;
}>;
