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
      model: 'gemini-2.5-flash', // The fast, high-performance model for text/JSON tasks
      contents: prompt,
      config: {
        // System instructions to guide the AI's persona
        systemInstruction: 'You are an expert Agile Project Manager and Senior Software Architect. Estimate story points (1, 2, 3, 5, 8, 13), break down technical implementation sub-tasks, and identify potential architectural risks.',
        // Enforce exact JSON response format matching our Mongoose model
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

    // The text field is guaranteed to be a valid JSON string matching the schema above
    return JSON.parse(response.text) as AiEstimationResponse;
  }
}