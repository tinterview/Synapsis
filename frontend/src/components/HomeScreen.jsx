import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  
import './HomeScreen.css';
import logo from './logo2.jpeg';
import { useUser } from './UserProvider'; 

const HomeScreen = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true); // Loading state

  // Simulate loading effect until user is available
  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  const metrics = [
    { title: 'Problems Solved', value: '42', total: '50', percentage: 42, color: '#4f46e5' },
    { title: 'Current Streak', value: '7', unit: 'days', total: '7', percentage: 70, color: '#eab308' },
    { title: 'Time Spent', value: '12.5', unit: 'hrs', total: '25', percentage: 50, color: '#06b6d4' },
    { title: 'Completion Rate', value: '85', unit: '%', total: '100', percentage: 85, color: '#10b981' },
    { title: 'Average Score', value: '92', unit: '%', total: '100', percentage: 92, color: '#8b5cf6' },
    { title: 'Videos Watched', value: '15', total: '25', percentage: 60, color: '#ec4899' }
  ];

  const problems = [
    { id: 'fizzbuzz', title: 'FizzBuzz', difficulty: 'Easy', description: 'Write a function that returns FizzBuzz sequence', implementationReady: true },
    { id: 'islands', title: 'Number of Islands', difficulty: 'Medium', description: 'Count the number of islands (connected 1s surrounded by 0s) in a 2D grid', implementationReady: false },
    { id: 'nqueens', title: 'N-Queens', difficulty: 'Hard', description: 'Place N queens on an NxN chessboard such that no two queens threaten each other', implementationReady: false }
  ];

  const handleProblemSelect = (id) => {
    if (id === 'fizzbuzz') {
      navigate('/coding'); 
    }
  };

  const handleRecordingsClick = () => {
    navigate('/recordings'); 
  };

  return (
    <div className={`home-container ${isDarkMode ? 'dark' : ''}`}>
      <header className="welcome-header">
        <div className="header-content">
          <div className="logo">
            <img src={logo} alt="AI Coding Assistant" className="logo-image" />
          </div>
          {loading ? (
            <h1>Loading...</h1>  // Show loading text while fetching user data
          ) : (
            <h1>Welcome, {user?.name}</h1>
          )}
        </div>
      </header>

      {loading ? (
        <div className="loading-container">
          <p>Fetching user data...</p>
          <div className="spinner"></div> {/* Optional spinner */}
        </div>
      ) : (
        <main className="main-content">
          <div className="left-column">
            <h2 className="section-title">User Metrics</h2>
            <section className="metrics-grid">
              {metrics.map((metric, index) => (
                <div key={index} className="metric-card">
                  <h3 className="metric-title">{metric.title}</h3>
                  <div className="metric-content">
                    <div className="progress-container">
                      <div className="metric-display">
                        <div className="circular-view">
                          <svg className="progress-ring" width="120" height="120" viewBox="0 0 120 120">
                            <circle className="progress-ring-circle-bg" cx="60" cy="60" r="35" fill="none" strokeWidth="8"/>
                            <circle className="progress-ring-circle" cx="60" cy="60" r="35" fill="none" stroke={metric.color} strokeWidth="8" strokeLinecap="round" strokeDasharray="219.9" strokeDashoffset={(1 - metric.percentage / 100) * 219.9}/>
                            <text x="60" y="60" className="progress-value" fill={metric.color} textAnchor="middle" dominantBaseline="middle">
                              {metric.value}
                            </text>
                            {metric.unit && (
                              <text x="60" y="80" className="progress-unit" fill={metric.color} textAnchor="middle" dominantBaseline="middle">
                                {metric.unit}
                              </text>
                            )}
                          </svg>
                        </div>
                        <div className="numeric-view">
                          <span className="big-number" style={{ color: metric.color }}>
                            {metric.value}{metric.unit && <span className="unit">{metric.unit}</span>}
                          </span>
                        </div>
                      </div>
                    </div>
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
                  <div key={problem.id} className="problem-card">
                    <div className="problem-content">
                      <div className="problem-header">
                        <h3>{problem.title}</h3>
                        <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                          {problem.difficulty}
                        </span>
                      </div>
                      <p className="problem-description">{problem.description}</p>
                    </div>
                    <button className="try-button" onClick={() => handleProblemSelect(problem.id)}>
                      Try Now
                    </button>
                  </div>
                ))}
              </div>

              <div className="videos-section">
                <h2>See your Recordings</h2>
                <button className="watch-videos-btn" onClick={handleRecordingsClick}>
                  Watch Now
                  <span className="arrow-icon">→</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
};

export default HomeScreen;
