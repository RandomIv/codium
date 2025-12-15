'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WindowHeader from './WindowHeader';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Verdict } from '@/types/enums';
import { cn } from '@/lib/utils';

export function TestConsole() {
  const { testLogs } = useWorkspaceStore();

  const getStatusColor = (status: Verdict) => {
    switch (status) {
      case Verdict.ACCEPTED:
        return 'text-green-500';
      case Verdict.WRONG_ANSWER:
        return 'text-red-500';
      case Verdict.TIME_LIMIT_EXCEEDED:
        return 'text-yellow-500';
      default:
        return 'text-destructive'; 
    }
  };

  const getStatusIcon = (status: Verdict) => {
    switch (status) {
      case Verdict.ACCEPTED:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case Verdict.WRONG_ANSWER:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case Verdict.COMPILATION_ERROR:
      case Verdict.RUNTIME_ERROR:
        return <Terminal className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  
  
  const hasGlobalError = testLogs?.some(
    (log) =>
      log.status === Verdict.COMPILATION_ERROR ||
      (log.status === Verdict.RUNTIME_ERROR && log.error),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <WindowHeader text="Console" />

      <Tabs
        defaultValue="cases"
        
        
        className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-muted/30 p-2"
      >
        <div className="flex justify-center pb-2">
          <TabsList className="bg-muted rounded-full p-1 h-auto text-muted-foreground shadow-sm">
            <TabsTrigger
              value="cases"
              className="rounded-full px-6 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all"
            >
              Test Cases
            </TabsTrigger>
            <TabsTrigger
              value="result"
              className={cn(
                'rounded-full px-6 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all',
                hasGlobalError &&
                  'text-destructive data-[state=active]:text-destructive', 
              )}
            >
              Test Result
              {testLogs && !hasGlobalError && (
                <span className="ml-2 w-2 h-2 rounded-full bg-blue-500 block" />
              )}
              {hasGlobalError && (
                <span className="ml-2 w-2 h-2 rounded-full bg-destructive block animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {}
        <TabsContent
          value="cases"
          className="flex-1 overflow-y-auto rounded-2xl bg-card p-4 shadow-inner m-0 ring-1 ring-inset ring-border/20 scrollbar-content"
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm text-center italic">
                Example test cases
              </p>
              {}
              <div className="rounded-xl bg-muted/50 p-3 font-mono text-sm text-foreground border border-border/50">
                nums = [2,7,11,15], target = 9
              </div>
              <div className="rounded-xl bg-muted/50 p-3 font-mono text-sm text-foreground border border-border/50">
                nums = [3,2,4], target = 6
              </div>
            </div>
          </div>
        </TabsContent>

        {}
        <TabsContent
          value="result"
          className="flex-1 overflow-y-auto rounded-2xl bg-card p-4 shadow-inner m-0 ring-1 ring-inset ring-border/20 scrollbar-content"
        >
          {!testLogs ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground opacity-70">
              <div className="p-4 bg-muted rounded-full shadow-inner">
                <Play className="w-6 h-6 ml-1" />
              </div>
              <p className="text-sm font-bold">Run code to see output</p>
            </div>
          ) : (
            <div className="space-y-4">
              {}
              {hasGlobalError &&
                testLogs.map(
                  (log, idx) =>
                    (log.status === Verdict.COMPILATION_ERROR ||
                      log.status === Verdict.RUNTIME_ERROR) && (
                      <div
                        key={idx}
                        className="border border-destructive/50 rounded-xl bg-destructive/10 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 bg-destructive/20 px-4 py-2 border-b border-destructive/20 text-destructive font-bold text-sm uppercase">
                          <Terminal className="w-4 h-4" />
                          {log.status.replace(/_/g, ' ')}
                        </div>
                        <div className="p-4 font-mono text-sm text-destructive whitespace-pre-wrap leading-relaxed">
                          {}
                          {log.compileOutput ||
                            log.error ||
                            'Unknown error occurred'}
                        </div>
                      </div>
                    ),
                )}

              {}
              {!hasGlobalError &&
                testLogs.map((log, index) => (
                  <div
                    key={log.testCaseId || index}
                    className="border border-border/50 rounded-xl bg-muted/20 overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span
                          className={cn(
                            'text-xs font-bold uppercase',
                            getStatusColor(log.status),
                          )}
                        >
                          {log.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.executionTime}ms | {Math.round(log.memory / 1024)}
                        KB
                      </span>
                    </div>

                    {log.status !== Verdict.ACCEPTED && (
                      <div className="p-3 space-y-3 font-mono text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-muted-foreground font-bold block mb-1">
                              Input:
                            </span>
                            <div className="bg-background p-2 rounded border border-border/50 min-h-[30px] break-all">
                              {log.input}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground font-bold block mb-1">
                              Expected:
                            </span>
                            <div className="bg-background p-2 rounded border border-border/50 min-h-[30px] break-all">
                              {log.expectedOutput}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-muted-foreground font-bold block mb-1">
                            Actual Output:
                          </span>
                          <div
                            className={cn(
                              'p-2 rounded border border-border/50 min-h-[30px] break-all',
                              'bg-red-500/10 text-red-600',
                            )}
                          >
                            {log.actualOutput}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
