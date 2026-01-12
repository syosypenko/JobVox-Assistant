
export interface InterviewData {
  cvText: string;
  jobDescription: string;
  subject: string;
}

export interface TranscriptionEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export enum InterviewStage {
  HISTORY = 'HISTORY',
  INPUT = 'INPUT',
  PREPARING = 'PREPARING',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  FEEDBACK = 'FEEDBACK'
}

export interface MatchAnalysis {
  matchPercentage: number;
  keyRequirements: string[];
  resumeHighlights: string[];
  interviewStrategy: string;
}

export interface FeedbackSummary {
  strengths: string[];
  improvements: string[];
  overallScore: number;
  detailedAnalysis: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SavedInterview {
  id: string;
  subject: string;
  data: InterviewData;
  matchAnalysis?: MatchAnalysis | null;
  transcript: TranscriptionEntry[];
  feedback: FeedbackSummary | null;
  updatedAt: number;
  syncStatus?: SyncStatus;
}

export interface DBConfig {
  host: string;
  project: string;
  status: 'connected' | 'disconnected' | 'connecting';
}

export interface SavedCV {
  id: string;
  name: string;
  cvText: string;
  createdAt: number;
}
