'use client';

import { use, useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import ProblemDescription from '@/app/(workspace)/problems/[slug]/_components/ProblemDescription';
import ProblemWorkspace from '@/app/(workspace)/problems/[slug]/_components/ProblemWorkspace';
import { useProblem } from '@/hooks/useProblem';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data: problem, isLoading, isError } = useProblem(slug);
  const initializeCode = useWorkspaceStore((state) => state.initializeCode);

  useEffect(() => {
    if (problem && problem.starterCode) {
      initializeCode(slug, problem.starterCode);
    }
  }, [problem, slug, initializeCode]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground w-10 h-10" />
      </div>
    );
  }

  if (isError || !problem) {
    return notFound();
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-background flex-col pb-10">
      <ResizablePanelGroup
        direction="horizontal"
        className="border border-border rounded-lg overflow-hidden bg-card"
      >
        <ResizablePanel>
          <ProblemDescription />
        </ResizablePanel>

        <ResizableHandle className="border-3 border-border" />

        <ResizablePanel minSize={20}>
          <ProblemWorkspace />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
