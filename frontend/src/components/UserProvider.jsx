import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// Create User Context
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [userData, setUserData] = useState(null);

  // Update user data when Auth0 user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserData(user);
    } else {
      setUserData(null);
    }
  }, [user, isAuthenticated]);

  return (
    <UserContext.Provider value={{ user: userData, isAuthenticated, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom Hook for easy access
export const useUser = () => useContext(UserContext);
