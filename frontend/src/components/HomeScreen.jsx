import React from 'react';
import './HomeScreen.css';

const HomeScreen = ({ onProblemSelect, isDarkMode }) => {
  const metrics = [
    {
      title: 'Problems Solved',
      value: '42',
      total: '50',
      percentage: 42,
      color: '#4f46e5'
    },
    {
      title: 'Current Streak',
      value: '7',
      unit: 'days',
      total: '7',
      percentage: 70,
      color: '#eab308'
    },
    {
      title: 'Time Spent',
      value: '12.5',
      unit: 'hrs',
      total: '25',
      percentage: 50,
      color: '#06b6d4'
    },
    {
      title: 'Completion Rate',
      value: '85',
      unit: '%',
      total: '100',
      percentage: 85,
      color: '#10b981'
    },
    {
      title: 'Average Score',
      value: '92',
      unit: '%',
      total: '100',
      percentage: 92,
      color: '#8b5cf6'
    },
    {
      title: 'Videos Watched',
      value: '15',
      total: '25',
      percentage: 60,
      color: '#ec4899'
    }
  ];

  const problems = [
    {
      id: 'fizzbuzz',
      title: 'FizzBuzz',
      difficulty: 'Easy',
      description: 'Write a function that returns FizzBuzz sequence',
      implementationReady: true
    },
    {
      id: 'islands',
      title: 'Number of Islands',
      difficulty: 'Medium',
      description: 'Count the number of islands (connected 1s surrounded by 0s) in a 2D grid',
      implementationReady: false
    },
    {
      id: 'nqueens',
      title: 'N-Queens',
      difficulty: 'Hard',
      description: 'Place N queens on an NxN chessboard such that no two queens threaten each other',
      implementationReady: false
    }
  ];

  const CircularProgress = ({ percentage, color, value, unit, total }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - (percentage / 100) * circumference;
    const center = 60;
    
    return (
      <div className="progress-container">
        <svg className="progress-ring" width="120" height="120" viewBox="0 0 120 120">
          <circle
            className="progress-ring-circle-bg"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="progress-ring-circle"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            transform={`rotate(-90 ${center} ${center})`}
          />
          <text
            x={center}
            y={unit ? center - 12 : center - 8}
            className="progress-value"
            fill={color}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {value}
          </text>
          {unit && (
            <text
              x={center}
              y={center + 8}
              className="progress-unit"
              fill={color}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {unit}
            </text>
          )}
          <text
            x={center}
            y={unit ? center + 24 : center + 16}
            className="progress-total"
            fill={isDarkMode ? "#666" : "#999"}
            textAnchor="middle"
            dominantBaseline="central"
          >
            / {total}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className={`home-container ${isDarkMode ? 'dark' : ''}`}>
      <header className="welcome-header">
        <div className="header-content">
          <div className="logo">
            <img src="/logo.png" alt="AI Coding Assistant" className="logo-image" />
          </div>
          <h1>Welcome, Deepansh Saxena</h1>
        </div>
      </header>

      <main className="main-content">
        <div className="left-column">
          <h2 className="section-title">User Metrics</h2>
          <section className="metrics-grid">
            {metrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <h3 className="metric-title">{metric.title}</h3>
                <div className="metric-content">
                  <CircularProgress 
                    percentage={metric.percentage}
                    color={metric.color}
                    value={metric.value}
                    unit={metric.unit}
                    total={metric.total}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="right-column">
          <section className="content-wrapper">
            <h2 className="section-title">Practice Problems</h2>
            <div className="problems-list">
              {problems.map((problem) => (
                <div 
                  key={problem.id}
                  className="problem-card"
                >
                  <div className="problem-content">
                    <div className="problem-header">
                      <h3>{problem.title}</h3>
                      <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <p className="problem-description">{problem.description}</p>
                  </div>
                  <button 
                    className="try-button"
                    onClick={() => onProblemSelect(problem.id)}
                  >
                    Try Now
                  </button>
                </div>
              ))}
            </div>

            <div className="videos-section">
              <h2>See your Recordings</h2>
              <button className="watch-videos-btn">
                Watch Now
                <span className="arrow-icon">→</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="home-footer">
        <p>AI Coding Assistant © 2025</p>
      </footer>
    </div>
  );
};

export default HomeScreen;