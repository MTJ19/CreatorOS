/**
 * CreatorOS Phase 1 API Service Layer
 * Directly connected to live Supabase PostgreSQL REST API
 */

export interface RateCalculationInput {
  viewsPerWeek: number;
  niche: string;
  followerTier: string;
  engagementRateTier: string;
  currency?: "USD" | "INR";
}

export interface RateCalculationResult {
  cpmUsed: number;
  viewsValue: number;
  followerMultiplier: number;
  engagementAdjustment: number;
  baseRate: number;
  suggestedRateLow: number;
  suggestedRateHigh: number;
  currency: "USD" | "INR";
  gstAmount?: number;
  totalWithGst?: number;
}

export interface GrowthForecastInput {
  currentFollowers: number;
  weeklyGrowthRate: number;
  weeksToForecast: number;
}

export interface GrowthPoint {
  week: number;
  base: number;
  lowerBound: number;
  upperBound: number;
}

export interface GrowthForecastResult {
  weeksForecasted: number;
  forecast: {
    base: number;
    lowerBound: number;
    upperBound: number;
  };
  weeklyPoints: GrowthPoint[];
}

export interface ChecklistInput {
  usage_rights_duration: string;
  exclusivity_scope: string;
  revision_limit: number | null;
  payment_timeline: string;
}

export interface ChecklistResult {
  canSendCounter: boolean;
  missingFields: string[];
  warnings: string[];
  message: string;
}

export interface NegotiationDraftInput {
  brandName: string;
  creatorNiche: string;
  initialOffer: number;
  desiredRate: number;
  tone?: string;
  scenario?: string;
}

export interface ActivityLogEntry {
  id: string;
  entityType: "creator" | "deal" | "contract" | "deliverable" | "payment";
  entityId: string;
  actorRole: "agency" | "creator" | "brand" | "system";
  action: string;
  metadata: Record<string, unknown>;
  visibleTo: ("agency" | "creator" | "brand")[];
  createdAt: string;
}

const FOLLOWER_TIER_MULTIPLIERS: Record<string, number> = {
  nano: 100,
  micro: 300,
  mid: 800,
  macro: 2000,
  mega: 5000,
};

const ENGAGEMENT_RATE_ADJUSTMENTS: Record<string, number> = {
  low: -100,
  average: 0,
  high: 200,
  viral: 500,
};

const NICHE_CPMS: Record<string, number> = {
  finance: 25.0,
  tech: 20.0,
  beauty: 15.0,
  fitness: 12.0,
  lifestyle: 10.0,
  gaming: 14.0,
  default: 10.0,
};

const USD_TO_INR_RATE = 86.5;

const SUPABASE_URL = 'https://lrszafdiozawymnxmhon.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WqH20W0-Ku_D-V3vh0fSVg_tbuL38dJ';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export const api = {
  async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/creators?select=count`, { headers });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Fetch live Creators from Supabase
  async getCreators() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/creators?select=*`, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error fetching creators from Supabase:', err);
    }
    return [];
  },

  // Fetch live Contracts from Supabase
  async getContracts() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contracts?select=*`, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error fetching contracts from Supabase:', err);
    }
    return [];
  },

  // Fetch live Deliverables from Supabase
  async getDeliverables() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/deliverables?select=*`, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error fetching deliverables from Supabase:', err);
    }
    return [];
  },

  // Fetch live Activity Log from Supabase
  async getActivityLogs() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/activity_log?select=*&order=created_at.desc`, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Error fetching activity log from Supabase:', err);
    }
    return [];
  },

  // Rate calculation (Deterministic Phase 1 formula)
  async calculateRate(input: RateCalculationInput): Promise<RateCalculationResult> {
    const cpm = NICHE_CPMS[input.niche.toLowerCase()] || NICHE_CPMS.default;
    const followerMultiplier = FOLLOWER_TIER_MULTIPLIERS[input.followerTier.toLowerCase()] || 0;
    const engagementAdjustment = ENGAGEMENT_RATE_ADJUSTMENTS[input.engagementRateTier.toLowerCase()] || 0;
    const viewsValue = (input.viewsPerWeek / 1000) * cpm;
    let baseRateUSD = viewsValue + followerMultiplier + engagementAdjustment;
    if (baseRateUSD < 0) baseRateUSD = 0;

    const currency = input.currency || 'USD';
    const rateMult = currency === 'INR' ? USD_TO_INR_RATE : 1;
    const baseRate = Math.round(baseRateUSD * rateMult);
    const suggestedRateLow = Math.round(baseRate * 0.85);
    const suggestedRateHigh = Math.round(baseRate * 1.35);
    const gstAmount = currency === 'INR' ? Math.round(baseRate * 0.18) : undefined;

    return {
      cpmUsed: cpm,
      viewsValue: Math.round(viewsValue * rateMult),
      followerMultiplier: Math.round(followerMultiplier * rateMult),
      engagementAdjustment: Math.round(engagementAdjustment * rateMult),
      baseRate,
      suggestedRateLow,
      suggestedRateHigh,
      currency,
      gstAmount,
      totalWithGst: gstAmount ? baseRate + gstAmount : undefined
    };
  },

  // Growth Forecaster
  async forecastGrowth(input: GrowthForecastInput): Promise<GrowthForecastResult> {
    const { currentFollowers, weeklyGrowthRate, weeksToForecast } = input;
    const baseForecast = currentFollowers * Math.pow(1 + weeklyGrowthRate, weeksToForecast);
    const lowerBound = currentFollowers * Math.pow(1 + weeklyGrowthRate * 0.8, weeksToForecast);
    const upperBound = currentFollowers * Math.pow(1 + weeklyGrowthRate * 1.2, weeksToForecast);

    const weeklyPoints: GrowthPoint[] = [];
    for (let w = 0; w <= weeksToForecast; w++) {
      weeklyPoints.push({
        week: w,
        base: Math.round(currentFollowers * Math.pow(1 + weeklyGrowthRate, w)),
        lowerBound: Math.round(currentFollowers * Math.pow(1 + weeklyGrowthRate * 0.8, w)),
        upperBound: Math.round(currentFollowers * Math.pow(1 + weeklyGrowthRate * 1.2, w)),
      });
    }

    return {
      weeksForecasted: weeksToForecast,
      forecast: {
        base: Math.round(baseForecast),
        lowerBound: Math.round(lowerBound),
        upperBound: Math.round(upperBound),
      },
      weeklyPoints
    };
  },

  // Checklist Gate
  async verifyChecklist(input: ChecklistInput): Promise<ChecklistResult> {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    if (!input.usage_rights_duration || input.usage_rights_duration.trim() === '') {
      missingFields.push('usage_rights_duration');
    } else if (input.usage_rights_duration.toLowerCase().includes('perpetuity')) {
      warnings.push('Perpetual usage rights detected. Requires Legal & Compliance review.');
    }

    if (!input.exclusivity_scope || input.exclusivity_scope.trim() === '') {
      missingFields.push('exclusivity_scope');
    } else if (input.exclusivity_scope.toLowerCase().includes('total')) {
      warnings.push('Total exclusivity limits future sponsorship opportunities.');
    }

    if (input.revision_limit === null || input.revision_limit === undefined) {
      missingFields.push('revision_limit');
    } else if (Number(input.revision_limit) > 3) {
      warnings.push('High revision limit (>3) increases scope creep risk.');
    }

    if (!input.payment_timeline || input.payment_timeline.trim() === '') {
      missingFields.push('payment_timeline');
    } else if (input.payment_timeline.toLowerCase().includes('90')) {
      warnings.push('Net 90 timeline poses significant cashflow delay.');
    }

    const canSendCounter = missingFields.length === 0;

    return {
      canSendCounter,
      missingFields,
      warnings,
      message: canSendCounter
        ? 'Checklist cleared. Pre-send gate passed.'
        : 'Pre-send checklist gate failed. Please fill all required fields.'
    };
  },

  // Negotiation Script Drafter
  async draftNegotiationScript(input: NegotiationDraftInput): Promise<{ script: string; source: string }> {
    const brand = input.brandName || "Brand Partner";
    const scenario = input.scenario || "counter";
    const tone = input.tone || "polite but firm";

    if (scenario === "exposure") {
      return {
        source: "deterministic_template",
        script: `Hi ${brand} Team,\n\nThank you for reaching out with this exciting campaign opportunity! I really appreciate your interest in collaborating with me in the ${input.creatorNiche || "creator"} space.\n\nWhile I love your brand and mission, I don't accept unpaid or gifting-only collaborations for dedicated production deliverables. My standard rate for a dedicated integration with guaranteed audience reach and category exclusivity is $${input.desiredRate.toLocaleString()}.\n\nI'd love to partner with you if we can make the budget work. Let me know if we can proceed with this structure!\n\nBest regards,\n[Your Name]`
      };
    }

    if (scenario === "scope_creep") {
      return {
        source: "deterministic_template",
        script: `Hi ${brand} Team,\n\nThanks for sharing the expanded deliverable scope and usage rights requirements. Based on the additional whitelisting rights and extra short-form cutdowns requested beyond our initial scope, my revised rate for this package is $${input.desiredRate.toLocaleString()} (adjusted from the baseline $${input.initialOffer.toLocaleString()}).\n\nThis ensures full commercial licensing, 2 rounds of creative revisions, and dedicated analytics reporting.\n\nLooking forward to finalizing the terms!\n\nBest regards,\n[Your Name]`
      };
    }

    if (tone.includes("friendly")) {
      return {
        source: "deterministic_template",
        script: `Hi ${brand} Team,\n\nThank you so much for the offer of $${input.initialOffer.toLocaleString()}! I am really excited about collaborating on this campaign.\n\nLooking at the deliverables, production time, and high engagement metrics from my ${input.creatorNiche || "audience"} community, my standard ask for this scope is $${input.desiredRate.toLocaleString()}.\n\nGiven how well our audiences align, I'm confident we will drive exceptional results and ROI for ${brand}. Let me know if this works on your end so we can lock in the production dates!\n\nWarmly,\n[Your Name]`
      };
    }

    if (tone.includes("data")) {
      return {
        source: "deterministic_template",
        script: `Hi ${brand} Team,\n\nThank you for the proposal. Based on our average benchmark of 500k+ weekly impressions, 6.2% engagement rate, and verified conversions in the ${input.creatorNiche || "industry"} sector, the market CPM valuation for this placement is $${input.desiredRate.toLocaleString()}.\n\nOur historical campaign data indicates strong click-through and retention for partners in your category. We can confirm this deliverable schedule at $${input.desiredRate.toLocaleString()} with Net 30 terms and 6 months digital usage rights.\n\nPlease find our media kit attached and let us know how you'd like to proceed.\n\nBest regards,\nTalent Management`
      };
    }

    return {
      source: "deterministic_template",
      script: `Dear ${brand} Team,\n\nThank you for reaching out and extending an initial offer of $${input.initialOffer.toLocaleString()}.\n\nAfter reviewing the required deliverables, creative scope, and licensing terms, our counter-offer for this partnership is $${input.desiredRate.toLocaleString()}. This rate covers full content production, 30-day category exclusivity, and standard revision rounds.\n\nWe value working with ${brand} and look forward to delivering high-impact results for your campaign.\n\nPlease let us know if we can prepare the agreement accordingly.\n\nBest regards,\n[Your Name / Talent Manager]`
    };
  }
};
