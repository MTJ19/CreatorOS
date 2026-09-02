import { useState } from 'react'
import { 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Unlock, 
  DollarSign, 
  Zap,
  Building2,
  Globe,
  Share2,
  MessageSquare
} from 'lucide-react'

interface LandingShowcaseProps {
  onLaunchWorkspace: (tab?: string) => void;
  onLaunchAgency: () => void;
  onLaunchBrand: () => void;
}

export default function LandingShowcase({ onLaunchWorkspace, onLaunchAgency, onLaunchBrand }: LandingShowcaseProps) {
  // Hero Window Tab Switcher
  const [heroTab, setHeroTab] = useState<'rate' | 'contract' | 'script'>('rate')
  const [heroViews, setHeroViews] = useState(750000)

  // Carousel Active Card
  const [activeDeckIdx, setActiveDeckIdx] = useState(1)

  const DECK_CARDS = [
    {
      id: 'deal-nike',
      brand: 'Nike Running',
      avatar: '👟',
      tag: 'Fitness Niche • Dedicated Reel',
      offer: '$3,500',
      counterAsk: '$6,500',
      status: 'Gate Cleared',
      scriptSummary: 'Hi Nike Team, standard ask for this scope with 6-month digital usage is $6,500 based on 750k weekly reach.'
    },
    {
      id: 'deal-notion',
      brand: 'Notion Productivity',
      avatar: '📝',
      tag: 'Tech & AI • 60s Integration',
      offer: '$5,000',
      counterAsk: '$8,500',
      status: 'Terms Agreed',
      scriptSummary: 'Hi Notion Team, confirmed $8,500 Net 30 with 2 revision rounds and 30-day competitor exclusivity.'
    },
    {
      id: 'deal-fitbit',
      brand: 'Fitbit Health',
      avatar: '⌚',
      tag: 'Health • 2 TikTok Videos',
      offer: '$4,000',
      counterAsk: '$5,500',
      status: 'Contract Drafted',
      scriptSummary: 'E-Sign envelope dispatched with 60-day social license. Deliverable slots ready in Brand Portal.'
    }
  ]

  const handlePrevDeck = () => {
    setActiveDeckIdx((prev) => (prev === 0 ? DECK_CARDS.length - 1 : prev - 1))
  }

  const handleNextDeck = () => {
    setActiveDeckIdx((prev) => (prev === DECK_CARDS.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="landing-wrapper">
      {/* Background Glowing Auroras */}
      <div className="aurora-bg">
        <div className="aurora-circle-1" />
        <div className="aurora-circle-2" />
        <div className="aurora-circle-3" />
        <div className="aurora-circle-bottom" />
      </div>

      {/* Floating Glass Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <Sparkles size={18} className="text-white" />
            </div>
            <span>CreatorOS</span>
          </div>

          <nav className="landing-nav-links">
            <span className="landing-nav-link" onClick={() => onLaunchWorkspace('intake')}>Deals Intake</span>
            <span className="landing-nav-link" onClick={() => onLaunchWorkspace('rate')}>Rate Engine</span>
            <span className="landing-nav-link" onClick={() => onLaunchWorkspace('contracts_intelligence')}>Contract AI</span>
            <span className="landing-nav-link" onClick={() => onLaunchWorkspace('benchmarking')}>Benchmarking</span>
            <span className="landing-nav-link" onClick={onLaunchAgency}>Agency Ops</span>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              className="btn-glass-pill text-xs"
              onClick={onLaunchBrand}
            >
              Brand Portal
            </button>
            <button 
              type="button" 
              className="btn-glowing-pill text-xs"
              onClick={() => onLaunchWorkspace('intake')}
            >
              <span>Launch Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill-badge">
          <Zap size={13} className="text-accent" />
          <span>The Operating System For Creator Partnerships</span>
        </div>

        <h1 className="hero-title">
          The Best Place To Value, Negotiate, And Scale <span className="hero-title-gradient">Front-End Creator Deals.</span>
        </h1>

        <p className="hero-subtitle">
          A comprehensive suite of deterministic rate engines, AI clause scanners, pre-send checklist gates, and magic-link brand portals.
        </p>

        <div className="hero-cta-group">
          <button 
            type="button" 
            className="btn-glowing-pill"
            onClick={() => onLaunchWorkspace('rate')}
          >
            <span>Launch Creator Portal</span>
            <ArrowRight size={16} />
          </button>
          <button 
            type="button" 
            className="btn-glass-pill"
            onClick={() => onLaunchWorkspace('contracts_intelligence')}
          >
            <span>Explore Contract AI</span>
          </button>
        </div>

        {/* 3D Perspective App Window with Horizon Grid */}
        <div className="perspective-mockup-wrapper">
          <div className="neon-grid-horizon" />

          <div className="mockup-window-card">
            {/* Window Header */}
            <div className="mockup-window-header">
              <div className="window-dots">
                <div className="window-dot" style={{ backgroundColor: '#ef4444' }} />
                <div className="window-dot" style={{ backgroundColor: '#f59e0b' }} />
                <div className="window-dot" style={{ backgroundColor: '#10b981' }} />
              </div>

              <div className="window-tabs">
                <button 
                  type="button" 
                  className={`window-tab-btn ${heroTab === 'rate' ? 'active' : ''}`}
                  onClick={() => setHeroTab('rate')}
                >
                  Rate Engine ($)
                </button>
                <button 
                  type="button" 
                  className={`window-tab-btn ${heroTab === 'contract' ? 'active' : ''}`}
                  onClick={() => setHeroTab('contract')}
                >
                  Clause Scanner (AI)
                </button>
                <button 
                  type="button" 
                  className={`window-tab-btn ${heroTab === 'script' ? 'active' : ''}`}
                  onClick={() => setHeroTab('script')}
                >
                  Counter Drafter
                </button>
              </div>

              <span className="text-2xs text-muted font-mono">v2.4-live</span>
            </div>

            {/* Window Body Split */}
            <div className="mockup-body-split">
              {/* Left Mockup Sidebar */}
              <div className="mockup-sidebar">
                <span className="text-2xs text-muted font-bold uppercase tracking-wider block mb-2">Active Sponsorships</span>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-between text-xs">
                    <span className="font-semibold text-main">👟 Nike Running</span>
                    <span className="badge-pill text-2xs">$6,500</span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border flex items-center justify-between text-xs text-muted">
                    <span>📝 Notion 60s Integration</span>
                    <span className="font-mono text-2xs">$8,500</span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border flex items-center justify-between text-xs text-muted">
                    <span>⌚ Fitbit Health</span>
                    <span className="font-mono text-2xs">$5,500</span>
                  </div>
                </div>

                <div className="mt-6 p-2.5 rounded-lg bg-dark/60 border border-border text-2xs text-muted">
                  <span className="text-success font-bold block mb-0.5">✓ Pre-Send Gate: Cleared</span>
                  <span>Usage: 6 Mo • Net 30 • Exclusivity: Direct</span>
                </div>
              </div>

              {/* Right Mockup Interactive Area */}
              <div className="mockup-main">
                {heroTab === 'rate' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-main">Live CPM Rate Calculation</span>
                      <span className="badge-success text-2xs">Deterministic Model</span>
                    </div>

                    <div className="p-3 bg-dark/80 rounded-xl border border-border font-mono text-xs mb-3">
                      <span className="text-muted">baseRate = (views/1k × CPM) + tierMultiplier + engagementBonus</span>
                      <div className="text-sm font-bold text-accent mt-1">
                        Recommended Valuation: ${(Math.round((heroViews / 1000) * 20) + 2000).toLocaleString()} USD
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted mb-1">
                        <span>Simulate View Volume:</span>
                        <span className="font-mono text-accent font-bold">{heroViews.toLocaleString()} views/wk</span>
                      </div>
                      <input
                        type="range"
                        min="100000"
                        max="2500000"
                        step="50000"
                        className="range-slider"
                        value={heroViews}
                        onChange={e => setHeroViews(Number(e.target.value))}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-4 w-full flex items-center justify-center gap-2"
                      onClick={() => onLaunchWorkspace('rate')}
                    >
                      <span>Open Full Rate Calculator</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}

                {heroTab === 'contract' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-main">Clause Red-Flag Scanner</span>
                      <span className="badge-danger text-2xs">1 Red Flag Detected</span>
                    </div>

                    <div className="p-2.5 bg-danger/10 border border-danger/30 rounded-lg text-xs mb-2">
                      <strong className="text-danger block mb-0.5">Commercial Usage Rights:</strong>
                      <p className="text-2xs text-muted font-mono">"Brand shall have perpetual, worldwide right to run paid Meta whitelisting..."</p>
                    </div>

                    <div className="p-2.5 bg-accent/10 border border-accent/30 rounded-lg text-xs mb-3">
                      <strong className="text-accent block mb-0.5">Plain-Language Translation:</strong>
                      <p className="text-2xs text-secondary">Brand can run ads from your face indefinitely without paying future royalties.</p>
                    </div>

                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-4 w-full flex items-center justify-center gap-2"
                      onClick={() => onLaunchWorkspace('contracts_intelligence')}
                    >
                      <span>Audit Full Contract in Intelligence Hub</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}

                {heroTab === 'script' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-main">Ready-to-Send Counter Script</span>
                      <span className="badge-pill text-2xs">Agency Standard</span>
                    </div>

                    <div className="p-3 bg-dark/80 border border-border rounded-lg text-2xs font-mono text-secondary leading-relaxed mb-3">
                      "Hi Nike Team, thank you for the $3,500 offer! After reviewing the deliverable scope, 6-month usage license, and category exclusivity, our standard agency ask is $6,500 with Net 30 terms..."
                    </div>

                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-4 w-full flex items-center justify-center gap-2"
                      onClick={() => onLaunchWorkspace('negotiation')}
                    >
                      <span>Customize in Negotiation Drafter</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Section ("All Of Your Deployments In One Place" -> "All Of Your Deals In One Place") */}
      <section className="section-bento">
        <div className="section-header-center">
          <h2 className="section-title">All Of Your Creator Deals In One Place</h2>
          <p className="section-subtitle">
            A battle-tested operating system for talent management, automated valuations, compliance gating, and brand approvals.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card 1 (Span 8): Deterministic Rate Engine */}
          <div className="bento-card bento-col-8">
            <div className="bento-card-header">
              <span className="badge-pill mb-2">Deterministic Logic</span>
              <h3 className="bento-card-title">Formula-Driven Rate Calculator</h3>
              <p className="bento-card-desc">
                Never guess your sponsorship valuation. Compute mathematically sound ask ranges using weekly impressions, verified niche CPMs, and engagement multipliers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark/70 border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-accent/20 text-accent">
                  <DollarSign size={20} />
                </div>
                <div>
                  <strong className="text-sm text-main block">Fair Market Ask Range</strong>
                  <span className="text-2xs text-muted">Auditable formula [0.85x – 1.35x confidence band]</span>
                </div>
              </div>
              <span className="text-lg font-bold text-success font-mono">$6,500 – $9,200</span>
            </div>
          </div>

          {/* Card 2 (Span 4): Contract Intelligence with 3D Holographic Prism */}
          <div className="bento-card bento-col-4 items-center text-center">
            <div className="hologram-prism-box mb-4">
              <ShieldAlert size={40} className="text-white" />
            </div>

            <h3 className="bento-card-title">Roll Out Contracts To Your Brand Network</h3>
            <p className="bento-card-desc mb-4">
              Automated red-flag scanning for perpetual usage rights and whitelisting trapdoors.
            </p>

            <button 
              type="button" 
              className="btn-glowing-pill text-xs w-full justify-center"
              onClick={() => onLaunchWorkspace('contracts_intelligence')}
            >
              Scan Contracts
            </button>
          </div>

          {/* Card 3 (Span 4): Pre-Send Checklist Gate */}
          <div className="bento-card bento-col-4">
            <div className="bento-card-header">
              <span className="badge-success text-2xs mb-2 inline-block">Hard Compliance Gate</span>
              <h3 className="bento-card-title">Pre-Send Checklist</h3>
              <p className="bento-card-desc">
                Locks counter-offer dispatches until usage rights, exclusivity, revision limits, and payment timelines are set.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/30 text-xs text-success">
              <span className="flex items-center gap-1.5 font-bold">
                <Unlock size={14} /> Gate Status
              </span>
              <span>All Criteria Cleared</span>
            </div>
          </div>

          {/* Card 4 (Span 8): Growth & Audience Forecaster */}
          <div className="bento-card bento-col-8">
            <div className="bento-card-header">
              <span className="badge-pill badge-pill-cyan mb-2">Compounding Audience Projection</span>
              <h3 className="bento-card-title">Growth-Adjusted Retainer Modeling</h3>
              <p className="bento-card-desc">
                Project multi-week audience expansion to justify escalating monthly retainers and capture upside as your channel grows.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 rounded-xl bg-card border border-border text-center">
                <span className="text-2xs text-muted block">Week 1 Baseline</span>
                <span className="text-lg font-bold text-main font-mono">100,000</span>
              </div>
              <ArrowRight size={18} className="text-accent shrink-0" />
              <div className="flex-1 p-3 rounded-xl bg-card border border-border text-center">
                <span className="text-2xs text-muted block">Week 12 Projected</span>
                <span className="text-lg font-bold text-accent font-mono">179,585 (+79%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Card Deck / Carousel */}
      <section className="carousel-section">
        <div className="section-header-center">
          <h2 className="section-title">All Of Your Negotiations In One Place</h2>
          <p className="section-subtitle">
            Seamlessly navigate active deals, review counter proposals, and dispatch verified terms.
          </p>
        </div>

        <div className="card-deck-container">
          {DECK_CARDS.map((card, idx) => {
            let positionClass = 'center'
            if (idx === (activeDeckIdx - 1 + DECK_CARDS.length) % DECK_CARDS.length) positionClass = 'left'
            else if (idx === (activeDeckIdx + 1) % DECK_CARDS.length) positionClass = 'right'
            else if (idx !== activeDeckIdx) return null

            return (
              <div key={card.id} className={`deck-card ${positionClass}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{card.avatar}</span>
                    <div>
                      <strong className="text-sm text-main block">{card.brand}</strong>
                      <span className="text-2xs text-muted">{card.tag}</span>
                    </div>
                  </div>
                  <span className="badge-pill text-2xs">{card.status}</span>
                </div>

                <div className="p-3 bg-dark/80 rounded-xl border border-border text-xs font-mono text-secondary mb-3">
                  "{card.scriptSummary}"
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-2xs text-muted block">Initial $\rightarrow$ Counter Ask</span>
                    <span className="font-bold text-success font-mono">{card.offer} $\rightarrow$ {card.counterAsk}</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn-glowing-pill text-2xs py-1.5 px-3"
                    onClick={() => onLaunchWorkspace('negotiation')}
                  >
                    Open Deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="carousel-nav-arrows">
          <button type="button" className="carousel-arrow-btn" onClick={handlePrevDeck} title="Previous Deal">
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-1.5">
            {DECK_CARDS.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${activeDeckIdx === i ? 'bg-accent w-6' : 'bg-muted/40'}`} 
              />
            ))}
          </div>
          <button type="button" className="carousel-arrow-btn" onClick={handleNextDeck} title="Next Deal">
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Split Feature Section */}
      <section className="split-feature-section">
        <div className="section-header-center">
          <h2 className="section-title">An Operating Environment Made For Protection And Speed</h2>
          <p className="section-subtitle">
            Shared visibility across Talent, Agency, and Brand stakeholders with granular permission rules.
          </p>
        </div>

        <div className="split-cards-grid">
          {/* Left Split Card */}
          <div className="bento-card">
            <div className="bento-card-header">
              <span className="badge-pill mb-2">Legal Intelligence</span>
              <h3 className="bento-card-title">Clause-By-Clause Analysis</h3>
              <p className="bento-card-desc">
                Translates complex indemnity, exclusivity, and whitelisting legalese into plain language with redline suggestions.
              </p>
            </div>

            <div className="space-y-2 font-mono text-2xs">
              <div className="p-2.5 rounded-lg bg-danger/15 border border-danger/40 text-danger">
                🚨 Perpetuity Whitelisting: Locked until amended to 60 days
              </div>
              <div className="p-2.5 rounded-lg bg-success/15 border border-success/40 text-success">
                ✓ 50% Kill Fee Protection: Verified Standard Term
              </div>
            </div>
          </div>

          {/* Right Split Card */}
          <div className="bento-card">
            <div className="bento-card-header">
              <span className="badge-pill badge-pill-cyan mb-2">White-Labeled Portals</span>
              <h3 className="bento-card-title">Magic-Link Brand Portal</h3>
              <p className="bento-card-desc">
                Sponsors review videos, request timestamped edits, and approve deliverables without needing passwords or accounts.
              </p>
            </div>

            <div className="p-3 bg-dark/80 rounded-xl border border-border flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-cyan" />
                <span className="text-main font-semibold">Titan Tech Review Hub</span>
              </div>
              <button 
                type="button" 
                className="btn-secondary text-2xs py-1 px-2.5"
                onClick={onLaunchBrand}
              >
                Preview Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Holographic 3D Orb Call To Action Section */}
      <section className="orb-cta-section">
        <div className="holographic-orb" />

        <h2 className="section-title">Ready To Join A New Dimension of Creator Business?</h2>
        <p className="section-subtitle mb-6">
          Access automated rate calculation, legal contract intelligence, and agency ops in one unified platform.
        </p>

        <button 
          type="button" 
          className="btn-glowing-pill text-sm py-3 px-8"
          onClick={() => onLaunchWorkspace('intake')}
        >
          <span>Launch Creator Workspace Now</span>
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Minimalist Dark Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="landing-logo mb-2">
              <div className="landing-logo-icon">
                <Sparkles size={16} className="text-white" />
              </div>
              <span>CreatorOS</span>
            </div>
            <p>
              The all-in-one talent operating system for creator rate valuation, contract intelligence, and brand ops.
            </p>
          </div>

          <div className="footer-col">
            <h4>Features</h4>
            <ul>
              <li><a href="#rates" onClick={() => onLaunchWorkspace('rate')}>Rate Calculator</a></li>
              <li><a href="#growth" onClick={() => onLaunchWorkspace('growth')}>Growth Forecaster</a></li>
              <li><a href="#checklist" onClick={() => onLaunchWorkspace('checklist')}>Checklist Gate</a></li>
              <li><a href="#scripts" onClick={() => onLaunchWorkspace('negotiation')}>Script Drafter</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Intelligence</h4>
            <ul>
              <li><a href="#contracts" onClick={() => onLaunchWorkspace('contracts_intelligence')}>Contract Scanner</a></li>
              <li><a href="#benchmarks" onClick={() => onLaunchWorkspace('benchmarking')}>Rate Benchmarking</a></li>
              <li><a href="#health" onClick={() => onLaunchWorkspace('content_health')}>Content Health Score</a></li>
              <li><a href="#activity" onClick={() => onLaunchWorkspace('activity')}>Activity Feed</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Portals</h4>
            <ul>
              <li><a href="#creator" onClick={() => onLaunchWorkspace('intake')}>Creator Dashboard</a></li>
              <li><a href="#agency" onClick={onLaunchAgency}>Agency Command Center</a></li>
              <li><a href="#brand" onClick={onLaunchBrand}>Brand Magic Portal</a></li>
              <li><a href="#india">GST / INR Rail</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 CreatorOS Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <Globe size={16} className="cursor-pointer hover:text-white" />
            <Share2 size={16} className="cursor-pointer hover:text-white" />
            <MessageSquare size={16} className="cursor-pointer hover:text-white" />
          </div>
        </div>
      </footer>
    </div>
  )
}
