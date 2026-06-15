'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Loader2,
  MessageSquare,
  Send,
  Globe,
  ExternalLink,
  ShieldCheck,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { publicPortalApi } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { UploadZone } from '@/components/ui/upload-zone';

export default function PublicBrandPortal() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const { toast } = useToast();

  // Data states
  const [context, setContext] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form states
  const [googleDocUrl, setGoogleDocUrl] = React.useState('');
  const [revisionNotes, setRevisionNotes] = React.useState('');
  const [commentBody, setCommentBody] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [submittingBrief, setSubmittingBrief] = React.useState(false);
  const [submittingComment, setSubmittingComment] = React.useState(false);
  const [updatingApproval, setUpdatingApproval] = React.useState(false);

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await publicPortalApi.getContext(token);
      setContext(data);
      // Pre-populate google doc link if exists
      if (data.submission?.briefGoogleDocUrl) {
        setGoogleDocUrl(data.submission.briefGoogleDocUrl);
      }
    } catch (err: any) {
      console.error('Failed to load portal context', err);
      setError(err.message || 'Error fetching portal details. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Handle Google Doc Brief submission
  const handleBriefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleDocUrl.trim()) {
      toast('Please enter a Google Doc URL', 'error');
      return;
    }
    try {
      setSubmittingBrief(true);
      await publicPortalApi.submitBrief(token, {
        googleDocUrl: googleDocUrl.trim(),
        revisionNotes: revisionNotes.trim(),
      });
      toast('Brief details submitted successfully!', 'success');
      // Re-fetch context to reflect changes
      const updated = await publicPortalApi.getContext(token);
      setContext(updated);
      setRevisionNotes('');
    } catch (err: any) {
      toast(err.message || 'Failed to submit brief', 'error');
    } finally {
      setSubmittingBrief(false);
    }
  };

  // Handle File Brief upload
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      await publicPortalApi.uploadBriefFile(token, file, revisionNotes.trim());
      toast('Brief file uploaded successfully!', 'success');
      // Re-fetch context
      const updated = await publicPortalApi.getContext(token);
      setContext(updated);
      setRevisionNotes('');
    } catch (err: any) {
      toast(err.message || 'Failed to upload brief file', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle Approval Status Change
  const handleApprovalChange = async (status: string) => {
    try {
      setUpdatingApproval(true);
      await publicPortalApi.setApproval(token, {
        approvalStatus: status,
        revisionNotes: revisionNotes.trim() || undefined,
      });
      toast(`Approval status updated to ${status.replace('_', ' ')}`, 'success');
      // Re-fetch context
      const updated = await publicPortalApi.getContext(token);
      setContext(updated);
      setRevisionNotes('');
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingApproval(false);
    }
  };

  // Handle Comments submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    try {
      setSubmittingComment(true);
      const newComment = await publicPortalApi.addComment(token, commentBody.trim());
      toast('Comment posted', 'success');
      setCommentBody('');
      // Optimistically append comment
      setContext((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        };
      });
    } catch (err: any) {
      toast(err.message || 'Failed to submit comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground-muted">Loading Brand Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-background-surface p-8 text-center shadow-float">
          <AlertCircle className="mx-auto h-12 w-12 animate-pulse text-danger" />
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-foreground-muted">
            {error || 'This brand portal link is inactive or incorrect.'}
          </p>
        </div>
      </div>
    );
  }

  const {
    brandName,
    brandNote,
    expiresAt,
    dealTitle,
    creatorDisplayName,
    deliverables = [],
    submission,
    comments = [],
  } = context;

  const currentStatus = submission?.approvalStatus || 'PENDING_REVIEW';
  const briefDoc = submission?.briefGoogleDocUrl;
  const briefFile = submission?.briefFileUrl;

  const getStatusBadgeVariant = (status: string) => {
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
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'APPROVED_WITH_CHANGES':
        return 'Approved with Changes';
      case 'REJECTED':
        return 'Revision Requested';
      case 'PENDING_REVIEW':
      default:
        return 'Pending Review';
    }
  };

  return (
    <div className="relative min-h-screen bg-background pb-12 text-foreground transition-colors duration-200">
      <GlowBackground className="opacity-30" />

      {/* Top Banner / Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background-surface/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary-muted text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
                Brand Review Portal
                <span className="text-sm font-normal text-foreground-muted">for {brandName}</span>
              </h1>
              <p className="text-xs text-foreground-muted">
                Deal:{' '}
                <span className="font-semibold text-foreground">
                  {dealTitle || 'Deliverables & Brief'}
                </span>{' '}
                • Managed by {creatorDisplayName || 'Creator'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Approval Status
              </span>
              <span className="mt-0.5 inline-block">
                <Badge variant={getStatusBadgeVariant(currentStatus) as any} dot>
                  {getStatusLabel(currentStatus)}
                </Badge>
              </span>
            </div>
            <div className="hidden h-10 w-px bg-border sm:block" />
            <div className="text-right">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                Access Expires
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-white">
                <Clock className="h-3.5 w-3.5 text-warning" />
                {new Date(expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-8 px-4 md:px-6 lg:grid-cols-12">
        {/* Left Column - Deliverables checklist & Brief submission */}
        <div className="space-y-8 lg:col-span-7">
          {/* Brand Welcome Note if present */}
          {brandNote && (
            <Card variant="glass" className="border-primary/20 bg-primary-muted/5">
              <CardContent className="p-5">
                <h3 className="mb-1 text-sm font-bold text-white">Creator's Note</h3>
                <p className="text-sm italic leading-relaxed text-foreground-muted">
                  "{brandNote}"
                </p>
              </CardContent>
            </Card>
          )}

          {/* Deliverables Checklist */}
          <Card variant="glass">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Deliverables Checklist
              </CardTitle>
              <CardDescription>
                Review status of deliverables proposed for this campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {deliverables.length === 0 ? (
                <div className="p-8 text-center text-sm text-foreground-muted">
                  No deliverables specified for this deal.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {deliverables.map((item: any) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 p-5">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {item.type.replace('_', ' ')}
                        </span>
                        {item.description && (
                          <p className="text-sm font-medium leading-relaxed text-foreground">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Due{' '}
                            {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={item.status === 'COMPLETED' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brief Upload & Submission */}
          <Card variant="glass">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Campaign Brief
              </CardTitle>
              <CardDescription>
                Provide or update details of the campaign brief (PDF, DOCX, or Google Doc Link).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Existing Submission status */}
              {(briefDoc || briefFile) && (
                <div className="space-y-3 rounded-xl border border-border/80 bg-background-elevated/50 p-4">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Current Submitted Brief
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {briefDoc && (
                      <a
                        href={briefDoc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4 shrink-0" />
                        Google Doc Brief
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    )}
                    {briefFile && (
                      <a
                        href={briefFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        Uploaded File Brief
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    )}
                    {submission.submittedAt && (
                      <span className="text-xs text-foreground-subtle">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {submission.revisionNotes && (
                    <div className="border-t border-border/40 pt-2 text-xs">
                      <span className="mb-1 block font-bold text-foreground-muted">
                        Brief Notes:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                        {submission.revisionNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Upload New Brief Version</h4>

                {/* File Upload Zone */}
                <UploadZone
                  onFileSelect={handleFileUpload}
                  isLoading={uploading}
                  loadingText="Uploading brief file..."
                />

                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <span className="relative bg-background px-3 text-xs font-bold uppercase text-foreground-muted">
                    OR
                  </span>
                </div>

                {/* Google Doc form */}
                <form onSubmit={handleBriefSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="google-doc-url"
                      className="block text-xs font-bold uppercase tracking-wider text-foreground-muted"
                    >
                      Google Doc Link
                    </label>
                    <input
                      id="google-doc-url"
                      type="url"
                      value={googleDocUrl}
                      onChange={(e) => setGoogleDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="notes"
                      className="block text-xs font-bold uppercase tracking-wider text-foreground-muted"
                    >
                      Add Brief Notes / Instructions
                    </label>
                    <textarea
                      id="notes"
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Provide any context, key requirements, or notes about this brief version..."
                      rows={3}
                      className="w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" loading={submittingBrief} className="w-full sm:w-auto">
                      Submit Google Doc & Notes
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status Approval & Discussion Thread */}
        <div className="space-y-8 lg:col-span-5">
          {/* Approval Decision Card */}
          <Card variant="glass" className="border-primary/20">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-base">Approval & Review</CardTitle>
              <CardDescription>
                Set the status of this campaign. Setting a state notifies the creator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleApprovalChange('APPROVED')}
                  variant={currentStatus === 'APPROVED' ? 'primary' : 'secondary'}
                  disabled={updatingApproval}
                  className="h-11 w-full justify-start px-4 text-left font-bold"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5 shrink-0 text-emerald-400" />
                  Approve Deliverables
                </Button>

                <Button
                  onClick={() => handleApprovalChange('APPROVED_WITH_CHANGES')}
                  variant={currentStatus === 'APPROVED_WITH_CHANGES' ? 'primary' : 'secondary'}
                  disabled={updatingApproval}
                  className="h-11 w-full justify-start px-4 text-left font-bold"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5 shrink-0 text-amber-400" />
                  Approve with Changes
                </Button>

                <Button
                  onClick={() => handleApprovalChange('REJECTED')}
                  variant={currentStatus === 'REJECTED' ? 'destructive' : 'secondary'}
                  disabled={updatingApproval}
                  className="h-11 w-full justify-start px-4 text-left font-bold"
                >
                  <AlertCircle className="mr-2 h-5 w-5 shrink-0 text-red-400" />
                  Request Revisions / Changes
                </Button>
              </div>

              {currentStatus !== 'PENDING_REVIEW' && (
                <div className="flex gap-2 rounded-xl border border-border/60 bg-background-elevated/40 p-3 text-xs text-foreground-muted">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Status is currently{' '}
                    <span className="font-bold text-white">{getStatusLabel(currentStatus)}</span>.
                    You can change the status at any time.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback & Comments Feed */}
          <Card variant="glass" className="flex h-[500px] flex-col">
            <CardHeader className="flex-shrink-0 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-primary" />
                Collaboration Feed
              </CardTitle>
              <CardDescription>Discuss requirements directly with the creator.</CardDescription>
            </CardHeader>

            {/* Scrollable feed */}
            <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4">
              {comments.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-foreground-muted">
                  <MessageSquare className="mb-2 h-8 w-8 text-border-strong" />
                  <p className="text-sm font-semibold">No comments yet</p>
                  <p className="mt-1 text-xs">Start the conversation by posting a comment below.</p>
                </div>
              ) : (
                comments.map((comment: any) => {
                  const isBrand = comment.author === 'BRAND';
                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        'flex max-w-[85%] flex-col rounded-2xl border p-3 text-sm',
                        isBrand
                          ? 'ml-auto self-end border-primary/20 bg-primary-muted/15'
                          : 'mr-auto self-start border-border/60 bg-background-elevated/50',
                      )}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted">
                        {isBrand ? (
                          <>
                            <Building2 className="h-3 w-3 text-primary" />
                            <span>Brand Feedback</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 text-accent" />
                            <span>{creatorDisplayName || 'Creator'}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-normal text-foreground">
                        {comment.body}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input form */}
            <div className="flex-shrink-0 border-t border-border/50 bg-background-surface/40 p-4">
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Ask a question or request revisions..."
                  className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" loading={submittingComment} size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
