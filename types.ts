
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
}
