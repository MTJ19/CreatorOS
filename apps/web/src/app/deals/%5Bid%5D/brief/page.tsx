/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ListTodo,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UploadZone } from '@/components/ui/upload-zone';
import { GlowBackground } from '@/components/ui/glow-background';
import { cn } from '@/lib/utils';
import { dealsApi } from '@/lib/api-client';

export default function BriefIntakePage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const { id: dealId } = useParams() as { id: string };
  const router = useRouter();

  // Data states
  const [deal, setDeal] = React.useState<any | null>(null);
  const [brief, setBrief] = React.useState<any | null>(null);
  const [reconciliation, setReconciliation] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Editing states (for confirmed deliverables list)
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedDeliverables, setEditedDeliverables] = React.useState<any[]>([]);
  const [newDelType, setNewDelType] = React.useState('INSTAGRAM_REEL');
  const [newDelQty, setNewDelQty] = React.useState(1);
  const [newDelPlatform, setNewDelPlatform] = React.useState('Instagram');

  const fetchBriefData = React.useCallback(async () => {
    if (!accessToken || !dealId) return;
    try {
      setLoading(true);
      const [dealData, briefResponse] = await Promise.all([
        dealsApi.getOne(accessToken, dealId),
        dealsApi.getBrief(accessToken, dealId),
      ]);
      setDeal(dealData);
      setBrief(briefResponse.brief);
      setReconciliation(briefResponse.reconciliation);
      if (briefResponse.brief?.parsedData?.deliverables) {
        setEditedDeliverables(briefResponse.brief.parsedData.deliverables);
      }
    } catch (err) {
      console.error('Failed to load brief data', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, dealId]);

  React.useEffect(() => {
    fetchBriefData();
  }, [fetchBriefData]);

  const handleBriefUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      setUploadError(null);
      const res = await dealsApi.uploadBrief(accessToken, dealId, file);
      setBrief(res.brief);
      setReconciliation(res.reconciliation);
      if (res.brief?.parsedData?.deliverables) {
        setEditedDeliverables(res.brief.parsedData.deliverables);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error uploading and parsing campaign brief.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAddDeliverable = () => {
    setEditedDeliverables((prev) => [
      ...prev,
      { type: newDelType, quantity: newDelQty, platform: newDelPlatform, description: '' },
    ]);
    setNewDelQty(1);
  };

  const handleRemoveDeliverable = (index: number) => {
    setEditedDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDeliverables = async () => {
    try {
      setLoading(true);
      const updatedParsedData = {
        ...brief.parsedData,
        deliverables: editedDeliverables,
      };
      const res = await dealsApi.updateBriefParsedData(accessToken, dealId, updatedParsedData);
      setBrief(res.brief);
      setReconciliation(res.reconciliation);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !uploadLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      <GlowBackground className="opacity-30" />

      {/* Back link */}
      <div>
        <Link
          href="/deals"
          className="inline-flex items-center text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CRM Pipeline
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-zinc-50 via-zinc-200 to-purple-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Brief Intake & Reconciliation
          </h1>
          <p className="mt-2 text-zinc-400">
            Upload campaign briefs to parse requirements and verify they match your agreed deal
            scope.
          </p>
        </div>
        {deal && (
          <div className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 backdrop-blur-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Campaign Deal
            </span>
            <span className="text-sm font-semibold text-zinc-200">
              {deal.brandName} • {deal.title}
            </span>
          </div>
        )}
      </div>

      {/* Upload View (No Brief) */}
      {!brief ? (
        <div className="mx-auto max-w-2xl space-y-6 py-12">
          <Card variant="glass" className="border-zinc-800 bg-zinc-950/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                <FileText className="h-7 w-7 text-purple-400" />
              </div>
              <CardTitle className="text-xl">Campaign Brief Upload</CardTitle>
              <CardDescription>
                Upload campaign brief PDF or Word document. Gemini will automatically extract
                deliverables, guidelines, and FTC compliance flags.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <UploadZone
                onFileSelect={handleBriefUpload}
                isLoading={uploadLoading}
                loadingText="Auditing brief text and parsing compliance rules with Gemini..."
                error={uploadError}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Workspace View */
        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* Left panel: Reconciliation & Deliverables */}
          <div className="space-y-6 lg:col-span-7">
            {/* Reconciliation Banner */}
            {reconciliation && (
              <div
                className={cn(
                  'flex items-start gap-4 rounded-2xl border p-5 transition-all duration-300',
                  reconciliation.isMatched
                    ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-950/10 text-rose-300',
                )}
              >
                {reconciliation.isMatched ? (
                  <>
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
                    <div>
                      <h3 className="font-bold text-zinc-100">Deliverables Scope Reconciled</h3>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        Excellent! The campaign brief deliverables align perfectly with your quoted
                        deal scope.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 animate-pulse text-rose-500" />
                    <div>
                      <h3 className="font-bold text-zinc-100">Scope Creep Detected!</h3>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        The campaign brief asks for deliverables that exceed your agreed contract
                        deliverables.
                      </p>
                      <ul className="mt-3.5 list-disc space-y-1.5 pl-4 text-xs text-rose-300">
                        {reconciliation.warnings.map((warning: string, i: number) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Confirmed Deliverables List */}
            <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900/50 p-6">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListTodo className="h-5 w-5 text-purple-400" />
                    Parsed Campaign Deliverables
                  </CardTitle>
                  <CardDescription>
                    Review and confirm deliverables requested in the brief.
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Deliverables
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Deliverable editor items */}
                    <div className="space-y-3">
                      {editedDeliverables.map((del, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 text-xs font-semibold text-zinc-400">
                              {del.quantity}x
                            </span>
                            <span className="text-xs font-medium text-zinc-200">
                              {del.platform} {del.type.replace('_', ' ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(index)}
                            className="rounded-lg p-1 text-zinc-500 transition-colors hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new deliverable inline */}
                    <div className="grid items-end gap-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Platform
                        </label>
                        <input
                          type="text"
                          value={newDelPlatform}
                          onChange={(e) => setNewDelPlatform(e.target.value)}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Format Type
                        </label>
                        <input
                          type="text"
                          value={newDelType}
                          onChange={(e) => setNewDelType(e.target.value)}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex items-end gap-2 space-y-1.5">
                        <div className="flex-grow space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={newDelQty}
                            onChange={(e) =>
                              setNewDelQty(Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-center text-xs text-zinc-200"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddDeliverable}
                          className="h-[34px] shrink-0 bg-purple-600 px-3 text-xs text-white hover:bg-purple-500"
                        >
                          <Plus className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-zinc-900 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditedDeliverables(brief.parsedData?.deliverables || []);
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 font-medium text-white hover:bg-purple-500"
                        onClick={handleSaveDeliverables}
                      >
                        Save & Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editedDeliverables.length === 0 ? (
                      <p className="text-xs italic text-zinc-500">
                        No deliverables parsed from brief.
                      </p>
                    ) : (
                      editedDeliverables.map((del, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-4 rounded-xl border border-zinc-900 bg-zinc-900/40 p-3"
                        >
                          <div>
                            <span className="block text-sm font-bold text-zinc-100">
                              {del.quantity}x {del.type}
                            </span>
                            {del.platform && (
                              <span className="mt-0.5 block text-xs text-zinc-500">
                                Platform: {del.platform}
                              </span>
                            )}
                            {del.description && (
                              <p className="mt-1.5 rounded-lg border border-zinc-800/40 bg-zinc-950/20 p-2.5 text-xs leading-relaxed text-zinc-400">
                                {del.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Guidelines & compliance */}
          <div className="space-y-6 lg:col-span-5">
            {/* FTC Warnings */}
            <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
              <CardHeader className="border-b border-zinc-900/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldAlert className="h-5 w-5 text-purple-400" />
                  FTC Compliance Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {brief.parsedData?.ftcFlags?.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 text-xs text-emerald-400">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <span>Brief complies with standard FTC / ASA disclosure guidelines.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {brief.parsedData?.ftcFlags?.map((flag: any, idx: number) => (
                      <div
                        key={idx}
                        className="space-y-1.5 rounded-xl border border-rose-500/20 bg-rose-950/10 p-3.5"
                      >
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-400">
                          Rule: {flag.rule}
                        </span>
                        <p className="text-xs leading-normal text-zinc-300">{flag.warning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dos and Don'ts */}
            <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
              <CardHeader className="border-b border-zinc-900/50">
                <CardTitle className="text-lg">Campaign Rules</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
                {/* Do list */}
                <div className="space-y-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    <ThumbsUp className="h-3.5 w-3.5" /> Do&apos;s
                  </span>
                  <ul className="list-disc space-y-2 pl-4 text-xs text-zinc-300">
                    {brief.parsedData?.dos?.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    )) || <span className="block italic text-zinc-500">None specified</span>}
                  </ul>
                </div>

                {/* Don't list */}
                <div className="space-y-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    <ThumbsDown className="h-3.5 w-3.5" /> Don&apos;ts
                  </span>
                  <ul className="list-disc space-y-2 pl-4 text-xs text-zinc-300">
                    {brief.parsedData?.donts?.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    )) || <span className="block italic text-zinc-500">None specified</span>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Deadlines */}
            <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
              <CardHeader className="border-b border-zinc-900/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  Key Campaign Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {brief.parsedData?.deadlines?.length === 0 ? (
                  <p className="text-xs italic text-zinc-500">
                    No deadlines specified in the brief.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {brief.parsedData?.deadlines?.map((dl: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 rounded-xl border border-zinc-900 bg-zinc-900/40 p-3"
                      >
                        <span className="text-xs font-medium text-zinc-300">{dl.event}</span>
                        <span className="rounded-lg border border-purple-500/20 bg-purple-950/15 px-3 py-1 text-xs font-bold text-purple-400">
                          {dl.date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
