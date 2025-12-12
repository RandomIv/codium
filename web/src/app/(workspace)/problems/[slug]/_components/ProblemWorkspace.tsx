'use client';

import { Editor } from '@monaco-editor/react';
import WindowHeader from './WindowHeader';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { TestConsole } from './TestConsole';
import { useWorkspaceStore } from '@/store/workspace-store';

export default function ProblemWorkspace() {
  const { codes, language, setCode } = useWorkspaceStore();
  const changeHandler = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="h-full flex flex-col overflow-hidden">
          <WindowHeader text="Code" />
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
                fontSize: 18,
                fontFamily: 'var(--font-mono)',
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
