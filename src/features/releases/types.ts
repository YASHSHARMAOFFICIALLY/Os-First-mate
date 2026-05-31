export interface ReleaseSection {
  category: string;
  items: { prNumber: number; title: string; author: string }[];
}
