'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn, enumToLabel } from '@/lib/utils';

// Re-export from constants (no 'use client') so Server Components can import them
export {
  dealStatusVariant,
  riskSeverityVariant,
  invoiceStatusVariant,
  contractStatusVariant,
} from '@/lib/status-variants';

const badgeVariants = cva('inline-flex items-center gap-1.5 font-semibold transition-colors', {
  variants: {
    variant: {
      // Semantic
      default: 'bg-muted text-foreground-muted',
      primary: 'bg-primary-muted text-primary',
      success: 'bg-success-muted text-success',
      warning: 'bg-warning-muted text-warning',
      danger: 'bg-danger-muted text-danger',
      info: 'bg-info-muted text-info',

      // Deal statuses
      'deal-draft': 'bg-muted text-foreground-muted',
      'deal-negotiating': 'bg-warning-muted text-warning',
      'deal-active': 'bg-primary-muted text-primary',
      'deal-pending-contract': 'bg-info-muted text-info',
      'deal-completed': 'bg-success-muted text-success',
      'deal-cancelled': 'bg-muted text-foreground-subtle',
      'deal-disputed': 'bg-danger-muted text-danger',

      // Contract statuses
      'contract-draft': 'bg-muted text-foreground-muted',
      'contract-pending-review': 'bg-info-muted text-info',
      'contract-pending-signature': 'bg-warning-muted text-warning',
      'contract-signed': 'bg-success-muted text-success',
      'contract-expired': 'bg-danger-muted text-danger',
      'contract-terminated': 'bg-muted text-foreground-subtle',

      // Risk severity
      'risk-low': 'bg-success-muted text-success',
      'risk-medium': 'bg-warning-muted text-warning',
      'risk-high': 'bg-danger-muted/80 text-risk-high',
      'risk-critical': 'bg-danger-muted text-danger',

      // Invoice statuses
      'invoice-draft': 'bg-muted text-foreground-muted',
      'invoice-sent': 'bg-info-muted text-info',
      'invoice-paid': 'bg-success-muted text-success',
      'invoice-overdue': 'bg-danger-muted text-danger',
      'invoice-cancelled': 'bg-muted text-foreground-subtle',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs rounded-sm',
      default: 'px-2.5 py-0.5 text-xs rounded-full',
      lg: 'px-3 py-1 text-sm rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Show a colored dot before the label */
  dot?: boolean;
  /** If true, renders the children as an enum label (SOME_ENUM → Some Enum) */
  enumLabel?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot = false, enumLabel = false, children, ...props }, ref) => {
    const content = enumLabel && typeof children === 'string' ? enumToLabel(children) : children;

    return (
      <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props}>
        {dot && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" aria-hidden />}
        {content}
      </span>
    );
  },
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
