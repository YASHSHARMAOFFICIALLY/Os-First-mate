export interface ContributorStats {
  busFactor: {
    score: number;
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
