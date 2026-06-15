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
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background-surface/30 p-8 text-center backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary-muted/20 text-primary shadow-glow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold tracking-tight text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-foreground-muted">{description}</p>
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
