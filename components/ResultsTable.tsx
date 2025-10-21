import React from 'react';
import type { CampaignAnalysisResult } from '../types';
import { ScoreCard } from './ScoreCard';
import { DownloadIcon, InfoIcon } from './icons';

interface ResultsTableProps {
  results: CampaignAnalysisResult[];
}

const scoreExplanations: Record<string, string> = {
    'Confidence Score': "The overall AI-powered prediction of this campaign's success, calculated as a weighted average of all other scores.",
    'Emotion': "The raw emotional tone of the message. A high score is very positive (e.g., joy), while a low score is negative (e.g., fear, anger).",
    'Clarity & Impact': "Measures how powerfully and clearly the message is written. High scores go to concise, impactful messages with strong, active language.",
    'Relevance': "How well the message aligns with the trending keywords you provided. High scores mean the keywords are integrated naturally and effectively.",
    'Shareability': "The message's potential to be shared on social media. It considers emotional hooks, practical value, and engaging elements.",
    'CTA Strength': "The effectiveness of the Call-to-Action. High scores mean the CTA is clear, urgent, and persuasive.",
};

const ScoreInfo: React.FC<{ title: string }> = ({ title }) => (
    <div className="relative group flex items-center">
        <span>{title}</span>
        <InfoIcon className="h-4 w-4 ml-1.5 text-slate-400 dark:text-slate-500" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
            {scoreExplanations[title] || 'No description available.'}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800 dark:border-t-slate-900"></div>
        </div>
    </div>
);


const RecommendationBadge: React.FC<{ recommendation: string }> = ({ recommendation }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block";
  let colorClasses = "";
  if (recommendation.startsWith('✅')) {
    colorClasses = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
  } else if (recommendation.startsWith('⚠️')) {
    colorClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300";
  } else {
    colorClasses = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  }
  return <span className={`${baseClasses} ${colorClasses}`}>{recommendation}</span>;
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {

    const convertToCSV = (data: CampaignAnalysisResult[]) => {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(value => 
                `"${String(value).replace(/"/g, '""')}"`
            ).join(',')
        );
        return [headers, ...rows].join('\n');
    };

    const handleDownload = () => {
        const csv = convertToCSV(results);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'Campaign_Evaluation_Result.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Detailed Breakdown</h3>
        <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            <DownloadIcon className="-ml-1 mr-2 h-5 w-5" />
            Download CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {results.map((result, index) => (
            <div key={index} className="py-6">
              <div className="mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Campaign Message</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">"{result.campaignMessage}"</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                <ScoreCard title={<ScoreInfo title="Confidence Score" />} score={result.weightedCampaignConfidenceScore} isPrimary />
                <ScoreCard title={<ScoreInfo title="Emotion" />} score={result.combinedEmotionScore} />
                <ScoreCard title={<ScoreInfo title="Clarity & Impact" />} score={result.clarityAndImpactScore} />
                <ScoreCard title={<ScoreInfo title="CTA Strength" />} score={result.ctaStrengthScore} />
                <ScoreCard title={<ScoreInfo title="Relevance" />} score={result.trendRelevanceScore} />
                <ScoreCard title={<ScoreInfo title="Shareability" />} score={result.steppsShareabilityScore} />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">AI Recommendation:</p>
                <div className="mt-1">
                    <RecommendationBadge recommendation={result.recommendation} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};