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
  WifiOff,
  ShieldAlert,
  BarChart2,
  Compass
} from 'lucide-react'

import LandingShowcase from './components/LandingShowcase'
import OpportunityIntake, { type DealOpportunity } from './components/OpportunityIntake'
import RateCalculator from './components/RateCalculator'
import GrowthForecaster from './components/GrowthForecaster'
import NegotiationDrafter from './components/NegotiationDrafter'
import ChecklistGate from './components/ChecklistGate'
import PracticeMode from './components/PracticeMode'
import ContractIntelligence from './components/ContractIntelligence'
import RateBenchmarking from './components/RateBenchmarking'
import ContentHealthScore from './components/ContentHealthScore'
import AgencyOpsPortal from './components/AgencyOpsPortal'
import BrandPortalView from './components/BrandPortalView'
import ActivityLogView from './components/ActivityLogView'
import { api } from './services/api'

type RoleMode = 'showcase' | 'creator' | 'agency' | 'brand';

export default function App() {
  const [roleMode, setRoleMode] = useState<RoleMode>('showcase')
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

  const handleLaunchWorkspaceFromLanding = (tab?: string) => {
    setRoleMode('creator')
    if (tab) setActiveTab(tab)
  };

  if (roleMode === 'showcase') {
    return (
      <LandingShowcase 
        onLaunchWorkspace={handleLaunchWorkspaceFromLanding}
        onLaunchAgency={() => {
          setRoleMode('agency')
          setActiveTab('agency_ops')
        }}
        onLaunchBrand={() => setRoleMode('brand')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="brand-title">CreatorOS</span>
              <span className="brand-badge">V2.4</span>
            </div>
            <span className="text-2xs text-muted block">Talent Operating System</span>
          </div>
        </div>

        {/* Back to Showcase Button */}
        <button
          type="button"
          className="btn-secondary text-2xs py-2 px-3 mb-3 flex items-center justify-center gap-1.5 w-full text-accent border-accent/30 hover:bg-accent/10"
          onClick={() => setRoleMode('showcase')}
        >
          <Compass size={13} />
          <span>✨ View Futuristic Landing</span>
        </button>

        {/* Role Switcher Card */}
        <div className="role-switcher-card">
          <span className="text-2xs text-muted uppercase tracking-wider font-bold block mb-2">Active Role View</span>
          <div className="role-selector-pills">
            <button
              type="button"
              className={`role-pill ${roleMode === 'creator' ? 'active' : ''}`}
              onClick={() => {
                setRoleMode('creator')
                setActiveTab('intake')
              }}
            >
              <User size={14} /> Creator Dashboard
            </button>
            <button
              type="button"
              className={`role-pill ${roleMode === 'agency' ? 'active' : ''}`}
              onClick={() => {
                setRoleMode('agency')
                setActiveTab('agency_ops')
              }}
            >
              <Briefcase size={14} /> Agency Ops Core
            </button>
            <button
              type="button"
              className={`role-pill ${roleMode === 'brand' ? 'active' : ''}`}
              onClick={() => {
                setRoleMode('brand')
              }}
            >
              <Building2 size={14} /> Brand Magic Portal
            </button>
          </div>
        </div>

        {/* Creator Navigation */}
        {roleMode === 'creator' && (
          <nav className="nav-group">
            <span className="nav-group-heading">Phase 1: Deal Flow</span>
            
            <div 
              className={`nav-item ${activeTab === 'intake' ? 'active' : ''}`}
              onClick={() => setActiveTab('intake')}
            >
              <Inbox size={17} />
              <span>1. Opportunity Intake</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'rate' ? 'active' : ''}`}
              onClick={() => setActiveTab('rate')}
            >
              <Calculator size={17} />
              <span>2. Rate Calculator</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'growth' ? 'active' : ''}`}
              onClick={() => setActiveTab('growth')}
            >
              <TrendingUp size={17} />
              <span>3. Growth Forecast</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'checklist' ? 'active' : ''}`}
              onClick={() => setActiveTab('checklist')}
            >
              <CheckSquare size={17} />
              <span>4. Checklist Gate</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'negotiation' ? 'active' : ''}`}
              onClick={() => setActiveTab('negotiation')}
            >
              <Mail size={17} />
              <span>5. Script Drafter</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'practice' ? 'active' : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              <Gamepad2 size={17} />
              <span>Practice Arena</span>
            </div>

            <span className="nav-group-heading mt-3">Phase 2: Trust & Intelligence</span>

            <div 
              className={`nav-item ${activeTab === 'contracts_intelligence' ? 'active' : ''}`}
              onClick={() => setActiveTab('contracts_intelligence')}
            >
              <ShieldAlert size={17} />
              <span>Contract Intelligence</span>
              <span className="nav-item-badge">AI</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'benchmarking' ? 'active' : ''}`}
              onClick={() => setActiveTab('benchmarking')}
            >
              <BarChart2 size={17} />
              <span>Rate Benchmarking</span>
            </div>

            <span className="nav-group-heading mt-3">Phase 3: Retention</span>

            <div 
              className={`nav-item ${activeTab === 'content_health' ? 'active' : ''}`}
              onClick={() => setActiveTab('content_health')}
            >
              <Sparkles size={17} />
              <span>Content Health Score</span>
              <span className="nav-item-badge">Agentic</span>
            </div>

            <span className="nav-group-heading mt-3">Audit Trail</span>
            <div 
              className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={17} />
              <span>Shared Activity Feed</span>
            </div>
          </nav>
        )}

        {/* Agency Navigation */}
        {roleMode === 'agency' && (
          <nav className="nav-group">
            <span className="nav-group-heading">Agency Operations</span>
            <div 
              className={`nav-item ${activeTab === 'agency_ops' ? 'active' : ''}`}
              onClick={() => setActiveTab('agency_ops')}
            >
              <Layers size={17} />
              <span>Agency Command Center</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'contracts_intelligence' ? 'active' : ''}`}
              onClick={() => setActiveTab('contracts_intelligence')}
            >
              <ShieldAlert size={17} />
              <span>Compliance Hard Gate</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'benchmarking' ? 'active' : ''}`}
              onClick={() => setActiveTab('benchmarking')}
            >
              <BarChart2 size={17} />
              <span>Market Rate Comps</span>
            </div>

            <div 
              className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Activity size={17} />
              <span>Shared Activity Feed</span>
            </div>
          </nav>
        )}

        {/* Brand Navigation */}
        {roleMode === 'brand' && (
          <nav className="nav-group">
            <span className="nav-group-heading">Brand Magic Portal</span>
            <div className="nav-item active">
              <Building2 size={17} />
              <span>Deliverables Review</span>
            </div>
          </nav>
        )}

        {/* System Health Status Indicator */}
        <div className="sidebar-footer mt-auto pt-3 border-t border-border">
          <div className="system-health-pill text-xs">
            {isBackendLive ? (
              <span className="health-live flex items-center gap-1.5 text-success font-semibold">
                <Wifi size={13} /> Supabase Live
              </span>
            ) : (
              <span className="health-sim flex items-center gap-1.5 text-accent font-semibold">
                <WifiOff size={13} /> Local Deterministic
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
              <RateCalculator 
                onApplyRate={handleApplyRateToDrafter} 
                selectedBrandName={selectedBrand}
                selectedInitialOffer={selectedOffer}
              />
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
            {activeTab === 'contracts_intelligence' && (
              <ContractIntelligence />
            )}
            {activeTab === 'benchmarking' && (
              <RateBenchmarking />
            )}
            {activeTab === 'content_health' && (
              <ContentHealthScore />
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
