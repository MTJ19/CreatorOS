/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Layers,
  Flame,
  TrendingUp,
  Share2,
  Target,
  Zap,
  Info,
  RefreshCw,
  ChevronRight,
  Filter,
  Check,
  ShieldAlert,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { contentHealthApi } from '@/lib/api-client';

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
  { value: 'TIKTOK', label: 'TikTok', icon: '🎵' },
  { value: 'YOUTUBE', label: 'YouTube', icon: '▶️' },
  { value: 'TWITTER', label: 'X (Twitter)', icon: '𝕏' },
  { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
];

const CONTENT_TYPES = [
  { value: 'REEL', label: 'Reel / Short' },
  { value: 'SHORT', label: 'YouTube Short' },
  { value: 'TIKTOK', label: 'TikTok Video' },
  { value: 'LONG_FORM_VIDEO', label: 'Long-form Video' },
  { value: 'POST', label: 'Post / Carousel' },
];

export default function RetentionPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  // Form State
  const [title, setTitle] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [platform, setPlatform] = React.useState('INSTAGRAM');
  const [contentType, setContentType] = React.useState('REEL');
  const [niche, setNiche] = React.useState('Tech & Software Engineering');
  const [targetAudience, setTargetAudience] = React.useState('Frontend developers, tech creators, junior engineers');
  const [durationSeconds, setDurationSeconds] = React.useState(35);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Active Simulation State
  const [activeRunId, setActiveRunId] = React.useState<string | null>(null);
  const [runStatus, setRunStatus] = React.useState<{
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    completedPersonas: number;
    totalPersonas: number;
    progress: number;
    error?: string;
  } | null>(null);

  // Score and Personas State
  const [scoreData, setScoreData] = React.useState<any | null>(null);
  const [personas, setPersonas] = React.useState<any[]>([]);
  const [selectedSegment, setSelectedSegment] = React.useState<string>('ALL');
  const [recentRuns, setRecentRuns] = React.useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = React.useState<any | null>(null);

  // Polling ref
  const pollTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch recent runs on load
  const fetchRecentRuns = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const runs = await contentHealthApi.getRecentRuns(accessToken);
      setRecentRuns(runs || []);
      // If we don't have an active score displayed, load the latest completed run
      if (!activeRunId && runs && runs.length > 0) {
        const latestCompleted = runs.find((r: any) => r.status === 'COMPLETED' && r.score);
        if (latestCompleted) {
          loadCompletedRun(latestCompleted.id);
        }
      }
    } catch (err) {
      console.error('Failed to load recent runs', err);
    }
  }, [accessToken, activeRunId]);

  React.useEffect(() => {
    fetchRecentRuns();
  }, [fetchRecentRuns]);

  // Load a specific completed run
  const loadCompletedRun = async (runId: string) => {
    if (!accessToken) return;
    try {
      setActiveRunId(runId);
      const [score, personasList] = await Promise.all([
        contentHealthApi.getScore(accessToken, runId),
        contentHealthApi.getPersonaResults(accessToken, runId),
      ]);
      setScoreData(score);
      setPersonas(personasList || []);
      setRunStatus({
        status: 'COMPLETED',
        completedPersonas: personasList?.length || 15,
        totalPersonas: 15,
        progress: 100,
      });
    } catch (err) {
      console.error('Failed to load score data', err);
    }
  };

  // Poll status while simulation is running
  React.useEffect(() => {
    if (!activeRunId || !accessToken) return;
    if (runStatus?.status === 'COMPLETED' || runStatus?.status === 'FAILED') return;

    const poll = async () => {
      try {
        const status = await contentHealthApi.getRunStatus(accessToken, activeRunId);
        setRunStatus(status);

        if (status.status === 'COMPLETED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          const [score, personasList] = await Promise.all([
            contentHealthApi.getScore(accessToken, activeRunId),
            contentHealthApi.getPersonaResults(accessToken, activeRunId),
          ]);
          setScoreData(score);
          setPersonas(personasList || []);
          fetchRecentRuns();
        } else if (status.status === 'FAILED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (err) {
        console.error('Error polling run status', err);
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeRunId, accessToken, runStatus?.status, fetchRecentRuns]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !title.trim()) return;

    setIsSubmitting(true);
    setScoreData(null);
    setPersonas([]);
    setRunStatus(null);

    try {
      const res = await contentHealthApi.analyze(accessToken, {
        title,
        caption,
        platform,
        contentType,
        niche,
        targetAudience,
        durationSeconds: Number(durationSeconds),
      });

      setActiveRunId(res.runId);
      setRunStatus({
        status: 'IN_PROGRESS',
        completedPersonas: 0,
        totalPersonas: 15,
        progress: 5,
      });
    } catch (err: any) {
      console.error('Analysis submission failed', err);
      alert(err.message || 'Failed to start evaluation simulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered personas
  const filteredPersonas = React.useMemo(() => {
    if (selectedSegment === 'ALL') return personas;
    return personas.filter((p) => p.segment === selectedSegment);
  }, [personas, selectedSegment]);

  // Score color helper
  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (val >= 65) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getViralityBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return { label: 'High Virality Potential', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'GOOD':
        return { label: 'Good Virality Potential', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'MODERATE':
        return { label: 'Moderate Virality', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      default:
        return { label: 'Low Virality Risk', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    }
  };

  return (
    <div className="relative min-h-screen pb-16 space-y-8">
      <GlowBackground />

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/20 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Retention AI & Health Studio
            </h1>
            <Badge variant="default" className="ml-2 border border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono text-xs">
              Phase 3 Multi-Agent
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulate 15 dynamic audience personas across Niche, Cold Outsiders & Platform Natives before you publish.
          </p>
        </div>

        {/* Recent Runs Selector */}
        {recentRuns.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">History:</span>
            <select
              value={activeRunId || ''}
              onChange={(e) => loadCompletedRun(e.target.value)}
              className="h-9 rounded-lg border border-border/60 bg-background/80 px-3 text-xs text-foreground backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="" disabled>Select previous run...</option>
              {recentRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.content?.title.slice(0, 32)}... ({r.score?.overallScore ?? '--'}/100)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── LEFT COLUMN: Intake & Configuration Form (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Play className="h-4 w-4 text-purple-400" />
                  Content Intake & Evaluation
                </CardTitle>
                <Badge variant="default" className="text-[10px] text-muted-foreground border border-border/40 bg-background/50">
                  Simulate 15 Personas
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Provide draft hook, script notes, or caption to run algorithmic retention prediction.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Content Title or Working Hook *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 Coding Mistakes Destroying Your Next.js Performance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* Platform Selector */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Platform</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPlatform(p.value)}
                        className={cn(
                          'flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all',
                          platform === p.value
                            ? 'border-purple-500 bg-purple-500/15 text-purple-200 font-medium'
                            : 'border-border/40 bg-background/30 hover:bg-background/60 text-muted-foreground',
                        )}
                      >
                        <span className="text-base mb-0.5">{p.icon}</span>
                        <span className="text-[10px] truncate max-w-full">{p.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Type & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Format</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      {CONTENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1 flex items-center justify-between">
                      <span>Duration</span>
                      <span className="text-purple-400 font-mono">{durationSeconds}s</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={180}
                      step={5}
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
                    />
                  </div>
                </div>

                {/* Niche & Target Audience */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Niche Category</label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g. AI & SaaS"
                      className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Target Persona</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. Solo Founders"
                      className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* Caption / Script Hook */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Caption / Opening Hook Script
                  </label>
                  <textarea
                    rows={4}
                    placeholder="First 3 seconds: 'Stop using React state for this!' Here is the exact architecture change that cut our database bills in half..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Agents evaluate hook clarity, platform retention curve, and drop-off risks from this copy.
                  </p>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-2 shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Dispatching Multi-Agent Workers...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Run Multi-Agent Simulation</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Persona Segment Reference Card */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                Active Evaluation Cohorts (15 Personas)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎯</span>
                  <div>
                    <p className="font-semibold text-purple-300">Niche Audience (5)</p>
                    <p className="text-[10px] text-muted-foreground">Domain specialists who critique technical accuracy & depth.</p>
                  </div>
                </div>
                <Badge variant="default" className="border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px]">33%</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm">❄️</span>
                  <div>
                    <p className="font-semibold text-blue-300">Cold Outsiders (5)</p>
                    <p className="text-[10px] text-muted-foreground">Broad general public sensitive to jargon, pacing & hook clarity.</p>
                  </div>
                </div>
                <Badge variant="default" className="border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">33%</Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <div>
                    <p className="font-semibold text-emerald-300">Platform-Native (5)</p>
                    <p className="text-[10px] text-muted-foreground">Heavy doom-scrollers testing fast payoff, hooks & shareability.</p>
                  </div>
                </div>
                <Badge variant="default" className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">33%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: Simulation Monitor & Results (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Simulation Progress Bar */}
          {runStatus && runStatus.status !== 'COMPLETED' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl border border-purple-500/40 bg-purple-950/20 backdrop-blur-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-purple-200">
                      Multi-Agent Simulation In Progress
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bounded Worker Pool evaluating 15 synthetic audience personas in parallel
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-purple-400">
                  {runStatus.completedPersonas} / {runStatus.totalPersonas} personas
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-background/60 h-2.5 rounded-full overflow-hidden border border-border/40 p-0.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(runStatus.progress, 10)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Concurrency: 15 workers</span>
                <span className="animate-pulse text-purple-300">Evaluating hook window, clarity & shareability...</span>
                <span>{runStatus.progress}%</span>
              </div>
            </motion.div>
          )}

          {/* Results Display */}
          {scoreData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Main Scorecard */}
              <Card className="border-border/60 bg-card/70 backdrop-blur-md overflow-hidden relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border/40">
                    {/* Score Circle & Title */}
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        'flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 shadow-inner font-mono',
                        getScoreColor(scoreData.overallScore)
                      )}>
                        <span className="text-3xl font-bold tracking-tight">{scoreData.overallScore}</span>
                        <span className="text-[10px] uppercase font-sans tracking-wider opacity-80">Health Score</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-foreground">
                            {scoreData.contentTitle}
                          </h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {scoreData.platform} • {scoreData.niche} • Evaluated by {scoreData.evaluatedPersonasCount} synthetic personas
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <Badge variant="default" className={cn('text-xs font-semibold px-2.5 py-0.5 border', getViralityBadge(scoreData.viralityPotential).color)}>
                            <Flame className="h-3 w-3 mr-1" />
                            {getViralityBadge(scoreData.viralityPotential).label}
                          </Badge>
                          <Badge variant="default" className="text-xs border border-border/60 bg-background/50 text-muted-foreground">
                            Median P50: <span className="font-mono font-semibold ml-1 text-foreground">{scoreData.percentiles?.p50 ?? '--'}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Percentile Spread */}
                    <div className="flex items-center gap-4 bg-background/50 p-3 rounded-xl border border-border/50 text-xs">
                      <div className="text-center">
                        <span className="text-[10px] text-muted-foreground block uppercase">P25 Lower</span>
                        <span className="font-mono font-bold text-muted-foreground text-sm">{scoreData.percentiles?.p25}</span>
                      </div>
                      <div className="h-7 w-px bg-border/60" />
                      <div className="text-center">
                        <span className="text-[10px] text-purple-400 block uppercase font-semibold">P50 Median</span>
                        <span className="font-mono font-bold text-purple-300 text-sm">{scoreData.percentiles?.p50}</span>
                      </div>
                      <div className="h-7 w-px bg-border/60" />
                      <div className="text-center">
                        <span className="text-[10px] text-emerald-400 block uppercase font-semibold">P75 Upper</span>
                        <span className="font-mono font-bold text-emerald-300 text-sm">{scoreData.percentiles?.p75}</span>
                      </div>
                    </div>
                  </div>

                  {/* 5 Core Dimensions Breakdown */}
                  <div className="mt-6 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-purple-400" />
                      5 Dimension Evaluation Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {[
                        { label: 'Hook Power', score: scoreData.dimensions?.hook, icon: Zap },
                        { label: 'Engagement', score: scoreData.dimensions?.engagement, icon: TrendingUp },
                        { label: 'Clarity', score: scoreData.dimensions?.clarity, icon: Target },
                        { label: 'Relevance', score: scoreData.dimensions?.relevance, icon: Users },
                        { label: 'Shareability', score: scoreData.dimensions?.shareability, icon: Share2 },
                      ].map((dim) => (
                        <div key={dim.label} className="p-3 rounded-xl bg-background/40 border border-border/40 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium flex items-center gap-1">
                              <dim.icon className="h-3 w-3 text-purple-400" />
                              {dim.label}
                            </span>
                            <span className="font-mono font-bold text-foreground">{dim.score}</span>
                          </div>
                          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disagreement Detection Alert Banner */}
                  {scoreData.disagreement?.detected && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-6 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-sm flex items-start gap-3.5 shadow-lg shadow-amber-500/5"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 mt-0.5">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-200 uppercase tracking-wider text-[11px]">
                            High Segment Disagreement Detected (Variance: {scoreData.disagreement.variance})
                          </span>
                          <Badge variant="default" className="border border-amber-500/40 bg-amber-500/20 text-amber-300 text-[10px]">
                            Polarized Audience
                          </Badge>
                        </div>
                        <p className="text-amber-100/90 leading-relaxed font-medium">
                          {scoreData.disagreement.insight}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Segment Clustering Comparison */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-purple-300">🎯 Niche Audience</span>
                        <span className="font-mono text-sm font-bold text-purple-200">
                          {scoreData.segments?.nicheScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Domain specialists who appreciate specific industry context.</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-300">❄️ Cold Outsiders</span>
                        <span className="font-mono text-sm font-bold text-blue-200">
                          {scoreData.segments?.coldOutsiderScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">General discovery feed viewers; bounce early if hook lacks clarity.</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-300">⚡ Platform-Native</span>
                        <span className="font-mono text-sm font-bold text-emerald-200">
                          {scoreData.segments?.platformNativeScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Algorithmic fast-scrollers evaluating pacing and shareability.</p>
                    </div>
                  </div>

                  {/* Algorithmic Pattern Benchmark & Recommendations */}
                  <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Platform Pattern Check */}
                    <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <Sliders className="h-4 w-4 text-purple-400" />
                          Platform Algorithmic Match
                        </span>
                        <span className="font-mono text-purple-400">
                          {scoreData.platformPatterns?.benchmarkMatchRating ?? 85}%
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {scoreData.platformPatterns?.optimalDurationFit ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          )}
                          <span>Duration Fit: {scoreData.platformPatterns?.optimalDurationFit ? 'Complies with platform retention window' : 'Review length'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {scoreData.platformPatterns?.hookWindowCompliance ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          )}
                          <span>Hook Window: 3-second drop-off barrier validated</span>
                        </div>
                      </div>
                    </div>

                    {/* Actionable Recommendations */}
                    <div className="p-4 rounded-xl bg-background/40 border border-border/40 space-y-2.5 text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        AI Optimization Recommendations
                      </span>
                      <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                        {scoreData.recommendations?.slice(0, 3).map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-purple-400 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Persona Drill-Down Explorer */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-foreground">
                      Persona Drill-Down Feedback ({filteredPersonas.length})
                    </h3>
                  </div>

                  {/* Segment Filter Tabs */}
                  <div className="flex items-center gap-1 bg-background/60 p-1 rounded-lg border border-border/50 text-xs">
                    {[
                      { key: 'ALL', label: 'All Personas' },
                      { key: 'NICHE', label: '🎯 Niche' },
                      { key: 'COLD_OUTSIDER', label: '❄️ Cold' },
                      { key: 'PLATFORM_NATIVE', label: '⚡ Native' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSelectedSegment(tab.key)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                          selectedSegment === tab.key
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personas Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredPersonas.map((persona) => (
                    <motion.div
                      key={persona.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-purple-500/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{persona.avatar || '👤'}</span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{persona.personaName}</p>
                            <p className="text-[10px] text-muted-foreground">{persona.demographics}</p>
                          </div>
                        </div>

                        <Badge
                          variant="default"
                          className={cn('text-xs font-mono font-bold border', getScoreColor(persona.overallScore))}
                        >
                          {persona.overallScore}/100
                        </Badge>
                      </div>

                      {/* Qualitative Reaction Quote */}
                      <div className="p-2.5 rounded-lg bg-background/60 border border-border/30 text-[11px] italic text-muted-foreground leading-relaxed">
                        "{persona.reason}"
                      </div>

                      {/* Score metrics pill */}
                      <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-mono">
                        <div className="p-1 rounded bg-muted/40">
                          <span className="text-muted-foreground block">Hook</span>
                          <span className="font-bold text-foreground">{persona.hookScore}</span>
                        </div>
                        <div className="p-1 rounded bg-muted/40">
                          <span className="text-muted-foreground block">Eng</span>
                          <span className="font-bold text-foreground">{persona.engagementScore}</span>
                        </div>
                        <div className="p-1 rounded bg-muted/40">
                          <span className="text-muted-foreground block">Clar</span>
                          <span className="font-bold text-foreground">{persona.clarityScore}</span>
                        </div>
                        <div className="p-1 rounded bg-muted/40">
                          <span className="text-muted-foreground block">Rel</span>
                          <span className="font-bold text-foreground">{persona.relevanceScore}</span>
                        </div>
                        <div className="p-1 rounded bg-muted/40">
                          <span className="text-muted-foreground block">Shar</span>
                          <span className="font-bold text-foreground">{persona.shareabilityScore}</span>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      {(persona.strengths?.length > 0 || persona.weaknesses?.length > 0) && (
                        <div className="pt-2 border-t border-border/30 space-y-1 text-[10px]">
                          {persona.strengths?.[0] && (
                            <p className="text-emerald-400 truncate">
                              <span className="font-semibold">+</span> {persona.strengths[0]}
                            </p>
                          )}
                          {persona.weaknesses?.[0] && (
                            <p className="text-rose-400 truncate">
                              <span className="font-semibold">-</span> {persona.weaknesses[0]}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Empty State when no evaluation is active */
            <div className="flex flex-col items-center justify-center min-h-[420px] rounded-2xl border border-dashed border-border/60 bg-card/20 p-8 text-center backdrop-blur-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4 shadow-lg shadow-purple-500/5">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                No Content Evaluation Selected
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                Fill out the intake form on the left or select a previous run from the history menu above to view persona ratings, disagreement detection, and virality scores.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setTitle('Stop Writing Boring Next.js Code: 3 Clean Architecture Upgrades');
                  setCaption('Are you still dumping all your database logic inside Server Components? Here are 3 architecture patterns used by senior engineers to clean up production Next.js apps.');
                  setPlatform('INSTAGRAM');
                  setContentType('REEL');
                  setDurationSeconds(30);
                }}
                className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
              >
                Load Sample Tech Content
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
