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
  FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const { data: session, status } = useSession();
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
  const [brandName, setBrandName] = React.useState('');
  const [followers, setFollowers] = React.useState(10000);
  const [dashboardDetails, setDashboardDetails] = React.useState('');

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
      rateIntelligenceApi
        .getHistory(accessToken)
        .then((data) => setHistory(data))
        .catch(() => null);
    }
  }, [accessToken]);

  // Handle Usage Rights Toggle
  const toggleUsageRight = (val: string) => {
    setUsageRights((prev) => {
      if (prev.includes(val)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((v) => v !== val);
      }
      return [...prev, val];
    });
  };

  // Handle Quote Generation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) { 
      setFormError('Access token is missing. Please refresh the page.');
      setLoading(false); 
      return; 
    }
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
        brandName: brandName.trim() || undefined,
        followers,
        dashboardDetails,
      });
      setResult(response);
      setCheckedPoints({});
      // Refresh history
      const histData = await rateIntelligenceApi.getHistory(accessToken).catch(() => []);
      setHistory(histData);
    } catch (err: any) {
      let errMsg = err.message || 'Failed to generate quote range';
      if (err.body?.message) {
        errMsg = Array.isArray(err.body.message) ? err.body.message.join(', ') : err.body.message;
      } else if (err.body?.error) {
        errMsg = err.body.error;
      }
      setFormError(errMsg);
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
    setBrandName(input.brandName || '');
    setFollowers(input.followers || 10000);
    setDashboardDetails(input.dashboardDetails || '');
    setResult(item);
    setCheckedPoints({});
    setIsEmailExpanded(true);
  };

  return (
    <div className="relative animate-fade-in space-y-8 pb-16">
      {/* Radial glow background */}
      <GlowBackground glowPosition="top-right" intensity="subtle" animated />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-white">
            <span className="inline-flex rounded-xl bg-primary-muted p-2 shadow-glow-sm">
              <BarChart3 className="h-6 w-6 animate-glow-pulse text-primary" />
            </span>
            Rate Intelligence
          </h1>
          <p className="mt-2 text-foreground-muted">
            Analyze brand deals and receive AI-backed, fair market rate recommendations.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column: Form & History */}
        <div className="space-y-6 lg:col-span-5">
          <Card variant="glass" className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                <Briefcase className="h-4 w-4 text-primary" /> Pricing Parameters
              </CardTitle>
              <CardDescription>Input the deal specifics to run analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Followers */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="followers-input"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Followers
                  </label>
                  <input
                    id="followers-input"
                    type="number"
                    min="0"
                    value={followers}
                    onChange={(e) => setFollowers(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Content Format */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="format-select"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Content Format
                  </label>
                  <select
                    id="format-select"
                    value={contentFormat}
                    onChange={(e) => setContentFormat(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CONTENT_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deal Type */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="deal-type-select"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Deal Type
                  </label>
                  <select
                    id="deal-type-select"
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {DEAL_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="brand-name-input"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Brand Name (Optional)
                  </label>
                  <input
                    id="brand-name-input"
                    type="text"
                    placeholder="e.g. Nike, Gymshark, Notion"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-all duration-150 placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Brand Category */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="category-input"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Brand Category
                  </label>
                  <input
                    id="category-input"
                    type="text"
                    placeholder="e.g. FinTech, Cosmetics, SaaS"
                    value={brandCategory}
                    onChange={(e) => setBrandCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-all duration-150 placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Brand Tier */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="brand-tier-select"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Brand Tier
                  </label>
                  <select
                    id="brand-tier-select"
                    value={brandTier}
                    onChange={(e) => setBrandTier(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {BRAND_TIERS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Usage Rights Multi-Toggle */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-foreground">
                    Usage Rights
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {USAGE_RIGHTS.map((u) => {
                      const isSelected = usageRights.includes(u.value);
                      return (
                        <button
                          key={u.value}
                          type="button"
                          onClick={() => toggleUsageRight(u.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                            isSelected
                              ? 'border-primary bg-primary-muted text-primary shadow-glow-sm'
                              : 'border-border bg-input text-foreground-muted hover:border-foreground-subtle',
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
                    <label
                      htmlFor="exclusivity-input"
                      className="text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      Exclusivity (Days)
                    </label>
                    <input
                      id="exclusivity-input"
                      type="number"
                      min="0"
                      max="730"
                      value={exclusivityDays}
                      onChange={(e) => setExclusivityDays(parseInt(e.target.value, 10) || 0)}
                      className="w-full border border-border bg-input px-3 py-2 text-sm text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="revisions-input"
                      className="text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      Revision Rounds
                    </label>
                    <input
                      id="revisions-input"
                      type="number"
                      min="0"
                      max="10"
                      value={revisionRounds}
                      onChange={(e) => setRevisionRounds(parseInt(e.target.value, 10) || 0)}
                      className="w-full border border-border bg-input px-3 py-2 text-sm text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Dashboard Details */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="dashboard-details"
                    className="text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Monthly Dashboard Details (Optional)
                  </label>
                  <textarea
                    id="dashboard-details"
                    rows={3}
                    placeholder="e.g. 500k avg views, 5% engagement rate, high US demographic"
                    value={dashboardDetails}
                    onChange={(e) => setDashboardDetails(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-all duration-150 placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Rush toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Rush Delivery (&lt; 72h)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRush(!isRush)}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      isRush ? 'bg-primary' : 'bg-border',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        isRush ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>

                {formError && (
                  <div className="rounded border border-danger/20 bg-danger-muted p-2.5 text-xs font-medium text-danger">
                    {formError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold"
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
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                  <History className="h-4 w-4 text-foreground-muted" /> Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[220px] space-y-2 overflow-y-auto">
                {history.map((h, idx) => {
                  const input = h.input;
                  const res = h.result;
                  return (
                    <button
                      key={h.id || idx}
                      onClick={() => selectHistoryItem(h)}
                      className="group flex w-full items-center justify-between rounded-lg border border-border/30 bg-background-surface/30 p-2.5 text-left text-xs text-foreground-muted transition-all duration-150 hover:border-primary/40 hover:bg-background-elevated"
                    >
                      <div className="truncate pr-4">
                        <span className="font-semibold text-white transition-colors group-hover:text-primary">
                          {input.brandCategory}
                        </span>
                        <span className="mx-1.5">•</span>
                        <span>{input.contentFormat.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex-shrink-0 font-mono text-white">
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
        <div className="space-y-6 lg:col-span-7">
          {result ? (
            <div className="animate-scale-in space-y-6">
              {/* Highlight hero number range */}
              <div className="to-accent-muted/10 relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary-muted/40 via-background-surface/80 p-8 text-center shadow-glow">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_100%)]" />
                <div className="relative z-10 space-y-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary">
                    <Sparkles className="h-3 w-3 animate-glow-pulse text-primary" /> Recommended
                    Quote Range
                  </span>
                  <div className="font-mono text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                    ${result.result.recommendedMin.toLocaleString()} – $
                    {result.result.recommendedMax.toLocaleString()}
                  </div>
                  <p className="mx-auto max-w-lg text-sm leading-relaxed text-foreground-muted">
                    {result.result.rationale}
                  </p>
                  {result.input.brandName && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                        Research Confidence:
                      </span>
                      <Badge
                        variant="default"
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5',
                          result.result.brandResearchConfidence === 'HIGH' && 'border-success text-success bg-success/10',
                          result.result.brandResearchConfidence === 'MEDIUM' && 'border-warning text-warning bg-warning/10',
                          result.result.brandResearchConfidence === 'LOW' && 'border-foreground-muted text-foreground-muted bg-foreground-muted/10'
                        )}
                      >
                        {result.result.brandResearchConfidence || 'MEDIUM'}
                      </Badge>
                      <span className="text-[10px] text-foreground-subtle ml-1">
                        Includes live research on {result.input.brandName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Side-by-side comparative cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Peer comparison */}
                <Card variant="glass" className="border-border/40">
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary-muted p-1.5">
                        <Users className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">Peer Benchmark</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono text-2xl font-bold text-white">
                        {result.result.peerComparison.percentile}th Percentile
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {result.result.peerComparison.label}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground-subtle">
                      {result.result.peerComparison.insight}
                    </p>
                  </CardContent>
                </Card>

                {/* Brand comparison */}
                <Card variant="glass" className="border-border/40">
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center gap-2">
                      <div className="bg-accent-muted rounded-lg p-1.5">
                        <Building2 className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">Brand Tier Budget</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono text-2xl font-bold text-white">
                        ${result.result.brandComparison.averageRate.toLocaleString()}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {result.result.brandComparison.label} Average
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground-subtle">
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
                  className="flex w-full items-center justify-between border-b border-border/40 p-5 text-left transition-colors hover:bg-background-surface/30"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Counteroffer Email Template
                  </span>
                  {isEmailExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {isEmailExpanded && (
                  <CardContent className="space-y-4 p-5">
                    <div className="max-h-[300px] select-all overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-input/50 p-4 font-mono text-sm leading-relaxed text-foreground">
                      {result.result.counterofferEmail}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex-1 gap-1.5 bg-input py-2 text-xs font-semibold hover:bg-background-elevated"
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
                        className="flex-1 gap-1.5 py-2 text-xs font-semibold"
                      >
                        <RotateCw className="h-3.5 w-3.5 text-white" /> Regenerate
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Brand Analysis Section */}
              <Card variant="glass" className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Building2 className="h-4 w-4 text-primary" /> Brand Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">
                    {result.result.brandAnalysis}
                  </p>
                </CardContent>
              </Card>

              {/* Negotiation talking points as checklist */}
              <Card variant="glass" className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
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
                        onClick={() => setCheckedPoints((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                        className={cn(
                          'flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left text-xs transition-all duration-150',
                          isChecked
                            ? 'border-primary/30 bg-primary-muted/20 text-foreground-muted line-through'
                            : 'border-border/50 bg-input/30 text-foreground hover:bg-background-surface/50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                            isChecked ? 'border-primary bg-primary' : 'border-border bg-background',
                          )}
                        >
                          {isChecked && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span>{point}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Evidence Section */}
              {result.result.citedComparables && result.result.citedComparables.length > 0 && (
                <Card variant="glass" className="border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                      <FileSearch className="h-4 w-4 text-primary" /> Evidence
                    </CardTitle>
                    <CardDescription>Comparable deals that most influenced this recommendation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <ul className="list-inside list-disc space-y-2 text-sm text-foreground-muted">
                      {result.result.citedComparables.map((citation: string, idx: number) => (
                        <li key={idx}>{citation}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card
              variant="glass"
              className="flex min-h-[450px] flex-col items-center justify-center border-border/40 p-12 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-muted text-primary shadow-glow-sm">
                <Sparkles className="h-8 w-8 animate-glow-pulse text-primary" />
              </div>
              <CardTitle className="text-xl text-white">Pricing Insights Await</CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-xs">
                Input your deal parameters on the left to compute recommendation ranges and generate
                negotiation strategies.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
