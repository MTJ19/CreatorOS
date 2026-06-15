'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { cn, formatCurrency, formatCompact, formatPercent } from '@/lib/utils';
import { Card } from './card';

type TrendDirection = 'up' | 'down' | 'neutral';
type ValueFormat = 'currency' | 'compact' | 'percent' | 'raw';

export interface StatCardProps {
  label: string;
  value: number | string;
  format?: ValueFormat;
  currency?: string;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  icon?: React.ReactNode;
  description?: string;
  loading?: boolean;
  className?: string;
  id?: string;
}

function formatValue(value: number | string, format: ValueFormat, currency?: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'currency':
      return formatCurrency(value, currency ?? 'USD');
    case 'compact':
      return formatCompact(value);
    case 'percent':
      return formatPercent(value);
    default:
      return value.toLocaleString();
  }
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-success', bg: 'bg-success-muted' },
  down: { icon: TrendingDown, color: 'text-danger', bg: 'bg-danger-muted' },
  neutral: { icon: Minus, color: 'text-foreground-muted', bg: 'bg-muted' },
} as const;

export function StatCard({
  label,
  value,
  format = 'raw',
  currency,
  trend,
  icon,
  description,
  loading = false,
  className,
  id,
}: StatCardProps) {
  const displayValue = loading ? '—' : formatValue(value, format, currency);
  const trendCfg = trend ? trendConfig[trend.direction] : null;
  const TrendIcon = trendCfg?.icon;

  return (
    <Card
      variant="glass"
      hover="lift"
      className={cn('p-6', className)}
      id={id}
      role="region"
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: label + value */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground-muted truncate">{label}</p>

          {loading ? (
            <div className="mt-2 h-8 w-24 rounded bg-muted shimmer" />
          ) : (
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {displayValue}
            </p>
          )}

          {/* Trend badge */}
          {trend && !loading && (
            <div className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5', trendCfg?.bg)}>
              {TrendIcon && <TrendIcon className={cn('h-3.5 w-3.5', trendCfg?.color)} aria-hidden />}
              <span className={cn('text-xs font-semibold', trendCfg?.color)}>
                {trend.value > 0 ? '+' : ''}{formatPercent(trend.value, 1)}
              </span>
              {trend.label && (
                <span className="text-xs text-foreground-muted">{trend.label}</span>
              )}
            </div>
          )}

          {description && !loading && (
            <p className="mt-2 text-xs text-foreground-subtle">{description}</p>
          )}
        </div>

        {/* Right: icon */}
        {icon && (
          <div
            className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-muted text-primary"
            aria-hidden
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
