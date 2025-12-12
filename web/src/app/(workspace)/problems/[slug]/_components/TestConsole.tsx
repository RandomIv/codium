'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WindowHeader from './WindowHeader';
import { Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { Verdict } from '@/types/enums';
import { cn } from '@/lib/utils';

export function TestConsole() {
  const { testLogs, isRunning } = useWorkspaceStore();

  const getStatusColor = (status: Verdict) => {
    switch (status) {
      case Verdict.ACCEPTED:
        return 'text-green-500';
      case Verdict.WRONG_ANSWER:
        return 'text-red-500';
      case Verdict.TIME_LIMIT_EXCEEDED:
      case Verdict.MEMORY_LIMIT_EXCEEDED:
        return 'text-yellow-500';
      case Verdict.RUNTIME_ERROR:
      case Verdict.COMPILATION_ERROR:
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: Verdict) => {
    switch (status) {
      case Verdict.ACCEPTED:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case Verdict.WRONG_ANSWER:
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background ">
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
              className="rounded-full px-6 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all"
            >
              Test Result
              {testLogs && (
                <span className="ml-2 w-2 h-2 rounded-full bg-blue-500 block" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="cases"
          className="flex-1 overflow-y-auto rounded-2xl bg-card p-4 shadow-inner m-0 ring-1 ring-inset ring-border/20"
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm text-center italic">
                Example test cases from description
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Case 1
                  </span>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 font-mono text-sm text-foreground border border-border/50">
                  nums = [2,7,11,15], target = 9
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="result"
          className="flex-1 overflow-y-auto rounded-2xl bg-card p-4 shadow-inner m-0 ring-1 ring-inset ring-border/20"
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
              <div className="flex flex-col gap-3">
                {testLogs.map((log, index) => (
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

                    <div className="p-3 space-y-3 font-mono text-sm">
                      {log.error && (
                        <div>
                          <span className="text-xs text-destructive font-bold block mb-1">
                            Error:
                          </span>
                          <pre className="bg-destructive/10 text-destructive p-2 rounded-md whitespace-pre-wrap">
                            {log.error}
                          </pre>
                        </div>
                      )}

                      {!log.error && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-muted-foreground font-bold block mb-1">
                                Input:
                              </span>
                              <div className="bg-background p-2 rounded border border-border/50 min-h-[30px]">
                                {log.input}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground font-bold block mb-1">
                                Expected:
                              </span>
                              <div className="bg-background p-2 rounded border border-border/50 min-h-[30px]">
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
                                'p-2 rounded border border-border/50 min-h-[30px]',
                                log.status === Verdict.ACCEPTED
                                  ? 'bg-green-500/10 text-green-600'
                                  : 'bg-red-500/10 text-red-600',
                              )}
                            >
                              {log.actualOutput}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
