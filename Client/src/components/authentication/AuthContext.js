import React, { createContext, useState, useContext, useEffect } from 'react';
import LoadingBorder from '../loading-components/LoadingBorder';

// Create the AuthContext
const AuthContext = createContext();

// Create a custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      }
    } catch (error) {
      console.error('Failed to fetch auth status:', error);
      setIsAuthenticated(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (responseJSON) => {
    setIsAuthenticated(true); // Login user
    setUserRole(responseJSON.role); // Set user role
    setUserData(responseJSON.user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Check authentication status on component mount
  useEffect(() => {
    setLoading(true)
    checkAuthStatus();
  }, []);


  if (loading)
    return <LoadingBorder />

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, handleLogin, handleLogout, userData }}>
      {children}
    </AuthContext.Provider>
  );
};
