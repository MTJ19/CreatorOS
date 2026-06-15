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
  const { data: session } = useSession();
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
    fetchContract();
  }, [fetchContract]);

  const handleAcknowledge = async (flagId: string) => {
    if (!accessToken) return;
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
      <div className="space-y-4 text-center max-w-md mx-auto py-24">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-100">Audit Not Found</h2>
        <p className="text-zinc-400 text-sm">{error || 'This contract review is not available.'}</p>
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
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contracts
        </Link>

        {contract.fileUrl && (
          <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100">
              <FileDown className="mr-2 h-4.5 w-4.5 text-purple-400" />
              Download Original File
            </Button>
          </a>
        )}
      </div>

      {/* Header Summary Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-zinc-950/20 border border-zinc-900 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-50">{contract.title}</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Associated with deal: <span className="font-semibold text-zinc-300">{contract.deal?.brandName || 'N/A'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-zinc-500 text-xxs block font-semibold uppercase tracking-wider">Overall Risk</span>
            <span className={cn('text-lg font-black px-3 py-0.5 rounded-lg border block mt-1.5', getRiskScoreColor(contract.overallRiskScore || 0))}>
              {contract.overallRiskScore || 0}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 text-xxs block font-semibold uppercase tracking-wider">Status</span>
            <span className="text-zinc-100 text-sm font-bold bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg block mt-1.5">
              {unacknowledgedFlags.length > 0 ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {unacknowledgedFlags.length} Flags to Review
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  All Cleared
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Summary & Details */}
        <div className="lg:col-span-6 space-y-6">
          {/* Summary Card */}
          <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
            <CardHeader className="border-b border-zinc-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                AI Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {contract.aiSummary || 'No AI summary generated.'}
              </p>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
            <CardHeader className="border-b border-zinc-900/50">
              <CardTitle className="text-lg">Contract Metadata</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 text-xs block">Parties Involved</span>
                  <span className="text-zinc-200 font-medium block mt-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                    {contract.parties?.join(' vs ') || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block">Governing Law</span>
                  <span className="text-zinc-200 font-medium block mt-1 flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-purple-400 shrink-0" />
                    {contract.governingLaw || 'Not specified'}
                  </span>
                </div>
                {contract.jurisdiction && (
                  <div className="col-span-2">
                    <span className="text-zinc-500 text-xs block">Dispute Jurisdiction</span>
                    <span className="text-zinc-200 font-medium block mt-1">
                      {contract.jurisdiction}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Risk Flag Cards */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            Audited Clauses ({contract.riskFlags?.length || 0})
          </h2>

          {contract.riskFlags?.length === 0 ? (
            <div className="p-8 border border-zinc-900 rounded-2xl bg-zinc-950/20 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-zinc-200 font-bold">No Risk Flags Found</h3>
              <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                Excellent! The AI audit did not detect any of the standard risk flags in this agreement.
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
                      'border transition-all duration-200 overflow-hidden',
                      isAcknowledged
                        ? 'border-zinc-900 bg-zinc-950/10 opacity-70'
                        : isExpanded
                        ? 'border-purple-500/40 bg-zinc-950/25 shadow-glow-sm'
                        : 'border-zinc-800/60 bg-zinc-950/15 hover:bg-zinc-950/25'
                    )}
                  >
                    {/* Card Header (Click to toggle) */}
                    <div
                      onClick={() => setExpandedFlagId(isExpanded ? null : flag.id)}
                      className="p-5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn('text-xxs font-black px-2 py-0.5 rounded border uppercase', getSeverityColor(flag.severity))}>
                          {getSeverityBadge(flag.severity)}
                        </span>
                        <h4 className={cn('text-sm font-bold', isAcknowledged ? 'text-zinc-500 line-through' : 'text-zinc-200')}>
                          {flag.clause}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        {isAcknowledged && (
                          <Badge variant="success" className="text-xxs px-2 py-0">Cleared</Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-zinc-900/50 pt-4 space-y-4 text-xs">
                        {/* Clause Text Segment */}
                        {flag.clauseText && (
                          <div className="space-y-1 bg-zinc-950/50 border border-zinc-900 p-3.5 rounded-xl">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Found Clause Snippet</span>
                            <blockquote className="text-zinc-300 italic pl-3 border-l-2 border-purple-500 leading-normal">
                              "{flag.clauseText}"
                            </blockquote>
                          </div>
                        )}

                        {/* Description */}
                        <div className="space-y-1">
                          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Risk Description</span>
                          <p className="text-zinc-300 leading-normal">{flag.description}</p>
                        </div>

                        {/* Scenario */}
                        {flag.scenario && (
                          <div className="space-y-1 bg-rose-950/5 border border-rose-900/10 p-3 rounded-xl text-rose-300">
                            <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> What could go wrong (Scenario)
                            </span>
                            <p className="leading-normal">{flag.scenario}</p>
                          </div>
                        )}

                        {/* Recommendation */}
                        {flag.recommendation && (
                          <div className="space-y-1">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">AI Recommendation</span>
                            <p className="text-emerald-400 leading-normal font-semibold">{flag.recommendation}</p>
                          </div>
                        )}

                        {/* Suggested Alternative Clause */}
                        {flag.suggestedClause && (
                          <div className="space-y-2.5 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Suggested Counter-Clause</span>
                              <Button
                                size="xs"
                                variant="ghost"
                                className="text-zinc-400 hover:text-purple-400 text-[10px] h-6 px-2.5 hover:bg-purple-950/20 border border-transparent hover:border-purple-500/20"
                                onClick={() => handleCopyClause(flag.id, flag.suggestedClause)}
                              >
                                {copiedFlagId === flag.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Clause
                                  </>
                                )}
                              </Button>
                            </div>
                            <pre className="text-zinc-300 font-mono text-xxs whitespace-pre-wrap leading-normal bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                              {flag.suggestedClause}
                            </pre>
                          </div>
                        )}

                        {/* Action buttons */}
                        {!isAcknowledged && (
                          <div className="flex justify-end pt-2 border-t border-zinc-900/30">
                            <Button
                              size="sm"
                              onClick={() => handleAcknowledge(flag.id)}
                              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
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
