import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/** Confidence weight multipliers */
const CONFIDENCE_WEIGHTS: Record<string, number> = {
  CONFIRMED: 1.0,
  LIKELY: 0.7,
  SPECULATIVE: 0.3,
};

export interface RunwayProjection {
  days: number;
  gross: number; // Confidence-weighted projected income
  dealCount: number;
  deals: {
    id: string;
    brandName: string;
    amount: number;
    confidence: string;
    weighted: number;
    deadline: Date | null;
  }[];
}

export interface RunwayResponse {
  projection30: RunwayProjection;
  projection60: RunwayProjection;
  projection90: RunwayProjection;
  outstandingReceivables: number;
  overdueAmount: number;
  monthlyFixedCosts: number;
  currency: string;
  netRunwayMonths: number | null;
  chartData: { label: string; projected: number; receivables: number }[];
}

export interface FinancialSettingsDto {
  monthlyFixedCosts: number;
  currency?: string;
}

@Injectable()
export class FinancialRunwayService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Settings ──────────────────────────────────────────────────

  async getSettings(creatorId: string) {
    const settings = await this.prisma.financialSettings.findUnique({
      where: { creatorId },
    });
    return settings ?? { creatorId, monthlyFixedCosts: 0, currency: 'USD' };
  }

  async upsertSettings(creatorId: string, dto: FinancialSettingsDto) {
    return this.prisma.financialSettings.upsert({
      where: { creatorId },
      create: {
        creatorId,
        monthlyFixedCosts: new Prisma.Decimal(dto.monthlyFixedCosts),
        currency: dto.currency ?? 'USD',
      },
      update: {
        monthlyFixedCosts: new Prisma.Decimal(dto.monthlyFixedCosts),
        ...(dto.currency ? { currency: dto.currency } : {}),
      },
    });
  }

  // ── Runway Calculation ────────────────────────────────────────

  async getProjection(creatorId: string): Promise<RunwayResponse> {
    const now = new Date();

    const [deals, invoices, settings] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          creatorId,
          status: { notIn: ['COMPLETED', 'CANCELLED', 'DISPUTED'] },
          stage: { notIn: ['LOST'] },
        },
        select: {
          id: true,
          brandName: true,
          amount: true,
          confidence: true,
          deadline: true,
          stage: true,
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          creatorId,
          status: { notIn: ['PAID', 'CANCELLED'] as any[] },
        },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          status: true,
        },
      }),
      this.prisma.financialSettings.findUnique({ where: { creatorId } }),
    ]);

    const monthlyFixedCosts = Number(settings?.monthlyFixedCosts ?? 0);
    const currency = settings?.currency ?? 'USD';

    // ── Project per time horizon ──────────────────────────────────
    const buildProjection = (days: number): RunwayProjection => {
      const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const relevant = deals.filter((d) => d.deadline && d.deadline <= horizon);
      const dealDetails = relevant.map((d) => {
        const amount = Number(d.amount);
        const weight = CONFIDENCE_WEIGHTS[d.confidence ?? 'LIKELY'] ?? 0.7;
        return {
          id: d.id,
          brandName: d.brandName,
          amount,
          confidence: d.confidence ?? 'LIKELY',
          weighted: amount * weight,
          deadline: d.deadline,
        };
      });
      return {
        days,
        gross: dealDetails.reduce((s, d) => s + d.weighted, 0),
        dealCount: dealDetails.length,
        deals: dealDetails,
      };
    };

    const projection30 = buildProjection(30);
    const projection60 = buildProjection(60);
    const projection90 = buildProjection(90);

    // ── Receivables & Overdue ─────────────────────────────────────
    let outstandingReceivables = 0;
    let overdueAmount = 0;

    for (const inv of invoices) {
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount ?? 0);
      outstandingReceivables += outstanding;
      if (inv.dueDate && inv.dueDate < now) {
        overdueAmount += outstanding;
      }
    }

    // ── Net Runway ────────────────────────────────────────────────
    const netRunwayMonths =
      monthlyFixedCosts > 0
        ? (outstandingReceivables - overdueAmount + projection30.gross) / monthlyFixedCosts
        : null;

    // ── Chart data (monthly buckets for 3 months) ─────────────────
    const chartData = [
      {
        label: '30d',
        projected: Math.round(projection30.gross),
        receivables: Math.round(outstandingReceivables),
      },
      {
        label: '60d',
        projected: Math.round(projection60.gross),
        receivables: Math.round(outstandingReceivables),
      },
      {
        label: '90d',
        projected: Math.round(projection90.gross),
        receivables: Math.round(outstandingReceivables),
      },
    ];

    return {
      projection30,
      projection60,
      projection90,
      outstandingReceivables: Math.round(outstandingReceivables),
      overdueAmount: Math.round(overdueAmount),
      monthlyFixedCosts,
      currency,
      netRunwayMonths: netRunwayMonths !== null ? Math.round(netRunwayMonths * 10) / 10 : null,
      chartData,
    };
  }

  // ── Update deal confidence ────────────────────────────────────

  async updateDealConfidence(dealId: string, creatorId: string, confidence: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal || deal.creatorId !== creatorId) {
      throw new Error(`Deal ${dealId} not found`);
    }
    return this.prisma.deal.update({
      where: { id: dealId },
      data: { confidence: confidence as any },
      select: { id: true, brandName: true, confidence: true },
    });
  }
}
