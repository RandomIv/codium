import WindowHeader from '@/app/(workspace)/problems/[id]/_components/WindowHeader';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
const MOCK_MARKDOWN = `
# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

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

export default function ProblemDescription() {
  return (
    <div className="">
      <WindowHeader text="Description"></WindowHeader>
      <div className="prose prose-invert prose-md max-w-none p-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {MOCK_MARKDOWN}
        </ReactMarkdown>
      </div>
    </div>
  );
}
