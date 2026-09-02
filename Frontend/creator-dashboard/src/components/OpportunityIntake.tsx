import { useState } from 'react'
import { 
  ArrowRight, 
  Clock, 
  PlusCircle, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  X, 
  Layers
} from 'lucide-react'

export interface DealOpportunity {
  id: string;
  brandName: string;
  brandAvatar: string;
  niche: string;
  initialOffer: number;
  currency: 'USD' | 'INR';
  deliverablesRequested: string;
  status: 'new_intake' | 'negotiating' | 'terms_agreed' | 'declined';
  receivedDate: string;
  notes: string;
  estimatedMarketValue?: number;
}

interface OpportunityIntakeProps {
  onSelectDealForNegotiation: (deal: DealOpportunity) => void;
}

export default function OpportunityIntake({ onSelectDealForNegotiation }: OpportunityIntakeProps) {
  const [opportunities, setOpportunities] = useState<DealOpportunity[]>([
    {
      id: 'deal-101',
      brandName: 'Nike Running',
      brandAvatar: '👟',
      niche: 'fitness',
      initialOffer: 3500,
      currency: 'USD',
      deliverablesRequested: '1 Dedicated Reel + 2 Story Frames',
      status: 'new_intake',
      receivedDate: 'Today, 11:30 AM',
      notes: 'Initial outreach from brand agency. Looking to promote new road running shoe.',
      estimatedMarketValue: 6500
    },
    {
      id: 'deal-102',
      brandName: 'Notion Productivity',
      brandAvatar: '📝',
      niche: 'tech',
      initialOffer: 5000,
      currency: 'USD',
      deliverablesRequested: '1 Dedicated YouTube Video (60s mid-roll integration)',
      status: 'negotiating',
      receivedDate: 'Yesterday',
      notes: 'Counter-offer sent for $8,500 based on rate calculator CPM.',
      estimatedMarketValue: 8500
    },
    {
      id: 'deal-103',
      brandName: 'Fitbit Health',
      brandAvatar: '⌚',
      niche: 'fitness',
      initialOffer: 4000,
      currency: 'USD',
      deliverablesRequested: '2 TikTok Videos with 30-day category exclusivity',
      status: 'terms_agreed',
      receivedDate: '2 days ago',
      notes: 'Agreed at $5,500. Handing off to Agency Ops for contract drafting & e-sign.',
      estimatedMarketValue: 5500
    },
    {
      id: 'deal-104',
      brandName: 'GlowSkin Organics',
      brandAvatar: '✨',
      niche: 'beauty',
      initialOffer: 1200,
      currency: 'USD',
      deliverablesRequested: '1 Dedicated Reel with Perpetual Ad Whitelisting',
      status: 'new_intake',
      receivedDate: '3 days ago',
      notes: 'Severe lowball with perpetual whitelisting trapdoor. Flagged for restructuring.',
      estimatedMarketValue: 4200
    }
  ])

  const [activeFilter, setActiveFilter] = useState<'all' | 'new_intake' | 'negotiating' | 'terms_agreed'>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // New Opportunity Form State
  const [newBrand, setNewBrand] = useState('')
  const [newAvatar, setNewAvatar] = useState('💼')
  const [newNiche, setNewNiche] = useState('tech')
  const [newOffer, setNewOffer] = useState<number>(3000)
  const [newDeliverables, setNewDeliverables] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const handleAddOpportunity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBrand) return

    const newDeal: DealOpportunity = {
      id: `deal-${Date.now()}`,
      brandName: newBrand,
      brandAvatar: newAvatar,
      niche: newNiche,
      initialOffer: Number(newOffer),
      currency: 'USD',
      deliverablesRequested: newDeliverables || '1 Dedicated Integration',
      status: 'new_intake',
      receivedDate: 'Just now',
      notes: newNotes || 'Direct creator intake submission.',
      estimatedMarketValue: Math.round(Number(newOffer) * 1.5)
    }

    setOpportunities([newDeal, ...opportunities])
    setIsAddModalOpen(false)
    setNewBrand('')
    setNewDeliverables('')
    setNewNotes('')
  }

  const filteredOpportunities = opportunities.filter(d => {
    if (activeFilter === 'all') return true
    return d.status === activeFilter
  })

  const totalPipelineValue = opportunities.reduce((acc, curr) => acc + (curr.estimatedMarketValue || curr.initialOffer), 0)

  return (
    <div className="tool-container">
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill mb-2">Phase 1 — Negotiation Flow (Step 1)</div>
          <h1 className="page-title">
            <Sparkles size={28} className="text-accent" />
            Brand Opportunity Intake & Pipeline
          </h1>
          <p className="page-subtitle">
            Intake incoming brand sponsorship proposals, identify lowball gaps against market valuation, and route opportunities directly into the Rate Calculator.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary text-xs flex items-center gap-1.5 py-2.5 px-4"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle size={15} />
          <span>Intake New Opportunity</span>
        </button>
      </header>

      {/* Pipeline Summary Bar */}
      <div className="grid-3-col mb-6">
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs text-muted uppercase font-bold block mb-1">Active Deal Pipeline</span>
            <div className="text-2xl font-extrabold text-main font-mono">${totalPipelineValue.toLocaleString()}</div>
          </div>
          <DollarSign size={28} className="text-accent" />
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs text-muted uppercase font-bold block mb-1">New Intake Opportunities</span>
            <div className="text-2xl font-extrabold text-cyan font-mono">
              {opportunities.filter(d => d.status === 'new_intake').length} Deals
            </div>
          </div>
          <Sparkles size={28} className="text-cyan" />
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs text-muted uppercase font-bold block mb-1">In Negotiation / Agreed</span>
            <div className="text-2xl font-extrabold text-success font-mono">
              {opportunities.filter(d => d.status === 'negotiating' || d.status === 'terms_agreed').length} Deals
            </div>
          </div>
          <TrendingUp size={28} className="text-success" />
        </div>
      </div>

      {/* Stage Filter Chips */}
      <div className="glass-card mb-6 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-accent" />
          <span className="text-xs font-semibold text-main">Filter Pipeline:</span>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'new_intake', 'negotiating', 'terms_agreed'] as const).map(f => (
              <button
                key={f}
                type="button"
                className={`preset-chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f === 'all' ? 'ALL DEALS' :
                 f === 'new_intake' ? '⚡ NEW INTAKE' :
                 f === 'negotiating' ? '💬 IN NEGOTIATION' : '✓ TERMS AGREED'}
              </button>
            ))}
          </div>
        </div>
        <span className="text-2xs text-muted font-mono">{filteredOpportunities.length} opportunities shown</span>
      </div>

      {/* Deals List */}
      <div className="grid-deals-list space-y-4">
        {filteredOpportunities.map((deal) => {
          const isLowball = deal.estimatedMarketValue && deal.initialOffer < deal.estimatedMarketValue * 0.75;
          return (
            <div 
              key={deal.id} 
              className="deal-intake-card p-5 rounded-xl border border-border bg-card hover:border-accent/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl p-3 rounded-xl bg-dark/80 border border-border shrink-0">
                  {deal.brandAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base text-main">{deal.brandName}</h3>
                    <span className={`badge-pill text-2xs ${
                      deal.status === 'terms_agreed' ? 'badge-success' :
                      deal.status === 'negotiating' ? 'badge-warning' : 'badge-primary'
                    }`}>
                      {deal.status === 'terms_agreed' ? '✓ Terms Agreed' :
                       deal.status === 'negotiating' ? '💬 In Negotiation' : '⚡ New Intake'}
                    </span>
                    <span className="badge-pill text-2xs uppercase">{deal.niche}</span>
                    {isLowball && (
                      <span className="badge-danger text-2xs">⚠️ Lowball Gap Detected</span>
                    )}
                  </div>
                  <p className="text-xs text-secondary mb-1.5">{deal.deliverablesRequested}</p>
                  <div className="flex items-center gap-4 text-2xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {deal.receivedDate}
                    </span>
                    <span>Note: {deal.notes}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
                <div className="text-left md:text-right">
                  <span className="text-2xs text-muted uppercase block">Brand Offer</span>
                  <span className="text-lg font-bold text-main font-mono">
                    ${deal.initialOffer.toLocaleString()}
                  </span>
                  {deal.estimatedMarketValue && (
                    <span className="text-2xs text-accent block font-mono">
                      Market Ask: ~${deal.estimatedMarketValue.toLocaleString()}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shrink-0"
                  onClick={() => onSelectDealForNegotiation(deal)}
                >
                  <span>Evaluate in Calculator</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredOpportunities.length === 0 && (
          <div className="glass-card empty-state-box py-12">
            <Layers size={40} className="text-muted mb-2" />
            <p className="text-sm text-muted">No deals match the selected filter category.</p>
          </div>
        )}
      </div>

      {/* Add Opportunity Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
              <h2 className="text-lg font-bold text-main flex items-center gap-2">
                <PlusCircle size={20} className="text-accent" />
                Intake New Brand Opportunity
              </h2>
              <button 
                type="button" 
                className="btn-icon-xs text-muted hover:text-main"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddOpportunity}>
              <div className="form-group">
                <label className="form-label">Brand / Sponsor Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  placeholder="e.g. Gymshark, Notion, Figma"
                  required
                />
              </div>

              <div className="grid-2-col-compact">
                <div className="form-group">
                  <label className="form-label">Content Niche</label>
                  <select className="form-input" value={newNiche} onChange={e => setNewNiche(e.target.value)}>
                    <option value="tech">Tech & AI</option>
                    <option value="fitness">Health & Fitness</option>
                    <option value="finance">Finance & Crypto</option>
                    <option value="beauty">Beauty & Skincare</option>
                    <option value="gaming">Gaming & Esports</option>
                    <option value="lifestyle">Lifestyle & Travel</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Brand Avatar Icon</label>
                  <select className="form-input" value={newAvatar} onChange={e => setNewAvatar(e.target.value)}>
                    <option value="💼">💼 Business / SaaS</option>
                    <option value="👟">👟 Fitness / Apparel</option>
                    <option value="⚡">⚡ Energy / Tech</option>
                    <option value="✨">✨ Beauty / Skincare</option>
                    <option value="🎮">🎮 Gaming / Hardware</option>
                    <option value="📱">📱 Mobile App</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Offer Amount ($ USD)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newOffer}
                  onChange={e => setNewOffer(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deliverables Requested</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDeliverables}
                  onChange={e => setNewDeliverables(e.target.value)}
                  placeholder="e.g. 1 Dedicated YouTube Video (60s mid-roll) + 1 Reel"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Intake Notes / Context</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Details on campaign timeline, target demographic, or specific whitelisting terms..."
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
