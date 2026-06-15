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
        variant === 'card' && 'rounded-xl h-36',
        variant === 'default' && 'rounded-md h-4',
        className
      )}
      {...props}
    />
  );
}
