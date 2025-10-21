// This is a serverless function that acts as a secure proxy.
// In a production environment (like Vercel or Netlify), this file 
// should be placed in the `api/` directory of your project.

import { GoogleGenAI, Type } from "@google/genai";
// Fix: Import `audienceOptions` and `toneOptions` as values, not just types, to allow runtime access.
import { audienceOptions, toneOptions } from '../types';
import type { 
    CampaignAnalysisResult, 
    CTA, 
    MarketingObjective, 
    CampaignGoalDetails,
} from '../types';

const API_KEY = process.env.API_KEY;

// The handler function signature might vary slightly based on the hosting provider.
// This signature is compatible with Vercel.
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!API_KEY) {
        return res.status(500).json({ error: "API_KEY environment variable not set on the server." });
    }
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        campaignMessage: { type: Type.STRING },
        combinedEmotionScore: { type: Type.NUMBER },
        clarityAndImpactScore: { type: Type.NUMBER },
        trendRelevanceScore: { type: Type.NUMBER },
        steppsShareabilityScore: { type: Type.NUMBER },
        ctaStrengthScore: { type: Type.NUMBER },
        subjectiveFitScore: { type: Type.NUMBER },
        weightedCampaignConfidenceScore: { type: Type.NUMBER },
        recommendation: { type: Type.STRING },
      },
      required: [
        "campaignMessage",
        "combinedEmotionScore",
        "clarityAndImpactScore",
        "trendRelevanceScore",
        "steppsShareabilityScore",
        "ctaStrengthScore",
        "subjectiveFitScore",
        "weightedCampaignConfidenceScore",
        "recommendation",
      ]
    };

    const getMarketingObjectiveInstructions = (objective: MarketingObjective): string => {
        switch (objective) {
            case 'awareness':
                return `The user's goal is 'Create Awareness'. The main goal is to get attention and be memorable.
                - **subjectiveFitScore**: Should be HIGHEST for messages that are simple, catchy, and have a strong emotional hook (positive like joy/surprise, or even negative if it's attention-grabbing). Prioritize high shareability and clarity.
                - A message is a POOR FIT if it is too complex, boring, or lacks a strong emotional angle.`;
            case 'consideration':
                return `The user's goal is 'Drive Consideration'. The main goal is to build trust and inform the user, helping them evaluate the product.
                - **subjectiveFitScore**: Should be HIGHEST for messages that are informative, benefit-driven, and have a neutral-to-positive, trustworthy tone. Clarity and credibility are key.
                - A message is a POOR FIT if it's overly emotional, vague, or sounds like high-pressure sales hype.`;
            case 'sales':
                return `The user's goal is 'Drive Sales (Conversion)'. The main goal is to get the user to take a specific action NOW.
                - **subjectiveFitScore**: Should be HIGHEST for messages with a very clear, strong Call-to-Action (CTA) that create urgency or scarcity (e.g., using fear of missing out). A slightly anxious or exciting tone is GOOD. The ctaStrengthScore is critical for this objective.
                - A message is a POOR FIT if the CTA is weak/unclear, or if the tone is too passive and doesn't motivate action.`;
            case 'loyalty':
                return `The user's goal is 'Build Loyalty (Retention)'. The main goal is to make existing customers feel valued.
                - **subjectiveFitScore**: Should be HIGHEST for messages with a warm, appreciative, and positive tone. Language of exclusivity ("for our members"), community, and gratitude should be rewarded.
                - A message is a POOR FIT if it feels impersonal, generic, or is too focused on selling instead of thanking or rewarding.`;
            default:
                return `No specific objective provided. Use a general-purpose analysis, balancing all factors equally.`;
        }
    }

    const getOptionalDetailsInstructions = (details: CampaignGoalDetails): string => {
        let instructions = "";
        
        const getAudienceText = (details: CampaignGoalDetails): string | undefined | null => {
            if (!details.targetAudience) return null;
            if (details.targetAudience === 'custom') return details.customTargetAudience;
            return audienceOptions.find(opt => opt.value === details.targetAudience)?.label;
        }
        
        const getBrandToneText = (details: CampaignGoalDetails): string | undefined | null => {
            if (!details.brandTone) return null;
            if (details.brandTone === 'custom') return details.customBrandTone;
            return toneOptions.find(opt => opt.value === details.brandTone)?.label;
        }

        const audienceText = getAudienceText(details);
        if (audienceText) {
            instructions += `- **Target Audience:** "${audienceText}". The message should resonate with this specific group.\n`;
        }

        const brandToneText = getBrandToneText(details);
        if (brandToneText) {
            instructions += `- **Brand Tone/Voice:** "${brandToneText}". The message's tone must be consistent with this brand voice.\n`;
        }

        if (details.keyMessage) {
            instructions += `- **Key Message/USP:** "${details.keyMessage}". The message should clearly communicate or reinforce this core idea.\n`;
        }

        if (instructions) {
            return `
        **Optional Campaign Details for Deeper Analysis:**
        You MUST evaluate the campaign's fit against these specific details. The subjectiveFitScore should be heavily penalized if the message clashes with this context.
    ${instructions}
            `;
        }
        return "";
    }

    try {
        const { campaigns, keywords, ctas, objective, details } = req.body;

        if (!campaigns || !keywords || !ctas || !objective || !details) {
            return res.status(400).json({ error: "Missing required parameters in request body." });
        }

        const objectiveInstructions = getMarketingObjectiveInstructions(objective);
        const optionalDetailsInstructions = getOptionalDetailsInstructions(details);

        const prompt = `
            You are an expert marketing campaign analyst. Your task is to evaluate one or more campaign messages based on a rigorous set of criteria and the user's specified context. Return the analysis in a structured JSON format.

            **Critical Context: Marketing Objective**
            ${objectiveInstructions}
            ${optionalDetailsInstructions}
            
            **Input Data:**

            1.  **Campaign Messages:**
                \`\`\`json
                ${JSON.stringify(campaigns)}
                \`\`\`

            2.  **Trending Keywords:**
                \`\`\`json
                ${JSON.stringify(keywords)}
                \`\`\`

            3.  **Call-to-Action (CTA) Examples:**
                \`\`\`json
                ${JSON.stringify(ctas.map(c => c['CTA Text']))}
                \`\`\`

            **Analysis Criteria (Score from 1 to 5):**

            1.  **combinedEmotionScore (1-5):** Analyze the raw emotional tone, independent of intent. 1 is extremely negative, 3 is neutral, 5 is extremely positive.
            2.  **clarityAndImpactScore (1-5):** Evaluate message quality. 1 is unclear and weak (passive voice, long sentences, jargon). 5 is crystal-clear and powerful (active voice, strong verbs, concise).
            3.  **trendRelevanceScore (1-5):** Assess relevance to the provided "Trending Keywords". 1 is no relevance, 5 is highly relevant and well-integrated.
            4.  **steppsShareabilityScore (1-5):** Evaluate potential for social sharing. Consider emotional resonance, practical value, and engagement. 1 is low, 5 is high.
            5.  **ctaStrengthScore (1-5):** Analyze the Call-to-Action. 1 is weak, vague, or missing. 5 is clear, urgent, and persuasive.
            6.  **subjectiveFitScore (1-5):** This is the most important score. Based on the **Marketing Objective** and any provided **Optional Campaign Details**, how well does the message fit the strategic goal? 1 is a complete mismatch, 5 is a perfect fit.

            **Final Calculations:**

            Using the scores from the analysis, calculate the following:

            1.  **weightedCampaignConfidenceScore:** Calculate a weighted average using these weights:
                *   subjectiveFitScore: 0.25
                *   clarityAndImpactScore: 0.20
                *   combinedEmotionScore: 0.20
                *   ctaStrengthScore: 0.15
                *   trendRelevanceScore: 0.10
                *   steppsShareabilityScore: 0.10
                Round the final score to two decimal places.

            2.  **recommendation:** Based on the "weightedCampaignConfidenceScore", provide one of the following recommendations:
                *   "✅ Strong potential to succeed" (if score >= 4.0)
                *   "⚠️ Good, but revise key elements" (if score >= 3.0 and < 4.0)
                *   "❌ Needs rework before launch" (if score < 3.0)

            **Output Format:**

            Return a JSON object containing a single key "results" which is an array of JSON objects, one for each campaign message provided. Strictly adhere to the provided JSON schema for each object in the array.
          `;
        
        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            items: analysisSchema,
                        },
                    },
                },
            },
        });
        
        const responseText = geminiResponse.text.trim();
        const parsedJson = JSON.parse(responseText);

        if (parsedJson && parsedJson.results) {
            return res.status(200).json(parsedJson.results);
        } else {
            throw new Error("Invalid response structure from Gemini API.");
        }

    } catch (error) {
        console.error("Error in serverless function:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        return res.status(500).json({ error: "Failed to analyze campaigns.", details: errorMessage });
    }
}
