import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, ArrowUpRight, BarChart3, Info } from 'lucide-react'

import { api, type GrowthForecastResult } from '../services/api'

export default function GrowthForecaster() {
  const [loading, setLoading] = useState(false)
  const [followers, setFollowers] = useState(100000)
  const [growthRate, setGrowthRate] = useState(0.05)
  const [weeks, setWeeks] = useState(6)
  const [result, setResult] = useState<GrowthForecastResult | null>(null)

  const runForecast = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.forecastGrowth({
        currentFollowers: followers,
        weeklyGrowthRate: growthRate,
        weeksToForecast: weeks
      })
      setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [followers, growthRate, weeks])

  useEffect(() => {
    runForecast()
  }, [runForecast])

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault()
    runForecast()
  }

  const growthPercentage = Math.round(growthRate * 100)

  return (
    <div className="tool-container">
      <header className="page-header">
        <div className="badge-pill mb-2">Compounding Audience Projection</div>
        <h1 className="page-title">Growth-Adjusted Forecast</h1>
        <p className="page-subtitle">
          Project audience compounding over multi-week sponsor timelines to justify higher upfront retainers and longer-term deal scopes.
        </p>
      </header>

      <div className="grid-2-col">
        {/* Input Parameters */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-accent" />
            Growth Baseline Parameters
          </h2>

          <form onSubmit={handleForecast}>
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label">Current Audience / Follower Base</label>
                <span className="text-sm font-semibold text-accent">{followers.toLocaleString()}</span>
              </div>
              <input 
                type="number" 
                className="form-input" 
                value={followers} 
                onChange={e => setFollowers(Number(e.target.value))} 
              />
            </div>
            
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label">Estimated Weekly Growth Rate</label>
                <span className="text-sm font-semibold text-success">+{growthPercentage}% / week</span>
              </div>
              <input 
                type="range"
                min="0.01"
                max="0.25"
                step="0.005"
                className="range-slider"
                value={growthRate}
                onChange={e => setGrowthRate(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>1% (Slow)</span>
                <span>5% (Healthy)</span>
                <span>15%+ (Viral)</span>
              </div>
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label">Deal Horizon / Forecast Window</label>
                <span className="text-sm font-semibold text-accent">{weeks} Weeks</span>
              </div>
              <div className="weeks-selector-grid">
                {[2, 4, 6, 8, 12].map(w => (
                  <button
                    key={w}
                    type="button"
                    className={`preset-btn ${weeks === w ? 'active' : ''}`}
                    onClick={() => setWeeks(w)}
                  >
                    {w} Weeks
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary mt-4" disabled={loading}>
              {loading ? 'Simulating...' : 'Run Compounding Forecast'}
            </button>
          </form>
        </div>

        {/* Results & Visual Chart */}
        <div className="glass-card result-panel-card">
          <h2 className="card-title mb-4 flex items-center justify-between">
            <span>Forecast Projection</span>
            <span className="badge-primary flex items-center gap-1">
              <BarChart3 size={14} /> Confidence Band
            </span>
          </h2>

          {result && (
            <div className="forecast-results">
              {/* Primary Stat Callout */}
              <div className="hero-rate-box">
                <span className="hero-label">Projected Audience ({weeks} weeks)</span>
                <div className="hero-amount text-accent flex items-center gap-2">
                  {result.forecast.base.toLocaleString()}
                  <span className="text-sm font-medium text-success badge-success">
                    <ArrowUpRight size={14} />
                    +{Math.round(((result.forecast.base - followers) / followers) * 100)}% Growth
                  </span>
                </div>
                <div className="range-indicator">
                  <span className="range-tag">Confidence Range [80%–120% Variance]:</span>
                  <span className="range-val font-semibold">
                    {result.forecast.lowerBound.toLocaleString()} – {result.forecast.upperBound.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Visual Trajectory Chart */}
              <div className="chart-container mt-4">
                <div className="chart-header flex justify-between items-center text-xs text-muted mb-2">
                  <span>Weekly Trajectory (Followers)</span>
                  <span>Confidence Bounds</span>
                </div>

                <div className="trajectory-bars">
                  {result.weeklyPoints.map((point) => {
                    const maxVal = result.forecast.upperBound * 1.05;
                    const baseHeight = Math.max(15, (point.base / maxVal) * 100);
                    const upperHeight = Math.max(20, (point.upperBound / maxVal) * 100);
                    const lowerHeight = Math.max(10, (point.lowerBound / maxVal) * 100);

                    return (
                      <div key={point.week} className="bar-column" title={`Week ${point.week}: ${point.base.toLocaleString()}`}>
                        <div className="bar-track">
                          <div 
                            className="bar-upper-band" 
                            style={{ height: `${upperHeight}%` }} 
                          />
                          <div 
                            className="bar-fill" 
                            style={{ height: `${baseHeight}%` }} 
                          />
                          <div 
                            className="bar-lower-band" 
                            style={{ height: `${lowerHeight}%` }} 
                          />
                        </div>
                        <span className="bar-label">W{point.week}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deal Framing Tip */}
              <div className="tip-box mt-4 flex items-start gap-2">
                <Info size={16} className="text-accent shrink-0 mt-0.5" />
                <div className="text-xs text-muted leading-relaxed">
                  <strong className="text-main block mb-0.5">Talent Manager Tip:</strong>
                  Use this {Math.round(((result.forecast.base - followers) / followers) * 100)}% audience expansion to counter multi-month campaign offers with escalating milestone rates.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
