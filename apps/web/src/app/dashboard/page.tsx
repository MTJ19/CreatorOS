/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Instagram,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlowBackground } from '@/components/ui/glow-background';
import { EmptyState } from '@/components/ui/empty-state';
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
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken;
  const router = useRouter();

  // Data states
  const [stats, setStats] = React.useState<any>(null);
  const [deals, setDeals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch Dashboard Stats & Deals
  const fetchDashboardData = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
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
  }, [accessToken, session]);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { setLoading(false); return; }
    fetchDashboardData();
  }, [status, fetchDashboardData]);

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
    return Object.keys(stats.stageBreakdown).map((key) => ({
      name: stageLabels[key] || key,
      count: stats.stageBreakdown[key] || 0,
    }));
  };

  // Recharts: Deal value chart data
  const getDealValueChartData = () => {
    return deals
      .slice(0, 6)
      .map((d) => ({
        name: d.brandName?.length > 10 ? `${d.brandName.substring(0, 10)}...` : d.brandName,
        value: Number(d.amount) || 0,
      }))
      .reverse();
  };

  // Render Performance Rating Badge
  const renderRatingBadge = (rating: string) => {
    switch (rating) {
      case 'HIGH':
        return (
          <Badge variant="deal-completed" dot className="text-[10px]">
            🟢 High Performance
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="deal-negotiating" dot className="text-[10px]">
            🟡 Avg Performance
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="deal-disputed" dot className="text-[10px]">
            🔴 Low Performance
          </Badge>
        );
      default:
        return (
          <Badge variant="deal-draft" dot className="text-[10px]">
            No ratings yet
          </Badge>
        );
    }
  };

  return (
    <div className="relative animate-fade-in space-y-8 pb-16">
      {/* Premium Radial Purple Glow Header */}
      <GlowBackground glowPosition="top-left" intensity="medium" animated />

      {/* Page Header */}
      <div className="relative z-10 flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-white">
            <span className="inline-flex rounded-xl bg-primary-muted p-2 shadow-glow-sm">
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
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <LayoutDashboard className="h-12 w-12 text-primary/40 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Welcome to DEALOS</h2>
          <p className="text-foreground-muted text-sm mb-6">
            Create your first brand deal to see your dashboard come alive.
          </p>
          <Button onClick={() => router.push('/deals?new=true')} className="mb-8">
            + Create First Deal
          </Button>
          
          <Card variant="glass" className="border-border/40 max-w-sm w-full mx-auto p-4 text-left">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Instagram className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Connect Instagram</h4>
                <p className="text-xs text-foreground-muted mt-1 mb-3">
                  Automatically sync your posts and engagement metrics.
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push('/performance')}>
                  Go to Performance
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* StatBand: Premium Gradient summary band */}
          <section aria-label="Key performance metrics" className="relative z-10">
            <div className="to-accent-muted/10 grid grid-cols-2 gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary-muted/15 p-5 shadow-glow-sm lg:grid-cols-5">
              {/* Active Deals */}
              <div className="space-y-1 p-2.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Active Deals
                </span>
                <span className="block text-3xl font-extrabold tracking-tight text-white">
                  {stats?.activeDeals || 0}
                </span>
                <span className="block text-xs text-foreground-muted">In progress</span>
              </div>

              {/* Monthly Contracted Value */}
              <div className="space-y-1 p-2.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Monthly Value
                </span>
                <span className="block text-3xl font-extrabold tracking-tight text-white">
                  {formatCurrency(stats?.monthlyContractedValue || 0)}
                </span>
                <span className="block text-xs text-foreground-muted">Contracted this month</span>
              </div>

              {/* Flagged Clauses */}
              <div className="space-y-1 p-2.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Flagged Clauses
                </span>
                <span className="block flex items-center gap-1.5 text-3xl font-extrabold tracking-tight text-white">
                  {stats?.flaggedClauseCount || 0}
                  {stats?.flaggedClauseCount > 0 && (
                    <ShieldAlert className="h-5 w-5 animate-pulse text-rose-500" />
                  )}
                </span>
                <span className="block text-xs text-foreground-muted">Requires review</span>
              </div>

              {/* Overdue Invoices */}
              <div className="space-y-1 p-2.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Overdue Invoices
                </span>
                <span className="block text-3xl font-extrabold tracking-tight text-rose-500 text-white">
                  {stats?.overdueInvoices || 0}
                </span>
                <span className="block text-xs text-foreground-muted">Awaiting payment</span>
              </div>

              {/* Average CPV */}
              <div className="col-span-2 space-y-1 p-2.5 lg:col-span-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Avg. CPV
                </span>
                <span className="block font-mono text-3xl font-extrabold tracking-tight text-white">
                  {stats?.avgCpv !== null && stats?.avgCpv !== undefined
                    ? `$${stats.avgCpv.toFixed(3)}`
                    : 'N/A'}
                </span>
                <span className="block text-xs text-foreground-muted">Cost per view</span>
              </div>
            </div>
          </section>

          {/* Recharts Visualizations Grid */}
          <section
            aria-label="Visual analytics"
            className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {/* Pipeline Stages */}
            <Card variant="glass" className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-foreground-muted">
                  <Handshake className="h-4 w-4 text-primary" /> CRM Pipeline Stage Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Deals distribution across Kanban stages
                </CardDescription>
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
                <CardTitle className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-foreground-muted">
                  <DollarSign className="h-4 w-4 text-primary" /> Recent Campaign Valuations
                </CardTitle>
                <CardDescription className="text-xs">
                  Valuation breakdown of your latest 6 deals
                </CardDescription>
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
                        formatter={(value: any) => [
                          `$${Number(value || 0).toLocaleString()}`,
                          'Value',
                        ]}
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
                  <div className="flex h-full items-center justify-center text-xs text-foreground-subtle">
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
                <p className="text-xs text-foreground-muted">
                  Overview of metrics, invoices, and performance ratings per deal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {deals
                .filter((d) => d.stage === 'ACTIVE')
                .slice(0, 6)
                .map((deal) => {
                  const views = deal.computed?.views || 0;
                  const er = deal.computed?.engagementRate || 0;
                  const cpv = deal.computed?.avgCpv;
                  const rating = deal.computed?.performanceRating || 'NONE';

                  return (
                    <Card
                      key={deal.id}
                      variant="glass"
                      className="border-border/40 transition-all duration-150 hover:border-primary/30"
                    >
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border/20 pb-3">
                        <div>
                          <CardTitle className="max-w-[180px] truncate text-base text-white">
                            {deal.title}
                          </CardTitle>
                          <CardDescription className="text-xs">{deal.brandName}</CardDescription>
                        </div>
                        <Badge variant="deal-active" className="text-[10px]">
                          Active
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-3.5 pt-4">
                        {/* Rating Banner */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground-muted">
                            AI Performance Rating:
                          </span>
                          {renderRatingBadge(rating)}
                        </div>

                        {/* Computed stats */}
                        <div className="grid grid-cols-3 gap-2 border-b border-t border-border/10 py-2.5 text-center">
                          <div className="space-y-0.5">
                            <span className="block text-[10px] uppercase text-foreground-subtle">
                              Views
                            </span>
                            <span className="font-mono text-sm font-semibold text-white">
                              {views.toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-[10px] uppercase text-foreground-subtle">
                              ER
                            </span>
                            <span className="font-mono text-sm font-semibold text-white">
                              {er.toFixed(2)}%
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-[10px] uppercase text-foreground-subtle">
                              CPV
                            </span>
                            <span className="font-mono text-sm font-semibold text-white">
                              {cpv !== null && cpv !== undefined ? `$${cpv.toFixed(3)}` : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Details & Invoices */}
                        <div className="space-y-2 text-xs text-foreground-muted">
                          <div className="flex justify-between">
                            <span>Deal Value:</span>
                            <span className="font-semibold text-white">
                              {formatCurrency(Number(deal.amount))}
                            </span>
                          </div>
                          {deal.deadline && (
                            <div className="flex justify-between">
                              <span>Deadline:</span>
                              <span className="flex items-center gap-1 text-white">
                                <Clock className="h-3 w-3" />
                                {new Date(deal.deadline).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Invoices:</span>
                            <span className="font-semibold text-white">
                              {deal.invoices && deal.invoices.length > 0 ? (
                                <Badge
                                  variant={
                                    dealStatusVariant[
                                      deal.invoices[0].status as keyof typeof dealStatusVariant
                                    ]
                                  }
                                  className="px-1.5 py-0.5 text-[9px]"
                                >
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

              {deals.filter((d) => d.stage === 'ACTIVE').length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-border/20 bg-background-surface/30 py-12 text-center text-foreground-muted">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-foreground-subtle" />
                  <p className="text-base font-semibold text-white">No active deals right now</p>
                  <p className="mx-auto mt-1 max-w-xs text-xs">
                    Once you update a deal stage to &quot;Active&quot; in the CRM, it will appear
                    here with live metrics.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Deadlines & Recent Performance */}
          <section aria-label="Dashboard widgets" className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 mt-8 mb-8">
            {/* Upcoming Deadlines */}
            <Card variant="glass" className="border-border/40 flex flex-col">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="flex items-center gap-1.5 text-base font-bold text-white">
                  <Clock className="h-4 w-4 text-primary" /> Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                {(() => {
                  const upcoming = deals.flatMap((d) => 
                    (d.deliverables || [])
                      .filter((del: any) => !['SUBMITTED', 'APPROVED'].includes(del.status))
                      .map((del: any) => ({
                        ...del,
                        dealTitle: d.title,
                        brandName: d.brandName,
                        type: 'deliverable'
                      }))
                  );
                  const upcomingInvoices = deals.flatMap((d) => 
                    (d.invoices || [])
                      .filter((inv: any) => inv.status !== 'PAID' && inv.status !== 'DRAFT')
                      .map((inv: any) => ({
                        ...inv,
                        dealTitle: d.title,
                        brandName: d.brandName,
                        dueDate: inv.dueDate || inv.createdAt,
                        type: 'invoice'
                      }))
                  );
                  const combined = [...upcoming, ...upcomingInvoices]
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 5);

                  if (combined.length === 0) {
                    return (
                      <div className="flex h-32 flex-col items-center justify-center text-center">
                        <Inbox className="h-8 w-8 text-foreground-subtle mb-2" />
                        <p className="text-sm font-medium text-white">No Upcoming Deadlines</p>
                        <p className="text-xs text-foreground-muted mt-1">You are all caught up!</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {combined.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between border-b border-border/10 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.dealTitle}</p>
                            <p className="text-xs text-foreground-muted">{item.type === 'invoice' ? 'Invoice Due' : 'Deliverable Due'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-primary">
                              {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Recent Performance */}
            <Card variant="glass" className="border-border/40 flex flex-col">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="flex items-center gap-1.5 text-base font-bold text-white">
                  <TrendingUp className="h-4 w-4 text-primary" /> Recent Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                {(() => {
                  const logs = deals.flatMap((d) => 
                    (d.performanceLogs || []).map((log: any) => ({
                      ...log,
                      dealTitle: d.title,
                      brandName: d.brandName
                    }))
                  ).sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()).slice(0, 5);

                  if (logs.length === 0) {
                    return (
                      <div className="flex h-32 flex-col items-center justify-center text-center">
                        <TrendingUp className="h-8 w-8 text-foreground-subtle mb-2 opacity-50" />
                        <p className="text-sm font-medium text-white">No Recent Performance</p>
                        <p className="text-xs text-foreground-muted mt-1">Log performance metrics to see them here.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {logs.map((log: any, idx) => (
                        <div key={idx} className="flex items-start justify-between border-b border-border/10 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold text-white">{log.dealTitle}</p>
                            <p className="text-xs text-foreground-muted">{log.platform || 'General'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-primary">
                              {log.metrics?.views?.toLocaleString() || 0} Views
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </section>

          {/* Upcoming Alert Banner */}
          {deals.filter((d) => d.stage === 'ACTIVE' && d.deadline).length > 0 && (
            <section aria-label="Upcoming deadlines notice" className="relative z-10">
              <Card variant="glass" className="border-warning/30 bg-warning-muted/15 p-5">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning-muted/20 text-warning">
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Review active campaigns
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                      Make sure you deliver all content and submit invoices for active campaigns
                      before the contract end dates.
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
