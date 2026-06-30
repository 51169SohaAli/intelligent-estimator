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

4. 🛑 CRITICAL SAFETY & VALIDATION GUARDRAIL:
   Before generating any metrics, evaluate if the input is a legitimate software engineering, web development, DevOps, or IT project management task. 
   If the text is nonsensical, completely unrelated to technology (e.g., "poop", "a dog smashed a window car", or random everyday lifestyle stories), or contains random repeated characters, you MUST flag it as invalid.

Always evaluate tasks strictly against these defined boundaries to ensure 100% consistent, professional outputs across identical prompts.`,
        responseMimeType: 'application/json',
        // Add these to the response schema configuration you pass to Gemini
responseSchema: {
  type: "object",
  properties: {
    isValidTask: { 
      type: "boolean", 
      description: "Set to false if the input is non-technical nonsense or gibberish. Set to true if it is a valid IT/software task." 
    },
    validationErrorReason: { 
      type: "string", 
      description: "If isValidTask is false, provide a clean reason like 'Please enter a valid technical software requirement.' Otherwise, leave empty." 
    },
    aiStoryPoints: { type: "number" },
    riskLevel: { type: "string", enum: ["Low", "Medium", "High"] },
    aiSubTasks: { 
      type: "array", 
      items: { type: "string" } 
    }
  },
  required: ["isValidTask", "validationErrorReason", "aiStoryPoints", "riskLevel", "aiSubTasks"]
},
      },
    });

    // 1. Parse the response from Gemini
    const result = JSON.parse(response.text) as AiEstimationResponse;

    // Replace 'throw new Error(...)' with this for a clean 400 Bad Request error:
if (result.isValidTask === false) {
  // Use WsException so NestJS knows it's a WebSocket error
  throw new WsException(result.validationErrorReason);
}

    // 3. Only return the result if it is valid
    return result;


  }
}