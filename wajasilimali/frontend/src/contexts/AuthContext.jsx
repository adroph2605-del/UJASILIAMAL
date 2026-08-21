import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('wajasilimali_token');
    localStorage.removeItem('wajasilimali_user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('wajasilimali_token');
    const savedUser = localStorage.getItem('wajasilimali_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      authAPI
        .me()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('wajasilimali_user', JSON.stringify(res.data));
        })
        .catch((err) => {
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            logout();
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('wajasilimali_token', access_token);
    localStorage.setItem('wajasilimali_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  };

  const isAdmin =
    user?.role === 'admin' || user?.role === 'Admin' || user?.is_superuser === true;
  const isSuperAdmin = user?.is_superuser === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
