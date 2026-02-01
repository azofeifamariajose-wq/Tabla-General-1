
export interface QuestionDef {
  key: string;
  label: string;
  type: string;
  options?: string[];
  default?: string;
  locked?: boolean;
  instruction?: string;
}

export interface SectionDef {
  section_name: string;
  questions: QuestionDef[];
}

export interface BlockDef {
  block_number: number;
  block_name: string;
  sections: SectionDef[];
  description?: string;
  notes?: string;
}

export interface SchemaDef {
  table_name?: string;
  language?: string;
  blocks: BlockDef[];
}

export interface ExtractionItem {
  block_id: number;
  section_name: string;
  question: string;
  answer: string;
  page_number: string;
  reasoning: string;
}

export interface AuditItem extends ExtractionItem {
  status: 'VERIFIED' | 'CORRECTED';
  original_answer?: string;
  auditor_notes: string;
  qa_status?: 'PASSED' | 'FIXED';
  qa_notes?: string;
}

export interface TokenUsage {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface FileResult {
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  results: AuditItem[];
  logs: LogEntry[];
  supervisorIsolationCheck?: string;
  tokenUsage: TokenUsage;
  completedAt?: string;
}

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
  avatar: string;
}

export type ProcessStatus = 'idle' | 'batch_processing' | 'complete' | 'error';
export type AgentStep = 'supervisor_pre' | 'extracting' | 'auditing' | 'qa' | 'supervisor_post' | 'export_validation';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
