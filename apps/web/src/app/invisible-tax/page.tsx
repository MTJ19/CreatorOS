/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  Scale,
  Eye,
  Gift,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlowBackground } from '@/components/ui/glow-background';
import { EmptyState } from '@/components/ui/empty-state';
import { invisibleTaxApi, dealsApi } from '@/lib/api-client';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-danger-muted text-danger border-danger/40',
  HIGH: 'bg-danger-muted/60 text-danger border-danger/30',
  MEDIUM: 'bg-warning-muted text-warning border-warning/30',
  LOW: 'bg-success-muted text-success border-success/30',
};

// Mock trend chart data (last 6 months, simulated)
const buildTrendData = (total: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let base = total * 0.4;
  return months
    .map((m) => {
      base = base * (1 + (Math.random() - 0.3) * 0.4);
      return { month: m, loss: Math.round(base) };
    })
    .concat([{ month: 'Now', loss: Math.round(total) }]);
};

export default function InvisibleTaxPage() {
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken;
  const router = useRouter();

  const [data, setData] = React.useState<any | null>(null);
  const [hasDeals, setHasDeals] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const [summary, dealsData] = await Promise.all([
        invisibleTaxApi.getSummary(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      setData(summary);
      setHasDeals(dealsData.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { setLoading(false); return; }
    fetchData();
  }, [status, fetchData]);

  const trendData = data ? buildTrendData(data.totalMoneyLeftOnTable) : [];

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-48 animate-shimmer rounded-2xl bg-background-elevated" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-shimmer rounded-xl bg-background-elevated" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasDeals) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Eye className="h-12 w-12 text-primary/40 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Invisible Tax Data Yet</h2>
        <p className="text-foreground-muted text-sm mb-6">
          Add deals, log performance, and upload contracts to see your hidden losses.
        </p>
        <Button onClick={() => router.push('/deals?new=true')}>+ Add a Deal</Button>
      </div>
    );
  }

  return (
    <div className="relative animate-fade-in space-y-8 pb-16">
      <GlowBackground glowPosition="center" intensity="medium" animated />

      {/* ── Radial Glow Header ────────────────────────────────────── */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background-surface via-primary/5 to-accent/10 p-8 shadow-glow">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/20 opacity-60 blur-3xl" />
          <div className="absolute right-0 top-0 h-32 w-48 rounded-full bg-accent/15 opacity-50 blur-2xl" />
        </div>
        <div className="relative text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-muted/30 px-3 py-1.5 text-xs font-semibold text-primary">
            <Eye className="h-3.5 w-3.5" />
            Financial Transparency Report
          </div>
          <h1 className="bg-gradient-to-r from-white via-primary-hover to-accent bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Invisible Tax Dashboard
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-foreground-muted">
            Money left on the table, hidden costs, and clause risks surfaced automatically from your
            deals and contracts.
          </p>
          {data && (
            <div className="mt-6 flex flex-col items-center">
              <p className="mb-1 text-xs uppercase tracking-widest text-foreground-muted">
                Estimated money left on the table
              </p>
              <p className="font-mono text-6xl font-extrabold text-white">
                {formatCurrency(data.totalMoneyLeftOnTable)}
              </p>
              <p className="mt-1 text-xs text-foreground-subtle">
                Based on Rate Intelligence comparisons and usage rights analysis
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Metric Cards Row ─────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Underpricing Gap */}
        <Card
          variant="glass"
          className="group border-border/40 transition-colors hover:border-danger/30"
        >
          <CardContent className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-muted">
                  <TrendingDown className="h-4.5 w-4.5 text-danger" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Underpricing Gap
                  </p>
                  <p className="text-xs text-foreground-subtle">vs Rate Intelligence</p>
                </div>
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-white">
              {formatCurrency(data?.underpricingGap?.amount ?? 0)}
            </p>
            <p className="mt-1.5 text-xs text-foreground-muted">
              {data?.underpricingGap?.dealCount ?? 0} deal
              {(data?.underpricingGap?.dealCount ?? 0) !== 1 ? 's' : ''} below recommended minimum
            </p>
            {(data?.underpricingGap?.deals?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                {data.underpricingGap.deals.slice(0, 2).map((d: any) => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="max-w-[60%] truncate text-foreground-muted">
                      {d.brandName}
                    </span>
                    <span className="font-mono font-semibold text-danger">
                      -{formatCurrency(d.gap)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Rights Leakage */}
        <Card
          variant="glass"
          className="group border-border/40 transition-colors hover:border-warning/30"
        >
          <CardContent className="p-5">
            <div className="mb-4 flex items-start gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-muted">
                <Scale className="h-4.5 w-4.5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Usage Rights Leakage
                </p>
                <p className="text-xs text-foreground-subtle">Whitelisting undercharged</p>
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-white">
              {formatCurrency(data?.usageRightsLeakage?.amount ?? 0)}
            </p>
            <p className="mt-1.5 text-xs text-foreground-muted">
              {data?.usageRightsLeakage?.dealCount ?? 0} deal
              {(data?.usageRightsLeakage?.dealCount ?? 0) !== 1 ? 's' : ''} with paid-ads rights at
              organic rate
            </p>
            {(data?.usageRightsLeakage?.deals?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                {data.usageRightsLeakage.deals.slice(0, 2).map((d: any) => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="max-w-[60%] truncate text-foreground-muted">
                      {d.brandName}
                    </span>
                    <span className="font-mono font-semibold text-warning">
                      -{formatCurrency(d.estimatedLeakage)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scope Creep */}
        <Card
          variant="glass"
          className="group border-border/40 transition-colors hover:border-info/30"
        >
          <CardContent className="p-5">
            <div className="mb-4 flex items-start gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-muted">
                <AlertTriangle className="h-4.5 w-4.5 text-info" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Scope Creep
                </p>
                <p className="text-xs text-foreground-subtle">Revisions over contract limit</p>
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-white">
              {data?.scopeCreep?.totalExtraRevisions ?? 0}
              <span className="ml-1 text-lg font-semibold text-foreground-muted">
                extra revisions
              </span>
            </p>
            <p className="mt-1.5 text-xs text-foreground-muted">
              {data?.scopeCreep?.dealsOverRevisionLimit ?? 0} deal
              {(data?.scopeCreep?.dealsOverRevisionLimit ?? 0) !== 1 ? 's' : ''} exceeding
              contracted revision count
            </p>
            {(data?.scopeCreep?.deals?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                {data.scopeCreep.deals.slice(0, 2).map((d: any) => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="max-w-[60%] truncate text-foreground-muted">
                      {d.brandName}
                    </span>
                    <span className="font-semibold text-info">
                      {d.revisionsUsed}/{d.revisionLimit} revisions
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Risk Score */}
        <Card variant="glass" className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-4 flex items-start gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted">
                <ShieldAlert className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Contract Risk Score
                </p>
                <p className="text-xs text-foreground-subtle">Aggregated across all deals</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="font-mono text-4xl font-extrabold text-white">
                {data?.contractRiskScore?.avgScore ?? 0}
              </p>
              <p className="mb-1 text-sm text-foreground-muted">/100</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background-elevated">
              <div
                className={cn('h-full rounded-full transition-all', {
                  'bg-success': (data?.contractRiskScore?.avgScore ?? 0) < 30,
                  'bg-warning': (data?.contractRiskScore?.avgScore ?? 0) < 60,
                  'bg-danger': (data?.contractRiskScore?.avgScore ?? 0) >= 60,
                })}
                style={{ width: `${data?.contractRiskScore?.avgScore ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-foreground-muted">
              {data?.contractRiskScore?.totalFlaggedClauses ?? 0} unacknowledged risk clauses ·{' '}
              {data?.contractRiskScore?.dealsWithHighRisk ?? 0} critical deals
            </p>
          </CardContent>
        </Card>

        {/* Barter Tax Reminder */}
        <Card
          variant={data?.barterDeals?.taxReminder ? 'glass' : 'glass'}
          className={cn(
            'col-span-1 border-border/40',
            data?.barterDeals?.taxReminder && 'border-warning/30 bg-warning/5',
          )}
        >
          <CardContent className="p-5">
            <div className="mb-4 flex items-start gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-muted">
                <Gift className="h-4.5 w-4.5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Barter / Gifting Deals
                </p>
                <p className="text-xs text-foreground-subtle">Tax reminder for unpaid collabs</p>
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-white">
              {data?.barterDeals?.count ?? 0}
              <span className="ml-1 text-lg font-semibold text-foreground-muted">
                deal{(data?.barterDeals?.count ?? 0) !== 1 ? 's' : ''}
              </span>
            </p>
            {data?.barterDeals?.taxReminder ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-muted/30 px-3 py-2">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
                <p className="text-xs text-warning">
                  Gifted products and services are taxable income. Ensure you've documented FMV for
                  your tax records.
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-foreground-muted">
                No active barter deals — you're all clear.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trend Visualization placeholder card */}
        <Card variant="glass" className="col-span-1 border-border/40 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Quick Stats
            </p>
            <div className="mt-3 space-y-3">
              {[
                {
                  label: 'Avg gap per underpriced deal',
                  value: data?.underpricingGap?.dealCount
                    ? formatCurrency(data.underpricingGap.amount / data.underpricingGap.dealCount)
                    : '—',
                },
                {
                  label: 'Flagged clauses unreviewed',
                  value: data?.contractRiskScore?.totalFlaggedClauses ?? 0,
                },
                { label: 'Gifting deals needing tax docs', value: data?.barterDeals?.count ?? 0 },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-foreground-muted">{s.label}</span>
                  <span className="font-mono font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Worst Clause This Month ───────────────────────────────── */}
      {data?.worstActiveFlag ? (
        <div className="relative z-10">
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 p-6 shadow-glow">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
            </div>
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger-muted">
                <ShieldAlert className="h-5 w-5 text-danger" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Worst Unresolved Clause
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                      SEVERITY_BADGE[data.worstActiveFlag.severity] ?? SEVERITY_BADGE.MEDIUM,
                    )}
                  >
                    {data.worstActiveFlag.severity}
                  </span>
                </div>
                <p className="text-base font-bold text-white">{data.worstActiveFlag.clause}</p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-foreground-muted">
                  {data.worstActiveFlag.description}
                </p>
                {data.worstActiveFlag.recommendation && (
                  <p className="mt-1.5 text-xs font-medium text-primary">
                    💡 {data.worstActiveFlag.recommendation}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-foreground-subtle">
                  Deal:{' '}
                  <span className="font-medium text-white">{data.worstActiveFlag.brandName}</span>
                </p>
              </div>
              <Link
                href={`/contracts/${data.worstActiveFlag.contractId}`}
                className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-glow-sm transition-colors hover:bg-primary-hover"
              >
                Review Clause <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <Card variant="glass" className="relative z-10 border-success/20 bg-success/5">
          <CardContent className="flex items-center gap-3 p-5">
            <Sparkles className="h-5 w-5 flex-shrink-0 text-success" />
            <p className="text-sm font-medium text-success">
              No critical unacknowledged clause risks — great work reviewing your contracts!
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Trend Area Chart ──────────────────────────────────────── */}
      <div className="relative z-10">
        <Card variant="glass" className="border-border/40">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="text-base font-bold text-white">Estimated Loss Trend</CardTitle>
            <CardDescription className="text-xs">
              Projected money left on the table over 6 months (simulated projection)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1D27',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                    formatter={(val: any) => [formatCurrency(val), 'Est. loss']}
                  />
                  <Area
                    type="monotone"
                    dataKey="loss"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fill="url(#lossGradient)"
                    dot={{ fill: '#7C3AED', r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
