import React, { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function ChecklistGate() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const [usageRights, setUsageRights] = useState('6 months')
  const [exclusivity, setExclusivity] = useState('None')
  const [revisions, setRevisions] = useState<number | string>(2)
  const [payment, setPayment] = useState('Net 30')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:54321/functions/v1/checklist-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usage_rights_duration: usageRights,
          exclusivity_scope: exclusivity,
          revision_limit: revisions === '' ? null : Number(revisions),
          payment_timeline: payment
        })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      setResult({ error: "Failed to connect to backend API." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 className="page-title">Checklist Gate</h1>
        <p className="page-subtitle">Verify all mandatory contract clauses before approving a counter-offer.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label">Usage Rights Duration</label>
            <select className="form-input" value={usageRights} onChange={e => setUsageRights(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="12 months">1 Year</option>
              <option value="In Perpetuity">In Perpetuity (Requires Review)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Exclusivity Scope</label>
            <select className="form-input" value={exclusivity} onChange={e => setExclusivity(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="None">None</option>
              <option value="Category Specific">Category Specific</option>
              <option value="Total">Total Exclusivity</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Revision Limit</label>
            <input 
              type="number" 
              className="form-input" 
              value={revisions} 
              onChange={e => setRevisions(e.target.value)} 
              placeholder="e.g. 2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Timeline</label>
            <select className="form-input" value={payment} onChange={e => setPayment(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="Upon Delivery">Upon Delivery</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
              <option value="Net 90">Net 90</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Run Checklist'}
          </button>
        </form>

        <div className="results-panel">
          {result && result.canSendCounter !== undefined && (
            <div className="results-container" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
              {result.canSendCounter ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <CheckCircle2 size={64} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--success)' }}>All Clear!</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{result.message}</p>
                </div>
              ) : (
                <div className="error-message" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 0 }}>
                  <AlertCircle size={48} style={{ color: '#f87171', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', color: '#f87171' }}>Checklist Failed</h3>
                  <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>{result.message}</p>
                  
                  <div style={{ marginTop: '1rem', width: '100%', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fca5a5' }}>Missing Fields:</strong>
                    <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
                      {result.missingFields.map((field: string) => (
                        <li key={field} style={{ marginBottom: '0.25rem' }}>{field.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {result?.error && (
             <div className="error-message">Error: {result.error}</div>
          )}
        </div>
      </div>
    </div>
  )
}
