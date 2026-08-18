import React, { useState } from 'react'

export default function GrowthForecaster() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const [followers, setFollowers] = useState(100000)
  const [growthRate, setGrowthRate] = useState(0.05)
  const [weeks, setWeeks] = useState(4)

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:54321/functions/v1/growth-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFollowers: followers,
          weeklyGrowthRate: growthRate,
          weeksToForecast: weeks
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
        <h1 className="page-title">Growth Forecast</h1>
        <p className="page-subtitle">Project audience growth over time to negotiate longer-term deal scopes.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <form onSubmit={handleForecast}>
          <div className="form-group">
            <label className="form-label">Current Followers</label>
            <input 
              type="number" 
              className="form-input" 
              value={followers} 
              onChange={e => setFollowers(Number(e.target.value))} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Weekly Growth Rate (0.05 = 5%)</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={growthRate} 
              onChange={e => setGrowthRate(Number(e.target.value))} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Weeks to Forecast</label>
            <input 
              type="number" 
              className="form-input" 
              value={weeks} 
              onChange={e => setWeeks(Number(e.target.value))} 
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Forecasting...' : 'Run Forecast'}
          </button>
        </form>

        <div className="results-panel">
          {result && !result.error && result.forecast && (
            <div className="results-container">
              <div className="result-stat">
                <span className="result-label">Base Forecast ({weeks} weeks)</span>
                <span className="result-value">{result.forecast.base.toLocaleString()}</span>
              </div>
              <div className="result-stat" style={{ marginTop: '1.5rem' }}>
                <span className="result-label">Confidence Band (80% - 120%)</span>
                <span className="result-range">{result.forecast.lowerBound.toLocaleString()} - {result.forecast.upperBound.toLocaleString()}</span>
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
