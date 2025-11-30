import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import ProblemDescription from '@/app/(workspace)/problems/[id]/_components/ProblemDescription';
import ProblemWorkspace from '@/app/(workspace)/problems/[id]/_components/ProblemWorkspace';

export default function Page() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        className="border border-border rounded-lg overflow-hidden bg-card"
      >
        <ResizablePanel>
          <ProblemDescription></ProblemDescription>
        </ResizablePanel>
        <ResizableHandle className="border-3 border-border" />
        <ResizablePanel minSize={20}>
          <ProblemWorkspace></ProblemWorkspace>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
