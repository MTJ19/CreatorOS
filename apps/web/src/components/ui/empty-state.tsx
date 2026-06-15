import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onActionClick,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 border border-dashed border-border/60 rounded-xl bg-background-surface/30 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-muted/20 border border-primary/20 text-primary mb-4 shadow-glow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-foreground-muted max-w-sm">{description}</p>
      {actionLabel && onActionClick && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onActionClick} className="shadow-glow-sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
