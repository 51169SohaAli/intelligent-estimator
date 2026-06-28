import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { AiEstimationResponse } from './ai-response.interface';

@Injectable()
export class AiService implements OnModuleInit {
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    // Initialize the modern Google Gen AI client
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateEstimation(title: string, description: string): Promise<AiEstimationResponse> {
    const prompt = `Analyze this Agile task and provide an estimation:
    Task Title: ${title}
    Task Description: ${description}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        // 👇 ADD TEMPERATURE HERE (0.1 forces consistent engineering estimations)
        temperature: 0.1, 

        systemInstruction: `You are an expert Agile Project Manager and Senior Software Architect. 

CRITICAL INSTRUCTIONS FOR ESTIMATION:
1. STORY POINTS: Assign Fibonacci values (1, 2, 3, 5, 8, 13) based on standard engineering complexity.
2. SUBTASKS LIMIT: Always provide exactly 4 to 6 high-level technical subtasks. Do not over-granuralize. Focus strictly on: Frontend UI, Backend API Endpoint, Database/Model changes, and Security/Testing.
3. RISK LEVEL RUBRIC:
   - Low: Minor UI tweaks, text changes, or self-contained helper functions.
   - Medium: Basic CRUD operations, simple schema additions, or trusted internal business logic.
   - High: Involves cryptographic security, external third-party email providers, authentication states, or financial transactions.
   
Always evaluate tasks strictly against these defined boundaries to ensure 100% consistent outputs across identical prompts.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiStoryPoints: { type: Type.INTEGER, description: 'Fibonacci number estimation (1, 2, 3, 5, 8, 13)' },
            aiSubTasks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Step-by-step developer tasks needed to implement this feature'
            },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            riskReason: { type: Type.STRING, description: 'Explanation for why this risk level was assigned' },
          },
          required: ['aiStoryPoints', 'aiSubTasks', 'riskLevel', 'riskReason'],
        },
      },
    });

    return JSON.parse(response.text) as AiEstimationResponse;
  }
}