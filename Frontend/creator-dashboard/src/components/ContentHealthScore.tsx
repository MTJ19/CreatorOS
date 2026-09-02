import { useState } from 'react'
import { 
  Sparkles, 
  Bot, 
  Flame, 
  Edit3
} from 'lucide-react'

export interface PersonaEvaluation {
  personaName: string;
  personaType: 'niche_insider' | 'outside_viewer' | 'platform_pattern';
  avatar: string;
  score: number;
  perspective: string;
  feedback: string;
}

const INITIAL_EVALUATORS: PersonaEvaluation[] = [
  {
    personaName: 'Niche Insider Agent',
    personaType: 'niche_insider',
    avatar: '🎯',
    score: 92,
    perspective: 'Finance Enthusiast / Tech-Savvy Investor',
    feedback: 'Hook immediately grabs attention with "tax drag" and "unharvested gains." Jargon resonates strongly with viewers who already manage investment portfolios.'
  },
  {
    personaName: 'Cold Outside Viewer Agent',
    personaType: 'outside_viewer',
    avatar: '👀',
    score: 74,
    perspective: 'Cold Casual Scroller (Zero Context)',
    feedback: 'The first 2 seconds ("rookie investment mistake") is compelling, but jumping straight into "unharvested capital gains" creates cognitive drop-off for beginner audiences.'
  },
  {
    personaName: 'Platform Pattern Agent',
    personaType: 'platform_pattern',
    avatar: '⚡',
    score: 86,
    perspective: 'TikTok & Reels Algorithm Benchmark',
    feedback: 'Pacing is punchy (48 words total). Call-to-action is positioned well at 0:28 mark. Suggested visual cut frequency: 1.8 seconds per b-roll transition.'
  }
];

export default function ContentHealthScore() {
  const [draftScript, setDraftScript] = useState<string>(
    `"Stop making this rookie investment mistake in 2026! Most people put their money into standard index funds and forget about the 18% tax drag on unharvested capital gains. Today, I'm breaking down how high-net-worth founders legally optimize their returns using automated tax-loss harvesting. Link in bio to check out WealthFront's new automated portfolio builder!"`
  )
  const [analyzing, setAnalyzing] = useState(false)
  const [overallScore, setOverallScore] = useState<number>(84)
  const [hookScore, setHookScore] = useState<number>(88)
  const [pacingScore, setPacingScore] = useState<number>(78)
  const [trendScore, setTrendScore] = useState<number>(92)
  const [ctaScore, setCtaScore] = useState<number>(80)

  const evaluators = INITIAL_EVALUATORS;

  const handleRunEvaluation = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      setOverallScore(88)
      setHookScore(92)
      setPacingScore(85)
      setTrendScore(90)
      setCtaScore(86)
    }, 900)
  }

  return (
    <div className="tool-container">
      <header className="page-header flex justify-between items-start">
        <div>
          <div className="badge-pill badge-pill-purple mb-2">Phase 3 — AI Multi-Agent Loop</div>
          <h1 className="page-title">
            <Sparkles size={28} className="text-accent" />
            Content Health Score Evaluator
          </h1>
          <p className="page-subtitle">
            Pre-publish multi-agent simulation: 3 persona evaluator agents test hook retention, pacing risk, and CTA clarity before you hit record.
          </p>
        </div>
      </header>

      <div className="grid-2-col">
        {/* Input Draft Script */}
        <div className="glass-card">
          <h2 className="card-title mb-3 flex items-center justify-between">
            <span>Video Hook & Script Draft</span>
            <span className="text-xs text-muted">Reels • Shorts • TikTok</span>
          </h2>

          <div className="form-group">
            <label className="form-label">Paste Draft Hook / Script Concept:</label>
            <textarea
              className="form-textarea font-mono text-xs leading-relaxed"
              rows={8}
              value={draftScript}
              onChange={e => setDraftScript(e.target.value)}
              placeholder="Paste your video script, hook idea, or story structure..."
            />
          </div>

          <button
            type="button"
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            onClick={handleRunEvaluation}
            disabled={analyzing}
          >
            <Bot size={16} />
            {analyzing ? 'Synthesizing Agent Personas...' : 'Run Multi-Agent Persona Evaluation'}
          </button>

          {/* Quick Metrics Breakdown */}
          <div className="mt-6 pt-4 border-t border-border">
            <span className="text-xs font-bold text-main uppercase tracking-wider block mb-3">Core Health Diagnostics</span>
            <div className="grid-2-col-compact">
              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-muted">Hook Strength (0-3s)</span>
                  <span className="font-bold text-accent">{hookScore}/100</span>
                </div>
                <div className="h-2 bg-dark rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${hookScore}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-muted">Pacing & Retention</span>
                  <span className="font-bold text-success">{pacingScore}/100</span>
                </div>
                <div className="h-2 bg-dark rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${pacingScore}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-muted">Trend Alignment</span>
                  <span className="font-bold text-cyan">{trendScore}/100</span>
                </div>
                <div className="h-2 bg-dark rounded-full overflow-hidden">
                  <div className="h-full bg-cyan rounded-full" style={{ width: `${trendScore}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-muted">CTA Conversion</span>
                  <span className="font-bold text-warning">{ctaScore}/100</span>
                </div>
                <div className="h-2 bg-dark rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: `${ctaScore}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Agent Personas & Synthesis Card */}
        <div className="space-y-4">
          {/* Overall Health Score Card */}
          <div className="glass-card result-panel-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Synthesis Verdict</h2>
              <div className="badge-success flex items-center gap-1">
                <Flame size={14} /> High Virality Potential
              </div>
            </div>

            <div className="hero-rate-box">
              <span className="hero-label">Unified Content Health Score</span>
              <div className="hero-amount text-success">{overallScore} <span className="text-xl text-muted font-normal">/ 100</span></div>
              <div className="range-indicator">
                <span className="range-tag">Confidence Band:</span>
                <span className="range-val font-semibold">Top 12% in Finance Niche</span>
              </div>
            </div>

            {/* Concrete Plain-Language Rewrite Recommendation */}
            <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/30 text-xs">
              <div className="flex items-center gap-2 font-bold text-accent mb-1.5">
                <Edit3 size={15} /> Recommended Rewrite for Maximum Cold Retention:
              </div>
              <p className="text-secondary leading-relaxed mb-2 font-mono bg-dark/60 p-2.5 rounded-lg border border-border">
                "You might be losing 18% of your investment profits to taxes without even realizing it. Here is the single tax loophole high-net-worth founders use to keep every dollar..."
              </p>
              <span className="text-2xs text-muted block">
                <strong>Why:</strong> Replaces abstract jargon ("tax drag") with direct financial pain ("losing 18% of profits"), cutting 0-3s bounce rate by an estimated 28%.
              </span>
            </div>
          </div>

          {/* Three Evaluator Agents Breakdown */}
          <div className="glass-card">
            <h3 className="text-sm font-bold text-main mb-3">Individual Persona Evaluator Outputs</h3>
            <div className="space-y-3">
              {evaluators.map(ev => (
                <div key={ev.personaType} className="p-3.5 rounded-xl bg-card border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ev.avatar}</span>
                      <div>
                        <strong className="text-xs text-main block">{ev.personaName}</strong>
                        <span className="text-2xs text-muted">{ev.perspective}</span>
                      </div>
                    </div>
                    <span className="badge-pill text-xs font-mono">{ev.score}/100</span>
                  </div>
                  <p className="text-xs text-secondary mt-2 leading-relaxed">{ev.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
