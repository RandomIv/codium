import { PrismaClient, Difficulty, Language } from '../../src/generated/prisma';

export default async function seedProblems(prisma: PrismaClient) {
  const twoSumDescription = `
# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return **indices of the two numbers** such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
**Input:** \`nums = [2,7,11,15], target = 9\`
**Output:** \`[0,1]\`
**Explanation:** Because \`nums[0] + nums[1] == 9\`, we return \`[0, 1]\`.

### Example 2:
**Input:** \`nums = [3,2,4], target = 6\`
**Output:** \`[1,2]\`

### Constraints:
* \`2 <= nums.length <= 10^4\`
* \`-10^9 <= nums[i] <= 10^9\`
* \`-10^9 <= target <= 10^9\`
* **Only one valid answer exists.**
`.trim();

  const twoSum = await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: { description: twoSumDescription },
    create: {
      title: 'Two Sum',
      slug: 'two-sum',
      description: twoSumDescription,
      difficulty: Difficulty.EASY,
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: {
        [Language.JAVASCRIPT]: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var solution = function(nums, target) {
    
};`,
        [Language.PYTHON]: `from typing import List

def solution(nums: List[int], target: int) -> List[int]:
    # Write your code here
    pass`,
      },
    },
  });

  await prisma.testCase.deleteMany({ where: { problemId: twoSum.id } });
  await prisma.testCase.createMany({
    data: [
      {
        problemId: twoSum.id,
        input: JSON.stringify([[2, 7, 11, 15], 9]),
        output: JSON.stringify([0, 1]),
        isPublic: true,
      },
      {
        problemId: twoSum.id,
        input: JSON.stringify([[3, 2, 4], 6]),
        output: JSON.stringify([1, 2]),
        isPublic: false,
      },
      {
        problemId: twoSum.id,
        input: JSON.stringify([[3, 3], 6]),
        output: JSON.stringify([0, 1]),
        isPublic: false,
      },
    ],
  });

  const validParenthesesDescription = `
# Valid Parentheses

Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
**Input:** \`s = "()"\`
**Output:** \`true\`

### Example 2:
**Input:** \`s = "()[]{}"\`
**Output:** \`true\`

### Example 3:
**Input:** \`s = "(]"\`
**Output:** \`false\`

### Constraints:
* \`1 <= s.length <= 10^4\`
* \`s\` consists of parentheses only \`()[]{}\`.
`.trim();

  const validParentheses = await prisma.problem.upsert({
    where: { slug: 'valid-parentheses' },
    update: { description: validParenthesesDescription },
    create: {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      description: validParenthesesDescription,
      difficulty: Difficulty.EASY,
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: {
        [Language.JAVASCRIPT]: `/**
 * @param {string} s
 * @return {boolean}
 */
var solution = function(s) {
    
};`,
        [Language.PYTHON]: `def solution(s: str) -> bool:
    # Write your code here
    pass`,
      },
    },
  });

  await prisma.testCase.deleteMany({
    where: { problemId: validParentheses.id },
  });
  await prisma.testCase.createMany({
    data: [
      {
        problemId: validParentheses.id,
        input: JSON.stringify(['()']),
        output: JSON.stringify(true),
        isPublic: true,
      },
      {
        problemId: validParentheses.id,
        input: JSON.stringify(['()[]{}']),
        output: JSON.stringify(true),
        isPublic: false,
      },
      {
        problemId: validParentheses.id,
        input: JSON.stringify(['(]']),
        output: JSON.stringify(false),
        isPublic: false,
      },
    ],
  });
}
