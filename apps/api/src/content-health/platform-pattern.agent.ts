import { Injectable, Logger } from '@nestjs/common';
import { PlatformPatternAnalysis } from './content-health.dto';

@Injectable()
export class PlatformPatternAgent {
  private readonly logger = new Logger(PlatformPatternAgent.name);

  /**
   * Evaluates content against platform-specific delivery patterns and algorithmic retention factors.
   */
  async analyze(content: {
    platform: string;
    contentType: string;
    niche: string;
    durationSeconds: number;
    caption: string;
  }): Promise<PlatformPatternAnalysis> {
    this.logger.debug(`Running Platform Pattern analysis for ${content.platform} (${content.contentType})`);

    const isShortForm = ['REEL', 'SHORT', 'TIKTOK'].includes(content.contentType.toUpperCase());
    const optimalDuration = isShortForm
      ? content.durationSeconds >= 18 && content.durationSeconds <= 45
      : content.durationSeconds >= 480 && content.durationSeconds <= 900;

    const hasCaptionHook = content.caption.length > 20;
    const retentionRiskFactors: string[] = [];
    const platformTips: string[] = [];

    if (!optimalDuration) {
      retentionRiskFactors.push(
        isShortForm && content.durationSeconds > 60
          ? 'Duration exceeds 60s sweet spot for short-form algorithm distribution'
          : 'Short video duration (< 15s) may fail to trigger platform high-watch-time bonus',
      );
    }

    if (content.caption.length < 15) {
      retentionRiskFactors.push('Minimal caption reduces searchability and indexing in platform explore feeds');
      platformTips.push('Add 2-3 searchable keywords in the first sentence of the caption');
    }

    if (content.platform === 'INSTAGRAM') {
      platformTips.push('Ensure key title cards avoid the bottom 25% zone where usernames and audio tags appear');
      platformTips.push('Use clear on-screen closed captions since 68% of Instagram users browse on mute');
    } else if (content.platform === 'TIKTOK') {
      platformTips.push('Hook the viewer in the first 1.2 seconds with rapid visual movement or question prompt');
      platformTips.push('Leverage trending audio to access viral discovery playlists');
    } else if (content.platform === 'YOUTUBE') {
      platformTips.push('Ensure seamless loop so replay count boosts average percentage viewed (APV)');
    }

    const benchmarkRating = Math.round(
      (optimalDuration ? 45 : 25) +
      (hasCaptionHook ? 30 : 15) +
      20
    );

    return {
      platform: content.platform,
      benchmarkMatchRating: Math.min(95, benchmarkRating),
      optimalDurationFit: optimalDuration,
      hookWindowCompliance: true,
      audioTrendAlignment: 'Voiceover + Lo-fi Background Beat',
      retentionRiskFactors,
      platformTips,
    };
  }
}
