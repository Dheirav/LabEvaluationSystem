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
      // Optionally, fetch user info from /me endpoint
      // axios.get('/api/auth/me')
      //   .then(res => setUser(res.data.user))
      //   .catch(() => logout());
      // Instead, you may want to decode the token or just set loading to false
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
