
import {
  GoogleGenerativeAI,
  GenerationConfig,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodSchema } from 'zod';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY', '');
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Call Gemini with a prompt and validate the response JSON against a Zod schema.
   * Returns typed, validated data or throws on schema mismatch.
   */
  async generateStructured<T>(
    prompt: string,
    schema: ZodSchema<T>,
    opts?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<T> {
    const modelName = opts?.model ?? 'gemini-2.0-flash';
    const model = this.client.getGenerativeModel({ model: modelName });

    const generationConfig: GenerationConfig = {
      temperature: opts?.temperature ?? 0.3,
      maxOutputTokens: opts?.maxTokens ?? 2048,
      responseMimeType: 'application/json',
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    this.logger.log(`Calling Gemini (${modelName}) with ${prompt.length} char prompt`);

    let rawText: string;
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      rawText = result.response.text();
    } catch (err: any) {
      this.logger.error(`Gemini API call failed: ${err.message || err}`, err);
      throw new InternalServerErrorException(
        `Gemini API error: ${err.message || 'Service temporarily unavailable'}`,
      );
    }

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      this.logger.error(`Gemini returned non-JSON: ${cleaned.slice(0, 200)}`);
      throw new InternalServerErrorException('AI returned malformed response');
    }

    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      this.logger.error('Gemini response failed schema validation', validated.error.flatten());
      throw new InternalServerErrorException('AI response did not match expected format');
    }

    return validated.data;
  }

  async embedText(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values; // array of 768 floats
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const model = this.client.getGenerativeModel({ model: 'text-embedding-004' });
    const results = await Promise.all(texts.map((t) => model.embedContent(t)));
    return results.map((r) => r.embedding.values);
  }

  async researchBrand(brandName: string, brandCategory?: string): Promise<{
    summary: string;
    sourceUrls: string[];
    estimatedTier: string;
  }> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} } as any],
    });

    const prompt = `Research the brand "${brandName}"${brandCategory ? ` (category: ${brandCategory})` : ''} for the purpose of creator/influencer marketing rate benchmarking.

Search for and summarize:
1. Company size and approximate revenue/funding tier (startup, mid-market, enterprise, luxury)
2. Industry and target market
3. Any public information about their influencer/creator marketing spend or past sponsorship campaigns
4. Their general brand positioning (budget vs premium)

Respond with a concise 3-4 sentence summary suitable for a creator deciding how to price a brand deal. Be factual — if you cannot find specific information, say so rather than guessing.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract grounding URLs if available
    const groundingMetadata = (result.response as any).candidates?.[0]?.groundingMetadata;
    const sourceUrls: string[] = groundingMetadata?.groundingChunks
      ?.map((c: any) => c.web?.uri)
      .filter(Boolean) ?? [];

    // Simple tier inference from the summary text
    const lower = text.toLowerCase();
    let estimatedTier = 'MID_MARKET';
    if (lower.includes('luxury') || lower.includes('premium')) estimatedTier = 'LUXURY';
    else if (lower.includes('startup') || lower.includes('early-stage') || lower.includes('seed')) estimatedTier = 'STARTUP';
    else if (lower.includes('fortune 500') || lower.includes('publicly traded') || lower.includes('multinational')) estimatedTier = 'ENTERPRISE';

    return { summary: text, sourceUrls, estimatedTier };
  }
}
