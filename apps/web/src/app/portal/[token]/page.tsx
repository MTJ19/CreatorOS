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
  Upload,
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
  const [context, setContext] = React.useState<any | null>(null);
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
    fetchData();
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
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-foreground-muted text-sm font-medium">Loading Brand Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="space-y-4 text-center max-w-md w-full bg-background-surface border border-border p-8 rounded-2xl shadow-float">
          <AlertCircle className="w-12 h-12 text-danger mx-auto animate-pulse" />
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-foreground-muted text-sm">{error || 'This brand portal link is inactive or incorrect.'}</p>
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
    <div className="relative min-h-screen bg-background text-foreground pb-12 transition-colors duration-200">
      <GlowBackground className="opacity-30" />

      {/* Top Banner / Header */}
      <header className="border-b border-border/60 bg-background-surface/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-muted flex items-center justify-center border border-primary/20 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Brand Review Portal
                <span className="text-foreground-muted font-normal text-sm">for {brandName}</span>
              </h1>
              <p className="text-foreground-muted text-xs">
                Deal: <span className="font-semibold text-foreground">{dealTitle || 'Deliverables & Brief'}</span> • Managed by {creatorDisplayName || 'Creator'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-foreground-muted block font-semibold uppercase tracking-wider">Approval Status</span>
              <span className="inline-block mt-0.5">
                <Badge variant={getStatusBadgeVariant(currentStatus) as any} dot>
                  {getStatusLabel(currentStatus)}
                </Badge>
              </span>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div className="text-right">
              <span className="text-[10px] text-foreground-muted block font-semibold uppercase tracking-wider">Access Expires</span>
              <span className="text-xs font-semibold text-white flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-warning" />
                {new Date(expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Deliverables checklist & Brief submission */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Brand Welcome Note if present */}
          {brandNote && (
            <Card variant="glass" className="border-primary/20 bg-primary-muted/5">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-white mb-1">Creator's Note</h3>
                <p className="text-foreground-muted text-sm leading-relaxed italic">"{brandNote}"</p>
              </CardContent>
            </Card>
          )}

          {/* Deliverables Checklist */}
          <Card variant="glass">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Deliverables Checklist
              </CardTitle>
              <CardDescription>Review status of deliverables proposed for this campaign.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {deliverables.length === 0 ? (
                <div className="p-8 text-center text-foreground-muted text-sm">
                  No deliverables specified for this deal.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {deliverables.map((item: any) => (
                    <div key={item.id} className="p-5 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {item.type.replace('_', ' ')}
                        </span>
                        {item.description && (
                          <p className="text-sm text-foreground font-medium leading-relaxed">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Due {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant={item.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
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
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Campaign Brief
              </CardTitle>
              <CardDescription>
                Provide or update details of the campaign brief (PDF, DOCX, or Google Doc Link).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Existing Submission status */}
              {(briefDoc || briefFile) && (
                <div className="p-4 bg-background-elevated/50 border border-border/80 rounded-xl space-y-3">
                  <span className="text-[10px] text-foreground-muted block font-semibold uppercase tracking-wider">
                    Current Submitted Brief
                  </span>
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    {briefDoc && (
                      <a
                        href={briefDoc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline font-semibold"
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        Google Doc Brief
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    )}
                    {briefFile && (
                      <a
                        href={briefFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline font-semibold"
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        Uploaded File Brief
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    )}
                    {submission.submittedAt && (
                      <span className="text-xs text-foreground-subtle">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {submission.revisionNotes && (
                    <div className="pt-2 border-t border-border/40 text-xs">
                      <span className="text-foreground-muted font-bold block mb-1">Brief Notes:</span>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{submission.revisionNotes}</p>
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
                  <span className="relative bg-background px-3 text-xs text-foreground-muted uppercase font-bold">OR</span>
                </div>

                {/* Google Doc form */}
                <form onSubmit={handleBriefSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="google-doc-url" className="text-xs font-bold text-foreground-muted uppercase tracking-wider block">
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
                    <label htmlFor="notes" className="text-xs font-bold text-foreground-muted uppercase tracking-wider block">
                      Add Brief Notes / Instructions
                    </label>
                    <textarea
                      id="notes"
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Provide any context, key requirements, or notes about this brief version..."
                      rows={3}
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
        <div className="lg:col-span-5 space-y-8">
          
          {/* Approval Decision Card */}
          <Card variant="glass" className="border-primary/20">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-base">Approval & Review</CardTitle>
              <CardDescription>
                Set the status of this campaign. Setting a state notifies the creator.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleApprovalChange('APPROVED')}
                  variant={currentStatus === 'APPROVED' ? 'primary' : 'secondary'}
                  disabled={updatingApproval}
                  className="w-full justify-start h-11 px-4 text-left font-bold"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2 shrink-0 text-emerald-400" />
                  Approve Deliverables
                </Button>
                
                <Button
                  onClick={() => handleApprovalChange('APPROVED_WITH_CHANGES')}
                  variant={currentStatus === 'APPROVED_WITH_CHANGES' ? 'primary' : 'secondary'}
                  disabled={updatingApproval}
                  className="w-full justify-start h-11 px-4 text-left font-bold"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2 shrink-0 text-amber-400" />
                  Approve with Changes
                </Button>

                <Button
                  onClick={() => handleApprovalChange('REJECTED')}
                  variant={currentStatus === 'REJECTED' ? 'destructive' : 'secondary'}
                  disabled={updatingApproval}
                  className="w-full justify-start h-11 px-4 text-left font-bold"
                >
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-red-400" />
                  Request Revisions / Changes
                </Button>
              </div>

              {currentStatus !== 'PENDING_REVIEW' && (
                <div className="text-xs text-foreground-muted bg-background-elevated/40 border border-border/60 rounded-xl p-3 flex gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-primary" />
                  <span>
                    Status is currently <span className="font-bold text-white">{getStatusLabel(currentStatus)}</span>.
                    You can change the status at any time.
                  </span>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Feedback & Comments Feed */}
          <Card variant="glass" className="flex flex-col h-[500px]">
            <CardHeader className="border-b border-border/50 pb-4 flex-shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Collaboration Feed
              </CardTitle>
              <CardDescription>Discuss requirements directly with the creator.</CardDescription>
            </CardHeader>
            
            {/* Scrollable feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-foreground-muted p-8">
                  <MessageSquare className="w-8 h-8 mb-2 text-border-strong" />
                  <p className="text-sm font-semibold">No comments yet</p>
                  <p className="text-xs mt-1">Start the conversation by posting a comment below.</p>
                </div>
              ) : (
                comments.map((comment: any) => {
                  const isBrand = comment.author === 'BRAND';
                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        'flex flex-col max-w-[85%] rounded-2xl p-3 border text-sm',
                        isBrand
                          ? 'bg-primary-muted/15 border-primary/20 self-end ml-auto'
                          : 'bg-background-elevated/50 border-border/60 self-start mr-auto'
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted mb-1">
                        {isBrand ? (
                          <>
                            <Building2 className="w-3 h-3 text-primary" />
                            <span>Brand Feedback</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 text-accent" />
                            <span>{creatorDisplayName || 'Creator'}</span>
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

            {/* Input form */}
            <div className="p-4 border-t border-border/50 flex-shrink-0 bg-background-surface/40">
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Ask a question or request revisions..."
                  className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" loading={submittingComment} size="icon" className="shrink-0">
                  <Send className="w-4 h-4" />
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
