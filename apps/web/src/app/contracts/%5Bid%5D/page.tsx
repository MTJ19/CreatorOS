/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileDown,
  Building2,
  Calendar,
  Gavel,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { contractsApi } from '@/lib/api-client';

export default function ContractReviewPage() {
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken;
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Data states
  const [contract, setContract] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // UI States
  const [copiedFlagId, setCopiedFlagId] = React.useState<string | null>(null);
  const [expandedFlagId, setExpandedFlagId] = React.useState<string | null>(null);

  const fetchContract = React.useCallback(async () => {
    if (!accessToken || !id) return;
    try {
      setLoading(true);
      const data = await contractsApi.getOne(accessToken, id);
      setContract(data);
      if (data.riskFlags && data.riskFlags.length > 0) {
        // Expand first flag by default
        setExpandedFlagId(data.riskFlags[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load contract details', err);
      setError(err.message || 'Error fetching contract data');
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    fetchContract();
  }, [status, fetchContract]);

  const handleAcknowledge = async (flagId: string) => {
    if (!accessToken) { setLoading(false); return; }
    try {
      await contractsApi.acknowledgeFlag(accessToken, flagId);
      // Update local state
      setContract((prev: any) => {
        if (!prev) return prev;
        const updatedFlags = prev.riskFlags.map((f: any) =>
          f.id === flagId ? { ...f, isAcknowledged: true, acknowledgedAt: new Date() } : f,
        );
        return { ...prev, riskFlags: updatedFlags };
      });
    } catch (err) {
      console.error('Failed to acknowledge flag', err);
    }
  };

  const handleCopyClause = (flagId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFlagId(flagId);
    setTimeout(() => setCopiedFlagId(null), 2000);
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20';
    if (score < 70) return 'text-amber-400 bg-amber-950/20 border-amber-500/20';
    return 'text-rose-400 bg-rose-950/20 border-rose-500/20';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-rose-400 bg-rose-950/30 border-rose-500/30';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
      case 'LOW':
        return 'text-zinc-400 bg-zinc-900 border-zinc-800';
      default:
        return 'text-zinc-400 bg-zinc-900';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴 Critical';
      case 'HIGH':
        return '🔴 High Risk';
      case 'MEDIUM':
        return '🟡 Medium Risk';
      case 'LOW':
        return '🟢 Low Risk';
      default:
        return severity;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-24 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-zinc-100">Audit Not Found</h2>
        <p className="text-sm text-zinc-400">{error || 'This contract review is not available.'}</p>
        <Link href="/contracts">
          <Button className="mt-4">Back to Contracts</Button>
        </Link>
      </div>
    );
  }

  const unacknowledgedFlags = contract.riskFlags?.filter((f: any) => !f.isAcknowledged) || [];

  return (
    <div className="relative min-h-screen space-y-6 pb-6">
      <GlowBackground className="opacity-30" />

      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/contracts"
          className="inline-flex items-center text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contracts
        </Link>

        {contract.fileUrl && (
          <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="border-zinc-700 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800"
            >
              <FileDown className="mr-2 h-4.5 w-4.5 text-purple-400" />
              Download Original File
            </Button>
          </a>
        )}
      </div>

      {/* Header Summary Stats */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-50">{contract.title}</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Associated with deal:{' '}
            <span className="font-semibold text-zinc-300">{contract.deal?.brandName || 'N/A'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xxs block font-semibold uppercase tracking-wider text-zinc-500">
              Overall Risk
            </span>
            <span
              className={cn(
                'mt-1.5 block rounded-lg border px-3 py-0.5 text-lg font-black',
                getRiskScoreColor(contract.overallRiskScore || 0),
              )}
            >
              {contract.overallRiskScore || 0}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xxs block font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </span>
            <span className="mt-1.5 block rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm font-bold text-zinc-100">
              {unacknowledgedFlags.length > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  {unacknowledgedFlags.length} Flags to Review
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  All Cleared
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Side: Summary & Details */}
        <div className="space-y-6 lg:col-span-6">
          {/* Summary Card */}
          <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
            <CardHeader className="border-b border-zinc-900/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-purple-400" />
                AI Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                {contract.aiSummary || 'No AI summary generated.'}
              </p>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
            <CardHeader className="border-b border-zinc-900/50">
              <CardTitle className="text-lg">Contract Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-zinc-500">Parties Involved</span>
                  <span className="mt-1 block flex items-center gap-2 font-medium text-zinc-200">
                    <Building2 className="h-4 w-4 shrink-0 text-purple-400" />
                    {contract.parties?.join(' vs ') || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Governing Law</span>
                  <span className="mt-1 block flex items-center gap-2 font-medium text-zinc-200">
                    <Gavel className="h-4 w-4 shrink-0 text-purple-400" />
                    {contract.governingLaw || 'Not specified'}
                  </span>
                </div>
                {contract.jurisdiction && (
                  <div className="col-span-2">
                    <span className="block text-xs text-zinc-500">Dispute Jurisdiction</span>
                    <span className="mt-1 block font-medium text-zinc-200">
                      {contract.jurisdiction}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Risk Flag Cards */}
        <div className="space-y-4 lg:col-span-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-100">
            <ShieldAlert className="h-5 w-5 text-purple-400" />
            Audited Clauses ({contract.riskFlags?.length || 0})
          </h2>

          {contract.riskFlags?.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-zinc-900 bg-zinc-950/20 p-8 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="font-bold text-zinc-200">No Risk Flags Found</h3>
              <p className="mx-auto max-w-xs text-xs text-zinc-500">
                Excellent! The AI audit did not detect any of the standard risk flags in this
                agreement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contract.riskFlags.map((flag: any) => {
                const isExpanded = expandedFlagId === flag.id;
                const isAcknowledged = flag.isAcknowledged;

                return (
                  <Card
                    key={flag.id}
                    variant="glass"
                    className={cn(
                      'overflow-hidden border transition-all duration-200',
                      isAcknowledged
                        ? 'border-zinc-900 bg-zinc-950/10 opacity-70'
                        : isExpanded
                          ? 'border-purple-500/40 bg-zinc-950/25 shadow-glow-sm'
                          : 'border-zinc-800/60 bg-zinc-950/15 hover:bg-zinc-950/25',
                    )}
                  >
                    {/* Card Header (Click to toggle) */}
                    <div
                      onClick={() => setExpandedFlagId(isExpanded ? null : flag.id)}
                      className="flex cursor-pointer select-none items-center justify-between p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'text-xxs rounded border px-2 py-0.5 font-black uppercase',
                            getSeverityColor(flag.severity),
                          )}
                        >
                          {getSeverityBadge(flag.severity)}
                        </span>
                        <h4
                          className={cn(
                            'text-sm font-bold',
                            isAcknowledged ? 'text-zinc-500 line-through' : 'text-zinc-200',
                          )}
                        >
                          {flag.clause}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        {isAcknowledged && (
                          <Badge variant="success" className="text-xxs px-2 py-0">
                            Cleared
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="space-y-4 border-t border-zinc-900/50 px-5 pb-5 pt-4 text-xs">
                        {/* Clause Text Segment */}
                        {flag.clauseText && (
                          <div className="space-y-1 rounded-xl border border-zinc-900 bg-zinc-950/50 p-3.5">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Found Clause Snippet
                            </span>
                            <blockquote className="border-l-2 border-purple-500 pl-3 italic leading-normal text-zinc-300">
                              "{flag.clauseText}"
                            </blockquote>
                          </div>
                        )}

                        {/* Description */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Risk Description
                          </span>
                          <p className="leading-normal text-zinc-300">{flag.description}</p>
                        </div>

                        {/* Scenario */}
                        {flag.scenario && (
                          <div className="space-y-1 rounded-xl border border-rose-900/10 bg-rose-950/5 p-3 text-rose-300">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                              <AlertTriangle className="h-3.5 w-3.5" /> What could go wrong
                              (Scenario)
                            </span>
                            <p className="leading-normal">{flag.scenario}</p>
                          </div>
                        )}

                        {/* Recommendation */}
                        {flag.recommendation && (
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              AI Recommendation
                            </span>
                            <p className="font-semibold leading-normal text-emerald-400">
                              {flag.recommendation}
                            </p>
                          </div>
                        )}

                        {/* Suggested Alternative Clause */}
                        {flag.suggestedClause && (
                          <div className="space-y-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                Suggested Counter-Clause
                              </span>
                              <Button
                                size="xs"
                                variant="ghost"
                                className="h-6 border border-transparent px-2.5 text-[10px] text-zinc-400 hover:border-purple-500/20 hover:bg-purple-950/20 hover:text-purple-400"
                                onClick={() => handleCopyClause(flag.id, flag.suggestedClause)}
                              >
                                {copiedFlagId === flag.id ? (
                                  <>
                                    <Check className="mr-1 h-3.5 w-3.5" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy Clause
                                  </>
                                )}
                              </Button>
                            </div>
                            <pre className="text-xxs whitespace-pre-wrap rounded-lg border border-zinc-900 bg-zinc-950 p-3 font-mono leading-normal text-zinc-300">
                              {flag.suggestedClause}
                            </pre>
                          </div>
                        )}

                        {/* Action buttons */}
                        {!isAcknowledged && (
                          <div className="flex justify-end border-t border-zinc-900/30 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcknowledge(flag.id)}
                              className="border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                            >
                              <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-500" />
                              Acknowledge Risk
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
