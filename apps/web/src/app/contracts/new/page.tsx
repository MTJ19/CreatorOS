/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Settings,
  Shield,
  FileCheck,
  Calendar,
  AlertCircle,
  Sparkles,
  Loader2,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GlowBackground } from '@/components/ui/glow-background';
import { contractsApi, dealsApi } from '@/lib/api-client';

export default function NewContractPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const router = useRouter();

  // Load deals for referencing
  const [deals, setDeals] = React.useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form Fields
  const [brandName, setBrandName] = React.useState('');
  const [creatorName, setCreatorName] = React.useState('');
  const [associatedDealId, setAssociatedDealId] = React.useState('');
  const [contractType, setContractType] = React.useState<'SPONSORED_POST' | 'UGC' | 'AMBASSADOR' | 'AFFILIATE' | 'OTHER'>('SPONSORED_POST');
  const [exclusivityDays, setExclusivityDays] = React.useState(0);
  const [exclusivityScope, setExclusivityScope] = React.useState('');
  const [usageRightsScope, setUsageRightsScope] = React.useState('Organic only (social media reposting)');
  const [killFeePercent, setKillFeePercent] = React.useState(50);
  const [revisionLimit, setRevisionLimit] = React.useState(2);
  const [latePaymentPenaltyToggle, setLatePaymentPenaltyToggle] = React.useState(true);
  const [latePaymentPenaltyPercent, setLatePaymentPenaltyPercent] = React.useState(5);
  const [includeFtcDisclosure, setIncludeFtcDisclosure] = React.useState(true);
  const [governingLaw, setGoverningLaw] = React.useState('California');

  // Load details if a deal is chosen
  const handleDealChange = (dealId: string) => {
    setAssociatedDealId(dealId);
    if (!dealId) return;

    const selectedDeal = deals.find(d => d.id === dealId);
    if (selectedDeal) {
      setBrandName(selectedDeal.brandName || '');
      setCreatorName(session?.user?.name || '');
      if (selectedDeal.exclusivityDays !== null) {
        setExclusivityDays(selectedDeal.exclusivityDays);
      }
      if (selectedDeal.usageRights) {
        setUsageRightsScope(selectedDeal.usageRights);
      }
    }
  };

  React.useEffect(() => {
    async function loadDeals() {
      if (!accessToken) return;
      try {
        setLoadingDeals(true);
        const dealsData = await dealsApi.getAll(accessToken);
        setDeals(dealsData);
      } catch (err) {
        console.error('Failed to load deals', err);
      } finally {
        setLoadingDeals(false);
      }
    }
    loadDeals();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !creatorName) {
      setError('Please provide Brand Name and Creator Name.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const payload = {
        brandName,
        creatorName,
        dealId: associatedDealId || undefined,
        contractType,
        exclusivityDays: Number(exclusivityDays),
        exclusivityScope: exclusivityScope || undefined,
        usageRightsScope,
        killFeePercent: Number(killFeePercent),
        revisionLimit: Number(revisionLimit),
        latePaymentPenaltyPercent: Number(latePaymentPenaltyPercent),
        latePaymentPenaltyToggle,
        includeFtcDisclosure,
        governingLaw,
      };

      const blob = await contractsApi.generate(accessToken, payload);

      // Trigger client side download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeBrandName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `collaboration_agreement_${safeBrandName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Redirect back to contracts index
      router.push('/contracts');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate contract.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      <GlowBackground className="opacity-30" />

      {/* Back link */}
      <div>
        <Link
          href="/contracts"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contracts
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-purple-400 bg-clip-text text-transparent">
          Programmatic Contract Builder
        </h1>
        <p className="mt-2 text-zinc-400">
          Build a legally protective campaign agreement with optimized defaults.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main settings Card */}
          <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
            <CardHeader className="border-b border-zinc-900/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-lg">Agreement Details</CardTitle>
              </div>
              <CardDescription>
                Provide the primary branding details and type of collaboration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Reference Deal */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Import terms from Brand Deal (Optional)
                  </label>
                  {loadingDeals ? (
                    <div className="text-zinc-500 text-xs flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading deals...
                    </div>
                  ) : (
                    <select
                      value={associatedDealId}
                      onChange={(e) => handleDealChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm transition-all"
                    >
                      <option value="">-- Start from scratch --</option>
                      {deals.map((deal) => (
                        <option key={deal.id} value={deal.id}>
                          {deal.brandName} — {deal.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Brand Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Brand Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                  />
                </div>

                {/* Creator Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Creator Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                  />
                </div>

                {/* Contract Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Agreement Type
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                  >
                    <option value="SPONSORED_POST">Sponsored Post</option>
                    <option value="UGC">User Generated Content (UGC)</option>
                    <option value="AMBASSADOR">Brand Ambassador</option>
                    <option value="AFFILIATE">Affiliate Agreement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Governing Law */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Governing Law (State/Region)
                  </label>
                  <input
                    type="text"
                    value={governingLaw}
                    onChange={(e) => setGoverningLaw(e.target.value)}
                    placeholder="e.g. California"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exclusivity and IP rights */}
          <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
            <CardHeader className="border-b border-zinc-900/50">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-lg">Exclusivity & IP Protection</CardTitle>
              </div>
              <CardDescription>
                Define safety rules surrounding exclusivity lockouts and usage rights scope.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Exclusivity Days */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Exclusivity Duration (Days)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={0}
                      value={exclusivityDays}
                      onChange={(e) => setExclusivityDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-center"
                    />
                    <span className="text-zinc-500 text-xs">
                      {exclusivityDays === 0
                        ? 'No exclusivity (non-exclusive agreement)'
                        : `${exclusivityDays} days of campaign exclusivity`}
                    </span>
                  </div>
                </div>

                {/* Exclusivity Scope */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Exclusivity Competitor Scope
                  </label>
                  <textarea
                    value={exclusivityScope}
                    onChange={(e) => setExclusivityScope(e.target.value)}
                    placeholder="e.g. Direct competitors in beauty, cosmetics and makeup product categories"
                    rows={3}
                    disabled={exclusivityDays === 0}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Intellectual Property Scope */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Usage Rights Scope & Duration
                  </label>
                  <textarea
                    value={usageRightsScope}
                    onChange={(e) => setUsageRightsScope(e.target.value)}
                    placeholder="e.g. Organic social reposting only for 30 days. No paid advertising usage."
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protection sidebar controls */}
        <div className="space-y-6">
          <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
            <CardHeader className="border-b border-zinc-900/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-lg">Safety Controls</CardTitle>
              </div>
              <CardDescription>
                Toggle risk mitigations and payment terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Revision Round Limit */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Revision Limit Rounds
                </label>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={revisionLimit}
                    onChange={(e) => setRevisionLimit(parseInt(e.target.value))}
                    className="flex-grow accent-purple-500"
                  />
                  <span className="text-zinc-100 font-bold bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-sm shrink-0">
                    {revisionLimit} Rounds
                  </span>
                </div>
              </div>

              {/* Kill Fee */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Campaign Kill Fee (%)
                </label>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={10}
                    value={killFeePercent}
                    onChange={(e) => setKillFeePercent(parseInt(e.target.value))}
                    className="flex-grow accent-purple-500"
                  />
                  <span className="text-zinc-100 font-bold bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-sm shrink-0">
                    {killFeePercent}%
                  </span>
                </div>
                <p className="text-zinc-500 text-xxs leading-normal">
                  Creator retains {killFeePercent}% of total deal amount if brand cancels after signing.
                </p>
              </div>

              {/* Late Payment Penalty */}
              <div className="space-y-3 pt-3 border-t border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Late Payment Clause
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={latePaymentPenaltyToggle}
                      onChange={(e) => setLatePaymentPenaltyToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                  </label>
                </div>
                {latePaymentPenaltyToggle && (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={latePaymentPenaltyPercent}
                      onChange={(e) => setLatePaymentPenaltyPercent(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none text-sm text-center"
                    />
                    <span className="text-zinc-400 text-xs">
                      % interest fee per month
                    </span>
                  </div>
                )}
              </div>

              {/* FTC compliance */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                    FTC Disclosure Clause
                  </span>
                  <span className="text-zinc-500 text-xxs block mt-0.5 max-w-[200px]">
                    Requires clear and conspicuous #ad disclosures.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={includeFtcDisclosure}
                    onChange={(e) => setIncludeFtcDisclosure(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                </label>
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-900/10 border-t border-zinc-900 p-6 flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-glow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                    Generating DOCX...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4.5 w-4.5" />
                    Generate & Download
                  </>
                )}
              </Button>
              <p className="text-zinc-500 text-center text-xxs">
                Generated agreements compile to standard Microsoft Word formats (.docx) with professional formatting.
              </p>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
