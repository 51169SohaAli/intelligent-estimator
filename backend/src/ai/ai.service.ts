import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { AiEstimationResponse } from './ai-response.interface';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class AiService implements OnModuleInit {
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateEstimation(title: string, description: string): Promise<AiEstimationResponse> {
    const prompt = `Analyze this Agile task and provide an estimation:
    Task Title: ${title}
    Task Description: ${description}`;

    // Define model cascade: try primary gemini-2.5-flash first, fall back to gemini-1.5-flash if 503 occurs
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const responseText = await this.executeGenAiRequest(modelName, prompt);
        const result = JSON.parse(responseText) as AiEstimationResponse;

        // Validation check for nonsensical inputs
        if (result.isValidTask === false) {
          throw new WsException(
            result.validationErrorReason || 'Please enter a valid technical software requirement.'
          );
        }

        return result;
      } catch (error: any) {
        // Rethrow WsException immediately so non-technical input validation errors pass through cleanly
        if (error instanceof WsException) {
          throw error;
        }

        const is503 =
          error?.status === 503 ||
          error?.message?.includes('503') ||
          error?.message?.includes('UNAVAILABLE') ||
          error?.message?.includes('high demand');

        if (is503) {
          console.warn(
            `[AiService] Model '${modelName}' hit 503 high demand. Attempting fallback/retry...`
          );
          lastError = error;
          continue; // Move to next model in sequence
        }

        // Rethrow any non-503 execution errors
        throw error;
      }
    }

    // If both models hit 503 high demand
    throw new WsException('AI Service is temporarily busy due to high demand. Please try again in a moment.');
  }

  /**
   * Internal helper to execute content generation using @google/genai SDK
   */
  private async executeGenAiRequest(modelName: string, prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.1,
        systemInstruction: `You are an expert Agile Project Manager and Senior Software Architect. 

CRITICAL INSTRUCTIONS FOR ESTIMATION:
1. STORY POINTS: Assign Fibonacci values (1, 2, 3, 5, 8, 13) based on standard engineering complexity.
2. SUBTASKS LIMIT: Always provide exactly 4 to 6 high-level technical subtasks. Do not over-granuralize. Focus strictly on: Frontend UI, Backend API Endpoint, Database/Model changes, and Security/Testing.
3. RISK LEVEL RUBRIC:
   - Low: Minor UI tweaks, text changes, or self-contained helper functions.
   - Medium: Basic CRUD operations, simple schema additions, or trusted internal business logic.
   - High: Involves cryptographic security, external third-party email providers, authentication states, or financial transactions.

4. 🛑 CRITICAL SAFETY & VALIDATION GUARDRAIL:
   Before generating any metrics, evaluate if the input is a legitimate software engineering, web development, DevOps, or IT project management task. 
   If the text is nonsensical, completely unrelated to technology (e.g., "poop", "a dog smashed a window car", or random everyday lifestyle stories), or contains random repeated characters, you MUST flag it as invalid.

Always evaluate tasks strictly against these defined boundaries to ensure 100% consistent, professional outputs across identical prompts.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidTask: {
              type: Type.BOOLEAN,
              description: 'Set to false if the input is non-technical nonsense or gibberish. Set to true if it is a valid IT/software task.',
            },
            validationErrorReason: {
              type: Type.STRING,
              description: 'If isValidTask is false, provide a clean reason like "Please enter a valid technical software requirement." Otherwise, leave empty.',
            },
            aiStoryPoints: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            aiSubTasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['isValidTask', 'validationErrorReason', 'aiStoryPoints', 'riskLevel', 'aiSubTasks'],
        },
      },
    });

    return response.text;
  }
}