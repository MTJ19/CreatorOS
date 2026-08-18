import React, { useState } from 'react'
import { Calculator, TrendingUp, Mail, DollarSign } from 'lucide-react'
import RateCalculator from './components/RateCalculator'
import GrowthForecaster from './components/GrowthForecaster'
import NegotiationDrafter from './components/NegotiationDrafter'

function App() {
  const [activeTab, setActiveTab] = useState('rate')

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-title">
          <DollarSign className="inline-block mr-2 text-indigo-400" size={24} style={{verticalAlign: 'middle', marginRight: '8px', color: '#818cf8'}} />
          CreatorOS
        </div>
        
        <div 
          className={`nav-item ${activeTab === 'rate' ? 'active' : ''}`}
          onClick={() => setActiveTab('rate')}
        >
          <Calculator size={20} />
          <span>Rate Calculator</span>
        </div>
        
        <div 
          className={`nav-item ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          <TrendingUp size={20} />
          <span>Growth Forecast</span>
        </div>
        
        <div 
          className={`nav-item ${activeTab === 'negotiation' ? 'active' : ''}`}
          onClick={() => setActiveTab('negotiation')}
        >
          <Mail size={20} />
          <span>Negotiation Drafter</span>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === 'rate' && <RateCalculator />}
        {activeTab === 'growth' && <GrowthForecaster />}
        {activeTab === 'negotiation' && <NegotiationDrafter />}
      </main>
    </div>
  )
}

export default App
