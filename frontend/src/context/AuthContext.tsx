import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL, TRACKER_URL } from '../config';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BACKEND_URL = `${API_BASE_URL}/api`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncTokenToTracker = (token: string) => {
    axios.post(`${TRACKER_URL}/token`, { token }).catch(() => {
      // Ignore if tracker is offline
    });
  };

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${BACKEND_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUser(response.data);
          syncTokenToTracker(token);
        } catch (error) {
          console.error('Session verification failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string): Promise<any> => {
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
      const { token, _id, name, email: userEmail } = response.data;
      localStorage.setItem('token', token);
      setUser({ _id, name, email: userEmail });
      syncTokenToTracker(token);
      return response.data;
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Login failed';
      throw new Error(errMsg);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<any> => {
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/register`, { name, email, password });
      const { token, _id, name: userName, email: userEmail } = response.data;
      localStorage.setItem('token', token);
      setUser({ _id, name: userName, email: userEmail });
      syncTokenToTracker(token);
      return response.data;
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed';
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
