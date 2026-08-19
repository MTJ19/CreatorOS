import { useState, useEffect, useCallback } from 'react'

import { DollarSign, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { api, type RateCalculationResult } from '../services/api'

interface RateCalculatorProps {
  onApplyRate?: (rate: number, brand?: string) => void;
}

export default function RateCalculator({ onApplyRate }: RateCalculatorProps) {
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
          <div className="badge-pill mb-2">Deterministic Formula Engine</div>
          <h1 className="page-title">Rate Range Calculator</h1>
          <p className="page-subtitle">
            Calculate fair-market sponsorship pricing based on weekly view volume, niche CPM, follower tier multiplier, and engagement adjustment.
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
            INR (₹ GST)
          </button>
        </div>
      </header>

      <div className="grid-2-col">
        {/* Input Parameters Form */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-accent" />
            Creator Metrics & Baseline
          </h2>

          <form onSubmit={handleCalculate}>
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label">Views Per Week</label>
                <span className="text-sm font-semibold text-accent">{views.toLocaleString()} views</span>
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
              <input 
                type="number" 
                className="form-input mt-2" 
                value={views} 
                onChange={e => setViews(Number(e.target.value))} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Content Niche</label>
              <select className="form-input" value={niche} onChange={e => setNiche(e.target.value)}>
                <option value="tech">Tech (CPM: $20 / 1k views)</option>
                <option value="finance">Finance & Crypto (CPM: $25 / 1k views)</option>
                <option value="beauty">Beauty & Skincare (CPM: $15 / 1k views)</option>
                <option value="fitness">Health & Fitness (CPM: $12 / 1k views)</option>
                <option value="gaming">Gaming & Esports (CPM: $14 / 1k views)</option>
                <option value="lifestyle">Lifestyle & Vlogs (CPM: $10 / 1k views)</option>
              </select>
            </div>

            <div className="grid-2-col-compact">
              <div className="form-group">
                <label className="form-label">Follower Tier</label>
                <select className="form-input" value={followerTier} onChange={e => setFollowerTier(e.target.value)}>
                  <option value="nano">Nano (&lt;10k)</option>
                  <option value="micro">Micro (10k-100k)</option>
                  <option value="mid">Mid (100k-500k)</option>
                  <option value="macro">Macro (500k-1M)</option>
                  <option value="mega">Mega (&gt;1M)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Engagement Rate</label>
                <select className="form-input" value={engagement} onChange={e => setEngagement(e.target.value)}>
                  <option value="low">Low (&lt;2% - Below avg)</option>
                  <option value="average">Average (2-5% - Standard)</option>
                  <option value="high">High (5-10% - Premium)</option>
                  <option value="viral">Viral (&gt;10% - Top 1%)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary mt-4" disabled={loading}>
              {loading ? 'Recomputing...' : 'Calculate Optimal Rate'}
            </button>
          </form>
        </div>

        {/* Results & Breakdown */}
        <div className="glass-card result-panel-card">
          <h2 className="card-title mb-4 flex items-center justify-between">
            <span>Recommended Deal Ask</span>
            <span className="badge-success flex items-center gap-1">
              <ShieldCheck size={14} /> Auditable Formula
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

              {/* Granular Breakdown */}
              <div className="breakdown-grid mt-4">
                <div className="breakdown-item">
                  <span className="breakdown-label">Views Value (CPM)</span>
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
                {currency === 'INR' && result.gstAmount && (
                  <div className="breakdown-item gst-highlight">
                    <span className="breakdown-label">18% GST (India Rail)</span>
                    <span className="breakdown-value">+{currencySymbol}{result.gstAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {currency === 'INR' && result.totalWithGst && (
                <div className="gst-total-box mt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Total Invoice (GST Inclusive):</span>
                    <span className="font-bold text-accent">₹{result.totalWithGst.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Quick action to negotiation drafter */}
              {onApplyRate && (
                <button 
                  type="button" 
                  className="btn-secondary w-full mt-4 flex items-center justify-center gap-2"
                  onClick={() => onApplyRate(result.baseRate)}
                >
                  Apply {currencySymbol}{result.baseRate.toLocaleString()} to Negotiation Drafter
                  <ArrowRight size={16} />
                </button>
              )}

              <div className="formula-footnote mt-4 text-xs text-muted flex items-start gap-1">
                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                <span>Formula: base = (views/1k × niche CPM) + tier multiplier + engagement adj. Range = base × [0.85–1.35].</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
