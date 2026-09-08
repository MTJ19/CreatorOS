import { useState, useEffect } from 'react'
import { 
  Inbox,
  Calculator, 
  TrendingUp, 
  Mail, 
  CheckSquare, 
  Layers, 
  Activity, 
  Gamepad2, 
  Building2, 
  User, 
  Briefcase,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react'

import OpportunityIntake, { type DealOpportunity } from './components/OpportunityIntake'
import RateCalculator from './components/RateCalculator'
import GrowthForecaster from './components/GrowthForecaster'
import NegotiationDrafter from './components/NegotiationDrafter'
import ChecklistGate from './components/ChecklistGate'
import PracticeMode from './components/PracticeMode'
import AgencyOpsPortal from './components/AgencyOpsPortal'
import BrandPortalView from './components/BrandPortalView'
import ActivityLogView from './components/ActivityLogView'
import { api } from './services/api'

type RoleMode = 'creator' | 'agency' | 'brand';

export default function App() {
  const [roleMode, setRoleMode] = useState<RoleMode>('creator')
  const [activeTab, setActiveTab] = useState('intake')
  
  // Cross-tool State Hand-off
  const [selectedBrand, setSelectedBrand] = useState<string>('Nike Running')
  const [selectedNiche, setSelectedNiche] = useState<string>('fitness')
  const [selectedOffer, setSelectedOffer] = useState<number>(3500)
  const [customAskRate, setCustomAskRate] = useState<number | undefined>(6500)
  const [brandToken, setBrandToken] = useState('token_titan_magic_9831')
  const [isBackendLive, setIsBackendLive] = useState<boolean | null>(null)

  useEffect(() => {
    api.checkBackendHealth().then(setIsBackendLive);
  }, []);

  const handleSelectDealForNegotiation = (deal: DealOpportunity) => {
    setSelectedBrand(deal.brandName);
    setSelectedNiche(deal.niche);
    setSelectedOffer(deal.initialOffer);
    setActiveTab('rate');
  };

  const handleApplyRateToDrafter = (rate: number) => {
    setCustomAskRate(rate);
    setActiveTab('checklist');
  };

  const handleChecklistPassed = () => {
    setActiveTab('negotiation');
  };

  const handlePreviewBrandPortal = (token: string) => {
    setBrandToken(token);
    setRoleMode('brand');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Sparkles size={22} className="text-accent" />
          </div>
          <div>
            <span className="brand-title">CreatorOS</span>
            <span className="brand-badge">PHASE 1</span>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="role-switcher-card">
          <span className="text-2xs text-muted uppercase tracking-wider font-semibold block mb-2">Active Workspace Role</span>
          <div className="role-selector-pills">
            <button
              type="button"
              className={`role-pill ${roleMode === 'creator' ? 'active' : ''}`}
              onClick={() => {
                setRoleMode('creator')
                setActiveTab('intake')
              }}
            >
              <User size={13} /> Creator Portal
            </button>
            <button
              type="button"
              className={`role-pill ${roleMode === 'agency' ? 'active' : ''}`}
              onClick={() => {
                setRoleMode('agency')
                setActiveTab('agency_ops')
              }}
            >
              <Briefcase size={13} /> Agency Ops Core
            </button>
            <button
              type="button"
              className={`role-pill ${roleMode === 'brand' ? 'active' : ''}`}
              onClick={() => {
                setRoleMode('brand')
              }}
            >
              <Building2 size={13} /> Brand Portal (Magic Link)
            </button>
          </div>
        </div>

        {/* Creator Navigation */}
        {roleMode === 'creator' && (
          <nav className="nav-group mt-3">
            <span className="nav-group-heading">Negotiation Flow</span>
            
            <div 
              className={`nav-item ${activeTab === 'intake' ? 'active' : ''}`}
              onClick={() => setActiveTab('intake')}
            >
              <Inbox size={18} />
              <span>1. Opportunity Intake</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'rate' ? 'active' : ''}`}
              onClick={() => setActiveTab('rate')}
            >
              <Calculator size={18} />
              <span>2. Rate Calculator</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'growth' ? 'active' : ''}`}
              onClick={() => setActiveTab('growth')}
            >
              <TrendingUp size={18} />
              <span>3. Growth Forecast</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'checklist' ? 'active' : ''}`}
              onClick={() => setActiveTab('checklist')}
            >
              <CheckSquare size={18} />
              <span>4. Checklist Gate</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'negotiation' ? 'active' : ''}`}
              onClick={() => setActiveTab('negotiation')}
            >
              <Mail size={18} />
              <span>5. Script Drafter</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'practice' ? 'active' : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              <Gamepad2 size={18} />
              <span>Practice Arena</span>
            </div>

            <span className="nav-group-heading mt-4">System of Record</span>
            <div 
              className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={18} />
              <span>Shared Activity Feed</span>
            </div>
          </nav>
        )}

        {/* Agency Navigation */}
        {roleMode === 'agency' && (
          <nav className="nav-group mt-3">
            <span className="nav-group-heading">Agency Ops Core</span>
            <div 
              className={`nav-item ${activeTab === 'agency_ops' ? 'active' : ''}`}
              onClick={() => setActiveTab('agency_ops')}
            >
              <Layers size={18} />
              <span>Agency Command Center</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={18} />
              <span>Shared Activity Feed</span>
            </div>
          </nav>
        )}

        {/* Brand Navigation */}
        {roleMode === 'brand' && (
          <nav className="nav-group mt-3">
            <span className="nav-group-heading">Brand Portal Access</span>
            <div className="nav-item active">
              <Building2 size={18} />
              <span>Deliverables Review</span>
            </div>
          </nav>
        )}

        {/* System Health Status Indicator */}
        <div className="sidebar-footer mt-auto pt-4 border-t border-border">
          <div className="system-health-pill">
            {isBackendLive ? (
              <span className="health-live flex items-center gap-1.5 text-success">
                <Wifi size={13} /> Supabase Functions Live
              </span>
            ) : (
              <span className="health-sim flex items-center gap-1.5 text-accent">
                <WifiOff size={13} /> Phase 1 Local Simulation
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        {roleMode === 'brand' ? (
          <BrandPortalView 
            token={brandToken} 
            onExitPortal={() => {
              setRoleMode('creator')
              setActiveTab('intake')
            }} 
          />
        ) : (
          <>
            {activeTab === 'intake' && (
              <OpportunityIntake onSelectDealForNegotiation={handleSelectDealForNegotiation} />
            )}
            {activeTab === 'rate' && (
              <RateCalculator onApplyRate={handleApplyRateToDrafter} />
            )}
            {activeTab === 'growth' && (
              <GrowthForecaster />
            )}
            {activeTab === 'checklist' && (
              <ChecklistGate onChecklistPassed={handleChecklistPassed} />
            )}
            {activeTab === 'negotiation' && (
              <NegotiationDrafter 
                initialBrand={selectedBrand}
                initialNiche={selectedNiche}
                initialOffer={selectedOffer}
                initialAsk={customAskRate} 
              />
            )}
            {activeTab === 'practice' && (
              <PracticeMode />
            )}
            {activeTab === 'agency_ops' && (
              <AgencyOpsPortal onPreviewBrandPortal={handlePreviewBrandPortal} />
            )}
            {activeTab === 'activity' && (
              <ActivityLogView />
            )}
          </>
        )}
      </main>
    </div>
  )
}
