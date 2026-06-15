/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  ChevronRight,
  ShieldAlert,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UploadZone } from '@/components/ui/upload-zone';
import { GlowBackground } from '@/components/ui/glow-background';
import { contractsApi, dealsApi } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContractsPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const router = useRouter();

  // Data states
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [deals, setDeals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [selectedDealId, setSelectedDealId] = React.useState('');
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [contractsData, dealsData] = await Promise.all([
        contractsApi.getAll(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      setContracts(contractsData);
      setDeals(dealsData);
      if (dealsData.length > 0) {
        setSelectedDealId(dealsData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load contracts data', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileUpload = async (file: File) => {
    if (!selectedDealId) {
      setUploadError('Please select a brand deal to associate with this contract.');
      return;
    }
    try {
      setUploadLoading(true);
      setUploadError(null);
      const result = await contractsApi.upload(accessToken, selectedDealId, file);
      setUploadOpen(false);
      // Redirect to the contract review page
      router.push(`/contracts/${result.id}`);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error uploading and reviewing contract.');
    } finally {
      setUploadLoading(false);
    }
  };

  const getRiskScoreColor = (score: number | null) => {
    if (score === null) return 'text-zinc-400 bg-zinc-950/40 border-zinc-800';
    if (score < 30) return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20';
    if (score < 70) return 'text-amber-400 bg-amber-950/20 border-amber-500/20';
    return 'text-rose-400 bg-rose-950/20 border-rose-500/20';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return 'success';
      case 'PENDING_REVIEW':
        return 'warning';
      case 'DRAFT':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-12">
      <GlowBackground className="opacity-40" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-purple-400 bg-clip-text text-transparent">
            Contracts & AI Audit
          </h1>
          <p className="mt-2 text-zinc-400">
            Generate custom collaboration agreements or upload agency contracts for automated AI risk audits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100 backdrop-blur-sm"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="mr-2 h-4.5 w-4.5 text-purple-400" />
            Upload Contract
          </Button>
          <Link href="/contracts/new">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-glow-sm">
              <Plus className="mr-2 h-4.5 w-4.5" />
              Generate Agreement
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : contracts.length === 0 ? (
        <Card variant="glass" className="py-16 text-center border-zinc-800/80 bg-zinc-950/25">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6">
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-100">No Contracts Yet</CardTitle>
            <p className="mt-2 text-zinc-400 max-w-md mx-auto text-sm">
              Get started by uploading an agency agreement for a risk audit, or generate a custom contract using our builder.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="mr-2 h-4.5 w-4.5 text-purple-400" />
                Upload Contract
              </Button>
              <Link href="/contracts/new">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white">
                  <Plus className="mr-2 h-4.5 w-4.5" />
                  Generate Custom DOCX
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {contracts.map((contract) => {
            const hasFlags = contract.riskFlags && contract.riskFlags.length > 0;
            const unacknowledgedCount = contract.riskFlags?.filter((f: any) => !f.isAcknowledged).length || 0;

            return (
              <Card
                key={contract.id}
                variant="glass"
                className="border-zinc-800/60 bg-zinc-950/20 hover:bg-zinc-950/30 transition-all duration-200"
              >
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-zinc-400 mt-1 shrink-0">
                      <FileText className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold text-zinc-100 leading-tight">
                          {contract.title}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(contract.status)}>
                          {contract.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-zinc-400 text-sm mt-1.5 flex items-center gap-2">
                        {contract.deal?.brandName && (
                          <>
                            <span className="font-semibold text-zinc-300">{contract.deal.brandName}</span>
                            <span className="text-zinc-600">•</span>
                          </>
                        )}
                        <span>Created {new Date(contract.createdAt).toLocaleDateString()}</span>
                      </p>
                      {contract.governingLaw && (
                        <p className="text-zinc-500 text-xs mt-1">
                          Governed by the laws of {contract.governingLaw}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:justify-end shrink-0">
                    {/* Risk Audit Stats */}
                    {contract.status !== 'DRAFT' && contract.overallRiskScore !== null && (
                      <div className="flex items-center gap-4 border-l border-zinc-800/80 pl-6">
                        <div className="text-center">
                          <span className="text-zinc-500 text-xs block font-medium">Risk Score</span>
                          <span
                            className={cn(
                              'text-xl font-black px-2.5 py-0.5 rounded-lg border block mt-1',
                              getRiskScoreColor(contract.overallRiskScore)
                            )}
                          >
                            {contract.overallRiskScore}%
                          </span>
                        </div>

                        <div className="text-left hidden md:block">
                          <span className="text-zinc-400 text-sm font-semibold flex items-center gap-1.5">
                            {unacknowledgedCount > 0 ? (
                              <>
                                <ShieldAlert className="w-4 h-4 text-amber-500" />
                                <span className="text-amber-500">{unacknowledgedCount} Action Flags</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-400">All Cleared</span>
                              </>
                            )}
                          </span>
                          <span className="text-zinc-500 text-xs mt-0.5 block">
                            {contract.riskFlags?.length || 0} total clauses audited
                          </span>
                        </div>
                      </div>
                    )}

                    <Link href={`/contracts/${contract.id}`}>
                      <Button
                        variant="ghost"
                        className="text-zinc-300 hover:text-purple-400 hover:bg-purple-950/20 border border-transparent hover:border-purple-500/20"
                      >
                        {contract.status === 'DRAFT' ? 'View Details' : 'View Audit'}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload & Review Contract Dialog */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-900/30">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-zinc-100">AI Contract Risk Audit</h2>
              </div>
              <button
                onClick={() => setUploadOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
                disabled={uploadLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Deal Picker */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">
                  Select Associated Brand Deal
                </label>
                {deals.length === 0 ? (
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-amber-500 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    You need to create a Brand Deal before uploading a contract for audit.
                  </div>
                ) : (
                  <select
                    value={selectedDealId}
                    onChange={(e) => setSelectedDealId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all"
                    disabled={uploadLoading}
                  >
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.brandName} — {deal.title}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-zinc-500 text-xs">
                  We will link the risk audit to this deal, and update the CRM pipeline stage to Negotiating automatically.
                </p>
              </div>

              {/* Upload Zone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Upload Agreement File</label>
                <UploadZone
                  onFileSelect={handleFileUpload}
                  isLoading={uploadLoading}
                  loadingText="Extracting terms and auditing risk clauses with Gemini AI..."
                  error={uploadError}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-900 bg-zinc-900/20">
              <Button
                variant="ghost"
                onClick={() => setUploadOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                disabled={uploadLoading}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
