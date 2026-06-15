/**
 * Status-to-badge-variant maps
 * Plain objects (no 'use client') — safe to import in Server Components
 */

export const dealStatusVariant = {
  DRAFT: 'deal-draft',
  NEGOTIATING: 'deal-negotiating',
  PENDING_CONTRACT: 'deal-pending-contract',
  ACTIVE: 'deal-active',
  COMPLETED: 'deal-completed',
  CANCELLED: 'deal-cancelled',
  DISPUTED: 'deal-disputed',
} as const;

export const riskSeverityVariant = {
  LOW: 'risk-low',
  MEDIUM: 'risk-medium',
  HIGH: 'risk-high',
  CRITICAL: 'risk-critical',
} as const;

export const invoiceStatusVariant = {
  DRAFT: 'invoice-draft',
  SENT: 'invoice-sent',
  VIEWED: 'invoice-sent',
  PARTIALLY_PAID: 'invoice-sent',
  PAID: 'invoice-paid',
  OVERDUE: 'invoice-overdue',
  CANCELLED: 'invoice-cancelled',
  DISPUTED: 'invoice-overdue',
} as const;

export const contractStatusVariant = {
  DRAFT: 'contract-draft',
  PENDING_REVIEW: 'contract-pending-review',
  PENDING_SIGNATURE: 'contract-pending-signature',
  SIGNED: 'contract-signed',
  EXPIRED: 'contract-expired',
  TERMINATED: 'contract-terminated',
} as const;
