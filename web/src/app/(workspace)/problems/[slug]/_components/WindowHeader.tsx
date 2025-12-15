import { ReactNode } from 'react';

export default function WindowHeader({
  text,
  children,
}: {
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-muted w-full rounded-t-lg p-1.5 md:p-2 shadow-sm border-b border-border/50 flex items-center justify-between px-2 md:px-4 h-[36px] md:h-[40px] select-none">
      <div className="flex-1"></div>

      <div className="font-bold text-xs md:text-sm text-foreground/90 tracking-wide uppercase truncate mx-1 md:mx-2">
        {text}
      </div>

      <div className="flex-1 flex justify-end items-center gap-1 md:gap-2">
        {children}
      </div>
    </div>
  );
}
