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
  new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);

const CONFIDENCE_CONFIG: Record<string, { label: string; className: string; weight: string }> = {
  CONFIRMED:   { label: 'Confirmed',   className: 'bg-success-muted text-success border-success/30', weight: '100%' },
  LIKELY:      { label: 'Likely',      className: 'bg-primary-muted text-primary border-primary/30', weight: '70%' },
  SPECULATIVE: { label: 'Speculative', className: 'bg-foreground-subtle/10 text-foreground-muted border-border/30', weight: '30%' },
};

export default function FinancialRunwayPage() {
  const { data: session } = useSession();
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
    if (!accessToken) return;
    setLoading(true);
    try {
      const [proj, dealsData] = await Promise.all([
        financialRunwayApi.getProjection(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      setProjection(proj);
      setDeals(dealsData.filter((d: any) => !['COMPLETED', 'CANCELLED', 'LOST'].includes(d.status)));
      setFixedCosts(Number(proj.monthlyFixedCosts ?? 0));
      setSettingsCurrency(proj.currency ?? 'USD');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveSettings = async () => {
    if (!accessToken) return;
    setSavingSettings(true);
    try {
      await financialRunwayApi.upsertSettings(accessToken, { monthlyFixedCosts: fixedCosts, currency: settingsCurrency });
      fetchData();
      setSettingsOpen(false);
    } catch (e) { console.error(e); }
    finally { setSavingSettings(false); }
  };

  const handleConfidenceChange = async (dealId: string, confidence: string) => {
    if (!accessToken) return;
    setUpdatingConfidence(dealId);
    try {
      await financialRunwayApi.updateDealConfidence(accessToken, dealId, confidence);
      fetchData();
    } catch (e) { console.error(e); }
    finally { setUpdatingConfidence(null); }
  };

  const currency = projection?.currency ?? 'USD';

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-12 w-56 rounded-lg bg-background-elevated animate-shimmer" />
        <div className="h-28 rounded-2xl bg-background-elevated animate-shimmer" />
        <div className="h-72 rounded-2xl bg-background-elevated animate-shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-background-elevated animate-shimmer" />)}
        </div>
      </div>
    );
  }

  const chartData = projection?.chartData ?? [];

  return (
    <div className="relative space-y-8 animate-fade-in pb-16">
      <GlowBackground glowPosition="top-left" intensity="subtle" animated />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-muted inline-flex shadow-glow-sm">
              <TrendingUp className="h-6 w-6 text-primary" />
            </span>
            Financial Runway
          </h1>
          <p className="mt-2 text-foreground-muted">Confidence-weighted income projections and payment runway analysis.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen((v) => !v)} className="gap-1.5 self-start sm:self-center">
          <Settings2 className="h-4 w-4" />
          {settingsOpen ? 'Close Settings' : 'Settings'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', settingsOpen && 'rotate-180')} />
        </Button>
      </div>

      {/* Settings Drawer */}
      {settingsOpen && (
        <Card variant="glass" className="border-primary/20 relative z-10 animate-fade-in">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Runway Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Monthly Fixed Costs</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                  <input
                    type="number" min={0} value={fixedCosts}
                    onChange={(e) => setFixedCosts(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-input pl-7 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. 4000"
                  />
                </div>
                <p className="text-xs text-foreground-subtle mt-1">Rent, tools, subscriptions, insurance — any recurring monthly expense.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Currency</label>
                <select value={settingsCurrency} onChange={(e) => setSettingsCurrency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'SGD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSaveSettings} disabled={savingSettings} className="gap-1.5 shadow-glow-sm">
                  <Save className="h-3.5 w-3.5" />
                  {savingSettings ? 'Saving…' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* StatBand — 3 time-horizon projections */}
      <div className="relative z-10 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/20 p-6 shadow-glow">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 h-48 w-64 bg-accent/10 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative">
          <p className="text-xs text-foreground-muted uppercase tracking-widest mb-5 font-semibold">Confidence-Weighted Projected Income</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
            {[
              { label: '30-Day Horizon', value: projection?.projection30?.gross, dealCount: projection?.projection30?.dealCount, icon: <CalendarRange className="h-5 w-5 text-success" /> },
              { label: '60-Day Horizon', value: projection?.projection60?.gross, dealCount: projection?.projection60?.dealCount, icon: <CalendarRange className="h-5 w-5 text-primary" /> },
              { label: '90-Day Horizon', value: projection?.projection90?.gross, dealCount: projection?.projection90?.dealCount, icon: <CalendarRange className="h-5 w-5 text-accent" /> },
            ].map((h) => (
              <div key={h.label} className="flex items-center gap-4 sm:pl-6 first:pl-0 pt-4 sm:pt-0 first:pt-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background-surface/60 flex-shrink-0">
                  {h.icon}
                </div>
                <div>
                  <p className="text-xs text-foreground-muted font-medium uppercase tracking-widest">{h.label}</p>
                  <p className="text-2xl font-extrabold text-white font-mono">{formatCurrency(h.value ?? 0, currency)}</p>
                  <p className="text-xs text-foreground-subtle">{h.dealCount ?? 0} deal{(h.dealCount ?? 0) !== 1 ? 's' : ''} in window</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="relative z-10">
        <Card variant="glass" className="border-border/40">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-base font-bold text-white">Projected Income Curve</CardTitle>
            <CardDescription className="text-xs">Confidence-weighted pipeline value across 30 / 60 / 90-day horizons</CardDescription>
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
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
                  <Tooltip
                    contentStyle={{ background: '#1A1D27', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                    formatter={(val: any, name: any) => [formatCurrency(val, currency), name === 'projected' ? 'Projected Income' : 'Outstanding Receivables']}
                  />
                  {projection?.monthlyFixedCosts > 0 && (
                    <ReferenceLine y={projection.monthlyFixedCosts} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: 'Fixed costs', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
                  )}
                  <Area type="monotone" dataKey="projected" name="projected" stroke="#6366F1" strokeWidth={2} fill="url(#projGradient)" dot={{ fill: '#6366F1', r: 4 }} />
                  <Area type="monotone" dataKey="receivables" name="receivables" stroke="#8B5CF6" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#recGradient)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-foreground-muted">
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-primary" /> Projected (confidence-weighted)</div>
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-accent opacity-60" /> Outstanding receivables</div>
              {projection?.monthlyFixedCosts > 0 && (
                <div className="flex items-center gap-1.5"><div className="h-0.5 w-5 bg-warning" style={{ borderTop: '2px dashed' }} /> Monthly fixed costs</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
        <Card variant="glass" className="border-border/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted flex-shrink-0">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-foreground-muted font-semibold uppercase tracking-wider">Outstanding Receivables</p>
              <p className="text-xl font-extrabold text-white font-mono">{formatCurrency(projection?.outstandingReceivables ?? 0, currency)}</p>
              <p className="text-xs text-foreground-subtle">Unpaid + partially paid invoices</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className={cn('border-border/40', (projection?.overdueAmount ?? 0) > 0 && 'border-danger/20 bg-danger/5')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-muted flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-foreground-muted font-semibold uppercase tracking-wider">Overdue Amount</p>
              <p className="text-xl font-extrabold text-white font-mono">{formatCurrency(projection?.overdueAmount ?? 0, currency)}</p>
              <p className="text-xs text-foreground-subtle">Past due invoices needing follow-up</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-border/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0', projection?.netRunwayMonths !== null ? 'bg-success-muted' : 'bg-background-elevated')}>
              <Activity className={cn('h-5 w-5', projection?.netRunwayMonths !== null ? 'text-success' : 'text-foreground-muted')} />
            </div>
            <div>
              <p className="text-xs text-foreground-muted font-semibold uppercase tracking-wider">Net Runway</p>
              {projection?.netRunwayMonths !== null ? (
                <p className="text-xl font-extrabold text-white font-mono">
                  {projection.netRunwayMonths}
                  <span className="text-sm font-semibold text-foreground-muted ml-1">months</span>
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
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-base font-bold text-white">Deal Pipeline Confidence</CardTitle>
              <CardDescription className="text-xs">Adjust confidence levels to refine your income projections. CONFIRMED = 100%, LIKELY = 70%, SPECULATIVE = 30%.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-2">
                {deals.map((deal) => {
                  const conf = CONFIDENCE_CONFIG[deal.confidence ?? 'LIKELY'] ?? CONFIDENCE_CONFIG.LIKELY;
                  return (
                    <div key={deal.id} className="flex items-center justify-between gap-4 rounded-xl border border-border/30 bg-background-surface/40 px-4 py-3 hover:bg-background-elevated/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{deal.brandName}</p>
                        <p className="text-xs text-foreground-muted">{deal.title} · {new Intl.NumberFormat(undefined, { style: 'currency', currency: deal.currency ?? 'USD', maximumFractionDigits: 0 }).format(Number(deal.amount))}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {updatingConfidence === deal.id ? (
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <select
                            value={deal.confidence ?? 'LIKELY'}
                            onChange={(e) => handleConfidenceChange(deal.id, e.target.value)}
                            className={cn('text-xs font-semibold rounded-full border px-3 py-1 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 bg-transparent', conf.className)}
                          >
                            {Object.entries(CONFIDENCE_CONFIG).map(([val, cfg]) => (
                              <option key={val} value={val} className="bg-background-elevated text-foreground">{cfg.label} ({cfg.weight})</option>
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
