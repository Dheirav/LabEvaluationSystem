import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Try to decode user from token
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        setUser(JSON.parse(jsonPayload));
      } catch {
        setUser(null);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (user_id, password) => {
    const response = await axios.post('/api/auth/login', { user_id, password });
    const { token, ...user } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    setLoading(false);
    return user;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Clear session token for students
  const clearStudentSession = () => {
    if (user && user.role === 'student') {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  // Clear session token on tab close for students
  useEffect(() => {
    const handleTabClose = () => {
      if (user && user.role === 'student') {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, clearStudentSession }}>
      {children}
    </AuthContext.Provider>
  );
};
