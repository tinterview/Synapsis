import React, { useState, useEffect } from 'react';
import CodingInterface from './components/CodingInterface';
import HomeScreen from './components/HomeScreen';
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

  // Loading screen render
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading AI Coding Assistant...</p>
      </div>
    );
  }

  // Main application render
  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Theme Toggle Button */}
      <button
        className="theme-toggle"
        onClick={toggleDarkMode}
        aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* Main Content */}
      <main className="main-container">
        {currentScreen === 'home' ? (
          <HomeScreen 
            onProblemSelect={handleProblemSelect} 
            isDarkMode={isDarkMode} 
          />
        ) : (
          <div className="coding-container">
            <button className="back-button" onClick={handleBackToHome}>
              ← Back to Home
            </button>
            <CodingInterface />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>AI Coding Assistant © 2024</p>
      </footer>
    </div>
  );
};

export default App;