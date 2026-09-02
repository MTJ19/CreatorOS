import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, ArrowUpRight, BarChart3, Info, Sparkles } from 'lucide-react'
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
        <div className="badge-pill mb-2">Phase 1 — Flow Step 3 (Compounding Model)</div>
        <h1 className="page-title">
          <TrendingUp size={28} className="text-accent" />
          Growth-Adjusted Audience Forecast
        </h1>
        <p className="page-subtitle">
          Project audience expansion over multi-week campaign windows to justify higher upfront retainers and escalating milestone terms.
        </p>
      </header>

      <div className="grid-2-col">
        {/* Input Parameters */}
        <div className="glass-card">
          <h2 className="card-title mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-accent" />
            Compounding Growth Parameters
          </h2>

          <form onSubmit={handleForecast}>
            <div className="form-group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Current Audience / Follower Base</label>
                <span className="text-sm font-bold text-accent font-mono">{followers.toLocaleString()}</span>
              </div>
              <input 
                type="number" 
                className="form-input font-mono" 
                value={followers} 
                onChange={e => setFollowers(Number(e.target.value))} 
              />
            </div>
            
            <div className="form-group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Estimated Weekly Growth Rate</label>
                <span className="text-sm font-bold text-success font-mono">+{growthPercentage}% / week</span>
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
              <div className="flex justify-between text-2xs text-muted mt-1.5">
                <span>1% (Steady)</span>
                <span>5% (High Velocity)</span>
                <span>15%+ (Viral Spike)</span>
              </div>
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Campaign Window / Forecast Horizon</label>
                <span className="text-sm font-bold text-accent font-mono">{weeks} Weeks</span>
              </div>
              <div className="preset-chips-row">
                {[2, 4, 6, 8, 12, 24].map(w => (
                  <button
                    key={w}
                    type="button"
                    className={`preset-chip ${weeks === w ? 'active' : ''}`}
                    onClick={() => setWeeks(w)}
                  >
                    {w} Weeks
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary mt-3 w-full" disabled={loading}>
              {loading ? 'Simulating Compounding...' : 'Update Growth Trajectory'}
            </button>
          </form>
        </div>

        {/* Results & Visual Trajectory Chart */}
        <div className="glass-card result-panel-card flex flex-col justify-between">
          <div>
            <h2 className="card-title mb-4 flex items-center justify-between">
              <span>Audience Projection</span>
              <span className="badge-primary flex items-center gap-1 text-2xs">
                <BarChart3 size={13} /> Confidence Band
              </span>
            </h2>

            {result && (
              <div className="forecast-results">
                {/* Hero Projection Box */}
                <div className="hero-rate-box">
                  <span className="hero-label">Projected Reach in {weeks} Weeks</span>
                  <div className="hero-amount text-accent flex items-center justify-center gap-2">
                    {result.forecast.base.toLocaleString()}
                    <span className="badge-success text-xs font-semibold flex items-center gap-0.5">
                      <ArrowUpRight size={13} />
                      +{Math.round(((result.forecast.base - followers) / followers) * 100)}%
                    </span>
                  </div>
                  <div className="range-indicator">
                    <span className="range-tag">Confidence Range [80%–120%]:</span>
                    <span className="range-val font-semibold">
                      {result.forecast.lowerBound.toLocaleString()} – {result.forecast.upperBound.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Trajectory Bar Chart */}
                <div className="chart-container mt-4">
                  <div className="flex justify-between items-center text-2xs text-muted mb-1">
                    <span>Weekly Progression (Followers)</span>
                    <span className="text-accent">W0 $\rightarrow$ W{weeks}</span>
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
              </div>
            )}
          </div>

          {/* Deal Framing Tip */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="p-3 rounded-xl bg-card border border-border flex items-start gap-2 text-xs text-muted">
              <Info size={15} className="text-accent shrink-0 mt-0.5" />
              <span>
                <strong className="text-main">Talent Manager Play:</strong> Lock in fixed milestone pricing for long-term 6-12 week campaigns now before your rate increases to match the +{Math.round(((result?.forecast.base || followers) - followers) / followers * 100)}% audience expansion.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
