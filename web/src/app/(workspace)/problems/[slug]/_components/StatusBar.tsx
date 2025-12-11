'use client';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

export default function StatusBar() {
  const [progress, setProgress] = useState(0);
  return (
    <div className="w-screen flex items-center justify-center">
      <div className="text-1xl absolute z-1 text-background font-extrabold text-center">
        Progress: {progress}%
      </div>
      <Progress
        value={progress}
        style={{ '--val': progress } as React.CSSProperties}
        className="bg-muted-foreground h-12 [&>div]:bg-[hsl(calc(var(--val)*1.2),100%,50%)] transition-colors duration-500"
      />
    </div>
  );
}
