import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-surface rounded-xl shadow-lg border border-slate-700/50 p-6", className)} {...props}>
      {children}
    </div>
  );
}
