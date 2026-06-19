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
  Instagram,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { performanceApi, dealsApi, instagramApi } from '@/lib/api-client';

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
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken;

  // Data states
  const [logs, setLogs] = React.useState<any[]>([]);
  const [averages, setAverages] = React.useState<any>(null);
  const [deals, setDeals] = React.useState<any[]>([]);

  const [igStatus, setIgStatus] = React.useState<any>(null);
  const [igSyncing, setIgSyncing] = React.useState(false);

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
    if (!accessToken) { setLoading(false); return; }
    try {
      const [logsData, averagesData, dealsData] = await Promise.all([
        performanceApi.getAll(accessToken),
        performanceApi.getAverages(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      const igData = await instagramApi.getStatus(accessToken).catch(() => null);
      
      setLogs(logsData);
      setAverages(averagesData);
      setDeals(dealsData);
      setIgStatus(igData);
    } catch (err) {
      console.error('Error fetching performance data:', err);
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

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const igParam = params.get('ig');
    if (igParam) {
      if (igParam === 'connected') {
        alert('Instagram connected successfully!');
      } else if (igParam === 'denied') {
        alert('Instagram connection denied.');
      } else if (igParam === 'error') {
        alert('Error connecting Instagram.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleIgSync = async () => {
    if (!accessToken) return;
    setIgSyncing(true);
    try {
      await instagramApi.sync(accessToken);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIgSyncing(false);
    }
  };

  const handleIgDisconnect = async () => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to disconnect Instagram?')) return;
    try {
      await instagramApi.disconnect(accessToken);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

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
    if (!accessToken) { setLoading(false); return; }

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
    if (!accessToken) { setLoading(false); return; }
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c) => {
          const data = averages[c.key] || {
            avgViews: 0,
            avgEngagementRate: 0,
            avgCpv: null,
            totalPosts: 0,
          };
          return (
            <Card
              key={c.key}
              variant="glass"
              className="group relative overflow-hidden border-border/40"
            >
              <div className="absolute right-0 top-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                <TrendingUp className="h-14 w-14 text-primary" />
              </div>
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {c.label}
                </span>
                <CardTitle className="mt-1 font-mono text-2xl font-extrabold text-white">
                  {Math.round(data.avgViews).toLocaleString()}{' '}
                  <span className="font-sans text-xs font-medium text-foreground-muted">
                    avg views
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs">
                <div className="flex justify-between border-t border-border/20 pt-2 text-foreground-muted">
                  <span>Engagement Rate:</span>
                  <span className="font-mono font-semibold text-white">
                    {data.avgEngagementRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-foreground-muted">
                  <span>Avg CPV:</span>
                  <span className="font-mono font-semibold text-white">
                    {data.avgCpv !== null ? `$${data.avgCpv.toFixed(3)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-foreground-muted">
                  <span>Total Posts:</span>
                  <span className="font-mono font-semibold text-white">{data.totalPosts}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative animate-fade-in space-y-8 pb-16">
      <GlowBackground glowPosition="top-left" intensity="subtle" animated />

      {/* Header */}
      <div className="relative z-10 flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-white">
            <span className="inline-flex rounded-xl bg-primary-muted p-2 shadow-glow-sm">
              <LineChart className="h-6 w-6 text-primary" />
            </span>
            Performance Logs
          </h1>
          <p className="mt-2 text-foreground-muted">
            Log your post performance metrics to compute engagement rates, CPV, and rolling
            averages.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          variant="primary"
          className="gap-1.5 self-start text-sm font-semibold shadow-glow-sm sm:self-center"
        >
          <Plus className="h-4 w-4" /> Add Post Log
        </Button>
      </div>

      {/* Instagram Banner */}
      <div className="relative z-10">
        <Card variant="glass" className="border-border/40 overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-3 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
            <Instagram className="h-24 w-24 text-primary" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white shadow-glow-sm flex-shrink-0">
                  {igStatus?.profilePicUrl ? (
                    <img src={igStatus.profilePicUrl} alt="IG" className="h-11 w-11 rounded-full object-cover border-2 border-background" />
                  ) : (
                    <Instagram className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {igStatus?.connected ? (
                      <>@{igStatus.username} <Badge variant="deal-active" className="px-1.5 py-0 text-[10px]">Connected</Badge></>
                    ) : (
                      'Connect Instagram'
                    )}
                  </h3>
                  <p className="text-sm text-foreground-muted mt-0.5">
                    {igStatus?.connected 
                      ? `${(igStatus.followersCount || 0).toLocaleString()} followers • ${(igStatus.mediaCount || 0).toLocaleString()} posts`
                      : 'Automatically sync your latest posts, reach, and engagement metrics.'}
                  </p>
                  {igStatus?.connected && igStatus.lastSyncedAt && (
                    <p className="text-[10px] text-foreground-subtle mt-1.5">
                      Last synced: {new Date(igStatus.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {igStatus?.connected ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleIgDisconnect} className="text-xs">
                      Disconnect
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleIgSync} disabled={igSyncing} className="gap-1.5 text-xs shadow-glow-sm">
                      {igSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      {igSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" onClick={() => accessToken && instagramApi.connect(accessToken)} className="gap-1.5 shadow-glow-sm">
                    <Instagram className="h-4 w-4" /> Connect Account
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rolling averages */}
      <div className="relative z-10">{renderAverages()}</div>

      {/* Performance Log Table */}
      <div className="relative z-10">
        <Card variant="glass" className="overflow-hidden border-border/40">
          <CardContent className="p-0">
            {logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-background-surface/40 font-semibold text-foreground-muted">
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
                    {logs.map((log) => {
                      const metrics = log.metrics || {};
                      const postDate = new Date(log.recordedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const deal = deals.find((d) => d.id === log.dealId);

                      return (
                        <tr
                          key={log.id}
                          className="group transition-colors duration-150 hover:bg-background-elevated/40"
                        >
                          <td className="p-4">
                            <div className="max-w-[200px] space-y-1">
                              <div className="flex items-center gap-1.5 font-medium text-white">
                                <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
                                {postDate}
                              </div>
                              {log.contentUrl && (
                                <a
                                  href={log.contentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-0.5 truncate text-xs text-primary hover:underline"
                                >
                                  Visit post <ExternalLink className="inline h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold uppercase tracking-wider text-white">
                                {log.platform}
                              </div>
                              <div className="text-xs text-foreground-muted">
                                {(metrics.contentFormat || log.contentFormat || '').replace(
                                  /_/g,
                                  ' ',
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono font-semibold text-white">
                            {(metrics.views ?? 0).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="space-y-0.5">
                              <div className="font-mono font-semibold text-white">
                                {(metrics.engagementRate ?? 0).toFixed(2)}%
                              </div>
                              <div className="text-[10px] text-foreground-muted">
                                {metrics.likes + metrics.comments} engagements
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono font-semibold text-white">
                            {metrics.cpv !== null ? `$${metrics.cpv.toFixed(3)}` : '—'}
                          </td>
                          <td className="p-4">
                            {metrics.isPaid ? (
                              <div className="space-y-1">
                                <Badge variant="deal-completed" className="px-2 py-0.5 text-[10px]">
                                  Paid Sponsored
                                </Badge>
                                {deal && (
                                  <div className="flex items-center gap-0.5 text-[10px] text-foreground-muted">
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
                            <div className="inline-flex gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => handleOpenEdit(log)}
                                className="rounded-lg border border-border bg-input/40 p-1.5 text-foreground-muted transition-all hover:border-primary/40 hover:bg-background-elevated hover:text-white"
                                aria-label="Edit post log"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(log.id)}
                                className="rounded-lg border border-border bg-input/40 p-1.5 text-foreground-muted transition-all hover:border-danger/40 hover:bg-danger-muted/20 hover:text-danger"
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
                <BarChart3 className="mx-auto mb-3 h-10 w-10 text-foreground-subtle" />
                <p className="text-base font-semibold text-white">No performance logs found</p>
                <p className="mx-auto mt-1 max-w-xs text-xs mb-4">
                  Add your first post performance metrics to start tracking benchmarks and
                  engagement rates.
                </p>
                <Button onClick={handleOpenAdd} variant="primary" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Log First Post
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slide-over Form Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setPanelOpen(false)}
          />

          {/* Form Container */}
          <div className="relative z-10 flex h-full w-full max-w-md animate-slide-in-right flex-col border-l border-border/60 bg-background-overlay shadow-float-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 p-5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingLog ? 'Edit Performance Log' : 'New Performance Log'}
                </h3>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {editingLog
                    ? 'Update the details for this post.'
                    : 'Add views and engagement metrics.'}
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-lg p-1.5 text-foreground-muted transition-all hover:bg-background-elevated hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Platform & Format in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="form-platform"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Platform
                  </label>
                  <select
                    id="form-platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="form-format"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Format
                  </label>
                  <select
                    id="form-format"
                    value={contentFormat}
                    onChange={(e) => setContentFormat(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recorded At Date */}
              <div className="space-y-1.5">
                <label
                  htmlFor="form-date"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Post Date
                </label>
                <input
                  id="form-date"
                  type="date"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Core Metrics Grid */}
              <div className="space-y-3 rounded-xl border border-border/45 bg-background/30 p-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-white">
                  Views & Engagements
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="form-views"
                      className="text-[10px] font-semibold uppercase text-foreground-muted"
                    >
                      Views
                    </label>
                    <input
                      id="form-views"
                      type="number"
                      min="0"
                      value={views}
                      onChange={(e) => setViews(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="form-likes"
                      className="text-[10px] font-semibold uppercase text-foreground-muted"
                    >
                      Likes
                    </label>
                    <input
                      id="form-likes"
                      type="number"
                      min="0"
                      value={likes}
                      onChange={(e) => setLikes(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="form-comments"
                      className="text-[10px] font-semibold uppercase text-foreground-muted"
                    >
                      Comments
                    </label>
                    <input
                      id="form-comments"
                      type="number"
                      min="0"
                      value={comments}
                      onChange={(e) => setComments(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="form-saves"
                      className="text-[10px] font-semibold uppercase text-foreground-muted"
                    >
                      Saves
                    </label>
                    <input
                      id="form-saves"
                      type="number"
                      min="0"
                      value={saves}
                      onChange={(e) => setSaves(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="form-shares"
                      className="text-[10px] font-semibold uppercase text-foreground-muted"
                    >
                      Shares
                    </label>
                    <input
                      id="form-shares"
                      type="number"
                      min="0"
                      value={shares}
                      onChange={(e) => setShares(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="form-watchtime"
                      className="text-[10px] font-semibold uppercase text-foreground-muted"
                    >
                      Watch Time %
                    </label>
                    <input
                      id="form-watchtime"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 65"
                      value={watchTimePercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWatchTimePercent(
                          val === '' ? '' : Math.min(100, Math.max(0, parseInt(val, 10) || 0)),
                        );
                      }}
                      className="w-full rounded border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Paid sponsorship toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border/45 bg-background/30 p-3.5">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-white">
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
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    isPaid ? 'bg-primary' : 'bg-border',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      isPaid ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Paid Deal parameters */}
              {isPaid && (
                <div className="animate-fade-in space-y-4 rounded-xl border border-primary/20 bg-primary-muted/10 p-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-deal"
                      className="text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      Link Brand Deal
                    </label>
                    <select
                      id="form-deal"
                      value={dealId}
                      onChange={(e) => setDealId(e.target.value)}
                      className="w-full cursor-pointer rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">-- Select Deal --</option>
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.brandName} - {d.title} (${Number(d.amount).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-brand-category"
                      className="text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      Brand Category
                    </label>
                    <input
                      id="form-brand-category"
                      type="text"
                      placeholder="e.g. Finance, Gaming"
                      value={brandCategory}
                      onChange={(e) => setBrandCategory(e.target.value)}
                      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {/* Content URL */}
              <div className="space-y-1.5">
                <label
                  htmlFor="form-url"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Post Content URL
                </label>
                <input
                  id="form-url"
                  type="url"
                  placeholder="https://instagram.com/p/..."
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="form-notes"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Notes
                </label>
                <textarea
                  id="form-notes"
                  rows={3}
                  placeholder="Add any internal notes about targeting, pacing, or remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {formError && (
                <div className="rounded border border-danger/20 bg-danger-muted p-2.5 text-xs font-medium text-danger">
                  {formError}
                </div>
              )}

              {/* Footer CTA */}
              <div className="flex gap-3 border-t border-border/40 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 bg-input py-2.5 text-sm hover:bg-background-elevated"
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
