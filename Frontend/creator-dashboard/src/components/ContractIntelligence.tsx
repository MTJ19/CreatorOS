import { useState } from 'react'
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  ArrowRight,
  Bot
} from 'lucide-react'

export interface ClauseScanResult {
  id: string;
  category: 'payment' | 'usage_rights' | 'exclusivity' | 'revisions' | 'termination' | 'kill_fee';
  name: string;
  clauseText: string;
  riskLevel: 'clean' | 'warning' | 'red_flag';
  riskReason: string;
  plainLanguageExplanation: string;
  recommendedRevision: string;
}

const SAMPLE_CLAUSES: ClauseScanResult[] = [
  {
    id: 'cl-1',
    category: 'usage_rights',
    name: 'Commercial Usage Rights & Paid Boosting',
    clauseText: 'Brand shall have the perpetual, irrevocable, worldwide, royalty-free right to use, reproduce, broadcast, display, adapt, and run paid digital advertising ("whitelisting") using Creator\'s name, image, voice, and deliverables across all media channels now known or hereafter devised.',
    riskLevel: 'red_flag',
    riskReason: 'Perpetual & Unpaid Whitelisting: Brand acquires indefinite ad rights without recurring compensation or expiration.',
    plainLanguageExplanation: 'This clause lets the brand run paid ads with your face forever without paying you anything after the initial campaign fee.',
    recommendedRevision: 'Limit usage rights to 6 months from publish date. Paid whitelisting/boosting must be restricted to 30 days and billed at +30% monthly retainer.'
  },
  {
    id: 'cl-2',
    category: 'exclusivity',
    name: 'Exclusivity & Non-Compete Scope',
    clauseText: 'Creator agrees not to create, sponsor, promote, or appear in any media for any commercial entity, software tool, or consumer brand for a period of 180 days following the publication of the deliverable.',
    riskLevel: 'red_flag',
    riskReason: 'Excessive Total Exclusivity: 6-month non-compete across all commercial entities locks out all future sponsorship revenue.',
    plainLanguageExplanation: 'You are blocked from taking ANY brand deals or sponsors for 6 months, not just direct competitors.',
    recommendedRevision: 'Narrow exclusivity strictly to direct category competitors (e.g. named competing apps) and limit duration to 30 days.'
  },
  {
    id: 'cl-3',
    category: 'revisions',
    name: 'Creative Revisions & Reshoots',
    clauseText: 'Creator shall provide revisions, re-edits, and reshoots upon Brand\'s request until Brand expresses full satisfaction with the creative output.',
    riskLevel: 'warning',
    riskReason: 'Unlimited Revisions: No cap on revision rounds exposes creator to unbounded scope creep without extra billing.',
    plainLanguageExplanation: 'The brand can demand endless edits and entire reshoots for free until they are happy.',
    recommendedRevision: 'Cap standard revisions at 2 rounds of minor editing. Additional rounds or full reshoots billed at $500/round.'
  },
  {
    id: 'cl-4',
    category: 'kill_fee',
    name: 'Campaign Cancellation & Kill Fee',
    clauseText: 'Brand may terminate this agreement at any time prior to publication without cause. Creator will receive 50% kill fee if scripted concepts were already delivered.',
    riskLevel: 'clean',
    riskReason: 'Standard Fair Terms: 50% kill fee protects baseline production effort.',
    plainLanguageExplanation: 'If the brand cancels after you write the script, they must still pay you 50% of the agreed deal.',
    recommendedRevision: 'Clause is acceptable as drafted.'
  },
  {
    id: 'cl-5',
    category: 'payment',
    name: 'Payment Terms & Invoicing',
    clauseText: 'Payment of $8,500 USD shall be remitted via wire transfer within 30 days following verified delivery and brand signoff (Net 30).',
    riskLevel: 'clean',
    riskReason: 'Standard Net 30 timeline with verified payout rail.',
    plainLanguageExplanation: 'Payment is guaranteed within 30 days after the final deliverable is approved.',
    recommendedRevision: 'Clause is acceptable as drafted.'
  }
];

export default function ContractIntelligence() {
  const [clauses, setClauses] = useState<ClauseScanResult[]>(SAMPLE_CLAUSES)
  const [selectedClauseId, setSelectedClauseId] = useState<string>('cl-1')
  const [escalationStatus, setEscalationStatus] = useState<'open' | 'lawyer_cleared' | 'rejected'>('open')
  const [lawyerNotes, setLawyerNotes] = useState('Clause 1 & 2 require immediate amendment before e-sign signature link can be generated.')
  const [notificationSent, setNotificationSent] = useState(false)

  const selectedClause = clauses.find(c => c.id === selectedClauseId) || clauses[0]
  const redFlagsCount = clauses.filter(c => c.riskLevel === 'red_flag').length
  const warningsCount = clauses.filter(c => c.riskLevel === 'warning').length
  const isLocked = redFlagsCount > 0 && escalationStatus !== 'lawyer_cleared'

  const handleClearEscalation = () => {
    setEscalationStatus('lawyer_cleared')
    setClauses(prev => prev.map(c => ({
      ...c,
      riskLevel: c.riskLevel === 'red_flag' ? 'clean' : c.riskLevel,
      riskReason: c.riskLevel === 'red_flag' ? 'Amended & Cleared by Legal Review' : c.riskReason
    })))
  }

  const handleRejectContract = () => {
    setEscalationStatus('rejected')
  }

  const handleNotifyReviewer = () => {
    setNotificationSent(true)
    setTimeout(() => setNotificationSent(false), 3000)
  }

  return (
    <div className="tool-container">
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill badge-pill-purple mb-2">Phase 2 — Legal & Contract Intelligence</div>
          <h1 className="page-title">
            <ShieldAlert size={28} className="text-accent" />
            Clause-by-Clause Contract Intelligence
          </h1>
          <p className="page-subtitle">
            Automated red-flag clause scanner + LLM plain-language breakdown with hard-gate compliance escalation queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="badge-danger flex items-center gap-1.5 py-1.5 px-3">
              <Lock size={14} /> E-Sign Hard Locked ({redFlagsCount} Red Flags)
            </div>
          ) : (
            <div className="badge-success flex items-center gap-1.5 py-1.5 px-3">
              <Unlock size={14} /> Contract Clean & E-Sign Unlocked
            </div>
          )}
        </div>
      </header>

      {/* Red Flag Warning Banner */}
      {isLocked && (
        <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/20 text-danger shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-danger">Compliance Hard Gate Triggered</h3>
              <p className="text-xs text-muted">
                {redFlagsCount} high-risk clause(s) detected. E-signature dispatch is locked until legal or compliance lead clears the case.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-danger text-xs py-2 px-3 shrink-0"
            onClick={handleNotifyReviewer}
          >
            {notificationSent ? '✓ WhatsApp & Email Dispatched!' : 'Notify Legal Reviewer (WhatsApp)'}
          </button>
        </div>
      )}

      <div className="grid-2-col">
        {/* Clause List Navigation */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center justify-between">
            <span>Scanned Clauses ({clauses.length})</span>
            <div className="flex gap-2">
              <span className="badge-danger text-2xs">{redFlagsCount} Red Flags</span>
              <span className="badge-warning text-2xs">{warningsCount} Warnings</span>
            </div>
          </h2>

          <div className="space-y-2.5">
            {clauses.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedClauseId(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                  selectedClauseId === c.id 
                    ? 'border-accent bg-accent/10 shadow-glow' 
                    : 'border-border bg-card hover:border-border-highlight'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-main">{c.name}</span>
                    <span className={`badge-pill text-2xs ${
                      c.riskLevel === 'red_flag' ? 'badge-danger' :
                      c.riskLevel === 'warning' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {c.riskLevel === 'red_flag' ? '🚨 Red Flag' :
                       c.riskLevel === 'warning' ? '⚠️ Caution' : '✓ Clean'}
                    </span>
                  </div>
                  <p className="text-xs text-muted line-clamp-2">{c.clauseText}</p>
                </div>
                <ArrowRight size={14} className={`shrink-0 mt-1 ${selectedClauseId === c.id ? 'text-accent' : 'text-muted'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Clause Deep Dive & Legal Explainer */}
        <div className="glass-card result-panel-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start pb-3 mb-4 border-b border-border">
              <div>
                <span className="text-2xs text-muted uppercase tracking-wider font-bold">Clause Deep-Dive</span>
                <h3 className="text-base font-bold text-main">{selectedClause.name}</h3>
              </div>
              <span className={`badge-pill ${
                selectedClause.riskLevel === 'red_flag' ? 'badge-danger' :
                selectedClause.riskLevel === 'warning' ? 'badge-warning' : 'badge-success'
              }`}>
                {selectedClause.riskLevel === 'red_flag' ? 'High Risk' :
                 selectedClause.riskLevel === 'warning' ? 'Medium Risk' : 'Low Risk'}
              </span>
            </div>

            {/* Original Legal Verbatim */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted block mb-1.5">Original Contract Text:</label>
              <div className="p-3 bg-dark/80 rounded-lg border border-border text-xs font-mono text-secondary leading-relaxed">
                "{selectedClause.clauseText}"
              </div>
            </div>

            {/* Plain-Language LLM Translation */}
            <div className="mb-4 p-3.5 rounded-xl bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent mb-1">
                <Bot size={14} /> Plain-Language Explanation (What this means for you):
              </div>
              <p className="text-xs text-main leading-relaxed">{selectedClause.plainLanguageExplanation}</p>
            </div>

            {/* Recommended Redline / Revision */}
            <div className="mb-4 p-3.5 rounded-xl bg-success/10 border border-success/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-success mb-1">
                <ShieldCheck size={14} /> Recommended Counter-Redline:
              </div>
              <p className="text-xs text-secondary leading-relaxed">{selectedClause.recommendedRevision}</p>
            </div>
          </div>

          {/* Compliance Reviewer Escalation Decision Box */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-main flex items-center gap-1.5">
                <UserCheck size={14} className="text-accent" />
                Legal Reviewer Decision (Hard Gate)
              </span>
              <span className="text-2xs text-muted">Role: Compliance Lead / In-House Counsel</span>
            </div>

            {escalationStatus === 'open' ? (
              <div className="space-y-3">
                <textarea
                  className="form-textarea text-xs"
                  rows={2}
                  value={lawyerNotes}
                  onChange={e => setLawyerNotes(e.target.value)}
                  placeholder="Enter lawyer review notes and redline instructions..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
                    onClick={handleRejectContract}
                  >
                    <XCircle size={13} /> Reject & Redline
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    onClick={handleClearEscalation}
                  >
                    <CheckCircle2 size={13} /> Approve Amendments & Unlock
                  </button>
                </div>
              </div>
            ) : escalationStatus === 'lawyer_cleared' ? (
              <div className="p-3 bg-success/15 rounded-lg border border-success/40 text-xs text-success flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Cleared by Legal Reviewer: Amendments approved. Contract unlocked for e-signature.</span>
              </div>
            ) : (
              <div className="p-3 bg-danger/15 rounded-lg border border-danger/40 text-xs text-danger flex items-center gap-2">
                <XCircle size={16} />
                <span>Contract Rejected: Returned to brand partner for redline modifications.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
