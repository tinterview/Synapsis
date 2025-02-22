import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CodingInterface from './components/CodingInterface';
import HomeScreen from './components/HomeScreen';
import RecordingsPage from './components/RecordingsPage';
import Landing from './components/Landing';
import './App.css';

const App = () => {
  // Theme state management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode and save preference
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Theme toggle handler
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <Router>
      <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
        {/* Theme Toggle Button */}
        <button
          className="theme-toggle"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {/* {isDarkMode ? '☀️' : '🌙'} */}
        </button>

        {/* Main Content */}
        <main className="main-container">
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Landing isDarkMode={isDarkMode} />} />

            <Route path="/home" element={<HomeScreen isDarkMode={isDarkMode} />} />
            
            {/* Coding page */}
            <Route path="/coding" element={<CodingInterface isDarkMode={isDarkMode} />} />
            
            {/* Recordings page */}
            <Route path="/recordings" element={<RecordingsPage isDarkMode={isDarkMode} />} />
            
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>AI Coding Assistant © 2024</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
