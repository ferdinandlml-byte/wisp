import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('siswisp_token');
    if (token) {
      getMe()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem('siswisp_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await apiLogin(email, password);
    localStorage.setItem('siswisp_token', data.access_token);
    const me = await getMe();
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    localStorage.removeItem('siswisp_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
