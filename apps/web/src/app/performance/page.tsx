/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Eye,
  Link2,
  X,
  TrendingUp,
  BarChart3,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { performanceApi, dealsApi } from '@/lib/api-client';

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'Twitter' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'TWITCH', label: 'Twitch' },
  { value: 'PINTEREST', label: 'Pinterest' },
  { value: 'PODCAST', label: 'Podcast' },
];

const FORMATS = [
  { value: 'SHORT_FORM_VIDEO', label: 'Short-form Video' },
  { value: 'LONG_FORM_VIDEO', label: 'Long-form Video' },
  { value: 'STATIC_IMAGE', label: 'Static Image' },
  { value: 'CAROUSEL', label: 'Carousel' },
  { value: 'STORIES', label: 'Stories' },
  { value: 'LIVE_STREAM', label: 'Live Stream' },
  { value: 'PODCAST', label: 'Podcast' },
  { value: 'BLOG_ARTICLE', label: 'Blog Article' },
  { value: 'NEWSLETTER', label: 'Newsletter' },
  { value: 'UGC_RAW_FOOTAGE', label: 'UGC Raw Footage' },
];

export default function PerformancePage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  // Data states
  const [logs, setLogs] = React.useState<any[]>([]);
  const [averages, setAverages] = React.useState<any>(null);
  const [deals, setDeals] = React.useState<any[]>([]);

  // UI Panel states
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingLog, setEditingLog] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Form Field states
  const [platform, setPlatform] = React.useState('INSTAGRAM');
  const [contentFormat, setContentFormat] = React.useState('SHORT_FORM_VIDEO');
  const [recordedAt, setRecordedAt] = React.useState(new Date().toISOString().split('T')[0]);
  const [contentUrl, setContentUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [views, setViews] = React.useState(0);
  const [likes, setLikes] = React.useState(0);
  const [comments, setComments] = React.useState(0);
  const [saves, setSaves] = React.useState(0);
  const [shares, setShares] = React.useState(0);
  const [watchTimePercent, setWatchTimePercent] = React.useState<number | ''>('');
  const [isPaid, setIsPaid] = React.useState(false);
  const [dealId, setDealId] = React.useState('');
  const [brandCategory, setBrandCategory] = React.useState('');

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const [logsData, averagesData, dealsData] = await Promise.all([
        performanceApi.getAll(accessToken),
        performanceApi.getAverages(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      setLogs(logsData);
      setAverages(averagesData);
      setDeals(dealsData);
    } catch (err) {
      console.error('Error fetching performance data:', err);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Panel for Add
  const handleOpenAdd = () => {
    setEditingLog(null);
    setPlatform('INSTAGRAM');
    setContentFormat('SHORT_FORM_VIDEO');
    setRecordedAt(new Date().toISOString().split('T')[0]);
    setContentUrl('');
    setNotes('');
    setViews(0);
    setLikes(0);
    setComments(0);
    setSaves(0);
    setShares(0);
    setWatchTimePercent('');
    setIsPaid(false);
    setDealId('');
    setBrandCategory('');
    setFormError(null);
    setPanelOpen(true);
  };

  // Open Panel for Edit
  const handleOpenEdit = (log: any) => {
    setEditingLog(log);
    const metrics = log.metrics || {};
    setPlatform(log.platform || 'INSTAGRAM');
    setContentFormat(metrics.contentFormat || log.contentFormat || 'SHORT_FORM_VIDEO');
    setRecordedAt(new Date(log.recordedAt).toISOString().split('T')[0]);
    setContentUrl(log.contentUrl || '');
    setNotes(log.notes || '');
    setViews(metrics.views || 0);
    setLikes(metrics.likes || 0);
    setComments(metrics.comments || 0);
    setSaves(metrics.saves || 0);
    setShares(metrics.shares || 0);
    setWatchTimePercent(metrics.watchTimePercent !== null ? metrics.watchTimePercent : '');
    setIsPaid(metrics.isPaid || false);
    setDealId(log.dealId || '');
    setBrandCategory(metrics.brandCategory || '');
    setFormError(null);
    setPanelOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (isPaid) {
      if (!dealId) {
        setFormError('Deal link is required for paid/sponsored posts.');
        return;
      }
      if (!brandCategory.trim()) {
        setFormError('Brand category is required for paid/sponsored posts.');
        return;
      }
    }

    setLoading(true);
    setFormError(null);

    const payload = {
      platform,
      contentFormat,
      recordedAt: new Date(recordedAt).toISOString(),
      contentUrl: contentUrl || undefined,
      notes: notes || undefined,
      views,
      likes,
      comments,
      saves,
      shares,
      watchTimePercent: watchTimePercent !== '' ? Number(watchTimePercent) : undefined,
      isPaid,
      dealId: isPaid ? dealId : undefined,
      brandCategory: isPaid ? brandCategory : undefined,
    };

    try {
      if (editingLog) {
        await performanceApi.update(accessToken, editingLog.id, payload);
      } else {
        await performanceApi.create(accessToken, payload);
      }
      setPanelOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save performance log');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Log
  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this performance log?')) return;

    try {
      await performanceApi.delete(accessToken, id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete performance log:', err);
    }
  };

  // Render Average Cards
  const renderAverages = () => {
    if (!averages) return null;

    const cards = [
      { key: 'rolling30', label: 'Rolling 30 Days' },
      { key: 'rolling60', label: 'Rolling 60 Days' },
      { key: 'rolling90', label: 'Rolling 90 Days' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(c => {
          const data = averages[c.key] || { avgViews: 0, avgEngagementRate: 0, avgCpv: null, totalPosts: 0 };
          return (
            <Card key={c.key} variant="glass" className="border-border/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="h-14 w-14 text-primary" />
              </div>
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-widest">{c.label}</span>
                <CardTitle className="text-2xl font-extrabold text-white font-mono mt-1">
                  {Math.round(data.avgViews).toLocaleString()} <span className="text-xs font-medium text-foreground-muted font-sans">avg views</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 text-xs">
                <div className="flex justify-between border-t border-border/20 pt-2 text-foreground-muted">
                  <span>Engagement Rate:</span>
                  <span className="font-semibold text-white font-mono">{data.avgEngagementRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-foreground-muted">
                  <span>Avg CPV:</span>
                  <span className="font-semibold text-white font-mono">
                    {data.avgCpv !== null ? `$${data.avgCpv.toFixed(3)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-foreground-muted">
                  <span>Total Posts:</span>
                  <span className="font-semibold text-white font-mono">{data.totalPosts}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative space-y-8 animate-fade-in pb-16">
      <GlowBackground glowPosition="top-left" intensity="subtle" animated />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-muted inline-flex shadow-glow-sm">
              <LineChart className="h-6 w-6 text-primary" />
            </span>
            Performance Logs
          </h1>
          <p className="mt-2 text-foreground-muted">
            Log your post performance metrics to compute engagement rates, CPV, and rolling averages.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          variant="primary"
          className="gap-1.5 font-semibold text-sm shadow-glow-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" /> Add Post Log
        </Button>
      </div>

      {/* Rolling averages */}
      <div className="relative z-10">
        {renderAverages()}
      </div>

      {/* Performance Log Table */}
      <div className="relative z-10">
        <Card variant="glass" className="border-border/40 overflow-hidden">
          <CardContent className="p-0">
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-background-surface/40 text-foreground-muted font-semibold">
                      <th className="p-4">Date / Post</th>
                      <th className="p-4">Platform & Format</th>
                      <th className="p-4 text-right">Views</th>
                      <th className="p-4 text-right">Engagement</th>
                      <th className="p-4 text-right">CPV</th>
                      <th className="p-4">Deal Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {logs.map(log => {
                      const metrics = log.metrics || {};
                      const postDate = new Date(log.recordedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      const deal = deals.find(d => d.id === log.dealId);

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-background-elevated/40 transition-colors duration-150 group"
                        >
                          <td className="p-4">
                            <div className="space-y-1 max-w-[200px]">
                              <div className="flex items-center gap-1.5 text-white font-medium">
                                <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
                                {postDate}
                              </div>
                              {log.contentUrl && (
                                <a
                                  href={log.contentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-0.5 truncate"
                                >
                                  Visit post <ExternalLink className="h-3 w-3 inline" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="text-white text-xs font-semibold uppercase tracking-wider">
                                {log.platform}
                              </div>
                              <div className="text-xs text-foreground-muted">
                                {(metrics.contentFormat || log.contentFormat || '').replace(/_/g, ' ')}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono text-white font-semibold">
                            {(metrics.views ?? 0).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="space-y-0.5">
                              <div className="font-mono text-white font-semibold">
                                {(metrics.engagementRate ?? 0).toFixed(2)}%
                              </div>
                              <div className="text-[10px] text-foreground-muted">
                                {metrics.likes + metrics.comments} engagements
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono text-white font-semibold">
                            {metrics.cpv !== null ? `$${metrics.cpv.toFixed(3)}` : '—'}
                          </td>
                          <td className="p-4">
                            {metrics.isPaid ? (
                              <div className="space-y-1">
                                <Badge variant="deal-completed" className="px-2 py-0.5 text-[10px]">
                                  Paid Sponsored
                                </Badge>
                                {deal && (
                                  <div className="text-[10px] text-foreground-muted flex items-center gap-0.5">
                                    <Link2 className="h-2.5 w-2.5" /> {deal.brandName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="deal-draft" className="px-2 py-0.5 text-[10px]">
                                Organic / Free
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEdit(log)}
                                className="p-1.5 rounded-lg border border-border bg-input/40 hover:bg-background-elevated hover:border-primary/40 text-foreground-muted hover:text-white transition-all"
                                aria-label="Edit post log"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(log.id)}
                                className="p-1.5 rounded-lg border border-border bg-input/40 hover:bg-danger-muted/20 hover:border-danger/40 text-foreground-muted hover:text-danger transition-all"
                                aria-label="Delete post log"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-foreground-muted">
                <BarChart3 className="h-10 w-10 text-foreground-subtle mx-auto mb-3" />
                <p className="text-base font-semibold text-white">No performance logs found</p>
                <p className="text-xs max-w-xs mx-auto mt-1">
                  Add your first post performance metrics to start tracking benchmarks and engagement rates.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slide-over Form Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setPanelOpen(false)}
          />

          {/* Form Container */}
          <div className="relative w-full max-w-md bg-background-overlay border-l border-border/60 shadow-float-lg h-full flex flex-col z-10 animate-slide-in-right">
            {/* Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingLog ? 'Edit Performance Log' : 'New Performance Log'}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {editingLog ? 'Update the details for this post.' : 'Add views and engagement metrics.'}
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-muted hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Platform & Format in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="form-platform" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Platform
                  </label>
                  <select
                    id="form-platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-format" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Format
                  </label>
                  <select
                    id="form-format"
                    value={contentFormat}
                    onChange={(e) => setContentFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                  >
                    {FORMATS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recorded At Date */}
              <div className="space-y-1.5">
                <label htmlFor="form-date" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Post Date
                </label>
                <input
                  id="form-date"
                  type="date"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Core Metrics Grid */}
              <div className="space-y-3 p-4 rounded-xl border border-border/45 bg-background/30">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Views & Engagements
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="form-views" className="text-[10px] font-semibold text-foreground-muted uppercase">Views</label>
                    <input
                      id="form-views"
                      type="number"
                      min="0"
                      value={views}
                      onChange={(e) => setViews(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="form-likes" className="text-[10px] font-semibold text-foreground-muted uppercase">Likes</label>
                    <input
                      id="form-likes"
                      type="number"
                      min="0"
                      value={likes}
                      onChange={(e) => setLikes(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="form-comments" className="text-[10px] font-semibold text-foreground-muted uppercase">Comments</label>
                    <input
                      id="form-comments"
                      type="number"
                      min="0"
                      value={comments}
                      onChange={(e) => setComments(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="form-saves" className="text-[10px] font-semibold text-foreground-muted uppercase">Saves</label>
                    <input
                      id="form-saves"
                      type="number"
                      min="0"
                      value={saves}
                      onChange={(e) => setSaves(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="form-shares" className="text-[10px] font-semibold text-foreground-muted uppercase">Shares</label>
                    <input
                      id="form-shares"
                      type="number"
                      min="0"
                      value={shares}
                      onChange={(e) => setShares(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="form-watchtime" className="text-[10px] font-semibold text-foreground-muted uppercase">Watch Time %</label>
                    <input
                      id="form-watchtime"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 65"
                      value={watchTimePercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWatchTimePercent(val === '' ? '' : Math.min(100, Math.max(0, parseInt(val, 10) || 0)));
                      }}
                      className="w-full px-3 py-1.5 rounded bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Paid sponsorship toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/45 bg-background/30">
                <div>
                  <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                    Paid Sponsorship
                  </span>
                  <span className="text-[10px] text-foreground-muted">
                    This post is sponsored by a brand deal.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaid(!isPaid)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    isPaid ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      isPaid ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Paid Deal parameters */}
              {isPaid && (
                <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary-muted/10 animate-fade-in">
                  <div className="space-y-1.5">
                    <label htmlFor="form-deal" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Link Brand Deal
                    </label>
                    <select
                      id="form-deal"
                      value={dealId}
                      onChange={(e) => setDealId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <option value="">-- Select Deal --</option>
                      {deals.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.brandName} - {d.title} (${Number(d.amount).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-brand-category" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Brand Category
                    </label>
                    <input
                      id="form-brand-category"
                      type="text"
                      placeholder="e.g. Finance, Gaming"
                      value={brandCategory}
                      onChange={(e) => setBrandCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {/* Content URL */}
              <div className="space-y-1.5">
                <label htmlFor="form-url" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Post Content URL
                </label>
                <input
                  id="form-url"
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-foreground-subtle"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="form-notes" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  id="form-notes"
                  rows={3}
                  placeholder="Add any internal notes about targeting, pacing, or remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-foreground-subtle resize-none"
                />
              </div>

              {formError && (
                <div className="text-xs text-danger font-medium p-2.5 rounded bg-danger-muted border border-danger/20">
                  {formError}
                </div>
              )}

              {/* Footer CTA */}
              <div className="pt-4 border-t border-border/40 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 py-2.5 text-sm bg-input hover:bg-background-elevated"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 text-sm"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingLog ? 'Save Changes' : 'Add Post Log'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
