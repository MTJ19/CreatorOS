import { useState } from 'react'
import { ArrowRight, Clock } from 'lucide-react'

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
}

interface OpportunityIntakeProps {
  onSelectDealForNegotiation: (deal: DealOpportunity) => void;
}

export default function OpportunityIntake({ onSelectDealForNegotiation }: OpportunityIntakeProps) {
  const [opportunities] = useState<DealOpportunity[]>([

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
      notes: 'Initial outreach from brand agency. Looking to promote new road running shoe.'
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
      notes: 'Counter-offer sent for $8,500 based on rate calculator CPM.'
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
      notes: 'Agreed at $5,500. Handing off to Agency Ops for contract drafting & e-sign.'
    }
  ])

  return (
    <div className="tool-container">
      <header className="page-header">
        <div className="badge-pill mb-2">Phase 1 — Flow Step 1</div>
        <h1 className="page-title">Brand Opportunity Intake</h1>
        <p className="page-subtitle">
          Intake and review incoming brand collaboration requests, evaluate deliverable scopes, and route them to the Rate Calculator and Negotiation pipeline.
        </p>
      </header>

      <div className="grid-deals-list space-y-4">
        {opportunities.map((deal) => (
          <div 
            key={deal.id} 
            className="deal-intake-card p-5 rounded-xl border border-border bg-card hover:border-accent/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl p-2.5 rounded-xl bg-dark/70 border border-border">
                {deal.brandAvatar}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base text-main">{deal.brandName}</h3>
                  <span className={`badge-pill text-2xs ${
                    deal.status === 'terms_agreed' ? 'badge-success' :
                    deal.status === 'negotiating' ? 'badge-warning' : 'badge-primary'
                  }`}>
                    {deal.status === 'terms_agreed' ? '✓ Terms Agreed' :
                     deal.status === 'negotiating' ? '💬 In Negotiation' : '⚡ New Opportunity'}
                  </span>
                  <span className="badge-pill text-2xs uppercase">{deal.niche}</span>
                </div>
                <p className="text-xs text-muted mb-1.5">{deal.deliverablesRequested}</p>
                <div className="flex items-center gap-4 text-2xs text-muted">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {deal.receivedDate}
                  </span>
                  <span>Notes: {deal.notes}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
              <div className="text-left md:text-right">
                <span className="text-2xs text-muted uppercase block">Brand Offer</span>
                <span className="text-lg font-bold text-main">
                  ${deal.initialOffer.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                onClick={() => onSelectDealForNegotiation(deal)}
              >
                <span>Evaluate & Counter</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
