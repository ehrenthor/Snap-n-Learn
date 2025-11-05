import { createContext, useContext, useState, useEffect } from 'react';

const apiUrl = process.env.REACT_APP_API_URL;

const initialAuthState = {
  isAuthenticated: false,
  userType: null,
  username: null,
  userId: null,
  loading: true
};
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(initialAuthState);

  // Check authentication status on app load
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/validate`, {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setAuthState({
            isAuthenticated: true,
            userType: userData.userType,
            username: userData.username,
            userId: userData.userId,
            loading: false
          });
        } else {
          setAuthState({ ...initialAuthState, loading: false });
        }
      } catch (error) {
        setAuthState({ ...initialAuthState, loading: false });
        console.error('Authentication check failed:', error);
      }
    };
    validateToken();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/validate`, {
          credentials: 'include'
        });

        if (!response.ok) {
          setAuthState(initialAuthState);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    const interval = setInterval(checkAuth, 4200000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);