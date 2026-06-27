export interface AiEstimationResponse {
  aiStoryPoints: number;
  aiSubTasks: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  riskReason: string;
}