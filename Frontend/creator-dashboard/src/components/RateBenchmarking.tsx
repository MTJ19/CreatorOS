import { useState } from 'react'
import { 
  BarChart2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award,
  Filter,
  CheckCircle2
} from 'lucide-react'

interface DealBenchmarkData {
  niche: string;
  followerTier: string;
  avgCPM: number;
  p25Rate: number;
  medianRate: number;
  p75Rate: number;
  p90Rate: number;
  sampleSize: number;
  topDeliverable: string;
  avgEngagement: number;
}

const BENCHMARK_DATA: Record<string, DealBenchmarkData[]> = {
  tech: [
    { niche: 'Tech & AI', followerTier: 'nano', avgCPM: 22, p25Rate: 250, medianRate: 450, p75Rate: 650, p90Rate: 900, sampleSize: 142, topDeliverable: 'Dedicated Shorts/Reel', avgEngagement: 6.4 },
    { niche: 'Tech & AI', followerTier: 'micro', avgCPM: 24, p25Rate: 1200, medianRate: 1800, p75Rate: 2500, p90Rate: 3400, sampleSize: 310, topDeliverable: '60s Dedicated Mid-roll', avgEngagement: 5.2 },
    { niche: 'Tech & AI', followerTier: 'mid', avgCPM: 25, p25Rate: 3800, medianRate: 5200, p75Rate: 7100, p90Rate: 9500, sampleSize: 228, topDeliverable: 'Integrated YouTube Video', avgEngagement: 4.6 },
    { niche: 'Tech & AI', followerTier: 'macro', avgCPM: 28, p25Rate: 8500, medianRate: 12000, p75Rate: 16500, p90Rate: 22000, sampleSize: 94, topDeliverable: 'Dedicated Review + Multi-platform', avgEngagement: 4.1 },
  ],
  fitness: [
    { niche: 'Health & Fitness', followerTier: 'nano', avgCPM: 12, p25Rate: 180, medianRate: 300, p75Rate: 450, p90Rate: 600, sampleSize: 180, topDeliverable: 'Story Sequence', avgEngagement: 7.1 },
    { niche: 'Health & Fitness', followerTier: 'micro', avgCPM: 14, p25Rate: 800, medianRate: 1300, p75Rate: 1900, p90Rate: 2600, sampleSize: 420, topDeliverable: '1 Dedicated Reel', avgEngagement: 6.0 },
    { niche: 'Health & Fitness', followerTier: 'mid', avgCPM: 15, p25Rate: 2500, medianRate: 3800, p75Rate: 5000, p90Rate: 7000, sampleSize: 305, topDeliverable: '2 Reels + Product Tag', avgEngagement: 5.1 },
    { niche: 'Health & Fitness', followerTier: 'macro', avgCPM: 17, p25Rate: 6000, medianRate: 8500, p75Rate: 12000, p90Rate: 16000, sampleSize: 112, topDeliverable: 'Monthly Retainer Bundle', avgEngagement: 4.5 },
  ],
  finance: [
    { niche: 'Finance & Crypto', followerTier: 'nano', avgCPM: 28, p25Rate: 350, medianRate: 600, p75Rate: 900, p90Rate: 1300, sampleSize: 95, topDeliverable: 'Thread / Carousel', avgEngagement: 5.8 },
    { niche: 'Finance & Crypto', followerTier: 'micro', avgCPM: 32, p25Rate: 1800, medianRate: 2700, p75Rate: 3800, p90Rate: 5000, sampleSize: 190, topDeliverable: '60s Dedicated Segment', avgEngagement: 4.8 },
    { niche: 'Finance & Crypto', followerTier: 'mid', avgCPM: 35, p25Rate: 5500, medianRate: 8000, p75Rate: 11500, p90Rate: 15000, sampleSize: 140, topDeliverable: 'Dedicated Deep-Dive Video', avgEngagement: 4.2 },
    { niche: 'Finance & Crypto', followerTier: 'macro', avgCPM: 40, p25Rate: 14000, medianRate: 19500, p75Rate: 27000, p90Rate: 36000, sampleSize: 68, topDeliverable: 'Keynote Sponsorship + YouTube', avgEngagement: 3.8 },
  ],
  beauty: [
    { niche: 'Beauty & Skincare', followerTier: 'nano', avgCPM: 14, p25Rate: 200, medianRate: 350, p75Rate: 500, p90Rate: 750, sampleSize: 220, topDeliverable: 'GRWM Reel', avgEngagement: 6.8 },
    { niche: 'Beauty & Skincare', followerTier: 'micro', avgCPM: 16, p25Rate: 950, medianRate: 1500, p75Rate: 2200, p90Rate: 3000, sampleSize: 510, topDeliverable: 'TikTok Dedicated Demo', avgEngagement: 5.9 },
    { niche: 'Beauty & Skincare', followerTier: 'mid', avgCPM: 18, p25Rate: 3000, medianRate: 4500, p75Rate: 6200, p90Rate: 8500, sampleSize: 340, topDeliverable: 'Tutorial + Story Takeover', avgEngagement: 5.0 },
    { niche: 'Beauty & Skincare', followerTier: 'macro', avgCPM: 20, p25Rate: 7500, medianRate: 11000, p75Rate: 15000, p90Rate: 21000, sampleSize: 135, topDeliverable: 'Brand Ambassador Multi-Post', avgEngagement: 4.3 },
  ]
};

export default function RateBenchmarking() {
  const [selectedNiche, setSelectedNiche] = useState<string>('tech')
  const [selectedTier, setSelectedTier] = useState<string>('macro')

  const nicheDataset = BENCHMARK_DATA[selectedNiche] || BENCHMARK_DATA.tech
  const currentStat = nicheDataset.find(d => d.followerTier === selectedTier) || nicheDataset[0]

  return (
    <div className="tool-container">
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill badge-pill-cyan mb-2">Phase 2 — Rate & Deal Benchmarking</div>
          <h1 className="page-title">
            <BarChart2 size={28} className="text-accent" />
            Rate & Deal Benchmarking Index
          </h1>
          <p className="page-subtitle">
            Aggregated, anonymized sponsorship deal terms and percentile comps across 1,800+ completed agency campaigns.
          </p>
        </div>
      </header>

      {/* Filter Selector Bar */}
      <div className="glass-card mb-6 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-accent" />
          <span className="text-xs font-semibold text-main">Select Niche:</span>
          <div className="flex gap-1.5 flex-wrap">
            {Object.keys(BENCHMARK_DATA).map((n) => (
              <button
                key={n}
                type="button"
                className={`preset-chip ${selectedNiche === n ? 'active' : ''}`}
                onClick={() => setSelectedNiche(n)}
              >
                {n.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Users size={16} className="text-muted" />
          <span className="text-xs font-semibold text-main">Follower Tier:</span>
          <div className="flex gap-1.5 flex-wrap">
            {['nano', 'micro', 'mid', 'macro'].map((t) => (
              <button
                key={t}
                type="button"
                className={`preset-chip ${selectedTier === t ? 'active' : ''}`}
                onClick={() => setSelectedTier(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2-col">
        {/* Market Percentiles Card */}
        <div className="glass-card">
          <h2 className="card-title mb-2 flex items-center justify-between">
            <span>Market Comp Percentiles ({currentStat.niche} • {currentStat.followerTier.toUpperCase()})</span>
            <span className="badge-pill text-2xs">N={currentStat.sampleSize} Deals</span>
          </h2>
          <p className="text-xs text-muted mb-6">Actual settled transaction values for dedicated deliverables in this segment.</p>

          {/* Percentile Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted font-medium">25th Percentile (Entry / Baseline)</span>
                <span className="font-mono font-bold text-secondary">${currentStat.p25Rate.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-dark/60 rounded-full overflow-hidden border border-border">
                <div className="h-full bg-muted/60 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-accent font-bold">50th Percentile (Market Median)</span>
                <span className="font-mono font-bold text-accent text-sm">${currentStat.medianRate.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-dark/60 rounded-full overflow-hidden border border-border">
                <div className="h-full bg-accent rounded-full shadow-glow" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-success font-medium">75th Percentile (High Performing)</span>
                <span className="font-mono font-bold text-success">${currentStat.p75Rate.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-dark/60 rounded-full overflow-hidden border border-border">
                <div className="h-full bg-success rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-warning font-medium">90th Percentile (Top Tier / Exclusivity)</span>
                <span className="font-mono font-bold text-warning">${currentStat.p90Rate.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-dark/60 rounded-full overflow-hidden border border-border">
                <div className="h-full bg-warning rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-card border border-border text-xs text-muted flex items-start gap-2">
            <TrendingUp size={16} className="text-accent shrink-0 mt-0.5" />
            <span>
              Creators pairing verified click-through case studies consistently command the <strong>75th–90th percentile</strong> (${currentStat.p75Rate.toLocaleString()}+).
            </span>
          </div>
        </div>

        {/* Niche CPM & Strategy Metrics */}
        <div className="space-y-4">
          <div className="glass-card">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-accent" />
              Sponsorship Intelligence Metrics
            </h2>

            <div className="grid-2-col-compact">
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-2xs text-muted uppercase font-bold block mb-1">Benchmark CPM</span>
                <div className="text-2xl font-extrabold text-main font-mono">${currentStat.avgCPM}.00</div>
                <span className="text-2xs text-success">Per 1,000 Verified Views</span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-2xs text-muted uppercase font-bold block mb-1">Avg Engagement</span>
                <div className="text-2xl font-extrabold text-accent font-mono">{currentStat.avgEngagement}%</div>
                <span className="text-2xs text-muted">Category Baseline</span>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-card border border-border">
              <span className="text-2xs text-muted uppercase font-bold block mb-1">Most Frequently Purchased Deliverable</span>
              <strong className="text-sm text-main block">{currentStat.topDeliverable}</strong>
              <span className="text-xs text-muted mt-1 block">Account for 58% of deal volume in this tier.</span>
            </div>
          </div>

          <div className="glass-card">
            <h2 className="card-title mb-3 flex items-center gap-2">
              <Award size={18} className="text-accent" />
              Negotiation Leverage Scorecard
            </h2>
            <ul className="text-xs text-secondary space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <span>Exclusivity adds an average <strong>+25% to +40% premium</strong> over base rate.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <span>Whitelisting rights beyond 30 days command a mandatory <strong>+$1,000–$2,500 retainer</strong>.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
