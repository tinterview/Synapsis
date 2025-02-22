import React, { useState, useEffect } from 'react';
import CodingInterface from './components/CodingInterface';
import HomeScreen from './components/HomeScreen';
import RecordingsPage from './components/RecordingsPage';
import './App.css';

const App = () => {
  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Application states
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('home');

  // Apply dark mode and save preference
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Theme toggle handler
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Navigation handlers
  const handleProblemSelect = (problemId) => {
    if (problemId === 'fizzbuzz') {
      setCurrentScreen('coding');
    }
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleRecordingsClick = () => {
    setCurrentScreen('recordings');
  };

  const handleEndInterview = () => {
    setCurrentScreen('recordings');
  };

  // Loading screen render
  if (isLoading) {
    return (
      <div className={`loading-screen ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p>Loading AI Coding Assistant...</p>
      </div>
    );
  }

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <button
        className="theme-toggle"
        onClick={toggleDarkMode}
        aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {/* {isDarkMode ? '☀️' : '🌙'} */}
      </button>

      {currentScreen === 'home' && (
        <HomeScreen 
          onProblemSelect={handleProblemSelect}
          isDarkMode={isDarkMode}
          onRecordingsClick={handleRecordingsClick}
        />
      )}

      {currentScreen === 'coding' && (
        <CodingInterface 
          onBackClick={handleBackToHome}
          onEndInterview={handleEndInterview}
          isDarkMode={isDarkMode}
        />
      )}

      {currentScreen === 'recordings' && (
        <RecordingsPage 
          onBackClick={handleBackToHome}
          isDarkMode={isDarkMode}
        />
      )}

      <footer className="app-footer">
        <p>AI Coding Assistant © 2024</p>
      </footer>
    </div>
  );
};

export default App;
