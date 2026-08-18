import React, { useState } from 'react'

export default function RateCalculator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const [views, setViews] = useState(500000)
  const [niche, setNiche] = useState('tech')
  const [followerTier, setFollowerTier] = useState('macro')
  const [engagement, setEngagement] = useState('high')

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:54321/functions/v1/rate-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewsPerWeek: views,
          niche,
          followerTier,
          engagementRateTier: engagement
        })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 className="page-title">Rate Calculator</h1>
        <p className="page-subtitle">Determine the baseline ask for a creator based on real-time market averages.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <form onSubmit={handleCalculate}>
          <div className="form-group">
            <label className="form-label">Views Per Week</label>
            <input 
              type="number" 
              className="form-input" 
              value={views} 
              onChange={e => setViews(Number(e.target.value))} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Niche</label>
            <select className="form-input" value={niche} onChange={e => setNiche(e.target.value)}>
              <option value="tech">Tech</option>
              <option value="finance">Finance</option>
              <option value="beauty">Beauty</option>
              <option value="fitness">Fitness</option>
              <option value="gaming">Gaming</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </div>

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
              <option value="low">Low (&lt;2%)</option>
              <option value="average">Average (2-5%)</option>
              <option value="high">High (5-10%)</option>
              <option value="viral">Viral (&gt;10%)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Rate'}
          </button>
        </form>

        <div className="results-panel">
          {result && !result.error && (
            <div className="results-container">
              <div className="result-stat">
                <span className="result-label">Base Rate</span>
                <span className="result-value">${result.baseRate.toLocaleString()}</span>
              </div>
              <div className="result-stat" style={{ marginTop: '1.5rem' }}>
                <span className="result-label">Suggested Negotiation Range</span>
                <span className="result-range">${result.suggestedRateLow.toLocaleString()} - ${result.suggestedRateHigh.toLocaleString()}</span>
              </div>
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
