import { useState } from 'react'
import { 
  Building2, 
  CheckCircle2, 
  ExternalLink, 
  MessageSquare, 
  FileCheck, 
  CreditCard,
  Lock,
  ArrowLeft
} from 'lucide-react'

interface BrandPortalProps {
  token?: string;
  onExitPortal?: () => void;
}

export default function BrandPortalView({ token = 'token_titan_magic_9831', onExitPortal }: BrandPortalProps) {
  const [deliverables, setDeliverables] = useState([
    {
      id: 'del-1',
      title: 'Dedicated YouTube Product Showcase (60-90s)',
      creator: 'Alex Rivera',
      status: 'submitted', // 'submitted' | 'approved' | 'changes_requested'
      submissionUrl: 'https://loom.com/share/draft-v1-titan-integration',
      submittedAt: 'Today, 2:15 PM'
    },
    {
      id: 'del-2',
      title: 'Instagram 9:16 Reel Cutdown',
      creator: 'Alex Rivera',
      status: 'approved',
      submissionUrl: 'https://instagram.com/reel/draft_sample',
      submittedAt: 'Yesterday'
    }
  ])

  const [feedbackInput, setFeedbackInput] = useState('')
  const [activeDelivIdForFeedback, setActiveDelivIdForFeedback] = useState<string | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)

  const handleApprove = (id: string) => {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d))
  }

  const handleSendChanges = (id: string) => {
    if (!feedbackInput.trim()) return
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, status: 'changes_requested' } : d))
    setFeedbackSent(true)
    setTimeout(() => {
      setFeedbackSent(false)
      setActiveDelivIdForFeedback(null)
      setFeedbackInput('')
    }, 2000)
  }

  return (
    <div className="brand-portal-container max-w-5xl mx-auto py-4">
      {/* Brand Header */}
      <header className="brand-portal-header glass-card mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan/15 border border-cyan/40 text-cyan">
            <Building2 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-main">Titan Tech Corp — Brand Portal</h1>
              <span className="badge-success text-2xs flex items-center gap-1">
                <Lock size={10} /> Verified Magic Link
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">White-labeled sponsor portal • Session Token: <code className="text-accent font-mono">{token}</code></p>
          </div>
        </div>

        {onExitPortal && (
          <button 
            type="button" 
            className="btn-secondary text-xs flex items-center gap-1.5" 
            onClick={onExitPortal}
          >
            <ArrowLeft size={13} />
            <span>Return to Workspace</span>
          </button>
        )}
      </header>

      <div className="grid-2-col">
        {/* Deliverables Review Column */}
        <div className="space-y-4">
          <div className="glass-card">
            <h2 className="card-title mb-4 flex items-center justify-between">
              <span>Campaign Deliverables Review</span>
              <span className="text-2xs text-muted font-mono">{deliverables.filter(d => d.status === 'approved').length} of {deliverables.length} Approved</span>
            </h2>

            <div className="space-y-3">
              {deliverables.map(del => (
                <div key={del.id} className="brand-deliv-card p-4 rounded-xl border border-border bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-main">{del.title}</h3>
                      <span className="text-2xs text-muted">Submitted by {del.creator} • {del.submittedAt}</span>
                    </div>
                    <span className={`badge-pill text-2xs ${del.status === 'approved' ? 'badge-success' : del.status === 'changes_requested' ? 'badge-warning' : 'badge-primary'}`}>
                      {del.status === 'approved' ? '✓ Approved' : del.status === 'changes_requested' ? '📝 Changes Requested' : '⏳ Ready for Review'}
                    </span>
                  </div>

                  {/* Submission Link Preview */}
                  <div className="p-3 bg-dark/70 rounded-lg border border-border/60 my-3 flex justify-between items-center">
                    <span className="text-xs text-muted truncate max-w-xs font-mono">{del.submissionUrl}</span>
                    <a 
                      href={del.submissionUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn-secondary text-2xs py-1 px-2.5 flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Preview Draft
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end mt-2">
                    {del.status !== 'approved' && (
                      <>
                        <button
                          type="button"
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                          onClick={() => setActiveDelivIdForFeedback(activeDelivIdForFeedback === del.id ? null : del.id)}
                        >
                          <MessageSquare size={13} /> Request Revisions
                        </button>
                        <button
                          type="button"
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          onClick={() => handleApprove(del.id)}
                        >
                          <CheckCircle2 size={13} /> Approve Deliverable
                        </button>
                      </>
                    )}
                  </div>

                  {/* Inline Revisions Feedback Form */}
                  {activeDelivIdForFeedback === del.id && (
                    <div className="revisions-feedback-box mt-3 p-3 bg-dark/90 rounded-xl border border-warning/40">
                      <label className="text-xs font-bold text-warning block mb-1">Specify Required Edits (Round 1 of 2):</label>
                      <textarea
                        className="form-textarea w-full text-xs"
                        rows={3}
                        value={feedbackInput}
                        onChange={e => setFeedbackInput(e.target.value)}
                        placeholder="e.g. Please adjust the CTA placement to appear at 0:45 and mention the 20% discount code."
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          type="button" 
                          className="btn-primary text-xs py-1 px-3"
                          onClick={() => handleSendChanges(del.id)}
                        >
                          Submit Revision Request
                        </button>
                      </div>
                      {feedbackSent && (
                        <span className="text-2xs text-success block mt-1">✓ Changes sent to talent operations team!</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contract & Invoicing Overview */}
        <div className="space-y-4">
          <div className="glass-card">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <FileCheck size={18} className="text-accent" />
              Sponsorship Agreement Terms
            </h2>

            <div className="terms-summary-list text-xs space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted">Agreement Status</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <CheckCircle2 size={12} /> E-Signed & Active
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted">Commercial Usage Rights</span>
                <span className="font-semibold text-main">6 Months Digital Social</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted">Exclusivity Window</span>
                <span className="font-semibold text-main">30 Days Category Specific</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted">Allowed Creative Revisions</span>
                <span className="font-semibold text-main">2 Rounds Total</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">Agreed Compensation</span>
                <span className="font-bold text-success font-mono">$8,500 USD (Net 30)</span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h2 className="card-title mb-3 flex items-center gap-2">
              <CreditCard size={18} className="text-accent" />
              Invoicing & Payment Rail
            </h2>
            <div className="p-3.5 rounded-xl bg-card border border-border flex justify-between items-center text-xs">
              <div>
                <strong className="text-main block">Invoice #INV-2026-904</strong>
                <span className="text-muted">Net 30 terms • Due upon milestone signoff</span>
              </div>
              <span className="badge-pill-success text-2xs">Pending Final Approval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
