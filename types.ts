
export interface Post {
  id: number;
  title: string;
  summary: string;
  url: string;
  published_date: string;
}

export enum EventType {
    FINANCING = 'financing',
    EXPANSION = 'expansion',
    REGULATION = 'regulation',
    MARKET = 'market',
    TECHNOLOGY = 'technology',
    EXPLORATION = 'exploration',
    M_AND_A = 'm&a', // Mergers and Acquisitions
}

export interface Insight {
  id: string;
  post_id: number;
  post: Post; // Embedded post data for easier display
  summary: string;
  implications_investor: string;
  implications_company: string;
  narratives: string[];
  event_type: EventType;
  created_at: string;
  company_ticker?: string; // Extracted company ticker for company-level grouping
}

export interface CompanyInsight {
  company_ticker: string;
  company_name?: string;
  summary: string; // Comprehensive company-level summary
  implications_investor: string;
  implications_company: string;
  narratives: string[]; // Synthesized narratives
  event_types: EventType[]; // Array of event types across all related posts
  related_post_count: number;
  latest_post_date: string;
  posts: Post[]; // All related posts
  created_at: string;
}
