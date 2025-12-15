'use client';

import { use, useEffect, useState } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProblemDescription from '@/app/(workspace)/problems/[slug]/_components/ProblemDescription';
import ProblemWorkspace from '@/app/(workspace)/problems/[slug]/_components/ProblemWorkspace';
import { useProblem } from '@/hooks/useProblem';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Loader2, FileText, Code } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data: problem, isLoading, isError } = useProblem(slug);
  const initializeCode = useWorkspaceStore((state) => state.initializeCode);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (problem && problem.starterCode) {
      initializeCode(slug, problem.starterCode);
    }
  }, [problem, slug, initializeCode]);

  useEffect(() => {
    // Check if screen is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className="w-full h-full bg-background">
        <Tabs defaultValue="description" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border bg-card h-12 justify-start px-2">
            <TabsTrigger
              value="description"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Description</span>
            </TabsTrigger>
            <TabsTrigger
              value="workspace"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Workspace</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="description"
            className="flex-1 m-0 overflow-hidden"
          >
            <ProblemDescription />
          </TabsContent>
          <TabsContent value="workspace" className="flex-1 m-0 overflow-hidden">
            <ProblemWorkspace />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop view with resizable panels
  return (
    <div className="w-full h-full bg-background p-4">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full border border-border rounded-lg overflow-hidden bg-card"
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
