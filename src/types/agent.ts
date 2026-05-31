export interface AgentStep {
  tool: string;
  description: string;
  status: "running" | "done";
}

export interface CoralTrace {
  tool: string;
  sql: string;
  table: string;
  source: "coral" | "github-rest";
  rowCount: number;
}
