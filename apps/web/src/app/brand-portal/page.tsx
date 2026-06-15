'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  Link2,
  Plus,
  Trash2,
  Copy,
  Check,
  Building2,
  ExternalLink,
  MessageSquare,
  Clock,
  Eye,
  Send,
  X,
  User,
  FileText,
  AlertCircle,
  Activity,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { brandPortalApi, dealsApi } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface PortalDeal {
  id: string;
  title: string;
  brandName: string;
  stage?: string;
}

interface PortalSubmission {
  id: string;
  tokenId: string;
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'APPROVED_WITH_CHANGES' | 'REJECTED';
  revisionNotes: string | null;
  briefFileUrl: string | null;
  briefGoogleDocUrl: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
}

interface PortalComment {
  id: string;
  tokenId: string;
  author: 'CREATOR' | 'BRAND';
  body: string;
  createdAt: string;
  updatedAt?: string;
}

interface BrandPortalToken {
  id: string;
  creatorId: string;
  dealId?: string | null;
  token: string;
  brandName: string;
  brandEmail: string;
  permissions: string[];
  expiresAt: string;
  lastAccessedAt?: string | null;
  accessCount: number;
  isRevoked: boolean;
  createdAt: string;
  updatedAt: string;
  deal?: PortalDeal | null;
  submissions?: PortalSubmission[];
}

interface TokenActivity {
  id: string;
  brandName: string;
  brandEmail: string;
  deal?: PortalDeal | null;
  submissions: PortalSubmission[];
  comments: PortalComment[];
}

interface GeneratedTokenResponse {
  id: string;
  token: string;
  brandName: string;
  brandEmail: string;
  brandNote: string | null;
  permissions: string[];
  expiresAt: string;
  deal?: PortalDeal | null;
  portalUrl?: string;
}

export default function BrandPortalDashboard() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { toast } = useToast();

  // Data states
  const [tokens, setTokens] = React.useState<BrandPortalToken[]>([]);
  const [deals, setDeals] = React.useState<PortalDeal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form states
  const [brandName, setBrandName] = React.useState('');
  const [brandEmail, setBrandEmail] = React.useState('');
  const [selectedDealId, setSelectedDealId] = React.useState('');
  const [expiresInDays, setExpiresInDays] = React.useState(30);
  const [brandNote, setBrandNote] = React.useState('');
  const [permissions, setPermissions] = React.useState<string[]>([
    'VIEW_DELIVERABLES',
    'APPROVE_CONTENT',
  ]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showGenerateForm, setShowGenerateForm] = React.useState(false);

  // Drawer / Detail states
  const [selectedToken, setSelectedToken] = React.useState<BrandPortalToken | null>(null);
  const [selectedTokenActivity, setSelectedTokenActivity] = React.useState<TokenActivity | null>(null);
  const [activityLoading, setActivityLoading] = React.useState(false);
  const [commentBody, setCommentBody] = React.useState('');
  const [submittingComment, setSubmittingComment] = React.useState(false);

  // Copied token state
  const [copiedTokenId, setCopiedTokenId] = React.useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const [tokensList, dealsList] = await Promise.all([
        brandPortalApi.listTokens(accessToken) as Promise<BrandPortalToken[]>,
        dealsApi.getAll(accessToken) as Promise<PortalDeal[]>,
      ]);
      setTokens(tokensList);
      setDeals(dealsList);
    } catch (err) {
      console.error('Failed to load brand portal tokens', err);
      const errMsg = err instanceof Error ? err.message : 'Error loading dashboard data';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Token Generation
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!brandName.trim() || !brandEmail.trim()) {
      toast('Brand Name and Email are required', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      const payload = {
        brandName: brandName.trim(),
        brandEmail: brandEmail.trim(),
        dealId: selectedDealId || undefined,
        expiresInDays,
        permissions,
        brandNote: brandNote.trim() || undefined,
      };

      const result = await brandPortalApi.generateToken(accessToken, payload) as GeneratedTokenResponse;
      toast('Brand portal link generated successfully!', 'success');
      
      // Auto copy to clipboard
      if (result.portalUrl) {
        void navigator.clipboard.writeText(result.portalUrl);
        toast('Portal URL copied to clipboard!', 'info');
      }

      // Reset form
      setBrandName('');
      setBrandEmail('');
      setSelectedDealId('');
      setBrandNote('');
      setShowGenerateForm(false);

      // Re-fetch tokens
      const updatedTokens = await brandPortalApi.listTokens(accessToken) as BrandPortalToken[];
      setTokens(updatedTokens);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to generate link';
      toast(errMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Token Revocation
  const handleRevokeToken = async (tokenId: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to revoke this link? The brand will lose access immediately.')) {
      return;
    }
    try {
      await brandPortalApi.revokeToken(accessToken, tokenId);
      toast('Link access revoked', 'success');
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to revoke token';
      toast(errMsg, 'error');
    }
  };

  // Toggle permissions checkbox
  const handlePermissionToggle = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // Copy URL action
  const handleCopyLink = (tokenId: string, url: string) => {
    void navigator.clipboard.writeText(url);
    setCopiedTokenId(tokenId);
    toast('Link copied!', 'success');
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  // Open drawer and load activity
  const handleViewActivity = async (token: BrandPortalToken) => {
    if (!accessToken) return;
    setSelectedToken(token);
    try {
      setActivityLoading(true);
      const activity = await brandPortalApi.getActivity(accessToken, token.id) as TokenActivity;
      setSelectedTokenActivity(activity);
    } catch {
      toast('Failed to load portal activity', 'error');
    } finally {
      setActivityLoading(false);
    }
  };

  // Submit creator comment reply inside the drawer
  const handleCreatorCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedToken || !commentBody.trim()) return;
    try {
      setSubmittingComment(true);
      const comment = await brandPortalApi.addCreatorComment(accessToken, selectedToken.id, commentBody.trim()) as PortalComment;
      toast('Comment posted', 'success');
      setCommentBody('');
      // Update local activity state
      setSelectedTokenActivity((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...(prev.comments || []), comment],
        };
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to post reply';
      toast(errMsg, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-xl font-bold text-white">Error Loading Portal Dashboard</h2>
        <p className="text-foreground-muted text-sm">{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <GlowBackground className="opacity-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Portal Manager</h1>
          <p className="mt-1 text-foreground-muted">
            Share secure links with brands to review briefs, track deliverables, and share live collaboration notes.
          </p>
        </div>
        <Button onClick={() => setShowGenerateForm(!showGenerateForm)} className="shadow-glow-sm self-start">
          <Plus className="w-4 h-4 mr-2" />
          {showGenerateForm ? 'View Links' : 'Create Portal Link'}
        </Button>
      </div>

      {/* Generate Link Form */}
      {showGenerateForm && (
        <Card variant="glass" className="border-primary/20 max-w-2xl">
          <CardHeader>
            <CardTitle>Create Brand Access Link</CardTitle>
            <CardDescription>
              Generates a secure, expiring URL scoped to a single deal. The brand can submit briefs and request edits.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleGenerateToken} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Brand Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nike, Notion"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Brand Contact Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sponsor@brand.com"
                    value={brandEmail}
                    onChange={(e) => setBrandEmail(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Link Expiration
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Associated Deal (Optional)
                  </label>
                  <select
                    value={selectedDealId}
                    onChange={(e) => setSelectedDealId(e.target.value)}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring animate-pulse"
                  >
                    <option value="">No deal — General Access</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.title} ({deal.brandName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions Checkbox Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Access Scope & Permissions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-background-elevated/40 border border-border/60 p-4 rounded-xl">
                  {[
                    { val: 'VIEW_DELIVERABLES', label: 'View Checklist & Due Dates' },
                    { val: 'APPROVE_CONTENT', label: 'Approve & Request Changes' },
                    { val: 'VIEW_PERFORMANCE', label: 'View Analytics & Metrics' },
                    { val: 'VIEW_INVOICES', label: 'View Associated Invoices' },
                    { val: 'DOWNLOAD_ASSETS', label: 'Download Deliverable Media Files' },
                  ].map((perm) => (
                    <label key={perm.val} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.val)}
                        onChange={() => handlePermissionToggle(perm.val)}
                        className="rounded border-border bg-input text-primary focus:ring-ring"
                      />
                      <span className="text-foreground-muted hover:text-white font-medium transition-colors">
                        {perm.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Add Note for the Brand (Optional)
                </label>
                <textarea
                  value={brandNote}
                  onChange={(e) => setBrandNote(e.target.value)}
                  placeholder="A welcome message, checklist context, or greeting that displays on their portal header..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowGenerateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isGenerating}>
                  Generate Portal URL
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Portal Links Table / Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Active Portal Links ({tokens.length})
        </h2>

        {tokens.length === 0 ? (
          <EmptyState
            title="No Active Brand Links"
            description="You haven't generated any portal access links yet. Create one to collaborate directly with brands."
            icon={Globe}
            actionLabel="Generate Access Link"
            onActionClick={() => setShowGenerateForm(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((tok) => {
              const latestSubmission = tok.submissions?.[0];
              const displayUrl = `${window.location.origin}/portal/${tok.token}`;

              return (
                <Card
                  key={tok.id}
                  variant="glass"
                  className="flex flex-col justify-between hover:border-primary/40 transition-colors duration-200"
                >
                  <CardHeader className="pb-3 border-b border-border/30">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-white text-base truncate">{tok.brandName}</h3>
                      <Badge variant={latestSubmission?.approvalStatus === 'APPROVED' ? 'success' : 'info'} size="sm">
                        {latestSubmission ? latestSubmission.approvalStatus.replace('_', ' ') : 'NO SUBMISSION'}
                      </Badge>
                    </div>
                    <CardDescription className="truncate text-xs">{tok.brandEmail}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 space-y-4">
                    {tok.deal && (
                      <div className="text-xs">
                        <span className="text-foreground-muted block font-semibold uppercase tracking-wider text-[10px]">
                          Deal Scope
                        </span>
                        <span className="font-bold text-white">{tok.deal.title}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-foreground-muted block font-semibold uppercase tracking-wider text-[10px]">
                          Clicks
                        </span>
                        <span className="font-bold text-white font-mono">{tok.accessCount || 0} clicks</span>
                      </div>
                      <div>
                        <span className="text-foreground-muted block font-semibold uppercase tracking-wider text-[10px]">
                          Expires
                        </span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-warning shrink-0" />
                          {new Date(tok.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Card Footer Actions */}
                  <div className="p-4 border-t border-border/30 flex gap-2 bg-background-elevated/25">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyLink(tok.id, displayUrl)}
                      className="flex-1 justify-center"
                    >
                      {copiedTokenId === tok.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewActivity(tok)}
                      className="px-3"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeToken(tok.id)}
                      className="text-danger hover:bg-danger-muted/20 px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Activity Feed Panel */}
      {selectedToken && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setSelectedToken(null);
              setSelectedTokenActivity(null);
            }}
          />

          {/* Activity Drawer */}
          <div className="relative w-full max-w-xl bg-background-overlay border-l border-border/60 shadow-float-lg h-full flex flex-col z-10 animate-slide-in-right">
            
            {/* Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Activity: {selectedToken.brandName}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  View brief feedback and discussions for this link.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedToken(null);
                  setSelectedTokenActivity(null);
                }}
                className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-muted hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activityLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-36" />
                  <Skeleton className="h-12" />
                </div>
              ) : selectedTokenActivity ? (
                <>
                  {/* Latest Submission Card */}
                  <Card variant="outlined" className="p-4 border-border/60 bg-background-elevated/15">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                      Brand Submission Overview
                    </h4>
                    {selectedTokenActivity.submissions?.length > 0 ? (
                      (() => {
                        const sub = selectedTokenActivity.submissions[0];
                        return (
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground-muted">Approval Status:</span>
                              <Badge variant={latestApprovalStatusVariant(sub.approvalStatus)}>
                                {sub.approvalStatus.replace('_', ' ')}
                              </Badge>
                            </div>
                            {(sub.briefGoogleDocUrl ?? sub.briefFileUrl) && (
                              <div className="space-y-1.5">
                                <span className="text-xs text-foreground-muted block">Submitted Brief:</span>
                                <div className="flex flex-wrap gap-2">
                                  {sub.briefGoogleDocUrl && (
                                    <a
                                      href={sub.briefGoogleDocUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-border text-xs text-primary rounded-lg hover:bg-zinc-800"
                                    >
                                      <Globe className="w-3.5 h-3.5" />
                                      Google Doc
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {sub.briefFileUrl && (
                                    <a
                                      href={sub.briefFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-border text-xs text-primary rounded-lg hover:bg-zinc-800"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Brief File
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            {sub.revisionNotes && (
                              <div className="pt-2 border-t border-border/40 text-xs">
                                <span className="text-foreground-muted font-bold block mb-1">Brand Notes:</span>
                                <p className="text-foreground leading-normal bg-background-overlay p-2.5 rounded-lg border border-border/50">
                                  {sub.revisionNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-foreground-muted">No briefs or approvals submitted yet.</p>
                    )}
                  </Card>

                  {/* Collaboration Comment Stream */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Collaboration Feed
                    </h4>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto bg-background-elevated/20 p-4 border border-border/60 rounded-xl scrollbar-hide">
                      {(!selectedTokenActivity.comments || selectedTokenActivity.comments.length === 0) ? (
                        <p className="text-xs text-foreground-muted text-center py-6">No messages posted yet.</p>
                      ) : (
                        selectedTokenActivity.comments.map((comment) => {
                          const isBrand = comment.author === 'BRAND';
                          return (
                            <div
                              key={comment.id}
                              className={cn(
                                'flex flex-col max-w-[85%] rounded-xl p-3 border text-xs',
                                !isBrand
                                  ? 'bg-primary-muted/15 border-primary/20 self-end ml-auto'
                                  : 'bg-background-elevated/50 border-border/60 self-start mr-auto'
                              )}
                            >
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground-muted mb-1">
                                {isBrand ? (
                                  <>
                                    <Building2 className="w-3 h-3 text-primary" />
                                    <span>Brand</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3 h-3 text-accent" />
                                    <span>You</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-foreground leading-normal whitespace-pre-wrap">{comment.body}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Creator comment submission */}
                    <form onSubmit={handleCreatorCommentSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Type a reply to the brand..."
                        className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Button type="submit" loading={submittingComment} size="sm" className="shrink-0">
                        <Send className="w-3.5 h-3.5" />
                        <span className="sr-only">Reply</span>
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground-muted">Failed to fetch link details.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Quick status badge resolver
function latestApprovalStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'APPROVED_WITH_CHANGES':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'PENDING_REVIEW':
    default:
      return 'info';
  }
}
