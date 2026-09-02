import { useState, useEffect, useCallback } from 'react'
import { DollarSign, HelpCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { api, type RateCalculationResult } from '../services/api'

interface RateCalculatorProps {
  onApplyRate?: (rate: number, brand?: string) => void;
  selectedBrandName?: string;
  selectedInitialOffer?: number;
}

export default function RateCalculator({ onApplyRate, selectedBrandName, selectedInitialOffer }: RateCalculatorProps) {
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')
  const [views, setViews] = useState(500000)
  const [niche, setNiche] = useState('tech')
  const [followerTier, setFollowerTier] = useState('macro')
  const [engagement, setEngagement] = useState('high')
  const [result, setResult] = useState<RateCalculationResult | null>(null)

  const runCalculation = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.calculateRate({
        viewsPerWeek: views,
        niche,
        followerTier,
        engagementRateTier: engagement,
        currency
      })
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [views, niche, followerTier, engagement, currency])

  useEffect(() => {
    runCalculation()
  }, [runCalculation])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    runCalculation()
  }

  const currencySymbol = currency === 'USD' ? '$' : '₹'

  return (
    <div className="tool-container">
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill mb-2">Phase 1 — Flow Step 2 (Deterministic Engine)</div>
          <h1 className="page-title">
            <DollarSign size={28} className="text-accent" />
            Rate Range & Sponsorship Pricing Calculator
          </h1>
          <p className="page-subtitle">
            Calculate auditable fair-market sponsorship pricing based on weekly view volume, niche CPM, follower tier multiplier, and engagement adjustment.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="currency-toggle-group">
          <button 
            type="button" 
            className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
            onClick={() => setCurrency('USD')}
          >
            USD ($)
          </button>
          <button 
            type="button" 
            className={`currency-btn ${currency === 'INR' ? 'active' : ''}`}
            onClick={() => setCurrency('INR')}
          >
            INR (₹ + 18% GST)
          </button>
        </div>
      </header>

      {/* Selected Deal Context Callout if passed */}
      {selectedBrandName && (
        <div className="deal-context-banner mb-6">
          <div className="deal-context-info">
            <div className="deal-context-avatar">💼</div>
            <div>
              <span className="text-2xs text-muted uppercase font-bold block">Evaluating Intake Opportunity</span>
              <strong className="text-sm text-main">{selectedBrandName}</strong>
            </div>
          </div>
          {selectedInitialOffer && (
            <div className="text-right">
              <span className="text-2xs text-muted uppercase block">Brand Opener</span>
              <span className="text-sm font-bold text-main font-mono">${selectedInitialOffer.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid-2-col">
        {/* Input Parameters Form */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              Creator Metrics & View Baseline
            </span>
          </h2>

          <form onSubmit={handleCalculate}>
            <div className="form-group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Views Per Week</label>
                <span className="text-sm font-bold text-accent font-mono">{views.toLocaleString()} views</span>
              </div>
              <input 
                type="range" 
                min="10000" 
                max="5000000" 
                step="25000"
                className="range-slider"
                value={views} 
                onChange={e => setViews(Number(e.target.value))} 
              />

              {/* View Presets Row */}
              <div className="preset-chips-row mt-2">
                {[100000, 250000, 500000, 1000000, 2500000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`preset-chip ${views === val ? 'active' : ''}`}
                    onClick={() => setViews(val)}
                  >
                    {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Content Niche & Market CPM</label>
              <select className="form-input" value={niche} onChange={e => setNiche(e.target.value)}>
                <option value="tech">Tech & AI (CPM: $20.00 / 1k views)</option>
                <option value="finance">Finance & Crypto (CPM: $25.00 / 1k views)</option>
                <option value="beauty">Beauty & Skincare (CPM: $15.00 / 1k views)</option>
                <option value="fitness">Health & Fitness (CPM: $12.00 / 1k views)</option>
                <option value="gaming">Gaming & Esports (CPM: $14.00 / 1k views)</option>
                <option value="lifestyle">Lifestyle & Travel (CPM: $10.00 / 1k views)</option>
              </select>
            </div>

            <div className="grid-2-col-compact">
              <div className="form-group">
                <label className="form-label">Follower Tier Multiplier</label>
                <select className="form-input" value={followerTier} onChange={e => setFollowerTier(e.target.value)}>
                  <option value="nano">Nano (&lt;10k followers)</option>
                  <option value="micro">Micro (10k-100k followers)</option>
                  <option value="mid">Mid (100k-500k followers)</option>
                  <option value="macro">Macro (500k-1M followers)</option>
                  <option value="mega">Mega (&gt;1M followers)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Audience Engagement Rate</label>
                <select className="form-input" value={engagement} onChange={e => setEngagement(e.target.value)}>
                  <option value="low">Low (&lt;2% - Below Industry Avg)</option>
                  <option value="average">Average (2-5% - Standard)</option>
                  <option value="high">High (5-10% - Premium Retainer)</option>
                  <option value="viral">Viral (&gt;10% - Top 1% Tier)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary mt-2 w-full" disabled={loading}>
              {loading ? 'Recomputing Rate Bands...' : 'Calculate Optimal Ask Rate'}
            </button>
          </form>
        </div>

        {/* Results & Breakdown Panel */}
        <div className="glass-card result-panel-card flex flex-col justify-between">
          <div>
            <h2 className="card-title mb-4 flex items-center justify-between">
              <span>Recommended Ask Valuation</span>
              <span className="badge-success flex items-center gap-1 text-2xs">
                <ShieldCheck size={14} /> Deterministic Formula
              </span>
            </h2>

            {result && (
              <div className="rate-results">
                {/* Primary Rate Card */}
                <div className="hero-rate-box">
                  <span className="hero-label">Recommended Base Ask</span>
                  <div className="hero-amount text-success">
                    {currencySymbol}{result.baseRate.toLocaleString()}
                  </div>
                  <div className="range-indicator">
                    <span className="range-tag">Confidence Band [0.85x – 1.35x]:</span>
                    <span className="range-val font-semibold">
                      {currencySymbol}{result.suggestedRateLow.toLocaleString()} – {currencySymbol}{result.suggestedRateHigh.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Granular Math Breakdown */}
                <div className="breakdown-grid mt-4">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Views CPM Value</span>
                    <span className="breakdown-value">+{currencySymbol}{result.viewsValue.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Tier Multiplier</span>
                    <span className="breakdown-value">+{currencySymbol}{result.followerMultiplier.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Engagement Bonus</span>
                    <span className={`breakdown-value ${result.engagementAdjustment >= 0 ? 'text-success' : 'text-danger'}`}>
                      {result.engagementAdjustment >= 0 ? '+' : ''}{currencySymbol}{result.engagementAdjustment.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* India Layer 18% GST Breakdown */}
                {currency === 'INR' && result.gstAmount && (
                  <div className="gst-total-box mt-4">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-muted">Base Professional Fee:</span>
                      <span className="font-mono text-main">₹{result.baseRate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-1 text-warning">
                      <span>18% GST (Tax Invoice Compliance):</span>
                      <span className="font-mono">+₹{result.gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-warning/30 font-bold">
                      <span className="text-main">Total Invoice Payable:</span>
                      <span className="text-accent font-mono">₹{(result.baseRate + result.gstAmount).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Handoff Actions */}
          {result && onApplyRate && (
            <div className="mt-6 pt-4 border-t border-border">
              <button 
                type="button" 
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={() => onApplyRate(result.baseRate)}
              >
                Proceed with {currencySymbol}{result.baseRate.toLocaleString()} to Checklist Gate
                <ArrowRight size={16} />
              </button>

              <div className="formula-footnote mt-3 text-2xs text-muted flex items-start gap-1">
                <HelpCircle size={13} className="shrink-0 mt-0.5" />
                <span>Base Formula: (views/1k × niche CPM) + tier multiplier + engagement adj.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
