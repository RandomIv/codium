import {
  PrismaClient,
  Difficulty,
  Language,
  Role,
} from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  await prisma.submission.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('12345678', 10);

  await prisma.user.create({
    data: {
      email: 'admin@codium.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const description = `
# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

## Example 1:

\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

## Constraints:

* $2 \\le nums.length \\le 10^4$
* $-10^9 \\le nums[i] \\le 10^9$
`;

  const problem = await prisma.problem.create({
    data: {
      title: 'Two Sum',
      slug: 'two-sum',
      description,
      difficulty: Difficulty.EASY,
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: {
        [Language.JAVASCRIPT]: 'function twoSum(nums, target) {\n  \n}',
        [Language.PYTHON]:
          'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
      },
    },
  });

  await prisma.testCase.createMany({
    data: [
      {
        problemId: problem.id,
        input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }),
        output: JSON.stringify([0, 1]),
        isPublic: true,
      },
      {
        problemId: problem.id,
        input: JSON.stringify({ nums: [3, 2, 4], target: 6 }),
        output: JSON.stringify([1, 2]),
        isPublic: true,
      },
      {
        problemId: problem.id,
        input: JSON.stringify({ nums: [3, 3], target: 6 }),
        output: JSON.stringify([0, 1]),
        isPublic: false,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
