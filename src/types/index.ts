export interface CVData {
  originalText: string;
  fileName?: string;
  fileType?: 'pdf' | 'docx' | 'text';
  originalFileBase64?: string; // Store original PDF/DOCX for later modification
}

export interface JobDescription {
  text: string;
  source: 'url' | 'text';
  url?: string;
}

export interface UserPreferences {
  tone: 'professional' | 'creative' | 'technical' | 'executive';
  emphasis: string[];
  targetSeniority: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface ChangeItem {
  section: string;
  originalText: string;
  newText: string;
  reason: string;
}

export interface OptimizationResult {
  optimizedCV: string;
  changes: ChangeItem[];
  matchScore: number;
  keywordsMatched: string[];
  keywordsMissing: string[];
  method?: 'ai-powered' | 'rule-based';
}

export interface AnalysisResult {
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  seniorityLevel: string;
  companyInfo?: string;
}
