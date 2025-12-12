'use client';

import { Editor } from '@monaco-editor/react';
import WindowHeader from './WindowHeader';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { TestConsole } from './TestConsole';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useProblem } from '@/hooks/useProblem';
import { useParams } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ProblemWorkspace() {
  const { codes, language, setCode } = useWorkspaceStore();

  const params = useParams();
  const slug = params.slug as string;
  const { data: problem } = useProblem(slug);

  const changeHandler = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleReset = () => {
    if (!problem || !problem.starterCode) return;

    const startCode = problem.starterCode[language];

    if (startCode === undefined) {
      alert(`No starter code available for ${language}`);
      return;
    }

    const isConfirmed = window.confirm(
      'Are you sure you want to reset your code? All changes will be lost.',
    );

    if (isConfirmed) {
      setCode(startCode);
    }
  };

  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="h-full flex flex-col overflow-hidden">
          <WindowHeader text="Code">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleReset}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Reset to starter code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </WindowHeader>

          <div className="h-full flex-1 min-h-0">
            <Editor
              height="100%"
              language={language.toLowerCase()}
              value={codes[language]}
              theme="vs-dark"
              onChange={changeHandler}
              loading={
                <div className="text-zinc-500 p-4">Loading Editor...</div>
              }
              options={{
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontSize: 15,
                fontFamily: 'var(--font-mono)',
                padding: { top: 16, bottom: 16 },
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastColumn: 0,
              }}
            />
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={40} minSize={10}>
        <TestConsole />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
