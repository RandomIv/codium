import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface JudgeProblem {
  timeLimit: number;
  memoryLimit: number;
  testCases: {
    id: string;
    input: string;
    output: string;
  }[];
}

@Injectable()
export class ApiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService
      .getOrThrow<string>('API_URL')
      .replace(/\/$/, '');
    this.apiKey = this.configService.getOrThrow<string>('SYSTEM_API_KEY');
  }

  async getProblem(problemId: string): Promise<JudgeProblem> {
    return this.request<JudgeProblem>(`problems/system/${problemId}`, 'GET');
  }

  async updateSubmission(submissionId: string, data: any): Promise<void> {
    return this.request<void>(`submissions/${submissionId}`, 'PATCH', data);
  }

  private async request<T>(
    endpoint: string,
    method: string,
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-system-api-key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : (null as T);
    } catch (error) {
      throw error;
    }
  }
}
