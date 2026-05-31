export interface TriageResult {
  issueNumber: number;
  title: string;
  suggestedLabels: string[];
  priority: string;
  assignee: string;
  reasoning: string;
  evidence?: number[];
  suggestedResponse?: string;
  nextAction?: string;
}
