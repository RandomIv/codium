import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WindowHeader from './WindowHeader';
import { Play } from 'lucide-react';

export function TestConsole() {
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
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="cases"
          className="flex-1 overflow-y-auto rounded-2xl bg-card p-4 shadow-inner m-0 ring-1 ring-inset ring-border/20"
        >
          <div className="flex flex-col gap-4">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                  Case 2
                </span>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 font-mono text-sm text-foreground border border-border/50">
                nums = [3,2,4], target = 6
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="result"
          className="flex-1 overflow-y-auto rounded-2xl bg-card p-4 shadow-inner m-0 ring-1 ring-inset ring-border/20"
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground opacity-70">
            <div className="p-4 bg-muted rounded-full shadow-inner">
              <Play className="w-6 h-6 ml-1" />
            </div>
            <p className="text-sm font-bold">Run code to see output</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
