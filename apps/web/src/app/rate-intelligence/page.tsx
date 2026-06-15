/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart3,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Info,
  DollarSign,
  Briefcase,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GlowBackground } from '@/components/ui/glow-background';
import { rateIntelligenceApi } from '@/lib/api-client';

const CONTENT_FORMATS = [
  { value: 'SHORT_FORM_VIDEO', label: 'Short-form Video (Reels, TikTok, Shorts)' },
  { value: 'LONG_FORM_VIDEO', label: 'Long-form Video (YouTube)' },
  { value: 'STATIC_IMAGE', label: 'Static Image Post' },
  { value: 'CAROUSEL', label: 'Carousel Post' },
  { value: 'STORIES', label: 'Instagram Stories' },
  { value: 'LIVE_STREAM', label: 'Live Stream' },
  { value: 'PODCAST', label: 'Podcast Episode/Mention' },
  { value: 'BLOG_ARTICLE', label: 'Blog Article' },
  { value: 'NEWSLETTER', label: 'Newsletter Sponsorship' },
  { value: 'UGC_RAW_FOOTAGE', label: 'UGC Raw Footage' },
];

const DEAL_TYPES = [
  { value: 'SPONSORED_POST', label: 'Sponsored Post' },
  { value: 'UGC', label: 'User Generated Content (UGC)' },
  { value: 'AMBASSADOR', label: 'Brand Ambassador' },
  { value: 'AFFILIATE', label: 'Affiliate + Flat Fee' },
  { value: 'PRODUCT_GIFTING', label: 'Product Gifting + Review' },
  { value: 'EVENT', label: 'Event Appearance' },
];

const USAGE_RIGHTS = [
  { value: 'ORGANIC_ONLY', label: 'Organic Only' },
  { value: 'PAID_ADS', label: 'Paid Ads Usage' },
  { value: 'WHITELISTING', label: 'Creator Whitelisting / Dark Posts' },
  { value: 'EXCLUSIVITY', label: 'Category Exclusivity' },
  { value: 'IN_PERPETUITY', label: 'In Perpetuity Rights' },
  { value: 'GEO_RESTRICTED', label: 'Geo-restricted usage' },
  { value: 'REPURPOSE_ALLOWED', label: 'Brand repurposing rights' },
];

const BRAND_TIERS = [
  { value: 'NANO', label: 'Nano Brand (<1K followers)' },
  { value: 'MICRO', label: 'Micro Brand (1K–10K followers)' },
  { value: 'MID', label: 'Mid-market Brand (10K–100K followers)' },
  { value: 'MACRO', label: 'Macro Brand (100K–1M followers)' },
  { value: 'MEGA', label: 'Mega Brand (1M+ followers)' },
  { value: 'ENTERPRISE', label: 'Enterprise / Fortune 500' },
];

export default function RateIntelligencePage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  // Form State
  const [contentFormat, setContentFormat] = React.useState('SHORT_FORM_VIDEO');
  const [dealType, setDealType] = React.useState('SPONSORED_POST');
  const [usageRights, setUsageRights] = React.useState<string[]>(['ORGANIC_ONLY']);
  const [exclusivityDays, setExclusivityDays] = React.useState(0);
  const [isRush, setIsRush] = React.useState(false);
  const [revisionRounds, setRevisionRounds] = React.useState(2);
  const [brandTier, setBrandTier] = React.useState('MID');
  const [brandCategory, setBrandCategory] = React.useState('');

  // UI States
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [isEmailExpanded, setIsEmailExpanded] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [checkedPoints, setCheckedPoints] = React.useState<Record<number, boolean>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Fetch History on Load
  React.useEffect(() => {
    if (accessToken) {
      rateIntelligenceApi.getHistory(accessToken)
        .then(data => setHistory(data))
        .catch(() => null);
    }
  }, [accessToken]);

  // Handle Usage Rights Toggle
  const toggleUsageRight = (val: string) => {
    setUsageRights(prev => {
      if (prev.includes(val)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(v => v !== val);
      }
      return [...prev, val];
    });
  };

  // Handle Quote Generation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!brandCategory.trim()) {
      setFormError('Brand category is required');
      return;
    }
    setFormError(null);
    setLoading(true);

    try {
      const response = await rateIntelligenceApi.generateQuote(accessToken, {
        contentFormat,
        dealType,
        usageRights,
        exclusivityDays,
        isRush,
        revisionRounds,
        brandTier,
        brandCategory,
      });
      setResult(response);
      setCheckedPoints({});
      // Refresh history
      const histData = await rateIntelligenceApi.getHistory(accessToken).catch(() => []);
      setHistory(histData);
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate quote range');
    } finally {
      setLoading(false);
    }
  };

  // Copy Email to Clipboard
  const copyToClipboard = () => {
    if (!result?.result?.counterofferEmail) return;
    navigator.clipboard.writeText(result.result.counterofferEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recall Past Request
  const selectHistoryItem = (item: any) => {
    const input = item.input;
    setContentFormat(input.contentFormat);
    setDealType(input.dealType);
    setUsageRights(input.usageRights);
    setExclusivityDays(input.exclusivityDays);
    setIsRush(input.isRush);
    setRevisionRounds(input.revisionRounds);
    setBrandTier(input.brandTier);
    setBrandCategory(input.brandCategory);
    setResult(item);
    setCheckedPoints({});
    setIsEmailExpanded(true);
  };

  return (
    <div className="relative space-y-8 animate-fade-in pb-16">
      {/* Radial glow background */}
      <GlowBackground glowPosition="top-right" intensity="subtle" animated />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-muted inline-flex shadow-glow-sm">
              <BarChart3 className="h-6 w-6 text-primary animate-glow-pulse" />
            </span>
            Rate Intelligence
          </h1>
          <p className="mt-2 text-foreground-muted">
            Analyze brand deals and receive AI-backed, fair market rate recommendations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Column: Form & History */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="glass" className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Pricing Parameters
              </CardTitle>
              <CardDescription>Input the deal specifics to run analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Content Format */}
                <div className="space-y-1.5">
                  <label htmlFor="format-select" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Content Format
                  </label>
                  <select
                    id="format-select"
                    value={contentFormat}
                    onChange={(e) => setContentFormat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer transition-all duration-150"
                  >
                    {CONTENT_FORMATS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Deal Type */}
                <div className="space-y-1.5">
                  <label htmlFor="deal-type-select" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Deal Type
                  </label>
                  <select
                    id="deal-type-select"
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer transition-all duration-150"
                  >
                    {DEAL_TYPES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Category */}
                <div className="space-y-1.5">
                  <label htmlFor="category-input" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Brand Category
                  </label>
                  <input
                    id="category-input"
                    type="text"
                    placeholder="e.g. FinTech, Cosmetics, SaaS"
                    value={brandCategory}
                    onChange={(e) => setBrandCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-foreground-subtle transition-all duration-150"
                  />
                </div>

                {/* Brand Tier */}
                <div className="space-y-1.5">
                  <label htmlFor="brand-tier-select" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Brand Tier
                  </label>
                  <select
                    id="brand-tier-select"
                    value={brandTier}
                    onChange={(e) => setBrandTier(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer transition-all duration-150"
                  >
                    {BRAND_TIERS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                {/* Usage Rights Multi-Toggle */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Usage Rights
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {USAGE_RIGHTS.map(u => {
                      const isSelected = usageRights.includes(u.value);
                      return (
                        <button
                          key={u.value}
                          type="button"
                          onClick={() => toggleUsageRight(u.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                            isSelected
                              ? "bg-primary-muted border-primary text-primary shadow-glow-sm"
                              : "bg-input border-border text-foreground-muted hover:border-foreground-subtle"
                          )}
                        >
                          {u.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exclusivity, Revision, Rush in Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="exclusivity-input" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Exclusivity (Days)
                    </label>
                    <input
                      id="exclusivity-input"
                      type="number"
                      min="0"
                      max="730"
                      value={exclusivityDays}
                      onChange={(e) => setExclusivityDays(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-150"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="revisions-input" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Revision Rounds
                    </label>
                    <input
                      id="revisions-input"
                      type="number"
                      min="0"
                      max="10"
                      value={revisionRounds}
                      onChange={(e) => setRevisionRounds(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-150"
                    />
                  </div>
                </div>

                {/* Rush toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Rush Delivery (&lt; 72h)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRush(!isRush)}
                    className={cn(
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isRush ? "bg-primary" : "bg-border"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isRush ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {formError && (
                  <div className="text-xs text-danger font-medium p-2.5 rounded bg-danger-muted border border-danger/20">
                    {formError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 gap-2 flex items-center justify-center font-semibold text-sm rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> Calculating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-white" /> Get AI Rate Analysis
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* History log */}
          {history.length > 0 && (
            <Card variant="glass" className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-foreground-muted" /> Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[220px] overflow-y-auto">
                {history.map((h, idx) => {
                  const input = h.input;
                  const res = h.result;
                  return (
                    <button
                      key={h.id || idx}
                      onClick={() => selectHistoryItem(h)}
                      className="w-full text-left p-2.5 rounded-lg border border-border/30 bg-background-surface/30 hover:bg-background-elevated hover:border-primary/40 transition-all duration-150 flex items-center justify-between text-xs text-foreground-muted group"
                    >
                      <div className="truncate pr-4">
                        <span className="font-semibold text-white group-hover:text-primary transition-colors">
                          {input.brandCategory}
                        </span>
                        <span className="mx-1.5">•</span>
                        <span>{input.contentFormat.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="font-mono text-white flex-shrink-0">
                        ${res.recommendedMin} - ${res.recommendedMax}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Results page */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6 animate-scale-in">
              {/* Highlight hero number range */}
              <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-muted/40 via-background-surface/80 to-accent-muted/10 p-8 shadow-glow overflow-hidden text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_100%)]" />
                <div className="relative z-10 space-y-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary">
                    <Sparkles className="h-3 w-3 text-primary animate-glow-pulse" /> Recommended Quote Range
                  </span>
                  <div className="text-4xl md:text-5xl font-extrabold text-white font-mono tracking-tight">
                    ${result.result.recommendedMin.toLocaleString()} – ${result.result.recommendedMax.toLocaleString()}
                  </div>
                  <p className="text-sm text-foreground-muted max-w-lg mx-auto leading-relaxed">
                    {result.result.rationale}
                  </p>
                </div>
              </div>

              {/* Side-by-side comparative cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peer comparison */}
                <Card variant="glass" className="border-border/40">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary-muted">
                        <Users className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-white text-sm">Peer Benchmark</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-white font-mono">{result.result.peerComparison.percentile}th Percentile</div>
                      <div className="text-xs text-foreground-muted">{result.result.peerComparison.label}</div>
                    </div>
                    <p className="text-xs text-foreground-subtle leading-relaxed">
                      {result.result.peerComparison.insight}
                    </p>
                  </CardContent>
                </Card>

                {/* Brand comparison */}
                <Card variant="glass" className="border-border/40">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-accent-muted">
                        <Building2 className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <h3 className="font-semibold text-white text-sm">Brand Tier Budget</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-white font-mono">${result.result.brandComparison.averageRate.toLocaleString()}</div>
                      <div className="text-xs text-foreground-muted">{result.result.brandComparison.label} Average</div>
                    </div>
                    <p className="text-xs text-foreground-subtle leading-relaxed">
                      {result.result.brandComparison.insight}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Counteroffer Copy */}
              <Card variant="glass" className="border-border/40">
                <button
                  type="button"
                  onClick={() => setIsEmailExpanded(!isEmailExpanded)}
                  className="w-full flex items-center justify-between p-5 text-left border-b border-border/40 hover:bg-background-surface/30 transition-colors"
                >
                  <span className="font-semibold text-white text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Counteroffer Email Template
                  </span>
                  {isEmailExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isEmailExpanded && (
                  <CardContent className="p-5 space-y-4">
                    <div className="p-4 rounded-lg bg-input/50 border border-border text-sm text-foreground leading-relaxed font-mono whitespace-pre-wrap select-all max-h-[300px] overflow-y-auto">
                      {result.result.counterofferEmail}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex-1 py-2 text-xs font-semibold gap-1.5 bg-input hover:bg-background-elevated"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-foreground-muted" /> Copy to Clipboard
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-2 text-xs font-semibold gap-1.5"
                      >
                        <RotateCw className="h-3.5 w-3.5 text-white" /> Regenerate
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Negotiation talking points as checklist */}
              <Card variant="glass" className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" /> Negotiation Talking Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {result.result.negotiationPoints.map((point: string, idx: number) => {
                    const isChecked = !!checkedPoints[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCheckedPoints(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg border text-left text-xs transition-all duration-150 cursor-pointer",
                          isChecked
                            ? "bg-primary-muted/20 border-primary/30 text-foreground-muted line-through"
                            : "bg-input/30 border-border/50 text-foreground hover:bg-background-surface/50"
                        )}
                      >
                        <span className={cn(
                          "h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                          isChecked ? "bg-primary border-primary" : "border-border bg-background"
                        )}>
                          {isChecked && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span>{point}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card variant="glass" className="p-12 text-center border-border/40 flex flex-col items-center justify-center min-h-[450px]">
              <div className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-muted flex text-primary shadow-glow-sm mb-4">
                <Sparkles className="h-8 w-8 text-primary animate-glow-pulse" />
              </div>
              <CardTitle className="text-xl text-white">Pricing Insights Await</CardTitle>
              <CardDescription className="max-w-xs mx-auto mt-2">
                Input your deal parameters on the left to compute recommendation ranges and generate negotiation strategies.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
