/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
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
import { GlowBackground } from '@/components/ui/glow-background';
import { invisibleTaxApi } from '@/lib/api-client';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-danger-muted text-danger border-danger/40',
  HIGH:     'bg-danger-muted/60 text-danger border-danger/30',
  MEDIUM:   'bg-warning-muted text-warning border-warning/30',
  LOW:      'bg-success-muted text-success border-success/30',
};

// Mock trend chart data (last 6 months, simulated)
const buildTrendData = (total: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let base = total * 0.4;
  return months.map((m) => {
    base = base * (1 + (Math.random() - 0.3) * 0.4);
    return { month: m, loss: Math.round(base) };
  }).concat([{ month: 'Now', loss: Math.round(total) }]);
};

export default function InvisibleTaxPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken) return;
    invisibleTaxApi.getSummary(accessToken)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const trendData = data ? buildTrendData(data.totalMoneyLeftOnTable) : [];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-48 rounded-2xl bg-background-elevated animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-background-elevated animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-fade-in pb-16">
      <GlowBackground glowPosition="center" intensity="medium" animated />

      {/* ── Radial Glow Header ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background-surface via-primary/5 to-accent/10 shadow-glow p-8 z-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-48 w-96 bg-primary/20 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-0 right-0 h-32 w-48 bg-accent/15 rounded-full blur-2xl opacity-50" />
        </div>
        <div className="relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted/30 border border-primary/30 text-xs text-primary font-semibold mb-4">
            <Eye className="h-3.5 w-3.5" />
            Financial Transparency Report
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-hover to-accent bg-clip-text text-transparent">
            Invisible Tax Dashboard
          </h1>
          <p className="mt-3 text-foreground-muted max-w-lg mx-auto text-sm">
            Money left on the table, hidden costs, and clause risks surfaced automatically from your deals and contracts.
          </p>
          {data && (
            <div className="mt-6 flex flex-col items-center">
              <p className="text-xs text-foreground-muted uppercase tracking-widest mb-1">Estimated money left on the table</p>
              <p className="text-6xl font-extrabold font-mono text-white">
                {formatCurrency(data.totalMoneyLeftOnTable)}
              </p>
              <p className="text-xs text-foreground-subtle mt-1">Based on Rate Intelligence comparisons and usage rights analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Metric Cards Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {/* Underpricing Gap */}
        <Card variant="glass" className="border-border/40 group hover:border-danger/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-muted">
                  <TrendingDown className="h-4.5 w-4.5 text-danger" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Underpricing Gap</p>
                  <p className="text-xs text-foreground-subtle">vs Rate Intelligence</p>
                </div>
              </div>
            </div>
            <p className="text-3xl font-extrabold font-mono text-white">
              {formatCurrency(data?.underpricingGap?.amount ?? 0)}
            </p>
            <p className="text-xs text-foreground-muted mt-1.5">
              {data?.underpricingGap?.dealCount ?? 0} deal{(data?.underpricingGap?.dealCount ?? 0) !== 1 ? 's' : ''} below recommended minimum
            </p>
            {(data?.underpricingGap?.deals?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                {data.underpricingGap.deals.slice(0, 2).map((d: any) => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="text-foreground-muted truncate max-w-[60%]">{d.brandName}</span>
                    <span className="text-danger font-mono font-semibold">-{formatCurrency(d.gap)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Rights Leakage */}
        <Card variant="glass" className="border-border/40 group hover:border-warning/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-muted">
                <Scale className="h-4.5 w-4.5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Usage Rights Leakage</p>
                <p className="text-xs text-foreground-subtle">Whitelisting undercharged</p>
              </div>
            </div>
            <p className="text-3xl font-extrabold font-mono text-white">
              {formatCurrency(data?.usageRightsLeakage?.amount ?? 0)}
            </p>
            <p className="text-xs text-foreground-muted mt-1.5">
              {data?.usageRightsLeakage?.dealCount ?? 0} deal{(data?.usageRightsLeakage?.dealCount ?? 0) !== 1 ? 's' : ''} with paid-ads rights at organic rate
            </p>
            {(data?.usageRightsLeakage?.deals?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                {data.usageRightsLeakage.deals.slice(0, 2).map((d: any) => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="text-foreground-muted truncate max-w-[60%]">{d.brandName}</span>
                    <span className="text-warning font-mono font-semibold">-{formatCurrency(d.estimatedLeakage)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scope Creep */}
        <Card variant="glass" className="border-border/40 group hover:border-info/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-muted">
                <AlertTriangle className="h-4.5 w-4.5 text-info" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Scope Creep</p>
                <p className="text-xs text-foreground-subtle">Revisions over contract limit</p>
              </div>
            </div>
            <p className="text-3xl font-extrabold font-mono text-white">
              {data?.scopeCreep?.totalExtraRevisions ?? 0}
              <span className="text-lg font-semibold text-foreground-muted ml-1">extra revisions</span>
            </p>
            <p className="text-xs text-foreground-muted mt-1.5">
              {data?.scopeCreep?.dealsOverRevisionLimit ?? 0} deal{(data?.scopeCreep?.dealsOverRevisionLimit ?? 0) !== 1 ? 's' : ''} exceeding contracted revision count
            </p>
            {(data?.scopeCreep?.deals?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                {data.scopeCreep.deals.slice(0, 2).map((d: any) => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="text-foreground-muted truncate max-w-[60%]">{d.brandName}</span>
                    <span className="text-info font-semibold">{d.revisionsUsed}/{d.revisionLimit} revisions</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Risk Score */}
        <Card variant="glass" className="border-border/40">
          <CardContent className="p-5">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted">
                <ShieldAlert className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Contract Risk Score</p>
                <p className="text-xs text-foreground-subtle">Aggregated across all deals</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-extrabold font-mono text-white">
                {data?.contractRiskScore?.avgScore ?? 0}
              </p>
              <p className="text-sm text-foreground-muted mb-1">/100</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-background-elevated overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', {
                  'bg-success': (data?.contractRiskScore?.avgScore ?? 0) < 30,
                  'bg-warning': (data?.contractRiskScore?.avgScore ?? 0) < 60,
                  'bg-danger': (data?.contractRiskScore?.avgScore ?? 0) >= 60,
                })}
                style={{ width: `${data?.contractRiskScore?.avgScore ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-foreground-muted mt-2">
              {data?.contractRiskScore?.totalFlaggedClauses ?? 0} unacknowledged risk clauses · {data?.contractRiskScore?.dealsWithHighRisk ?? 0} critical deals
            </p>
          </CardContent>
        </Card>

        {/* Barter Tax Reminder */}
        <Card variant={data?.barterDeals?.taxReminder ? 'glass' : 'glass'} className={cn('border-border/40 col-span-1', data?.barterDeals?.taxReminder && 'border-warning/30 bg-warning/5')}>
          <CardContent className="p-5">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-muted">
                <Gift className="h-4.5 w-4.5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Barter / Gifting Deals</p>
                <p className="text-xs text-foreground-subtle">Tax reminder for unpaid collabs</p>
              </div>
            </div>
            <p className="text-3xl font-extrabold font-mono text-white">
              {data?.barterDeals?.count ?? 0}
              <span className="text-lg font-semibold text-foreground-muted ml-1">deal{(data?.barterDeals?.count ?? 0) !== 1 ? 's' : ''}</span>
            </p>
            {data?.barterDeals?.taxReminder ? (
              <div className="mt-3 rounded-lg bg-warning-muted/30 border border-warning/30 px-3 py-2 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  Gifted products and services are taxable income. Ensure you've documented FMV for your tax records.
                </p>
              </div>
            ) : (
              <p className="text-xs text-foreground-muted mt-1.5">No active barter deals — you're all clear.</p>
            )}
          </CardContent>
        </Card>

        {/* Trend Visualization placeholder card */}
        <Card variant="glass" className="border-border/40 col-span-1 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-1">Quick Stats</p>
            <div className="space-y-3 mt-3">
              {[
                { label: 'Avg gap per underpriced deal', value: data?.underpricingGap?.dealCount ? formatCurrency(data.underpricingGap.amount / data.underpricingGap.dealCount) : '—' },
                { label: 'Flagged clauses unreviewed', value: data?.contractRiskScore?.totalFlaggedClauses ?? 0 },
                { label: 'Gifting deals needing tax docs', value: data?.barterDeals?.count ?? 0 },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-foreground-muted">{s.label}</span>
                  <span className="font-semibold text-white font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Worst Clause This Month ───────────────────────────────── */}
      {data?.worstActiveFlag ? (
        <div className="relative z-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 border border-primary/25 p-6 shadow-glow">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-8 -right-8 h-32 w-32 bg-accent/20 rounded-full blur-2xl" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-muted flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Worst Unresolved Clause</span>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border', SEVERITY_BADGE[data.worstActiveFlag.severity] ?? SEVERITY_BADGE.MEDIUM)}>
                    {data.worstActiveFlag.severity}
                  </span>
                </div>
                <p className="text-base font-bold text-white">{data.worstActiveFlag.clause}</p>
                <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed line-clamp-2">{data.worstActiveFlag.description}</p>
                {data.worstActiveFlag.recommendation && (
                  <p className="text-xs text-primary mt-1.5 font-medium">💡 {data.worstActiveFlag.recommendation}</p>
                )}
                <p className="text-xs text-foreground-subtle mt-1.5">
                  Deal: <span className="text-white font-medium">{data.worstActiveFlag.brandName}</span>
                </p>
              </div>
              <Link
                href={`/contracts/${data.worstActiveFlag.contractId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-glow-sm flex-shrink-0 self-start"
              >
                Review Clause <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <Card variant="glass" className="border-success/20 bg-success/5 relative z-10">
          <CardContent className="p-5 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-success flex-shrink-0" />
            <p className="text-sm text-success font-medium">No critical unacknowledged clause risks — great work reviewing your contracts!</p>
          </CardContent>
        </Card>
      )}

      {/* ── Trend Area Chart ──────────────────────────────────────── */}
      <div className="relative z-10">
        <Card variant="glass" className="border-border/40">
          <CardHeader className="px-6 pt-6 pb-0">
            <CardTitle className="text-base font-bold text-white">Estimated Loss Trend</CardTitle>
            <CardDescription className="text-xs">Projected money left on the table over 6 months (simulated projection)</CardDescription>
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
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
                  <Tooltip
                    contentStyle={{ background: '#1A1D27', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                    formatter={(val: any) => [formatCurrency(val), 'Est. loss']}
                  />
                  <Area type="monotone" dataKey="loss" stroke="#7C3AED" strokeWidth={2} fill="url(#lossGradient)" dot={{ fill: '#7C3AED', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
