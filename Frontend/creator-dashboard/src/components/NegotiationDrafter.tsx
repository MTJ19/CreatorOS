import { useState, useEffect } from 'react'
import { Mail, Sparkles, Copy, Check, FileText, Send, Zap } from 'lucide-react'
import { api } from '../services/api'

interface NegotiationDrafterProps {
  initialAsk?: number;
  initialBrand?: string;
  initialOffer?: number;
  initialNiche?: string;
}

export default function NegotiationDrafter({ 
  initialAsk, 
  initialBrand, 
  initialOffer, 
  initialNiche 
}: NegotiationDrafterProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<{ script: string; source: string } | null>(null)
  
  const [brand, setBrand] = useState(initialBrand || 'Nike Running')
  const [niche, setNiche] = useState(initialNiche || 'fitness')
  const [offer, setOffer] = useState(initialOffer || 3500)
  const [ask, setAsk] = useState(initialAsk || 6500)
  const [tone, setTone] = useState('polite but firm')
  const [scenario, setScenario] = useState('counter')

  useEffect(() => {
    if (initialBrand) setBrand(initialBrand);
    if (initialAsk) setAsk(initialAsk);
    if (initialOffer) setOffer(initialOffer);
    if (initialNiche) setNiche(initialNiche);
  }, [initialBrand, initialAsk, initialOffer, initialNiche]);

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api.draftNegotiationScript({
        brandName: brand,
        creatorNiche: niche,
        initialOffer: offer,
        desiredRate: ask,
        tone,
        scenario
      })
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result?.script) return
    navigator.clipboard.writeText(result.script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="tool-container">
      <header className="page-header">
        <div className="badge-pill mb-2">Phase 1 — Deterministic Negotiation Engine</div>
        <h1 className="page-title">Ready-to-Send Negotiation Scripts</h1>
        <p className="page-subtitle">
          Generate battle-tested counter-offer scripts for lowball openers, exposure pitches, and scope creep requests using deterministic talent agency templates.
        </p>
      </header>

      {/* Scenario Selector Pills */}
      <div className="scenario-pills-container mb-6">
        <button
          type="button"
          className={`scenario-pill ${scenario === 'counter' ? 'active' : ''}`}
          onClick={() => setScenario('counter')}
        >
          <Zap size={14} /> Lowball / Standard Counter
        </button>
        <button
          type="button"
          className={`scenario-pill ${scenario === 'exposure' ? 'active' : ''}`}
          onClick={() => setScenario('exposure')}
        >
          <Sparkles size={14} /> "Exposure Instead of Pay"
        </button>
        <button
          type="button"
          className={`scenario-pill ${scenario === 'scope_creep' ? 'active' : ''}`}
          onClick={() => setScenario('scope_creep')}
        >
          <FileText size={14} /> Scope Creep & Add-on Rights
        </button>
      </div>

      <div className="grid-2-col">
        {/* Deal Input Form */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center gap-2">
            <Mail size={20} className="text-accent" />
            Negotiation Parameters
          </h2>

          <form onSubmit={handleDraft}>
            <div className="form-group">
              <label className="form-label">Brand / Sponsor Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={brand} 
                onChange={e => setBrand(e.target.value)} 
                placeholder="e.g. Nike, Gymshark, Notion"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Creator Niche / Community</label>
              <input 
                type="text" 
                className="form-input" 
                value={niche} 
                onChange={e => setNiche(e.target.value)} 
                placeholder="e.g. Tech, Fitness, Finance"
                required
              />
            </div>

            <div className="grid-2-col-compact">
              <div className="form-group">
                <label className="form-label">Initial Brand Offer ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={offer} 
                  onChange={e => setOffer(Number(e.target.value))} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Counter Ask ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={ask} 
                  onChange={e => setAsk(Number(e.target.value))} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Response Tone & Framing</label>
              <select className="form-input" value={tone} onChange={e => setTone(e.target.value)}>
                <option value="polite but firm">Polite but Firm (Recommended)</option>
                <option value="friendly and collaborative">Friendly & Collaborative</option>
                <option value="data-driven and analytical">Data-Driven & Analytical (CPM focused)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary mt-4 flex items-center justify-center gap-2" disabled={loading}>
              <Zap size={16} />
              {loading ? 'Drafting Counter-Offer...' : 'Generate Ready-to-Send Script'}
            </button>
          </form>
        </div>

        {/* Script Output Panel */}
        <div className="glass-card result-panel-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Generated Counter Email</h2>
            {result && (
              <span className="badge-pill text-xs">
                ⚡ Deterministic Template (Phase 1)
              </span>
            )}
          </div>

          {!result && (
            <div className="empty-state-box">
              <Mail size={48} className="text-muted mb-2" />
              <p className="text-sm text-muted">Configure negotiation parameters to generate your ready-to-send counter script.</p>
            </div>
          )}

          {result && (
            <div className="script-output-container">
              <div className="script-text-box">
                {result.script}
              </div>

              <div className="script-actions-bar mt-4 flex justify-between items-center">
                <button 
                  type="button" 
                  className={`btn-secondary flex items-center gap-2 ${copied ? 'btn-copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Script'}
                </button>

                <button
                  type="button"
                  className="btn-primary flex items-center gap-2"
                  onClick={() => {
                    const mailtoUrl = `mailto:?subject=${encodeURIComponent(`Partnership Proposal: ${brand} x Creator`)}&body=${encodeURIComponent(result.script)}`;
                    window.open(mailtoUrl, '_blank');
                  }}
                >
                  <Send size={16} /> Open in Email Client
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
