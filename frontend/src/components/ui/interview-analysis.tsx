import React from 'react';

interface AnalysisScore {
  [key: string]: number;
}

interface AnalysisCategory {
  [key: string]: AnalysisScore;
}

interface InterviewAnalysisProps {
  data: AnalysisCategory | null;
}

const InterviewAnalysis: React.FC<InterviewAnalysisProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="w-96 bg-white/80 backdrop-blur-sm p-6 border-l border-primary/10">
        <h2 className="text-xl font-semibold text-primary mb-6">Loading Analysis...</h2>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    // Convert score to a percentage (0-10 -> 0-100)
    const percentage = (score / 10) * 100;
    // Red to green gradient
    const red = Math.floor(255 * (1 - percentage / 100));
    const green = Math.floor(255 * (percentage / 100));
    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <div className="w-96 bg-white/80 backdrop-blur-sm p-6 border-l border-primary/10 overflow-y-auto">
      <h2 className="text-xl font-semibold text-primary mb-6">Interview Analysis</h2>
      {Object.entries(data).map(([category, scores]) => (
        <div key={category} className="mb-6">
          <h3 className="text-lg font-medium text-primary/80 mb-3">
            {category.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </h3>
          <div className="space-y-2">
            {Object.entries(scores).map(([metric, score]) => (
              <div key={metric} className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    {metric.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </p>
                </div>
                <div 
                  className="w-12 h-8 rounded flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: getScoreColor(score) }}
                >
                  {score.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InterviewAnalysis;