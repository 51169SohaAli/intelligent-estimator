export interface AiEstimationResponse {
  isValidTask: boolean;
  validationErrorReason: string;
  aiStoryPoints: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  aiSubTasks: string[];
}