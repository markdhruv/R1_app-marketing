import type { 
    CampaignAnalysisResult, 
    CTA, 
    MarketingObjective, 
    CampaignGoalDetails 
} from '../types';

export const analyzeCampaignsWithGemini = async (
  campaigns: string[],
  keywords: string[],
  ctas: CTA[],
  objective: MarketingObjective,
  details: CampaignGoalDetails
): Promise<CampaignAnalysisResult[]> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaigns,
        keywords,
        ctas,
        objective,
        details,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "An unknown error occurred on the server." }));
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const results: CampaignAnalysisResult[] = await response.json();
    return results;

  } catch (error) {
    console.error("Error calling backend API:", error);
    throw new Error(`Failed to communicate with the analysis service. Please try again later. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
};
