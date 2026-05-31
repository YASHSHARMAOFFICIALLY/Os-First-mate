export interface RepoBrief {
  repoHealth: {
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    summary: string;
  };
  urgentIssues: {
    number: number;
    title: string;
    priority: string;
    reason: string;
    nextAction: string;
  }[];
  duplicateRisks: {
    issues: { number: number; title: string }[];
    similarity: string;
    nextAction: string;
  }[];
  contributorRisks: {
    risk: string;
    detail: string;
    nextAction: string;
  }[];
  risingContributors: {
    login: string;
    recentPrs: number;
    recommendation: string;
  }[];
  releaseCandidates: {
    prCount: number;
    sinceTag: string;
    nextAction: string;
  };
  recommendedActions: {
    priority: number;
    action: string;
    reason: string;
    command?: string;
  }[];
}
