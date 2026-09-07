import { Injectable, Logger } from '@nestjs/common';
import { EvaluatorPersona } from '@prisma/client';
import { EvaluatedPersonaResult, PersonaEvaluatorAgent } from './persona-evaluator.agent';

export interface PoolExecutionResult {
  successful: EvaluatedPersonaResult[];
  failed: { personaId: string; personaName: string; error: string }[];
}

@Injectable()
export class WorkerPoolService {
  private readonly logger = new Logger(WorkerPoolService.name);
  private readonly DEFAULT_CONCURRENCY = 15;
  private readonly MAX_RETRIES = 2;

  constructor(private readonly personaAgent: PersonaEvaluatorAgent) {}

  /**
   * Dispatches evaluation across all personas through a bounded worker pool.
   * Concurrency is bounded to 15 workers with retry and failure isolation.
   */
  async executePool(
    personas: EvaluatorPersona[],
    content: {
      title: string;
      caption: string;
      platform: string;
      contentType: string;
      niche: string;
      targetAudience?: string | null;
      durationSeconds: number;
    },
    concurrency = this.DEFAULT_CONCURRENCY,
    onProgress?: (completedCount: number, totalCount: number) => Promise<void>,
  ): Promise<PoolExecutionResult> {
    const total = personas.length;
    this.logger.log(`Dispatching ${total} persona evaluations with bounded concurrency = ${concurrency}`);

    const successful: EvaluatedPersonaResult[] = [];
    const failed: { personaId: string; personaName: string; error: string }[] = [];
    let completedCount = 0;

    // Execute with controlled concurrency chunks
    const queue = [...personas];
    const workers: Promise<void>[] = [];

    const worker = async () => {
      while (queue.length > 0) {
        const persona = queue.shift();
        if (!persona) break;

        let attempts = 0;
        let success = false;
        let lastError = '';

        while (attempts <= this.MAX_RETRIES && !success) {
          attempts++;
          try {
            const result = await this.personaAgent.evaluate(persona, content);
            successful.push(result);
            success = true;
          } catch (err: any) {
            lastError = err.message || 'Unknown evaluation failure';
            this.logger.warn(`Persona ${persona.name} evaluation attempt ${attempts} failed: ${lastError}`);
          }
        }

        if (!success) {
          this.logger.error(`Persona ${persona.name} failed all retries. Isolating failure.`);
          failed.push({
            personaId: persona.id,
            personaName: persona.name,
            error: lastError,
          });
        }

        completedCount++;
        if (onProgress) {
          await onProgress(completedCount, total);
        }
      }
    };

    const workerCount = Math.min(concurrency, total);
    for (let i = 0; i < workerCount; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    this.logger.log(`Worker pool finished: ${successful.length} successful, ${failed.length} failed`);
    return { successful, failed };
  }
}
