import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkerPoolService } from './worker-pool.service';
import { PlatformPatternAgent } from './platform-pattern.agent';
import { AggregationEngine } from './aggregation.engine';
import {
  CreateContentIntakeInput,
  ContentHealthScoreResponse,
} from './content-health.dto';
import { ContentScoreRunStatus, SocialPlatform } from '@prisma/client';

@Injectable()
export class ContentHealthService {
  private readonly logger = new Logger(ContentHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workerPool: WorkerPoolService,
    private readonly platformAgent: PlatformPatternAgent,
    private readonly aggregationEngine: AggregationEngine,
  ) {}

  /**
   * Submits new content and initiates a background evaluation run.
   */
  async startAnalysis(creatorId: string, input: CreateContentIntakeInput) {
    this.logger.log(`Starting content health analysis for creator ${creatorId}: "${input.title}"`);

    // 1. Persist content intake
    const content = await this.prisma.content.create({
      data: {
        creatorId,
        title: input.title,
        caption: input.caption || '',
        platform: input.platform as SocialPlatform,
        contentType: input.contentType,
        niche: input.niche,
        targetAudience: input.targetAudience,
        videoUrl: input.videoUrl || null,
        durationSeconds: input.durationSeconds || 45,
      },
    });

    // 2. Create evaluation run in QUEUED status
    const run = await this.prisma.contentScoreRun.create({
      data: {
        contentId: content.id,
        status: ContentScoreRunStatus.QUEUED,
        progress: 0,
      },
    });

    // 3. Launch background execution asynchronously
    void this.executeEvaluationRun(run.id, content.id);

    return {
      runId: run.id,
      contentId: content.id,
      status: run.status,
      message: 'Evaluation run successfully scheduled and processing in background.',
    };
  }

  /**
   * Background orchestrator pipeline
   */
  private async executeEvaluationRun(runId: string, contentId: string) {
    try {
      // Transition to RUNNING
      await this.prisma.contentScoreRun.update({
        where: { id: runId },
        data: { status: ContentScoreRunStatus.RUNNING, progress: 10 },
      });

      const content = await this.prisma.content.findUniqueOrThrow({
        where: { id: contentId },
      });

      // Fetch all active personas
      const personas = await this.prisma.evaluatorPersona.findMany({
        where: { active: true },
      });

      if (personas.length === 0) {
        throw new Error('No active evaluator personas found in the database');
      }

      const personaSegmentMap = new Map(personas.map((p) => [p.id, p.segment]));

      // Dispatch persona evaluations through bounded worker pool (concurrency 15)
      const poolResult = await this.workerPool.executePool(
        personas,
        {
          title: content.title,
          caption: content.caption,
          platform: content.platform,
          contentType: content.contentType,
          niche: content.niche,
          targetAudience: content.targetAudience,
          durationSeconds: content.durationSeconds,
        },
        15,
        async (completed, total) => {
          const pct = 15 + Math.round((completed / total) * 65); // 15% -> 80%
          await this.prisma.contentScoreRun.update({
            where: { id: runId },
            data: { progress: pct },
          });
        },
      );

      // Save individual persona results (one row per persona per run)
      for (const res of poolResult.successful) {
        await this.prisma.contentScorePersonaResult.upsert({
          where: {
            runId_personaId: {
              runId,
              personaId: res.personaId,
            },
          },
          create: {
            runId,
            personaId: res.personaId,
            hookScore: res.hookScore,
            clarityScore: res.clarityScore,
            engagementScore: res.engagementScore,
            relevanceScore: res.relevanceScore,
            shareabilityScore: res.shareabilityScore,
            overallScore: res.overallScore,
            reason: res.reason,
            strengths: res.strengths,
            weaknesses: res.weaknesses,
          },
          update: {
            hookScore: res.hookScore,
            clarityScore: res.clarityScore,
            engagementScore: res.engagementScore,
            relevanceScore: res.relevanceScore,
            shareabilityScore: res.shareabilityScore,
            overallScore: res.overallScore,
            reason: res.reason,
            strengths: res.strengths,
            weaknesses: res.weaknesses,
          },
        });
      }

      await this.prisma.contentScoreRun.update({
        where: { id: runId },
        data: { progress: 85 },
      });

      // Run separate Platform Pattern Agent
      const platformPatterns = await this.platformAgent.analyze({
        platform: content.platform,
        contentType: content.contentType,
        niche: content.niche,
        durationSeconds: content.durationSeconds,
        caption: content.caption,
      });

      // Aggregate persona scores
      const aggregated = this.aggregationEngine.aggregate(
        poolResult.successful,
        personaSegmentMap,
      );

      // Persist final ContentScore
      await this.prisma.contentScore.create({
        data: {
          runId,
          overallScore: aggregated.overallScore,
          viralityPotential: aggregated.viralityPotential,
          hookScore: aggregated.dimensions.hook,
          engagementScore: aggregated.dimensions.engagement,
          clarityScore: aggregated.dimensions.clarity,
          relevanceScore: aggregated.dimensions.relevance,
          shareabilityScore: aggregated.dimensions.shareability,
          nicheScore: aggregated.segments.nicheScore,
          coldOutsiderScore: aggregated.segments.coldOutsiderScore,
          platformNativeScore: aggregated.segments.platformNativeScore,
          p25: aggregated.percentiles.p25,
          p50: aggregated.percentiles.p50,
          p75: aggregated.percentiles.p75,
          disagreementDetected: aggregated.disagreement.detected,
          disagreementVariance: aggregated.disagreement.variance,
          disagreementInsight: aggregated.disagreement.insight,
          platformPatterns: platformPatterns as any,
          recommendations: aggregated.recommendations,
        },
      });

      // Mark run as COMPLETED
      await this.prisma.contentScoreRun.update({
        where: { id: runId },
        data: {
          status: ContentScoreRunStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Evaluation run ${runId} completed with overall score ${aggregated.overallScore}`);
    } catch (err: any) {
      this.logger.error(`Evaluation run ${runId} failed: ${err.message}`, err.stack);
      await this.prisma.contentScoreRun.update({
        where: { id: runId },
        data: {
          status: ContentScoreRunStatus.FAILED,
          errorMsg: err.message,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Retrieves the current execution status and progress of a run.
   */
  async getRunStatus(runId: string) {
    const run = await this.prisma.contentScoreRun.findUnique({
      where: { id: runId },
      include: {
        content: true,
        _count: {
          select: { personaResults: true },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Run ${runId} not found`);
    }

    return {
      runId: run.id,
      contentId: run.contentId,
      status: run.status,
      progress: run.progress,
      totalPersonas: 15,
      completedPersonas: run._count?.personaResults ?? 0,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      errorMsg: run.errorMsg,
      content: {
        title: run.content.title,
        platform: run.content.platform,
        contentType: run.content.contentType,
      },
    };
  }

  /**
   * Fetches the final aggregated Content Health Score and analytics for a run.
   */
  async getScore(runId: string): Promise<ContentHealthScoreResponse> {
    const run = await this.prisma.contentScoreRun.findUnique({
      where: { id: runId },
      include: {
        content: true,
        score: true,
        _count: {
          select: { personaResults: true },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Run ${runId} not found`);
    }

    if (!run.score) {
      throw new NotFoundException(`Score has not been calculated yet for run ${runId} (status: ${run.status})`);
    }

    const score = run.score;
    const platformPatterns = score.platformPatterns as any;

    return {
      id: score.id,
      runId: run.id,
      contentId: run.contentId,
      contentTitle: run.content.title,
      platform: run.content.platform,
      niche: run.content.niche,
      overallScore: score.overallScore,
      viralityPotential: score.viralityPotential as any,
      dimensions: {
        hook: score.hookScore,
        engagement: score.engagementScore,
        clarity: score.clarityScore,
        relevance: score.relevanceScore,
        shareability: score.shareabilityScore,
      },
      segments: {
        nicheScore: score.nicheScore,
        coldOutsiderScore: score.coldOutsiderScore,
        platformNativeScore: score.platformNativeScore,
      },
      percentiles: {
        p25: score.p25,
        p50: score.p50,
        p75: score.p75,
      },
      disagreement: {
        detected: score.disagreementDetected,
        variance: score.disagreementVariance,
        insight: score.disagreementInsight || '',
      },
      platformPatterns: {
        platform: platformPatterns.platform || run.content.platform,
        benchmarkMatchRating: platformPatterns.benchmarkMatchRating || 75,
        optimalDurationFit: !!platformPatterns.optimalDurationFit,
        hookWindowCompliance: !!platformPatterns.hookWindowCompliance,
        audioTrendAlignment: platformPatterns.audioTrendAlignment || 'Voiceover + Lo-fi Beat',
        retentionRiskFactors: platformPatterns.retentionRiskFactors || [],
        platformTips: platformPatterns.platformTips || [],
      },
      recommendations: score.recommendations,
      evaluatedPersonasCount: run._count.personaResults,
      createdAt: score.createdAt.toISOString(),
    };
  }

  /**
   * Returns individual persona evaluations for drill-down.
   */
  async getPersonaResults(runId: string, segmentFilter?: string) {
    const results = await this.prisma.contentScorePersonaResult.findMany({
      where: {
        runId,
        ...(segmentFilter ? { persona: { segment: segmentFilter as any } } : {}),
      },
      include: {
        persona: true,
      },
      orderBy: { overallScore: 'desc' },
    });

    return results.map((r) => ({
      id: r.id,
      personaId: r.personaId,
      personaName: r.persona.name,
      segment: r.persona.segment,
      avatar: r.persona.avatar,
      demographics: r.persona.demographics,
      bio: r.persona.bio,
      hookScore: r.hookScore,
      clarityScore: r.clarityScore,
      engagementScore: r.engagementScore,
      relevanceScore: r.relevanceScore,
      shareabilityScore: r.shareabilityScore,
      overallScore: r.overallScore,
      reason: r.reason,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Retrieves latest runs for current creator
   */
  async getRecentRuns(creatorId: string) {
    return this.prisma.contentScoreRun.findMany({
      where: {
        content: { creatorId },
      },
      include: {
        content: true,
        score: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });
  }
}
