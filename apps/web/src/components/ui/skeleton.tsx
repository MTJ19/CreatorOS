import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'circle';
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted-foreground/10',
        variant === 'circle' && 'rounded-full',
        variant === 'card' && 'h-36 rounded-xl',
        variant === 'default' && 'h-4 rounded-md',
        className,
      )}
      {...props}
    />
  );
}
