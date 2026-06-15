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
    const modelName = opts?.model ?? 'gemini-1.5-flash';
    const model = this.client.getGenerativeModel({ model: modelName });

    const generationConfig: GenerationConfig = {
      temperature: opts?.temperature ?? 0.3,
      maxOutputTokens: opts?.maxTokens ?? 2048,
      responseMimeType: 'application/json',
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
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
    } catch (err) {
      this.logger.error('Gemini API call failed', err);
      throw new InternalServerErrorException('AI service temporarily unavailable');
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
}
