import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.getOrThrow('PYTHON_SERVICE_URL');
    this.apiKey = this.config.getOrThrow('INTERNAL_API_KEY');
  }

  async generateRoadmap(
    profile: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.baseUrl}/roadmap/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': this.apiKey,
        },
        body: JSON.stringify(profile),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Python service returned ${response.status}`);
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      this.logger.warn(
        `Python service unavailable: ${(error as Error).message}. Falling back to raw DB steps.`,
      );
      return null;
    }
  }

  async chat(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Python service returned ${response.status}`);
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      this.logger.warn(`AI chat unavailable: ${(error as Error).message}`);
      return null;
    }
  }

  async explainField(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/explain-field`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Python service returned ${response.status}`);
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      this.logger.warn(
        `Field explanation unavailable: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
