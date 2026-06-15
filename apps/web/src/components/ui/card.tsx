'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* ── Card Root ─────────────────────────────────────────────── */

const cardVariants = cva('rounded-lg border transition-all duration-200', {
  variants: {
    variant: {
      // Default glass card
      default: ['bg-card border-border', 'shadow-float'],
      // Glass with blur — for overlapping content
      glass: [
        'bg-background-surface/70 border-border/50',
        'backdrop-blur-xl shadow-float',
        'bg-gradient-to-br from-background-surface/80 to-background-elevated/60',
      ],
      // Elevated — slightly more prominent
      elevated: ['bg-background-elevated border-border', 'shadow-float-lg'],
      // Outlined — minimal, no fill
      outlined: ['bg-transparent border-border'],
      // Glow — primary glow accent
      glow: ['bg-card border-primary/30', 'shadow-glow'],
    },
    hover: {
      none: '',
      lift: 'hover:-translate-y-0.5 hover:shadow-float-lg cursor-pointer',
      glow: 'hover:border-primary/50 hover:shadow-glow cursor-pointer',
      scale: 'hover:scale-[1.01] cursor-pointer',
    },
    padding: {
      none: '',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    hover: 'none',
    padding: 'none',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, padding, className }))}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

/* ── Card Header ───────────────────────────────────────────── */

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

/* ── Card Title ────────────────────────────────────────────── */

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

/* ── Card Description ──────────────────────────────────────── */

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-foreground-muted', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

/* ── Card Content ──────────────────────────────────────────── */

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-4', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

/* ── Card Footer ───────────────────────────────────────────── */

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
