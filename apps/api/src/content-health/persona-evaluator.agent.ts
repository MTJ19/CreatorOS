import { Injectable, Logger } from '@nestjs/common';
import { EvaluatorPersona, PersonaSegment } from '@prisma/client';
import { z } from 'zod';
import { GeminiService } from '../gemini/gemini.service';

const PersonaEvaluationAiSchema = z.object({
  hookScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  engagementScore: z.number().min(0).max(100),
  relevanceScore: z.number().min(0).max(100),
  shareabilityScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  reason: z.string().min(10),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
});

export interface EvaluatedPersonaResult {
  personaId: string;
  hookScore: number;
  clarityScore: number;
  engagementScore: number;
  relevanceScore: number;
  shareabilityScore: number;
  overallScore: number;
  reason: string;
  strengths: string[];
  weaknesses: string[];
}

@Injectable()
export class PersonaEvaluatorAgent {
  private readonly logger = new Logger(PersonaEvaluatorAgent.name);

  constructor(private readonly gemini: GeminiService) {}

  /**
   * Evaluates content strictly through the lens of a single dynamic persona.
   * Uses Gemini AI with structured schema, falling back gracefully to a heuristic simulation.
   */
  async evaluate(
    persona: EvaluatorPersona,
    content: {
      title: string;
      caption: string;
      platform: string;
      contentType: string;
      niche: string;
      targetAudience?: string | null;
      durationSeconds: number;
    },
  ): Promise<EvaluatedPersonaResult> {
    this.logger.debug(`Evaluating persona ${persona.name} (${persona.segment})`);

    const prompt = `You are roleplaying as the following audience persona evaluating a piece of creator content:
NAME: ${persona.name}
SEGMENT: ${persona.segment}
DEMOGRAPHICS: ${persona.demographics}
BIO: ${persona.bio}
EVALUATION CRITERIA: ${persona.evaluationPrompt}

CONTENT BEING EVALUATED:
- Title / Concept: "${content.title}"
- Caption / Script context: "${content.caption}"
- Platform: ${content.platform}
- Format: ${content.contentType}
- Creator Niche: ${content.niche}
- Declared Target Audience: ${content.targetAudience || 'General audience'}
- Length: ${content.durationSeconds} seconds

Provide an honest, in-character rating from 0 to 100 for:
1. hookScore (first 3 seconds attention grab)
2. clarityScore (understandability of message/premise)
3. engagementScore (likelihood to watch till the end or comment)
4. relevanceScore (how meaningful this topic is to YOU)
5. shareabilityScore (would you DM or share this with friends)
6. overallScore (overall retention/virality grade from your perspective)
7. reason (1-2 sentences of direct, personal feedback in your persona's voice)
8. strengths (up to 2 specific highlights)
9. weaknesses (up to 2 friction points or reasons for skipping)

Output purely valid JSON.`;

    try {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5) {
        const result = (await this.gemini.generateStructured(prompt, PersonaEvaluationAiSchema, {
          temperature: 0.7,
        })) as any;

        return {
          personaId: persona.id,
          hookScore: result.hookScore ?? 75,
          clarityScore: result.clarityScore ?? 75,
          engagementScore: result.engagementScore ?? 75,
          relevanceScore: result.relevanceScore ?? 75,
          shareabilityScore: result.shareabilityScore ?? 75,
          overallScore: result.overallScore ?? 75,
          reason: result.reason ?? 'Good evaluation',
          strengths: result.strengths ?? [],
          weaknesses: result.weaknesses ?? [],
        };
      }
    } catch (err: any) {
      this.logger.warn(`Gemini evaluation failed for ${persona.name}, using deterministic persona model: ${err.message}`);
    }

    // Heuristic simulation model tailored specifically to the persona's segment
    return this.simulatePersonaEvaluation(persona, content);
  }

  /**
   * Deterministic heuristic evaluator modeling distinct segment behaviors
   */
  private simulatePersonaEvaluation(
    persona: EvaluatorPersona,
    content: {
      title: string;
      caption: string;
      platform: string;
      contentType: string;
      niche: string;
      durationSeconds: number;
    },
  ): EvaluatedPersonaResult {
    // Generate pseudo-random variance based on persona and content title hash
    const seed = (persona.name.length * 17 + content.title.length * 31) % 100;
    const variance = (seed % 15) - 7; // -7 to +7

    let baseHook = 75;
    let baseClarity = 75;
    let baseEngagement = 74;
    let baseRelevance = 76;
    let baseShareability = 70;
    let reason = '';
    let strengths: string[] = [];
    let weaknesses: string[] = [];

    if (persona.segment === PersonaSegment.NICHE) {
      baseRelevance = 88;
      baseEngagement = 82;
      baseHook = 80;
      baseClarity = 78;
      baseShareability = 74;
      reason = `As a specialist in ${content.niche}, I appreciate the focused premise and insider context, though more practical takeaways would elevate it.`;
      strengths = ['Strong domain alignment', 'Authentic depth for subject practitioners'];
      weaknesses = ['Could deliver the core takeaway faster'];
    } else if (persona.segment === PersonaSegment.COLD_OUTSIDER) {
      // Cold outsiders struggle more if jargon is assumed
      baseRelevance = 58;
      baseClarity = 64;
      baseHook = 72;
      baseEngagement = 60;
      baseShareability = 52;
      reason = `Without background context in ${content.niche}, the opening was intriguing but the middle section felt overly specific to insiders.`;
      strengths = ['Eye-catching concept'];
      weaknesses = ['Assumes too much prior knowledge', 'High friction for casual scrollers'];
    } else {
      // Platform Native
      const isOptimalLength = content.durationSeconds >= 15 && content.durationSeconds <= 60;
      baseHook = isOptimalLength ? 86 : 68;
      baseEngagement = 80;
      baseShareability = 82;
      baseClarity = 76;
      baseRelevance = 75;
      reason = `Great visual pacing and platform fit. The hook works within vertical feed constraints, making it easy to share via DMs.`;
      strengths = ['Pacing fits vertical video algorithm', 'High DM shareability potential'];
      weaknesses = ['Ensure caption doesn\'t overlap native mobile UI buttons'];
    }

    const clamp = (val: number) => Math.min(98, Math.max(35, Math.round(val + variance)));

    const hookScore = clamp(baseHook);
    const clarityScore = clamp(baseClarity);
    const engagementScore = clamp(baseEngagement);
    const relevanceScore = clamp(baseRelevance);
    const shareabilityScore = clamp(baseShareability);
    const overallScore = Math.round(
      hookScore * 0.25 +
      engagementScore * 0.25 +
      clarityScore * 0.2 +
      relevanceScore * 0.15 +
      shareabilityScore * 0.15,
    );

    return {
      personaId: persona.id,
      hookScore,
      clarityScore,
      engagementScore,
      relevanceScore,
      shareabilityScore,
      overallScore,
      reason,
      strengths,
      weaknesses,
    };
  }
}
