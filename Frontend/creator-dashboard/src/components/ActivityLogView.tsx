import { useState, useEffect } from 'react'
import { Activity, Filter, Clock, Eye, Layers, RefreshCw, Search } from 'lucide-react'
import { api } from '../services/api'

interface ActivityItem {
  id: string;
  entityType?: 'creator' | 'deal' | 'contract' | 'deliverable' | 'payment' | string;
  entity_type?: string;
  actorRole?: 'agency' | 'creator' | 'brand' | 'system' | string;
  actor_role?: string;
  actorName?: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
  visibleTo?: ('agency' | 'creator' | 'brand' | string)[];
  visible_to?: string[];
  created_at?: string;
  timeAgo?: string;
}

export default function ActivityLogView() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'agency' | 'creator' | 'brand' | 'system'>('all')
  const [entityFilter, setEntityFilter] = useState<'all' | 'creator' | 'deal' | 'contract' | 'deliverable' | 'payment'>('all')

  const loadActivities = async () => {
    setLoading(true)
    try {
      const logs = await api.getActivityLogs()
      if (logs && logs.length > 0) {
        setActivities(logs.map((log: any) => ({
          id: log.id,
          entityType: log.entity_type,
          actorRole: log.actor_role,
          actorName: log.actor_role === 'agency' ? 'Agency Talent Ops' : log.actor_role === 'creator' ? 'Alex Rivera (Creator)' : log.actor_role === 'brand' ? 'Brand Sponsor' : 'System Engine',
          action: log.action,
          description: log.action === 'creator.onboarded' ? 'Onboarded creator into agency roster.' :
                       log.action === 'contract.signed' ? 'Contract e-signed and locked with envelope ID.' :
                       log.action === 'deliverable.approved' ? 'Deliverable approved via Magic Link brand portal.' :
                       'State change recorded in immutable system of record.',
          visibleTo: log.visible_to || ['agency', 'creator', 'brand'],
          timeAgo: log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
        })))
      } else {
        setActivities([
          {
            id: 'act-1',
            entityType: 'deliverable',
            actorRole: 'brand',
            actorName: 'Titan Tech Brand Manager',
            action: 'deliverable.approved',
            description: 'Approved deliverable "Dedicated YouTube Product Showcase" via Magic Link portal.',
            visibleTo: ['agency', 'creator', 'brand'],
            timeAgo: '12 mins ago'
          },
          {
            id: 'act-2',
            entityType: 'contract',
            actorRole: 'creator',
            actorName: 'Alex Rivera',
            action: 'contract.signed',
            description: 'E-signed sponsorship agreement envelope #stub_env_8992a ($8,500 USD).',
            visibleTo: ['agency', 'creator', 'brand'],
            timeAgo: '1 hour ago'
          },
          {
            id: 'act-3',
            entityType: 'creator',
            actorRole: 'agency',
            actorName: 'Talent Ops Lead',
            action: 'creator.onboarded',
            description: 'Onboarded creator Rahul Sharma into agency roster (Finance & GST niche).',
            visibleTo: ['agency', 'creator'],
            timeAgo: '2 hours ago'
          },
          {
            id: 'act-4',
            entityType: 'deal',
            actorRole: 'system',
            actorName: 'Deterministic Engine',
            action: 'checklist.passed',
            description: 'Pre-send checklist gate cleared: usage rights, exclusivity, revisions, and Net 30 validated.',
            visibleTo: ['agency', 'creator'],
            timeAgo: '3 hours ago'
          }
        ])
      }
    } catch (err) {
      console.error('Error fetching logs from Supabase:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [])

  const filteredActivities = activities.filter(act => {
    const role = act.actorRole || act.actor_role;
    const entity = act.entityType || act.entity_type;
    if (roleFilter !== 'all' && role !== roleFilter) return false;
    if (entityFilter !== 'all' && entity !== entityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = act.actorName?.toLowerCase().includes(q);
      const matchAction = act.action?.toLowerCase().includes(q);
      const matchDesc = act.description?.toLowerCase().includes(q);
      if (!matchName && !matchAction && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="tool-container">
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill mb-2">System of Record (Shared Activity Log)</div>
          <h1 className="page-title">
            <Activity size={28} className="text-accent" />
            Shared Immutable Activity Feed
          </h1>
          <p className="page-subtitle">
            Shared event log tracking creator onboarding, rate estimations, contract e-sign dispatches, and brand magic-link signoffs.
          </p>
        </div>
        <button 
          type="button" 
          className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
          onClick={loadActivities}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Syncing...' : 'Sync Feed'}</span>
        </button>
      </header>

      {/* Filter & Search Bar */}
      <div className="activity-filters-bar glass-card mb-6 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} className="text-accent" />
          <span className="text-xs font-semibold text-main">Filter by Actor:</span>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'agency', 'creator', 'brand', 'system'] as const).map(role => (
              <button
                key={role}
                type="button"
                className={`preset-chip ${roleFilter === role ? 'active' : ''}`}
                onClick={() => setRoleFilter(role)}
              >
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              className="form-input text-xs py-1.5 px-3 pl-8 h-8 w-44"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted" />
          </div>

          <div className="flex items-center gap-2">
            <Layers size={14} className="text-muted" />
            <select 
              className="form-input text-xs py-1 px-2.5 h-8"
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value as any)}
            >
              <option value="all">All Entities</option>
              <option value="contract">Contracts</option>
              <option value="deliverable">Deliverables</option>
              <option value="deal">Deals</option>
              <option value="creator">Creators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline Cards */}
      <div className="glass-card">
        <div className="activity-timeline-list space-y-3.5">
          {filteredActivities.map((act) => (
            <div key={act.id} className="activity-item-card p-4 rounded-xl border border-border bg-card flex items-start gap-3.5 hover:border-border-highlight transition-all">
              <div className="p-2.5 rounded-xl bg-dark/80 border border-border text-accent mt-0.5 shrink-0">
                <Activity size={16} />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-main">{act.actorName}</span>
                    <span className={`badge-pill text-2xs ${
                      act.actorRole === 'brand' ? 'badge-primary' :
                      act.actorRole === 'creator' ? 'badge-success' :
                      act.actorRole === 'agency' ? 'badge-pill-purple' : 'badge-pill-cyan'
                    }`}>
                      {act.actorRole || act.actor_role}
                    </span>
                    <code className="text-2xs text-muted font-mono bg-dark/60 px-1.5 py-0.5 rounded border border-border">
                      {act.action}
                    </code>
                  </div>
                  <span className="text-2xs text-muted flex items-center gap-1">
                    <Clock size={11} /> {act.timeAgo}
                  </span>
                </div>

                <p className="text-xs text-secondary leading-relaxed mb-2.5">{act.description}</p>

                <div className="flex items-center gap-2 text-2xs text-muted">
                  <Eye size={12} className="text-accent" />
                  <span>Audited Permissions:</span>
                  <div className="flex gap-1">
                    {(act.visibleTo || act.visible_to || ['agency']).map(v => (
                      <span key={v} className="badge-pill text-2xs py-0 px-1.5 uppercase font-mono">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="empty-state-box py-10 text-center text-muted text-xs">
              No activity logs match the search or filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
