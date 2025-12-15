'use client';

import WindowHeader from '@/app/(workspace)/problems/[slug]/_components/WindowHeader';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useProblem } from '@/hooks/useProblem';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'katex/dist/katex.min.css';

export default function ProblemDescription() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: problem, isLoading } = useProblem(slug);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <WindowHeader text="Description" />
        <div className="flex h-full items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-full flex-col">
        <WindowHeader text="Description" />
        <div className="p-4 text-muted-foreground">Problem not found.</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <WindowHeader text={problem.title} />{' '}
      <div className="prose prose-invert prose-sm md:prose-base max-w-none p-4 overflow-y-auto flex-1 scrollbar-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {problem.description}
        </ReactMarkdown>
      </div>
    </div>
  );
}
