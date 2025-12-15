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
import { useState, useEffect } from 'react';

export default function ProblemWorkspace() {
  const { codes, language, setCode } = useWorkspaceStore();
  const [isMobile, setIsMobile] = useState(false);

  const params = useParams();
  const slug = params.slug as string;
  const { data: problem } = useProblem(slug);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
                minimap: { enabled: !isMobile },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontSize: isMobile ? 13 : 15,
                fontFamily: 'var(--font-mono)',
                padding: {
                  top: isMobile ? 12 : 16,
                  bottom: isMobile ? 12 : 16,
                },
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastColumn: 0,
                wordWrap: isMobile ? 'on' : 'off',
                
                folding: !isMobile,
                glyphMargin: !isMobile,
                lineDecorationsWidth: isMobile ? 5 : 10,
                lineNumbersMinChars: isMobile ? 3 : 5,
                
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: isMobile ? 8 : 10,
                  horizontalScrollbarSize: isMobile ? 8 : 10,
                },
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
