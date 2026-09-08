import { useState } from 'react'
import { MessageSquare, Award, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, User, Building2 } from 'lucide-react'

interface NegotiationScenario {
  id: string;
  brandName: string;
  brandAvatar: string;
  campaign: string;
  initialBrandMessage: string;
  options: {
    id: string;
    text: string;
    score: number; // 1 to 10
    verdict: 'optimal' | 'acceptable' | 'blunder';
    feedback: string;
    suggestedFollowUp: string;
  }[];
}

const SCENARIOS: NegotiationScenario[] = [
  {
    id: 'budget_pushback',
    brandName: 'Apex Nutrition',
    brandAvatar: '⚡',
    campaign: 'Q3 Protein Shake Launch',
    initialBrandMessage: "Hi! We love your fitness content. Our budget for this campaign is strictly capped at $2,000 for 1 Dedicated YouTube Video + 3 IG Reels. We can't go higher because we are allocating most ad spend to paid search.",
    options: [
      {
        id: 'opt_1',
        text: "Okay, I understand. I can do the dedicated video and 3 reels for $2,000 just this once to build the relationship.",
        score: 2,
        verdict: 'blunder',
        feedback: "Severe Underpricing & Scope Trap. You conceded 70% of your market value without reducing deliverable scope or asking for anything in return.",
        suggestedFollowUp: "Never discount price without removing deliverables or shortening usage rights."
      },
      {
        id: 'opt_2',
        text: "Thanks for the context! For a $2,000 budget, I can offer 1 High-Impact IG Reel with 30 days usage rights. If you need the dedicated YouTube video + 3 Reels, my standard rate is $6,500.",
        score: 10,
        verdict: 'optimal',
        feedback: "Masterclass Counter. You respected their budget constraint while protecting your rate integrity by restructuring the deliverable scope.",
        suggestedFollowUp: "Brand will usually either take the single Reel or find budget from another line item."
      },
      {
        id: 'opt_3',
        text: "No thanks, that's way too low for my numbers. Let me know when you have a real budget.",
        score: 4,
        verdict: 'blunder',
        feedback: "Too confrontational. Burns bridges and eliminates the possibility of future campaigns when their budget expands.",
        suggestedFollowUp: "Always remain polite and suggest a trimmed deliverable package."
      }
    ]
  },
  {
    id: 'whitelisting_trap',
    brandName: 'GlowSkin Co.',
    brandAvatar: '✨',
    campaign: 'Summer Hydration Serum',
    initialBrandMessage: "We agree to your $4,000 rate! We just need standard dark-posting & Meta ad whitelisting access to your Instagram account in perpetuity included in the agreement.",
    options: [
      {
        id: 'opt_1',
        text: "Sounds great! Let's get the contract signed with the whitelisting access.",
        score: 1,
        verdict: 'blunder',
        feedback: "Perpetual whitelisting is a catastrophic red flag. The brand can run ads from your face indefinitely without paying a single dollar in future royalties.",
        suggestedFollowUp: "Always time-box whitelisting to 30–60 days and charge a 30%–50% premium."
      },
      {
        id: 'opt_2',
        text: "Awesome to partner! My $4,000 rate includes standard organic posting with 60 days digital usage. For Meta ad whitelisting/boosting, my rate is +$1,200 per 30-day window. Let me know if you'd like to add that on!",
        score: 10,
        verdict: 'optimal',
        feedback: "Flawless Defense. You separated organic rights from paid ad whitelisting and captured an extra 30% add-on fee.",
        suggestedFollowUp: "Brands with media spend will almost always pay the $1,200 boosting add-on."
      }
    ]
  }
];

export default function PracticeMode() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  const scenario = SCENARIOS[activeScenarioIdx]
  const selectedOption = scenario.options.find(o => o.id === selectedOptionId)

  const handleSelectOption = (optId: string) => {
    setSelectedOptionId(optId)
  }

  const handleNextScenario = () => {
    setSelectedOptionId(null)
    setActiveScenarioIdx((prev) => (prev + 1) % SCENARIOS.length)
  }


  return (
    <div className="tool-container">
      <header className="page-header">
        <div className="badge-pill mb-2">Simulated Back-and-Forth</div>
        <h1 className="page-title">Negotiation Practice Arena</h1>
        <p className="page-subtitle">
          Test your negotiation instincts against simulated real-world brand pushbacks, lowball budgets, and sneaky contract trapdoors.
        </p>
      </header>

      <div className="grid-2-col">
        {/* Chat / Simulation Window */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{scenario.brandAvatar}</span>
                <div>
                  <h3 className="font-bold text-main leading-tight">{scenario.brandName}</h3>
                  <span className="text-xs text-muted">{scenario.campaign}</span>
                </div>
              </div>
              <span className="badge-pill text-xs">Scenario {activeScenarioIdx + 1} of {SCENARIOS.length}</span>
            </div>

            {/* Brand Message Bubble */}
            <div className="chat-bubble brand-bubble mb-6">
              <div className="bubble-header flex items-center gap-1.5 text-xs text-muted mb-1">
                <Building2 size={14} className="text-accent" />
                <span>Brand Partner</span>
              </div>
              <p className="bubble-text text-sm leading-relaxed">{scenario.initialBrandMessage}</p>
            </div>

            {/* Response Options */}
            <div className="response-options-list space-y-3">
              <span className="text-xs font-semibold text-muted block mb-2 flex items-center gap-1">
                <User size={14} /> Choose Your Counter Response:
              </span>
              {scenario.options.map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  className={`practice-option-btn ${selectedOptionId === option.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(option.id)}
                >
                  <span className="option-number">Option {String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{option.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
            <button
              type="button"
              className="btn-secondary text-xs flex items-center gap-1.5"
              onClick={() => {
                setSelectedOptionId(null);
                setActiveScenarioIdx(0);
              }}
            >
              <RefreshCw size={14} /> Reset Scenarios
            </button>


            <button
              type="button"
              className="btn-primary text-xs flex items-center gap-1.5"
              onClick={handleNextScenario}
            >
              Next Scenario <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Talent Manager Feedback Panel */}
        <div className="glass-card result-panel-card">
          <h2 className="card-title mb-4 flex items-center justify-between">
            <span>Talent Manager Evaluation</span>
            <span className="badge-primary flex items-center gap-1">
              <Award size={14} /> Instant Coaching
            </span>
          </h2>

          {!selectedOption && (
            <div className="empty-state-box">
              <MessageSquare size={48} className="text-muted mb-2" />
              <p className="text-sm text-muted">Select a counter response option to see instant talent management scoring and coaching.</p>
            </div>
          )}

          {selectedOption && (
            <div className="coaching-feedback-container">
              {/* Score Badge */}
              <div className="feedback-hero-score mb-4 flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                <div>
                  <span className="text-xs text-muted block">Negotiation Score</span>
                  <span className={`text-3xl font-extrabold ${selectedOption.score >= 8 ? 'text-success' : selectedOption.score >= 5 ? 'text-warning' : 'text-danger'}`}>
                    {selectedOption.score} / 10
                  </span>
                </div>
                <div className="verdict-tag">
                  {selectedOption.verdict === 'optimal' && (
                    <span className="badge-success flex items-center gap-1 text-sm py-1 px-3">
                      <CheckCircle2 size={16} /> Optimal Move
                    </span>
                  )}
                  {selectedOption.verdict === 'acceptable' && (
                    <span className="badge-warning flex items-center gap-1 text-sm py-1 px-3">
                      <AlertCircle size={16} /> Acceptable
                    </span>
                  )}
                  {selectedOption.verdict === 'blunder' && (
                    <span className="badge-danger flex items-center gap-1 text-sm py-1 px-3">
                      <AlertCircle size={16} /> Tactical Blunder
                    </span>
                  )}
                </div>
              </div>

              {/* Coaching Insight */}
              <div className="coaching-card mb-4">
                <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Strategic Breakdown</h4>
                <p className="text-sm text-main leading-relaxed">{selectedOption.feedback}</p>
              </div>

              {/* Follow-up Playbook */}
              <div className="playbook-card">
                <h4 className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Talent Manager Playbook</h4>
                <p className="text-sm text-muted leading-relaxed">{selectedOption.suggestedFollowUp}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
