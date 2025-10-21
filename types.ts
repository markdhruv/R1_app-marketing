export type MarketingObjective = 'awareness' | 'consideration' | 'sales' | 'loyalty';

// Preset Audience
export const audienceOptions = [
    { value: 'general', label: 'General Consumers (B2C)' },
    { value: 'genz', label: 'Gen Z / Young Adults' },
    { value: 'millennials', label: 'Millennials' },
    { value: 'parents', label: 'Parents / Families' },
    { value: 'b2b', label: 'B2B Professionals / Decision Makers' },
    { value: 'smb', label: 'Small Business Owners' },
    { value: 'custom', label: 'Custom...' },
] as const;
export type PresetAudience = typeof audienceOptions[number]['value'];

// Preset Brand Tone
export const toneOptions = [
    { value: 'professional', label: 'Professional / Authoritative' },
    { value: 'friendly', label: 'Friendly / Conversational' },
    { value: 'humorous', label: 'Humorous / Witty' },
    { value: 'empathetic', label: 'Empathetic / Caring' },
    { value: 'inspirational', label: 'Inspirational / Aspirational' },
    { value: 'urgent', label: 'Direct / Urgent' },
    { value: 'custom', label: 'Custom...' },
] as const;
export type PresetBrandTone = typeof toneOptions[number]['value'];


export interface CTA {
  'CTA Text': string;
  'Type Score'?: number;
  'Tone Score'?: number;
  'Simple Avg'?: number;
  [key: string]: any; 
}

export interface CampaignGoalDetails {
  targetAudience?: PresetAudience;
  customTargetAudience?: string;
  brandTone?: PresetBrandTone;
  customBrandTone?: string;
  keyMessage?: string;
}

export interface CampaignAnalysisResult {
  campaignMessage: string;
  combinedEmotionScore: number;
  clarityAndImpactScore: number;
  trendRelevanceScore: number;
  steppsShareabilityScore: number;
  ctaStrengthScore: number;
  subjectiveFitScore: number;
  weightedCampaignConfidenceScore: number;
  recommendation: string;
}