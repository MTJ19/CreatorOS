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
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CRM Pipeline
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-purple-400 bg-clip-text text-transparent">
            Brief Intake & Reconciliation
          </h1>
          <p className="mt-2 text-zinc-400">
            Upload campaign briefs to parse requirements and verify they match your agreed deal scope.
          </p>
        </div>
        {deal && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 backdrop-blur-sm shrink-0">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Campaign Deal</span>
            <span className="text-zinc-200 font-semibold text-sm">
              {deal.brandName} • {deal.title}
            </span>
          </div>
        )}
      </div>

      {/* Upload View (No Brief) */}
      {!brief ? (
        <div className="max-w-2xl mx-auto py-12 space-y-6">
          <Card variant="glass" className="border-zinc-800 bg-zinc-950/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <FileText className="h-7 w-7 text-purple-400" />
              </div>
              <CardTitle className="text-xl">Campaign Brief Upload</CardTitle>
              <CardDescription>
                Upload campaign brief PDF or Word document. Gemini will automatically extract deliverables, guidelines, and FTC compliance flags.
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
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left panel: Reconciliation & Deliverables */}
          <div className="lg:col-span-7 space-y-6">
            {/* Reconciliation Banner */}
            {reconciliation && (
              <div
                className={cn(
                  'border p-5 rounded-2xl flex items-start gap-4 transition-all duration-300',
                  reconciliation.isMatched
                    ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-950/10 text-rose-300'
                )}
              >
                {reconciliation.isMatched ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-zinc-100">Deliverables Scope Reconciled</h3>
                      <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                        Excellent! The campaign brief deliverables align perfectly with your quoted deal scope.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-zinc-100">Scope Creep Detected!</h3>
                      <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                        The campaign brief asks for deliverables that exceed your agreed contract deliverables.
                      </p>
                      <ul className="mt-3.5 space-y-1.5 text-xs text-rose-300 list-disc pl-4">
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
              <CardHeader className="border-b border-zinc-900/50 flex flex-row items-center justify-between p-6">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-purple-400" />
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
                    className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
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
                          className="flex items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-400 text-xs font-semibold shrink-0">
                              {del.quantity}x
                            </span>
                            <span className="text-zinc-200 text-xs font-medium">
                              {del.platform} {del.type.replace('_', ' ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(index)}
                            className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new deliverable inline */}
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl grid gap-4 sm:grid-cols-3 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Platform</label>
                        <input
                          type="text"
                          value={newDelPlatform}
                          onChange={(e) => setNewDelPlatform(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Format Type</label>
                        <input
                          type="text"
                          value={newDelType}
                          onChange={(e) => setNewDelType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="space-y-1.5 flex gap-2 items-end">
                        <div className="space-y-1.5 flex-grow">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={newDelQty}
                            onChange={(e) => setNewDelQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 text-center"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddDeliverable}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-[34px] px-3 shrink-0"
                        >
                          <Plus className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
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
                        className="bg-purple-600 hover:bg-purple-500 text-white font-medium"
                        onClick={handleSaveDeliverables}
                      >
                        Save & Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editedDeliverables.length === 0 ? (
                      <p className="text-zinc-500 text-xs italic">No deliverables parsed from brief.</p>
                    ) : (
                      editedDeliverables.map((del, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-4 p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl"
                        >
                          <div>
                            <span className="text-zinc-100 font-bold text-sm block">
                              {del.quantity}x {del.type}
                            </span>
                            {del.platform && (
                              <span className="text-zinc-500 text-xs mt-0.5 block">
                                Platform: {del.platform}
                              </span>
                            )}
                            {del.description && (
                              <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-800/40">
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
          <div className="lg:col-span-5 space-y-6">
            {/* FTC Warnings */}
            <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
              <CardHeader className="border-b border-zinc-900/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  FTC Compliance Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {brief.parsedData?.ftcFlags?.length === 0 ? (
                  <div className="flex items-center gap-3 text-emerald-400 text-xs bg-emerald-950/10 p-3.5 border border-emerald-500/20 rounded-xl">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>Brief complies with standard FTC / ASA disclosure guidelines.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {brief.parsedData?.ftcFlags?.map((flag: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-rose-950/10 border border-rose-500/20 rounded-xl space-y-1.5"
                      >
                        <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider block">
                          Rule: {flag.rule}
                        </span>
                        <p className="text-zinc-300 text-xs leading-normal">
                          {flag.warning}
                        </p>
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
              <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
                {/* Do list */}
                <div className="space-y-3">
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> Do&apos;s
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-300 list-disc pl-4">
                    {brief.parsedData?.dos?.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    )) || <span className="text-zinc-500 italic block">None specified</span>}
                  </ul>
                </div>

                {/* Don't list */}
                <div className="space-y-3">
                  <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ThumbsDown className="w-3.5 h-3.5" /> Don&apos;ts
                  </span>
                  <ul className="space-y-2 text-xs text-zinc-300 list-disc pl-4">
                    {brief.parsedData?.donts?.map((item: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    )) || <span className="text-zinc-500 italic block">None specified</span>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Deadlines */}
            <Card variant="glass" className="border-zinc-800/80 bg-zinc-950/20">
              <CardHeader className="border-b border-zinc-900/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Key Campaign Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {brief.parsedData?.deadlines?.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">No deadlines specified in the brief.</p>
                ) : (
                  <div className="space-y-3.5">
                    {brief.parsedData?.deadlines?.map((dl: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl"
                      >
                        <span className="text-zinc-300 text-xs font-medium">{dl.event}</span>
                        <span className="text-purple-400 text-xs font-bold bg-purple-950/15 border border-purple-500/20 px-3 py-1 rounded-lg">
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
