import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'

export default function NegotiationDrafter() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const [brand, setBrand] = useState('Nike')
  const [niche, setNiche] = useState('fitness')
  const [offer, setOffer] = useState(5000)
  const [ask, setAsk] = useState(8500)
  const [tone, setTone] = useState('polite but firm')

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:54321/functions/v1/negotiation-script-drafter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brand,
          creatorNiche: niche,
          initialOffer: offer,
          desiredRate: ask,
          tone: tone
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
    <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 className="page-title">AI Script Drafter</h1>
        <p className="page-subtitle">Automatically generate negotiation counter-offers powered by OpenAI.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <form onSubmit={handleDraft}>
          <div className="form-group">
            <label className="form-label">Brand Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={brand} 
              onChange={e => setBrand(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Creator Niche</label>
            <input 
              type="text" 
              className="form-input" 
              value={niche} 
              onChange={e => setNiche(e.target.value)} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Initial Offer ($)</label>
              <input 
                type="number" 
                className="form-input" 
                value={offer} 
                onChange={e => setOffer(Number(e.target.value))} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Counter Ask ($)</label>
              <input 
                type="number" 
                className="form-input" 
                value={ask} 
                onChange={e => setAsk(Number(e.target.value))} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tone</label>
            <select className="form-input" value={tone} onChange={e => setTone(e.target.value)}>
              <option value="polite but firm">Polite but firm</option>
              <option value="friendly and collaborative">Friendly & Collaborative</option>
              <option value="data-driven and analytical">Data-driven & Analytical</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Generating Script...' : 'Generate Script'}
          </button>
        </form>

        <div className="results-panel">
          {!result && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              Fill details to draft a script
            </div>
          )}
          {result && result.script && (
            <div className="results-container" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
              <div className="result-label" style={{ marginBottom: '0.5rem' }}>Drafted Response:</div>
              <div className="ai-script-output">
                {result.script}
              </div>
            </div>
          )}
          {result?.error && (
             <div className="error-message">
               <AlertCircle size={20} style={{ flexShrink: 0 }} />
               <div>
                 <strong>AI Provider Error</strong>
                 <p style={{ marginTop: '0.25rem', opacity: 0.9 }}>{result.error}</p>
                 {result.error.includes('429') && (
                   <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fef2f2' }}>
                     Note: Your OpenAI account is currently out of quota. Add billing credits to see the script generation work end-to-end!
                   </p>
                 )}
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
