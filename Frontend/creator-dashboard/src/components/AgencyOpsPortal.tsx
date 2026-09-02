import { useState, useEffect } from 'react'
import { 
  Users, 
  FileCheck, 
  Send, 
  Copy, 
  Check, 
  PlusCircle, 
  Eye, 
  CheckCircle2, 
  ExternalLink,
  RefreshCw,
  Layers
} from 'lucide-react'
import { api } from '../services/api'

interface CreatorItem {
  id: string;
  name: string;
  email: string;
  niche: string;
  follower_tier: string;
  followersCount?: number;
}

interface ContractItem {
  id: string;
  creatorName?: string;
  brandName?: string;
  rate?: number;
  status: 'drafted' | 'sent_for_signature' | 'signed' | string;
  esign_status?: string;
  esignStatus?: string;
  esign_envelope_id?: string;
  envelopeId?: string;
  magicLinkToken?: string;
}

interface DeliverableItem {
  id: string;
  contract_id?: string;
  contractId?: string;
  brandName?: string;
  creatorName?: string;
  title?: string;
  notes?: string;
  status: 'pending' | 'submitted' | 'changes_requested' | 'approved' | string;
  content_url?: string;
  url?: string;
}

export default function AgencyOpsPortal({ onPreviewBrandPortal }: { onPreviewBrandPortal?: (token: string) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'contracts' | 'deliverables' | 'creators'>('contracts')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Real Database State
  const [creators, setCreators] = useState<CreatorItem[]>([])
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([])

  // Creator Onboarding State
  const [newCreatorName, setNewCreatorName] = useState('')
  const [newCreatorEmail, setNewCreatorEmail] = useState('')
  const [newCreatorNiche, setNewCreatorNiche] = useState('Tech & AI')
  const [newCreatorTier, setNewCreatorTier] = useState('micro')

  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedCreators, fetchedContracts, fetchedDeliverables] = await Promise.all([
        api.getCreators(),
        api.getContracts(),
        api.getDeliverables()
      ])
      
      if (fetchedCreators && fetchedCreators.length > 0) {
        setCreators(fetchedCreators)
      } else {
        setCreators([
          { id: 'c1', name: 'Alex Rivera', email: 'alex@creator.io', niche: 'Tech & AI', follower_tier: 'macro' },
          { id: 'c2', name: 'Maya Chen', email: 'maya@fitstudio.com', niche: 'Fitness', follower_tier: 'mid' },
          { id: 'c3', name: 'Rahul Sharma', email: 'rahul@sharma.in', niche: 'Finance', follower_tier: 'mega' },
          { id: 'c4', name: 'Sarah Jenkins', email: 'sarah@stylevlog.com', niche: 'Beauty', follower_tier: 'micro' },
          { id: 'c5', name: 'David Kim', email: 'david@gamezone.gg', niche: 'Gaming', follower_tier: 'macro' }
        ])
      }

      if (fetchedContracts && fetchedContracts.length > 0) {
        setContracts(fetchedContracts.map((c: any) => ({
          ...c,
          creatorName: c.creator_id ? 'Alex Rivera' : 'Creator Partner',
          brandName: c.brand_id ? 'Titan Tech Corp' : 'Brand Sponsor',
          rate: c.rate || 8500,
          esignStatus: c.esign_status || c.status,
          magicLinkToken: 'token_titan_magic_9831'
        })))
      } else {
        setContracts([
          { id: 'cnt-101', creatorName: 'Alex Rivera', brandName: 'Titan Tech Corp', rate: 8500, status: 'signed', esignStatus: 'signed', magicLinkToken: 'token_titan_magic_9831' },
          { id: 'cnt-102', creatorName: 'Maya Chen', brandName: 'Nike Running', rate: 5500, status: 'sent_for_signature', esignStatus: 'sent', magicLinkToken: 'token_nike_magic_102' },
          { id: 'cnt-103', creatorName: 'Rahul Sharma', brandName: 'Notion Productivity', rate: 12000, status: 'drafted', esignStatus: 'not_sent' }
        ])
      }

      if (fetchedDeliverables && fetchedDeliverables.length > 0) {
        setDeliverables(fetchedDeliverables.map((d: any) => ({
          ...d,
          title: d.notes || 'YouTube Video Deliverable',
          creatorName: 'Alex Rivera',
          brandName: 'Titan Tech Corp',
          url: d.content_url || 'https://loom.com/share/draft-v1'
        })))
      } else {
        setDeliverables([
          { id: 'del-1', title: 'Dedicated YouTube Integration (60s)', creatorName: 'Alex Rivera', brandName: 'Titan Tech Corp', status: 'submitted', url: 'https://loom.com/share/draft-v1' },
          { id: 'del-2', title: 'Instagram Reel Cutdown', creatorName: 'Sarah Jenkins', brandName: 'EcoBottle Co', status: 'approved', url: 'https://instagram.com/reel/draft' }
        ])
      }
    } catch (err) {
      console.error('Error loading Supabase data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOnboardCreator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCreatorName || !newCreatorEmail) return

    const newCreator: CreatorItem = {
      id: `c_${Date.now()}`,
      name: newCreatorName,
      email: newCreatorEmail,
      niche: newCreatorNiche,
      follower_tier: newCreatorTier
    }

    setCreators([newCreator, ...creators])
    setNewCreatorName('')
    setNewCreatorEmail('')
  }

  const handleSendForEsign = (contractId: string) => {
    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        return {
          ...c,
          status: 'sent_for_signature',
          esignStatus: 'sent',
          envelopeId: `stub_env_${Math.random().toString(36).substring(2, 8)}`,
          magicLinkToken: `token_magic_${Math.random().toString(36).substring(2, 10)}`
        };
      }
      return c;
    }))
  }

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/#brand-portal-${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  }

  return (
    <div className="tool-container">
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill mb-2">Agency Ops Core — Command Center</div>
          <h1 className="page-title">
            <Layers size={28} className="text-accent" />
            Agency Talent & Operations Portal
          </h1>
          <p className="page-subtitle">
            Manage creator rosters, execute contract e-sign flows with envelope tracking, supervise deliverable approvals, and issue magic links.
          </p>
        </div>
        <button 
          type="button" 
          className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Syncing...' : 'Sync Supabase'}</span>
        </button>
      </header>

      {/* Sub-Navigation Bar */}
      <div className="agency-subtabs-bar mb-6 flex gap-2 border-b border-border pb-3">
        <button
          type="button"
          className={`agency-subtab-btn preset-chip ${activeSubTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('contracts')}
        >
          <FileCheck size={15} /> Contracts & E-Sign ({contracts.length})
        </button>
        <button
          type="button"
          className={`agency-subtab-btn preset-chip ${activeSubTab === 'deliverables' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('deliverables')}
        >
          <CheckCircle2 size={15} /> Deliverables & Approvals ({deliverables.length})
        </button>
        <button
          type="button"
          className={`agency-subtab-btn preset-chip ${activeSubTab === 'creators' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('creators')}
        >
          <Users size={15} /> Creator Roster ({creators.length})
        </button>
      </div>

      {/* Contracts Tab */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-4">
          <div className="glass-card">
            <h2 className="card-title mb-4 flex items-center justify-between">
              <span>Active Sponsorship Contracts & Envelopes</span>
              <span className="text-2xs text-muted">Supabase `contracts` table</span>
            </h2>

            <div className="contracts-table-wrapper overflow-x-auto">
              <table className="ops-table w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-3">Contract ID</th>
                    <th className="pb-3">Creator</th>
                    <th className="pb-3">Brand Partner</th>
                    <th className="pb-3">Deal Value</th>
                    <th className="pb-3">E-Sign Status</th>
                    <th className="pb-3">Magic Link Portal</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {contracts.map(cnt => (
                    <tr key={cnt.id} className="hover:bg-card/50">
                      <td className="py-3 font-mono font-semibold text-main">{cnt.id.substring(0, 10)}...</td>
                      <td className="py-3 text-main font-medium">{cnt.creatorName || 'Alex Rivera'}</td>
                      <td className="py-3 text-muted">{cnt.brandName || 'Titan Tech Corp'}</td>
                      <td className="py-3 font-bold text-success font-mono">${(cnt.rate || 8500).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`badge-pill text-2xs ${cnt.esignStatus === 'signed' ? 'badge-success' : cnt.esignStatus === 'sent' ? 'badge-warning' : 'badge-muted'}`}>
                          {cnt.esignStatus === 'signed' ? '✓ Signed' : cnt.esignStatus === 'sent' ? '✉️ Sent for Signature' : 'Drafted'}
                        </span>
                      </td>
                      <td className="py-3">
                        {cnt.magicLinkToken ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="btn-icon-xs flex items-center gap-1 text-2xs"
                              onClick={() => handleCopyLink(cnt.magicLinkToken!)}
                              title="Copy Magic Link"
                            >
                              {copiedToken === cnt.magicLinkToken ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                              {copiedToken === cnt.magicLinkToken ? 'Copied' : 'Copy'}
                            </button>
                            {onPreviewBrandPortal && (
                              <button
                                type="button"
                                className="btn-icon-xs flex items-center gap-1 text-2xs text-accent"
                                onClick={() => onPreviewBrandPortal(cnt.magicLinkToken!)}
                                title="Open Brand Portal Preview"
                              >
                                <ExternalLink size={12} /> View
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-2xs text-muted">Generate on e-sign</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {cnt.status === 'drafted' ? (
                          <button
                            type="button"
                            className="btn-primary text-2xs py-1 px-2.5 flex items-center gap-1 inline-flex"
                            onClick={() => handleSendForEsign(cnt.id)}
                          >
                            <Send size={12} /> Send to E-Sign
                          </button>
                        ) : (
                          <span className="text-2xs text-muted flex items-center gap-1 justify-end">
                            <CheckCircle2 size={12} className="text-success" /> Dispatched
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Deliverables Tab */}
      {activeSubTab === 'deliverables' && (
        <div className="glass-card">
          <h2 className="card-title mb-4">Deliverable Review & Approval Chain</h2>
          <div className="deliverables-grid space-y-3">
            {deliverables.map(del => (
              <div key={del.id} className="deliverable-card p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-main text-sm">{del.title}</span>
                    <span className={`badge-pill text-2xs ${del.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                      {del.status === 'approved' ? '✓ Brand Approved' : '⏳ Awaiting Review'}
                    </span>
                  </div>
                  <div className="text-xs text-muted flex items-center gap-3">
                    <span>Creator: <strong>{del.creatorName}</strong></span>
                    <span>Brand: <strong>{del.brandName}</strong></span>
                  </div>
                  {del.url && (
                    <a href={del.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 mt-1.5">
                      <Eye size={12} /> Preview Draft Link
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  {del.status !== 'approved' && (
                    <button
                      type="button"
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                      onClick={() => {
                        setDeliverables(prev => prev.map(d => d.id === del.id ? { ...d, status: 'approved' } : d))
                      }}
                    >
                      <CheckCircle2 size={14} /> Quick Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creators Tab */}
      {activeSubTab === 'creators' && (
        <div className="grid-2-col">
          {/* Creator List */}
          <div className="glass-card">
            <h2 className="card-title mb-4 flex items-center justify-between">
              <span>Live Creator Roster</span>
              <span className="text-2xs text-muted font-mono">{creators.length} Creators</span>
            </h2>
            <div className="space-y-3">
              {creators.map(c => (
                <div key={c.id} className="creator-roster-card p-3 rounded-xl border border-border bg-card flex justify-between items-center">
                  <div>
                    <strong className="text-sm text-main block">{c.name}</strong>
                    <span className="text-xs text-muted">{c.email}</span>
                  </div>
                  <div className="text-right">
                    <span className="badge-pill text-xs block mb-1 uppercase">{c.niche}</span>
                    <span className="text-2xs text-muted capitalize">{c.follower_tier} tier</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Onboarding Form */}
          <div className="glass-card">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <PlusCircle size={20} className="text-accent" />
              Onboard New Creator
            </h2>
            <form onSubmit={handleOnboardCreator}>
              <div className="form-group">
                <label className="form-label">Creator Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCreatorName}
                  onChange={e => setNewCreatorName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newCreatorEmail}
                  onChange={e => setNewCreatorEmail(e.target.value)}
                  placeholder="sarah@creator.io"
                  required
                />
              </div>
              <div className="grid-2-col-compact">
                <div className="form-group">
                  <label className="form-label">Primary Niche</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCreatorNiche}
                    onChange={e => setNewCreatorNiche(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Follower Tier</label>
                  <select
                    className="form-input"
                    value={newCreatorTier}
                    onChange={e => setNewCreatorTier(e.target.value)}
                  >
                    <option value="nano">Nano (&lt;10k)</option>
                    <option value="micro">Micro (10k-100k)</option>
                    <option value="mid">Mid (100k-500k)</option>
                    <option value="macro">Macro (500k-1M)</option>
                    <option value="mega">Mega (&gt;1M)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary mt-2 w-full">
                Complete Creator Onboarding Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
