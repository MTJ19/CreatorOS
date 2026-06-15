import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface InvisibleTaxSummary {
  totalMoneyLeftOnTable: number;
  underpricingGap: {
    amount: number;
    dealCount: number;
    deals: { id: string; brandName: string; offeredAmount: number; recommendedMin: number; gap: number }[];
  };
  usageRightsLeakage: {
    amount: number;
    dealCount: number;
    deals: { id: string; brandName: string; usageRights: string; amount: number; estimatedLeakage: number }[];
  };
  scopeCreep: {
    dealsOverRevisionLimit: number;
    totalExtraRevisions: number;
    deals: { id: string; brandName: string; revisionLimit: number; revisionsUsed: number }[];
  };
  contractRiskScore: {
    avgScore: number;
    dealsWithHighRisk: number;
    totalFlaggedClauses: number;
  };
  worstActiveFlag: {
    id: string;
    clause: string;
    severity: string;
    description: string;
    recommendation: string | null;
    contractId: string;
    dealId: string;
    brandName: string;
  } | null;
  barterDeals: {
    count: number;
    deals: { id: string; brandName: string; title: string }[];
    taxReminder: boolean;
  };
}

/** Organic-only whitelisting leakage multiplier: brands typically pay 2–3x for whitelisting rights */
const WHITELISTING_MULTIPLIER = 2.0;
const WHITELISTING_KEYWORDS = ['whitelist', 'paid ads', 'dark post', 'amplification', 'boosted'];

@Injectable()
export class InvisibleTaxService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(creatorId: string): Promise<InvisibleTaxSummary> {
    const [deals, rateRequests, contracts, worstFlag] = await Promise.all([
      this.prisma.deal.findMany({
        where: { creatorId },
        include: {
          deliverables: true,
          contract: {
            include: {
              riskFlags: { where: { isAcknowledged: false } },
            },
          },
        },
      }),
      this.prisma.rateIntelligenceRequest.findMany({
        where: { userId: creatorId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.findMany({
        where: { creatorId },
        include: { riskFlags: true },
      }),
      this.prisma.contractRiskFlag.findFirst({
        where: {
          isAcknowledged: false,
          contract: { creatorId },
          severity: { in: ['CRITICAL', 'HIGH'] as any[] },
        },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        include: {
          contract: {
            include: { deal: { select: { id: true, brandName: true } } },
          },
        },
      }),
    ]);

    // ── 1. Underpricing Gap ───────────────────────────────────────
    // Match deals to their most recent rate intelligence request
    const rateRequestMap = new Map<string, { recommendedMin: number; recommendedMax: number }>();
    for (const req of rateRequests) {
      const input = req.input;
      const result = req.result;
      if (input?.brandName && result?.recommendedMin) {
        // key by brandName for loose matching
        if (!rateRequestMap.has(input.brandName)) {
          rateRequestMap.set(input.brandName, {
            recommendedMin: Number(result.recommendedMin),
            recommendedMax: Number(result.recommendedMax),
          });
        }
      }
    }

    const underpricedDeals: InvisibleTaxSummary['underpricingGap']['deals'] = [];
    for (const deal of deals) {
      const offered = Number(deal.offeredAmount ?? deal.amount ?? 0);
      const rateData = rateRequestMap.get(deal.brandName);
      if (rateData && offered > 0 && offered < rateData.recommendedMin) {
        underpricedDeals.push({
          id: deal.id,
          brandName: deal.brandName,
          offeredAmount: offered,
          recommendedMin: rateData.recommendedMin,
          gap: rateData.recommendedMin - offered,
        });
      }
    }
    const underpricingTotal = underpricedDeals.reduce((s, d) => s + d.gap, 0);

    // ── 2. Usage Rights Leakage ───────────────────────────────────
    const leakageDeals: InvisibleTaxSummary['usageRightsLeakage']['deals'] = [];
    for (const deal of deals) {
      const usageRights = (deal.usageRights ?? '').toLowerCase();
      const hasWhitelisting = WHITELISTING_KEYWORDS.some((kw) => usageRights.includes(kw));
      if (hasWhitelisting && deal.amount) {
        const amount = Number(deal.amount);
        // Estimate leakage: creator charged organic rate but granted whitelisting rights
        const estimatedLeakage = amount * (WHITELISTING_MULTIPLIER - 1);
        leakageDeals.push({
          id: deal.id,
          brandName: deal.brandName,
          usageRights: deal.usageRights ?? '',
          amount,
          estimatedLeakage,
        });
      }
    }
    const leakageTotal = leakageDeals.reduce((s, d) => s + d.estimatedLeakage, 0);

    // ── 3. Scope Creep ────────────────────────────────────────────
    const scopeCreepDeals: InvisibleTaxSummary['scopeCreep']['deals'] = [];
    for (const deal of deals) {
      const contract = deal.contract;
      const revisionLimit = contract?.revisionLimit ?? 2;
      const revisionsUsed = deal.deliverables.filter(
        (d) => d.status === 'REVISION_REQUESTED',
      ).length;
      if (revisionsUsed > revisionLimit) {
        scopeCreepDeals.push({
          id: deal.id,
          brandName: deal.brandName,
          revisionLimit,
          revisionsUsed,
        });
      }
    }
    const totalExtraRevisions = scopeCreepDeals.reduce(
      (s, d) => s + (d.revisionsUsed - d.revisionLimit),
      0,
    );

    // ── 4. Contract Risk Score ────────────────────────────────────
    const contractsWithScore = contracts.filter((c) => c.overallRiskScore !== null);
    const avgScore =
      contractsWithScore.length > 0
        ? contractsWithScore.reduce((s, c) => s + (c.overallRiskScore ?? 0), 0) /
          contractsWithScore.length
        : 0;

    const totalFlaggedClauses = contracts.reduce(
      (s, c) => s + c.riskFlags.filter((f) => !f.isAcknowledged).length,
      0,
    );

    const dealsWithHighRisk = contracts.filter(
      (c) => c.riskFlags.some((f) => ['HIGH', 'CRITICAL'].includes(f.severity) && !f.isAcknowledged),
    ).length;

    // ── 5. Worst Active Flag ──────────────────────────────────────
    let worstActiveFlag: InvisibleTaxSummary['worstActiveFlag'] = null;
    if (worstFlag) {
      const contractRecord = worstFlag.contract;
      worstActiveFlag = {
        id: worstFlag.id,
        clause: worstFlag.clause,
        severity: worstFlag.severity,
        description: worstFlag.description,
        recommendation: worstFlag.recommendation,
        contractId: worstFlag.contractId,
        dealId: contractRecord?.deal?.id ?? '',
        brandName: contractRecord?.deal?.brandName ?? 'Unknown',
      };
    }

    // ── 6. Barter Deals ───────────────────────────────────────────
    const barterDeals = deals.filter(
      (d) => Number(d.amount) === 0 && ['ACTIVE', 'COMPLETED'].includes(d.status),
    );

    return {
      totalMoneyLeftOnTable: underpricingTotal + leakageTotal,
      underpricingGap: {
        amount: underpricingTotal,
        dealCount: underpricedDeals.length,
        deals: underpricedDeals,
      },
      usageRightsLeakage: {
        amount: leakageTotal,
        dealCount: leakageDeals.length,
        deals: leakageDeals,
      },
      scopeCreep: {
        dealsOverRevisionLimit: scopeCreepDeals.length,
        totalExtraRevisions,
        deals: scopeCreepDeals,
      },
      contractRiskScore: {
        avgScore: Math.round(avgScore),
        dealsWithHighRisk,
        totalFlaggedClauses,
      },
      worstActiveFlag,
      barterDeals: {
        count: barterDeals.length,
        deals: barterDeals.map((d) => ({ id: d.id, brandName: d.brandName, title: d.title })),
        taxReminder: barterDeals.length > 0,
      },
    };
  }
}
