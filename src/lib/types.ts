// Chat message in the UI
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

// Agent reasoning step — shown live in the UI
export interface AgentStep {
  tool: string;
  description: string;
  status: "running" | "done";
}

// Coral query trace — proves Coral is powering the product
export interface CoralTrace {
  tool: string;
  sql: string;
  table: string;
  source: "coral" | "github-rest";
  rowCount: number;
}

// Triage feature
export interface TriageResult {
  issueNumber: number;
  title: string;
  suggestedLabels: string[];
  priority: string;
  assignee: string;
  reasoning: string;
  evidence?: number[]; // similar closed issue numbers
  suggestedResponse?: string;
  nextAction?: string; // what should the maintainer do
}

// Project Health feature (formerly Contributor Intelligence)
export interface ContributorStats {
  busFactor: {
    score: number; // 1-5
    risk: "low" | "medium" | "high" | "critical";
    topContributor: string;
    percentage: number;
  };
  topContributors: {
    login: string;
    prs: number;
    issues: number;
    role: string;
  }[];
  risingStars: {
    login: string;
    recentPrs: number;
    trend: string;
  }[];
  reviewBottleneck?: {
    bottleneck: string;
    avgWaitDays: number;
    suggestion: string;
  };
  burnoutRisk?: {
    contributor: string;
    signal: string;
    recommendation: string;
  }[];
  insights: string[];
  recommendations: string[];
}

// Repo Brief feature
export interface RepoBrief {
  repoHealth: {
    score: number; // 1-100
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

// Release notes feature
export interface ReleaseSection {
  category: string;
  items: { prNumber: number; title: string; author: string }[];
}

// Tab navigation
export type Tab = "brief" | "triage" | "health" | "releases";
