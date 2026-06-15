'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-semibold text-sm leading-none',
    'rounded-md transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-40',
    'select-none',
  ],
  {
    variants: {
      variant: {
        // Primary — Indigo gradient with glow
        primary: [
          'bg-gradient-to-r from-primary to-accent text-primary-foreground',
          'shadow-glow-sm hover:shadow-glow',
          'hover:brightness-110 active:brightness-90 active:scale-[0.98]',
        ],
        // Secondary — glass surface
        secondary: [
          'bg-background-elevated border border-border',
          'text-foreground',
          'hover:border-primary/50 hover:bg-background-elevated/80',
          'active:scale-[0.98]',
        ],
        // Ghost — no background
        ghost: [
          'bg-transparent text-foreground-muted',
          'hover:bg-background-elevated hover:text-foreground',
          'active:scale-[0.98]',
        ],
        // Outline — primary border
        outline: [
          'bg-transparent border border-primary/50 text-primary',
          'hover:bg-primary/10 hover:border-primary',
          'active:scale-[0.98]',
        ],
        // Destructive — danger
        destructive: [
          'bg-danger text-danger-foreground',
          'hover:bg-danger/90 shadow-glow-danger',
          'active:scale-[0.98]',
        ],
        // Link — text only
        link: [
          'bg-transparent text-primary underline-offset-4',
          'hover:underline hover:text-primary-hover',
          'p-0 h-auto',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-sm',
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
