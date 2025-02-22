import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import './Landing.css';

const Landing = ({ isDarkMode }) => {
  const { isAuthenticated, user } = useAuth0();
  const navigate = useNavigate(); // ✅ Hook for navigation

  // Redirect to /home after login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  return (
    <main className={`landing-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <section className="intro">
        <h1>Welcome to AI Coding Assistant</h1>
        <p>Your personalized AI-powered coding environment. Login to get started!</p>
      </section>

      <section className="auth-buttons">
        {isAuthenticated ? (
          <div className="user-info">
            <p>Welcome, {user.name}!</p>
            <LogoutButton />
          </div>
        ) : (
          <LoginButton />
        )}
      </section>
    </main>
  );
};

export default Landing;
