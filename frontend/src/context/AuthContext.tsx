import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, _password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        setLoading(true);
        const response = await fetch('/auth_status', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Auth status check failed');
        }
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);
          setLoading(false);
          return;
        } else {
          setUser(null);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error(`Auth status check failed (Attempt ${attempt}):`, error);
        
        if (attempt === MAX_RETRIES) {
          setUser(null);
          setLoading(false);
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  };

  const login = async (email: string, _password: string) => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', _password);

      const response = await fetch('/login', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        await checkAuthStatus(); // Refresh user data after successful login
        return { success: true };
      }
      
      return { 
        success: false, 
        message: data.message || 'Login failed'
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Login failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
