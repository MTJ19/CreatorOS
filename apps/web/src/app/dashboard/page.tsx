/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  DollarSign,
  Handshake,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  LayoutDashboard,
  Percent,
  Search,
  Eye,
  Inbox,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { dealsApi } from '@/lib/api-client';
import { dealStatusVariant } from '@/lib/status-variants';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  // Data states
  const [stats, setStats] = React.useState<any>(null);
  const [deals, setDeals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch Dashboard Stats & Deals
  const fetchDashboardData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [statsData, dealsData] = await Promise.all([
        dealsApi.getDashboardStats(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      setStats(statsData);
      setDeals(dealsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Recharts: Pipeline stage chart data
  const getPipelineChartData = () => {
    if (!stats?.stageBreakdown) return [];
    const stageLabels: Record<string, string> = {
      NEW_INQUIRY: 'Inquiry',
      QUALIFIED: 'Qualified',
      PITCH_SENT: 'Pitch',
      NEGOTIATING: 'Negotiation',
      CONTRACT_SENT: 'Contract',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      LOST: 'Lost',
    };
    return Object.keys(stats.stageBreakdown).map(key => ({
      name: stageLabels[key] || key,
      count: stats.stageBreakdown[key] || 0,
    }));
  };

  // Recharts: Deal value chart data
  const getDealValueChartData = () => {
    return deals
      .slice(0, 6)
      .map(d => ({
        name: d.brandName?.length > 10 ? `${d.brandName.substring(0, 10)}...` : d.brandName,
        value: Number(d.amount) || 0,
      }))
      .reverse();
  };

  // Render Performance Rating Badge
  const renderRatingBadge = (rating: string) => {
    switch (rating) {
      case 'HIGH':
        return <Badge variant="deal-completed" dot className="text-[10px]">🟢 High Performance</Badge>;
      case 'MEDIUM':
        return <Badge variant="deal-negotiating" dot className="text-[10px]">🟡 Avg Performance</Badge>;
      case 'LOW':
        return <Badge variant="deal-disputed" dot className="text-[10px]">🔴 Low Performance</Badge>;
      default:
        return <Badge variant="deal-draft" dot className="text-[10px]">No ratings yet</Badge>;
    }
  };

  return (
    <div className="relative space-y-8 animate-fade-in pb-16">
      {/* Premium Radial Purple Glow Header */}
      <GlowBackground glowPosition="top-left" intensity="medium" animated />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-muted inline-flex shadow-glow-sm">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </span>
            Dashboard
          </h1>
          <p className="mt-2 text-foreground-muted">
            Overview of your brand partnerships, negotiation pipelines, and post-performance.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* StatBand: Premium Gradient summary band */}
          <section aria-label="Key performance metrics" className="relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 bg-gradient-to-r from-primary-muted/15 to-accent-muted/10 border border-primary/20 rounded-xl p-5 shadow-glow-sm">
              {/* Active Deals */}
              <div className="p-2.5 space-y-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Active Deals</span>
                <span className="text-3xl font-extrabold text-white tracking-tight block">
                  {stats?.activeDeals || 0}
                </span>
                <span className="text-xs text-foreground-muted block">In progress</span>
              </div>

              {/* Monthly Contracted Value */}
              <div className="p-2.5 space-y-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Monthly Value</span>
                <span className="text-3xl font-extrabold text-white tracking-tight block">
                  {formatCurrency(stats?.monthlyContractedValue || 0)}
                </span>
                <span className="text-xs text-foreground-muted block">Contracted this month</span>
              </div>

              {/* Flagged Clauses */}
              <div className="p-2.5 space-y-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Flagged Clauses</span>
                <span className="text-3xl font-extrabold text-white tracking-tight block flex items-center gap-1.5">
                  {stats?.flaggedClauseCount || 0}
                  {stats?.flaggedClauseCount > 0 && (
                    <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
                  )}
                </span>
                <span className="text-xs text-foreground-muted block">Requires review</span>
              </div>

              {/* Overdue Invoices */}
              <div className="p-2.5 space-y-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Overdue Invoices</span>
                <span className="text-3xl font-extrabold text-white tracking-tight block text-rose-500">
                  {stats?.overdueInvoices || 0}
                </span>
                <span className="text-xs text-foreground-muted block">Awaiting payment</span>
              </div>

              {/* Average CPV */}
              <div className="p-2.5 space-y-1 col-span-2 lg:col-span-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">Avg. CPV</span>
                <span className="text-3xl font-extrabold text-white tracking-tight block font-mono">
                  {stats?.avgCpv !== null && stats?.avgCpv !== undefined ? `$${stats.avgCpv.toFixed(3)}` : 'N/A'}
                </span>
                <span className="text-xs text-foreground-muted block">Cost per view</span>
              </div>
            </div>
          </section>

          {/* Recharts Visualizations Grid */}
          <section aria-label="Visual analytics" className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pipeline Stages */}
            <Card variant="glass" className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Handshake className="h-4 w-4 text-primary" /> CRM Pipeline Stage Distribution
                </CardTitle>
                <CardDescription className="text-xs">Deals distribution across Kanban stages</CardDescription>
              </CardHeader>
              <CardContent className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getPipelineChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1D27" vertical={false} />
                    <XAxis dataKey="name" stroke="#525866" fontSize={11} tickLine={false} />
                    <YAxis stroke="#525866" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141620',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="url(#purpleGradient)" radius={[4, 4, 0, 0]}>
                      <defs>
                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Deal Valuation */}
            <Card variant="glass" className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-primary" /> Recent Campaign Valuations
                </CardTitle>
                <CardDescription className="text-xs">Valuation breakdown of your latest 6 deals</CardDescription>
              </CardHeader>
              <CardContent className="h-64 pt-4">
                {getDealValueChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDealValueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A1D27" vertical={false} />
                      <XAxis dataKey="name" stroke="#525866" fontSize={11} tickLine={false} />
                      <YAxis stroke="#525866" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141620',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Value']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#areaGlow)"
                      >
                        <defs>
                          <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-foreground-subtle">
                    No deal data available for charts
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Active / Recent Deals Cards */}
          <section aria-label="Active partnerships breakdown" className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Active Partnerships & Performance</h2>
                <p className="text-xs text-foreground-muted">Overview of metrics, invoices, and performance ratings per deal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.filter(d => d.stage === 'ACTIVE').slice(0, 6).map(deal => {
                const views = deal.computed?.views || 0;
                const er = deal.computed?.engagementRate || 0;
                const cpv = deal.computed?.avgCpv;
                const rating = deal.computed?.performanceRating || 'NONE';

                return (
                  <Card key={deal.id} variant="glass" className="border-border/40 hover:border-primary/30 transition-all duration-150">
                    <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base text-white truncate max-w-[180px]">{deal.title}</CardTitle>
                        <CardDescription className="text-xs">{deal.brandName}</CardDescription>
                      </div>
                      <Badge variant="deal-active" className="text-[10px]">Active</Badge>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3.5">
                      {/* Rating Banner */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground-muted">AI Performance Rating:</span>
                        {renderRatingBadge(rating)}
                      </div>

                      {/* Computed stats */}
                      <div className="grid grid-cols-3 gap-2 border-t border-b border-border/10 py-2.5 text-center">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-foreground-subtle uppercase block">Views</span>
                          <span className="font-semibold text-sm text-white font-mono">{views.toLocaleString()}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-foreground-subtle uppercase block">ER</span>
                          <span className="font-semibold text-sm text-white font-mono">{er.toFixed(2)}%</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-foreground-subtle uppercase block">CPV</span>
                          <span className="font-semibold text-sm text-white font-mono">
                            {cpv !== null && cpv !== undefined ? `$${cpv.toFixed(3)}` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Details & Invoices */}
                      <div className="space-y-2 text-xs text-foreground-muted">
                        <div className="flex justify-between">
                          <span>Deal Value:</span>
                          <span className="font-semibold text-white">{formatCurrency(Number(deal.amount))}</span>
                        </div>
                        {deal.deadline && (
                          <div className="flex justify-between">
                            <span>Deadline:</span>
                            <span className="flex items-center gap-1 text-white">
                              <Clock className="h-3 w-3" />
                              {new Date(deal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Invoices:</span>
                          <span className="font-semibold text-white">
                            {deal.invoices && deal.invoices.length > 0 ? (
                              <Badge variant={dealStatusVariant[deal.invoices[0].status as keyof typeof dealStatusVariant]} className="px-1.5 py-0.5 text-[9px]">
                                {deal.invoices[0].status}
                              </Badge>
                            ) : (
                              'No invoices'
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {deals.filter(d => d.stage === 'ACTIVE').length === 0 && (
                <div className="col-span-full py-12 text-center text-foreground-muted bg-background-surface/30 border border-dashed border-border/20 rounded-xl">
                  <Inbox className="h-10 w-10 text-foreground-subtle mx-auto mb-3" />
                  <p className="text-base font-semibold text-white">No active deals right now</p>
                  <p className="text-xs max-w-xs mx-auto mt-1">
                    Once you update a deal stage to &quot;Active&quot; in the CRM, it will appear here with live metrics.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Alert Banner */}
          {deals.filter(d => d.stage === 'ACTIVE' && d.deadline).length > 0 && (
            <section aria-label="Upcoming deadlines notice" className="relative z-10">
              <Card variant="glass" className="border-warning/30 bg-warning-muted/15 p-5">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning-muted/20 text-warning">
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Review active campaigns</h3>
                    <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                      Make sure you deliver all content and submit invoices for active campaigns before the contract end dates.
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
