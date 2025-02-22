
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, ArrowLeft } from 'lucide-react';
import './RecordingsPage.css';

const RecordingsPage = ({ onBackClick, isDarkMode }) => {
  const [expandedInterview, setExpandedInterview] = useState(null);

  const interviews = [
    {
      id: 1,
      title: "Interview 1",
      timestamp: "February 22, 2025 at 2:15 PM",
      metrics: {
        ai_interaction: 0,
        approach: 7.0,
        clarity: 6.0,
        conciseness: 7.0,
        correctness: 10.0,
        edge_cases: 7.0,
        efficiency: 8.0,
        feedback_summary: "The candidate's solution is correct and works well for normal inputs; they efficiently utilized a list comprehension, demonstrating knowledge of Python's capabilities. However, the focus on the loop without a robust explanation of their approach limits the clarity of their solution. They could benefit from practicing explaining their thought process step-by-step. The candidate did not mention any potential edge cases, such as n being zero or negative, which is important in a thorough solution. Overall, they demonstrated a solid understanding, but clearer communication and consideration of edge cases would enhance their performance.",
        final_score: 7.6,
        iterations: 1,
        readability: 8.0,
        speed: 8.0
      }
    }
  ];

  const MetricBar = ({ label, value }) => (
    <div className="metric-bar">
      <div className="metric-label">{label}</div>
      <div className="metric-bar-container">
        <div 
          className="metric-bar-fill" 
          style={{ width: `${value * 10}%`, backgroundColor: getScoreColor(value) }}
        />
        <span className="metric-value">{value.toFixed(1)}</span>
      </div>
    </div>
  );

  const getScoreColor = (score) => {
    if (score >= 9) return '#059669';
    if (score >= 7) return '#0284c7';
    if (score >= 5) return '#eab308';
    return '#dc2626';
  };

  return (
    <div className={`recordings-container ${isDarkMode ? 'dark' : ''}`}>
      <header className="recordings-header">
        <div className="header-content">
          <button className="back-button" onClick={onBackClick}>
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <h1>Your Interview Recordings</h1>
        </div>
      </header>

      <main className="recordings-content">
        {interviews.map((interview) => (
          <div 
            key={interview.id}
            className={`interview-card ${expandedInterview === interview.id ? 'expanded' : ''}`}
          >
            <div 
              className="interview-header"
              onClick={() => setExpandedInterview(
                expandedInterview === interview.id ? null : interview.id
              )}
            >
              <div className="interview-info">
                <h2>{interview.title}</h2>
                <div className="timestamp">
                  <Clock size={16} />
                  <span>{interview.timestamp}</span>
                </div>
              </div>
              <div className="score-and-expand">
                <div className="final-score">
                  Score: <span style={{ color: getScoreColor(interview.metrics.final_score) }}>
                    {interview.metrics.final_score.toFixed(1)}
                  </span>
                </div>
                {expandedInterview === interview.id ? 
                  <ChevronUp size={24} /> : 
                  <ChevronDown size={24} />
                }
              </div>
            </div>

            {expandedInterview === interview.id && (
              <div className="interview-details">
                <div className="metrics-panel">
                  <h3>Performance Metrics</h3>
                  <MetricBar label="Correctness" value={interview.metrics.correctness} />
                  <MetricBar label="Efficiency" value={interview.metrics.efficiency} />
                  <MetricBar label="Readability" value={interview.metrics.readability} />
                  <MetricBar label="Approach" value={interview.metrics.approach} />
                  <MetricBar label="Clarity" value={interview.metrics.clarity} />
                  <MetricBar label="Conciseness" value={interview.metrics.conciseness} />
                  <MetricBar label="Edge Cases" value={interview.metrics.edge_cases} />
                  <MetricBar label="Speed" value={interview.metrics.speed} />
                  
                  <div className="additional-metrics">
                    <div className="metric-item">
                      <span>Iterations:</span>
                      <span>{interview.metrics.iterations}</span>
                    </div>
                    <div className="metric-item">
                      <span>AI Interactions:</span>
                      <span>{interview.metrics.ai_interaction}</span>
                    </div>
                  </div>
                </div>

                <div className="feedback-panel">
                  <h3>Feedback Summary</h3>
                  <p>{interview.metrics.feedback_summary}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};

export default RecordingsPage;
