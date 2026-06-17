/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings2,
  Save,
  ChevronDown,
  Activity,
  Wallet,
  CalendarRange,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlowBackground } from '@/components/ui/glow-background';
import { financialRunwayApi, dealsApi } from '@/lib/api-client';

const formatCurrency = (val: number, cur = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: cur,
    maximumFractionDigits: 0,
  }).format(val);

const CONFIDENCE_CONFIG: Record<string, { label: string; className: string; weight: string }> = {
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-success-muted text-success border-success/30',
    weight: '100%',
  },
  LIKELY: {
    label: 'Likely',
    className: 'bg-primary-muted text-primary border-primary/30',
    weight: '70%',
  },
  SPECULATIVE: {
    label: 'Speculative',
    className: 'bg-foreground-subtle/10 text-foreground-muted border-border/30',
    weight: '30%',
  },
};

export default function FinancialRunwayPage() {
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [projection, setProjection] = React.useState<any | null>(null);
  const [deals, setDeals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [fixedCosts, setFixedCosts] = React.useState<number>(0);
  const [settingsCurrency, setSettingsCurrency] = React.useState('USD');
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [updatingConfidence, setUpdatingConfidence] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const [proj, dealsData] = await Promise.all([
        financialRunwayApi.getProjection(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      setProjection(proj);
      setDeals(
        dealsData.filter((d: any) => !['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(d.status) && d.stage !== 'LOST'),
      );
      setFixedCosts(Number(proj.monthlyFixedCosts ?? 0));
      setSettingsCurrency(proj.currency ?? 'USD');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    fetchData();
  }, [status, fetchData]);

  const handleSaveSettings = async () => {
    if (!accessToken) { setLoading(false); return; }
    setSavingSettings(true);
    try {
      await financialRunwayApi.upsertSettings(accessToken, {
        monthlyFixedCosts: fixedCosts,
        currency: settingsCurrency,
      });
      fetchData();
      setSettingsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleConfidenceChange = async (dealId: string, confidence: string) => {
    if (!accessToken) { setLoading(false); return; }
    setUpdatingConfidence(dealId);
    try {
      await financialRunwayApi.updateDealConfidence(accessToken, dealId, confidence);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingConfidence(null);
    }
  };

  const currency = projection?.currency ?? 'USD';

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-12 w-56 animate-shimmer rounded-lg bg-background-elevated" />
        <div className="h-28 animate-shimmer rounded-2xl bg-background-elevated" />
        <div className="h-72 animate-shimmer rounded-2xl bg-background-elevated" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-shimmer rounded-xl bg-background-elevated" />
          ))}
        </div>
      </div>
    );
  }

  const chartData = projection?.chartData ?? [];

  return (
    <div className="relative animate-fade-in space-y-8 pb-16">
      <GlowBackground glowPosition="top-left" intensity="subtle" animated />

      {/* Header */}
      <div className="relative z-10 flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-white">
            <span className="inline-flex rounded-xl bg-primary-muted p-2 shadow-glow-sm">
              <TrendingUp className="h-6 w-6 text-primary" />
            </span>
            Financial Runway
          </h1>
          <p className="mt-2 text-foreground-muted">
            Confidence-weighted income projections and payment runway analysis.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSettingsOpen((v) => !v)}
          className="gap-1.5 self-start sm:self-center"
        >
          <Settings2 className="h-4 w-4" />
          {settingsOpen ? 'Close Settings' : 'Settings'}
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', settingsOpen && 'rotate-180')}
          />
        </Button>
      </div>

      {/* Settings Drawer */}
      {settingsOpen && (
        <Card variant="glass" className="relative z-10 animate-fade-in border-primary/20">
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <Settings2 className="h-4 w-4 text-primary" /> Runway Settings
            </h3>
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Monthly Fixed Costs
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={fixedCosts}
                    onChange={(e) => setFixedCosts(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-input py-2.5 pl-7 pr-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                    placeholder="e.g. 4000"
                  />
                </div>
                <p className="mt-1 text-xs text-foreground-subtle">
                  Rent, tools, subscriptions, insurance — any recurring monthly expense.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Currency
                </label>
                <select
                  value={settingsCurrency}
                  onChange={(e) => setSettingsCurrency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                >
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'SGD'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end sm:col-span-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="gap-1.5 shadow-glow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingSettings ? 'Saving…' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* StatBand — 3 time-horizon projections */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-6 shadow-glow">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-48 w-64 rounded-full bg-accent/10 opacity-60 blur-3xl" />
        </div>
        <div className="relative">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-foreground-muted">
            Confidence-Weighted Projected Income
          </p>
          <div className="grid grid-cols-1 gap-6 divide-y divide-border/30 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              {
                label: '30-Day Horizon',
                value: projection?.projection30?.gross,
                dealCount: projection?.projection30?.dealCount,
                icon: <CalendarRange className="h-5 w-5 text-success" />,
              },
              {
                label: '60-Day Horizon',
                value: projection?.projection60?.gross,
                dealCount: projection?.projection60?.dealCount,
                icon: <CalendarRange className="h-5 w-5 text-primary" />,
              },
              {
                label: '90-Day Horizon',
                value: projection?.projection90?.gross,
                dealCount: projection?.projection90?.dealCount,
                icon: <CalendarRange className="h-5 w-5 text-accent" />,
              },
            ].map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-4 pt-4 first:pl-0 first:pt-0 sm:pl-6 sm:pt-0"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-background-surface/60">
                  {h.icon}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                    {h.label}
                  </p>
                  <p className="font-mono text-2xl font-extrabold text-white">
                    {formatCurrency(h.value ?? 0, currency)}
                  </p>
                  <p className="text-xs text-foreground-subtle">
                    {h.dealCount ?? 0} deal{(h.dealCount ?? 0) !== 1 ? 's' : ''} in window
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="relative z-10">
        <Card variant="glass" className="border-border/40">
          <CardHeader className="px-6 pb-2 pt-6">
            <CardTitle className="text-base font-bold text-white">Projected Income Curve</CardTitle>
            <CardDescription className="text-xs">
              Confidence-weighted pipeline value across 30 / 60 / 90-day horizons
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="recGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency,
                        notation: 'compact',
                        maximumFractionDigits: 1,
                      }).format(v)
                    }
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
                    formatter={(val: any, name: any) => [
                      formatCurrency(val, currency),
                      name === 'projected' ? 'Projected Income' : 'Outstanding Receivables',
                    ]}
                  />
                  {projection?.monthlyFixedCosts > 0 && (
                    <ReferenceLine
                      y={projection.monthlyFixedCosts}
                      stroke="#f59e0b"
                      strokeDasharray="6 3"
                      label={{
                        value: 'Fixed costs',
                        fill: '#f59e0b',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="projected"
                    name="projected"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="url(#projGradient)"
                    dot={{ fill: '#6366F1', r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receivables"
                    name="receivables"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    fill="url(#recGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-6 text-xs text-foreground-muted">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" /> Projected
                (confidence-weighted)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-accent opacity-60" /> Outstanding
                receivables
              </div>
              {projection?.monthlyFixedCosts > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-5 bg-warning" style={{ borderTop: '2px dashed' }} />{' '}
                  Monthly fixed costs
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row */}
      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card variant="glass" className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-muted">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Outstanding Receivables
              </p>
              <p className="font-mono text-xl font-extrabold text-white">
                {formatCurrency(projection?.outstandingReceivables ?? 0, currency)}
              </p>
              <p className="text-xs text-foreground-subtle">Unpaid + partially paid invoices</p>
            </div>
          </CardContent>
        </Card>

        <Card
          variant="glass"
          className={cn(
            'border-border/40',
            (projection?.overdueAmount ?? 0) > 0 && 'border-danger/20 bg-danger/5',
          )}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger-muted">
              <AlertCircle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Overdue Amount
              </p>
              <p className="font-mono text-xl font-extrabold text-white">
                {formatCurrency(projection?.overdueAmount ?? 0, currency)}
              </p>
              <p className="text-xs text-foreground-subtle">Past due invoices needing follow-up</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                projection?.netRunwayMonths !== null
                  ? 'bg-success-muted'
                  : 'bg-background-elevated',
              )}
            >
              <Activity
                className={cn(
                  'h-5 w-5',
                  projection?.netRunwayMonths !== null ? 'text-success' : 'text-foreground-muted',
                )}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Net Runway
              </p>
              {projection?.netRunwayMonths !== null ? (
                <p className="font-mono text-xl font-extrabold text-white">
                  {projection.netRunwayMonths}
                  <span className="ml-1 text-sm font-semibold text-foreground-muted">months</span>
                </p>
              ) : (
                <p className="text-sm text-foreground-muted">Set monthly costs to calculate</p>
              )}
              <p className="text-xs text-foreground-subtle">At current fixed costs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Confidence Editor */}
      {deals.length > 0 && (
        <div className="relative z-10">
          <Card variant="glass" className="border-border/40">
            <CardHeader className="px-6 pb-3 pt-6">
              <CardTitle className="text-base font-bold text-white">
                Deal Pipeline Confidence
              </CardTitle>
              <CardDescription className="text-xs">
                Adjust confidence levels to refine your income projections. CONFIRMED = 100%, LIKELY
                = 70%, SPECULATIVE = 30%.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-2">
                {deals.map((deal) => {
                  const conf =
                    CONFIDENCE_CONFIG[deal.confidence ?? 'LIKELY'] ?? CONFIDENCE_CONFIG.LIKELY;
                  return (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border/30 bg-background-surface/40 px-4 py-3 transition-colors hover:bg-background-elevated/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {deal.brandName}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {deal.title} ·{' '}
                          {new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: deal.currency ?? 'USD',
                            maximumFractionDigits: 0,
                          }).format(Number(deal.amount))}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {updatingConfidence === deal.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <select
                            value={deal.confidence ?? 'LIKELY'}
                            onChange={(e) => handleConfidenceChange(deal.id, e.target.value)}
                            className={cn(
                              'cursor-pointer appearance-none rounded-full border bg-transparent px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40',
                              conf.className,
                            )}
                          >
                            {Object.entries(CONFIDENCE_CONFIG).map(([val, cfg]) => (
                              <option
                                key={val}
                                value={val}
                                className="bg-background-elevated text-foreground"
                              >
                                {cfg.label} ({cfg.weight})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
