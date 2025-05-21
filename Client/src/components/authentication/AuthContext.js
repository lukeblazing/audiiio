import React, { createContext, useState, useContext, useEffect } from 'react';
import LoadingSpinner from '../loading-components/LoadingSpinner';

// Create the AuthContext
const AuthContext = createContext();

// Create a custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccessCode, setHasAccessCode] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const checkAuthStatus = async () => {
    try {
      // setIsAuthenticated(true);
      // return;
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/authCheck`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const authResult = await response.json();
        setIsAuthenticated(true);
        setUserRole(authResult.role);
        setUserData(authResult.user);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        setUserData(null);
      }
    } catch (error) {
      console.error('Failed to fetch auth status:', error);
      setIsAuthenticated(false);
      setUserRole(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if the user has a JWT for a previously entered access code
  const checkAccessCode = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/checkAccessCode`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // If you expect some result data, you can process it here
        const result = await response.json();
        setHasAccessCode(true);
        return { valid: true, ...result };
      } else {
        setHasAccessCode(false);
        return { valid: false };
      }
    } catch (error) {
      console.error('Failed to check access code:', error);
      return { valid: false, error: error.message };
    }
  };

  const handleLogin = (responseJSON) => {
    setIsAuthenticated(true); // Login user
    setUserRole(responseJSON.role); // Set user role
    setUserData(responseJSON.user);
  };

  const handleAccessCodeGranted = (responseJSON) => {
    setHasAccessCode(true);
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setHasAccessCode(false);
    setUserRole(null);
    setUserData(null);
  };

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
    checkAccessCode();
  }, []);

  if (loading)
    return <LoadingSpinner />

  return (
    <AuthContext.Provider value={{ isAuthenticated, hasAccessCode, handleAccessCodeGranted, userRole, handleLogin, handleLogout, userData }}>
      {children}
    </AuthContext.Provider>
  );
};
