export interface RepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  lastCommit: string;
  hasContributingMd: boolean;
  openIssuesCount: number;
  license: string | null;
  defaultBranch: string;
}

export interface RepoIssue {
  number: number;
  title: string;
  labels: string[];
  createdAt: string;
  commentsCount: number;
  bodyPreview: string;
  url: string;
}

export interface HealthVerdict {
  score: "great" | "good" | "caution" | "avoid";
  reasons: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isLoading?: boolean;
}

export interface Citation {
  text: string;
  url: string;
  title: string;
}

export type Skill = string;
