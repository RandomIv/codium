import { Prisma } from '../../generated/prisma';

export type FindManyUserDto = {
  where?: Prisma.UserWhereInput;
  orderBy?:
    | Prisma.UserOrderByWithRelationInput
    | Prisma.UserOrderByWithRelationInput[];
  take?: number;
  skip?: number;
};
