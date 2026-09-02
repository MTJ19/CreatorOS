import { useState } from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck, Lock, Unlock, ArrowRight, XCircle, FileCheck } from 'lucide-react'
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

  const applyPreset = (preset: 'standard' | 'extended' | 'annual') => {
    if (preset === 'standard') {
      setUsageRights('3 months')
      setExclusivity('Category Specific')
      setRevisions(2)
      setPayment('Net 30')
    } else if (preset === 'extended') {
      setUsageRights('6 months')
      setExclusivity('Category Specific')
      setRevisions(2)
      setPayment('Net 30')
    } else if (preset === 'annual') {
      setUsageRights('12 months')
      setExclusivity('Category Specific')
      setRevisions(3)
      setPayment('Upon Delivery')
    }
  }

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
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill mb-2">Phase 1 — Flow Step 4 (Hard Gate)</div>
          <h1 className="page-title">
            <ShieldCheck size={28} className="text-accent" />
            Pre-Send Checklist Gate
          </h1>
          <p className="page-subtitle">
            Mandatory compliance gate: Usage rights, exclusivity scope, revision limits, and payment timelines must be strictly locked in before a counter-offer script can send.
          </p>
        </div>

        {/* Presets Row */}
        <div className="flex items-center gap-1.5">
          <span className="text-2xs text-muted font-bold uppercase">Presets:</span>
          <button type="button" className="preset-chip text-2xs" onClick={() => applyPreset('standard')}>
            Standard (3 Mo)
          </button>
          <button type="button" className="preset-chip text-2xs" onClick={() => applyPreset('extended')}>
            Extended (6 Mo)
          </button>
          <button type="button" className="preset-chip text-2xs" onClick={() => applyPreset('annual')}>
            Annual Retainer
          </button>
        </div>
      </header>

      <div className="grid-2-col">
        {/* Term Input Form */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center gap-2">
            <FileCheck size={20} className="text-accent" />
            Mandatory Deal Terms
          </h2>

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>1. Commercial Usage Rights Duration *</span>
                {usageRights.includes('Perpetuity') && (
                  <span className="text-2xs text-danger font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> Perpetual Lock Risk
                  </span>
                )}
              </label>
              <select 
                className={`form-input ${usageRights.includes('Perpetuity') ? 'border-danger' : ''}`}
                value={usageRights} 
                onChange={e => setUsageRights(e.target.value)}
              >
                <option value="">-- Select Required Duration --</option>
                <option value="3 months">3 Months (Standard Campaign Window)</option>
                <option value="6 months">6 Months (Extended Commercial)</option>
                <option value="12 months">12 Months (Annual License)</option>
                <option value="In Perpetuity">In Perpetuity (Dangerous Red Flag)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>2. Exclusivity Scope *</span>
                {exclusivity.includes('Total') && (
                  <span className="text-2xs text-warning font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> Total Lockout Risk
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
                  <span className="text-2xs text-warning font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> Scope Creep Risk (&gt;3)
                  </span>
                )}
              </label>
              <input 
                type="number" 
                min="0"
                max="10"
                className="form-input font-mono" 
                value={revisions} 
                onChange={e => setRevisions(e.target.value)} 
                placeholder="Recommended: 2 rounds"
              />
              <span className="text-2xs text-muted mt-1 block">Industry standard: 2 rounds included. Extra rounds billed at +15% per round.</span>
            </div>

            <div className="form-group">
              <label className="form-label flex justify-between items-center">
                <span>4. Invoicing & Payment Timeline *</span>
                {payment.includes('90') && (
                  <span className="text-2xs text-warning font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> Delayed Cashflow
                  </span>
                )}
              </label>
              <select 
                className="form-input" 
                value={payment} 
                onChange={e => setPayment(e.target.value)}
              >
                <option value="">-- Select Required Timeline --</option>
                <option value="Upon Delivery">Upon Delivery (Immediate Rail)</option>
                <option value="Net 30">Net 30 Days (Standard Benchmark)</option>
                <option value="Net 60">Net 60 Days (Extended)</option>
                <option value="Net 90">Net 90 Days (Delayed Risk)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary mt-2 w-full" disabled={loading}>
              {loading ? 'Evaluating Deal Terms...' : 'Run Pre-Send Checklist Gate'}
            </button>
          </form>
        </div>

        {/* Gate Authorization Status Card */}
        <div className="glass-card result-panel-card flex flex-col justify-between">
          <div>
            <h2 className="card-title mb-4 flex items-center justify-between">
              <span>Gate Authorization Status</span>
              {result && (
                <span className={result.canSendCounter ? "badge-success" : "badge-danger"}>
                  {result.canSendCounter ? "✓ Gate Cleared" : "🚨 Counter Locked"}
                </span>
              )}
            </h2>

            {!result && (
              <div className="empty-state-box py-12">
                <Lock size={48} className="text-muted mb-3" />
                <h3 className="text-sm font-bold text-main">Pre-Send Gate is Active</h3>
                <p className="text-xs text-muted max-w-xs mt-1">Submit all mandatory deal terms to run automated compliance checks and unlock negotiation scripts.</p>
              </div>
            )}

            {result && (
              <div className="checklist-result-box">
                {result.canSendCounter ? (
                  <div className="gate-cleared-panel text-center py-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-success/20 border border-success/40 flex items-center justify-center text-success mb-3 shadow-glow">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-base font-bold text-success">All Checklist Criteria Cleared!</h3>
                    <p className="text-xs text-muted mt-1">{result.message}</p>

                    {/* Warnings list if any */}
                    {result.warnings && result.warnings.length > 0 && (
                      <div className="warning-box mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-left">
                        <div className="flex items-center gap-1.5 text-warning font-bold text-xs mb-1">
                          <AlertTriangle size={13} /> Attention Notes:
                        </div>
                        <ul className="text-xs text-secondary list-disc list-inside space-y-1">
                          {result.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="gate-locked-panel text-center py-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center text-danger mb-3 shadow-glow">
                      <XCircle size={32} />
                    </div>
                    <h3 className="text-base font-bold text-danger">Checklist Gate Locked</h3>
                    <p className="text-xs text-muted mt-1">{result.message}</p>

                    <div className="missing-fields-box mt-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-left">
                      <span className="text-2xs font-bold text-danger uppercase block mb-2">Missing Mandatory Terms:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingFields.map((field) => (
                          <span key={field} className="badge-danger text-2xs font-mono">
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

          {/* Action Trigger */}
          {result && result.canSendCounter && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="badge-pill-success mb-3 flex items-center justify-center gap-1.5 w-full">
                <Unlock size={14} /> Ready-to-Send Counter Dispatch Unlocked
              </div>
              {onChecklistPassed && (
                <button 
                  type="button" 
                  className="btn-primary flex items-center justify-center gap-2 w-full"
                  onClick={onChecklistPassed}
                >
                  Proceed to Negotiation Script Drafter
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
