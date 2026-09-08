import { useState } from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck, Lock, Unlock, ArrowRight, XCircle } from 'lucide-react'
import { api, type ChecklistResult } from '../services/api'

interface ChecklistGateProps {
  onChecklistPassed?: () => void;
}

export default function ChecklistGate({ onChecklistPassed }: ChecklistGateProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ChecklistResult | null>(null)
  
  const [usageRights, setUsageRights] = useState('6 months')
  const [exclusivity, setExclusivity] = useState('Category Specific')
  const [revisions, setRevisions] = useState<number | string>(2)
  const [payment, setPayment] = useState('Net 30')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api.verifyChecklist({
        usage_rights_duration: usageRights,
        exclusivity_scope: exclusivity,
        revision_limit: revisions === '' ? null : Number(revisions),
        payment_timeline: payment
      })
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tool-container">
      <header className="page-header">
        <div className="badge-pill mb-2">Pre-Send Verification Gate</div>
        <h1 className="page-title">Pre-Send Checklist Gate</h1>
        <p className="page-subtitle">
          Mandatory compliance gate: Usage rights, exclusivity scope, revision limits, and payment timelines must be strictly defined before sending any counter-offer.
        </p>
      </header>

      <div className="grid-2-col">
        {/* Term Input Form */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-accent" />
            Deal Terms & Mandatory Clauses
          </h2>

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>1. Usage Rights Duration *</span>
                {usageRights.includes('Perpetuity') && (
                  <span className="text-xs text-danger font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> Red Flag Risk
                  </span>
                )}
              </label>
              <select 
                className={`form-input ${usageRights.includes('Perpetuity') ? 'border-danger' : ''}`}
                value={usageRights} 
                onChange={e => setUsageRights(e.target.value)}
              >
                <option value="">-- Select Required Duration --</option>
                <option value="3 months">3 Months (Standard Digital Campaign)</option>
                <option value="6 months">6 Months (Extended Commercial)</option>
                <option value="12 months">12 Months (Annual License)</option>
                <option value="In Perpetuity">In Perpetuity (Dangerous - Hard Lock)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>2. Exclusivity Scope *</span>
                {exclusivity.includes('Total') && (
                  <span className="text-xs text-warning font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> High Restriction
                  </span>
                )}
              </label>
              <select 
                className="form-input" 
                value={exclusivity} 
                onChange={e => setExclusivity(e.target.value)}
              >
                <option value="">-- Select Required Exclusivity --</option>
                <option value="None">None (Non-Exclusive)</option>
                <option value="Category Specific">Category Specific (Direct Competitors Only)</option>
                <option value="Total">Total Exclusivity (Blocks All Other Deals)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>3. Creative Revision Limit *</span>
                {Number(revisions) > 3 && (
                  <span className="text-xs text-warning font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> Scope Creep Risk
                  </span>
                )}
              </label>
              <input 
                type="number" 
                min="0"
                max="10"
                className="form-input" 
                value={revisions} 
                onChange={e => setRevisions(e.target.value)} 
                placeholder="Recommended: 2 rounds"
              />
              <span className="text-xs text-muted mt-1">Recommended: 2 rounds maximum (additional rounds charged at 15%).</span>
            </div>

            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>4. Payment Timeline *</span>
                {payment.includes('90') && (
                  <span className="text-xs text-warning font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> Delayed Rail
                  </span>
                )}
              </label>
              <select 
                className="form-input" 
                value={payment} 
                onChange={e => setPayment(e.target.value)}
              >
                <option value="">-- Select Required Timeline --</option>
                <option value="Upon Delivery">Upon Delivery (Immediate)</option>
                <option value="Net 30">Net 30 Days (Industry Benchmark)</option>
                <option value="Net 60">Net 60 Days (Extended)</option>
                <option value="Net 90">Net 90 Days (Delayed Cashflow Risk)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary mt-4" disabled={loading}>
              {loading ? 'Evaluating Terms...' : 'Run Checklist Gate'}
            </button>
          </form>
        </div>

        {/* Verification Status Card */}
        <div className="glass-card result-panel-card">
          <h2 className="card-title mb-4 flex items-center justify-between">
            <span>Gate Authorization Status</span>
            {result && (
              <span className={result.canSendCounter ? "badge-success" : "badge-danger"}>
                {result.canSendCounter ? "Gate Cleared" : "Counter Locked"}
              </span>
            )}
          </h2>

          {!result && (
            <div className="empty-state-box">
              <Lock size={48} className="text-muted mb-2" />
              <p className="text-sm text-muted">Submit all mandatory deal terms to run pre-send validation.</p>
            </div>
          )}

          {result && (
            <div className="checklist-result-box">
              {result.canSendCounter ? (
                <div className="gate-cleared-panel">
                  <div className="icon-badge-success mb-3">
                    <CheckCircle2 size={48} className="text-success" />
                  </div>
                  <h3 className="text-lg font-bold text-success">All Checklist Criteria Cleared!</h3>
                  <p className="text-sm text-muted mt-1">{result.message}</p>

                  {/* Warning callouts if any */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="warning-box mt-4 text-left">
                      <div className="flex items-center gap-2 text-warning font-semibold text-xs mb-2">
                        <AlertTriangle size={14} /> Attention Items:
                      </div>
                      <ul className="text-xs text-muted list-disc list-inside space-y-1">
                        {result.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="gate-action-box mt-6">
                    <div className="badge-pill-success mb-3 flex items-center justify-center gap-1.5">
                      <Unlock size={14} /> Counter-Offer Sending Unlocked
                    </div>
                    {onChecklistPassed && (
                      <button 
                        type="button" 
                        className="btn-primary flex items-center justify-center gap-2 w-full"
                        onClick={onChecklistPassed}
                      >
                        Proceed to Negotiation Drafter
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="gate-locked-panel">
                  <div className="icon-badge-danger mb-3">
                    <XCircle size={48} className="text-danger" />
                  </div>
                  <h3 className="text-lg font-bold text-danger">Checklist Gate Failed</h3>
                  <p className="text-sm text-muted mt-1">{result.message}</p>

                  <div className="missing-fields-box mt-4">
                    <span className="text-xs font-semibold text-danger block mb-2">Missing Mandatory Clauses:</span>
                    <div className="missing-pills flex flex-wrap gap-2">
                      {result.missingFields.map((field) => (
                        <span key={field} className="badge-danger text-xs">
                          {field.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
