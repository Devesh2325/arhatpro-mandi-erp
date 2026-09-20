import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [auditedFirmName, setAuditedFirmName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('mandi_jwt_token');
    if (token) {
      API.getMe()
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            setIsImpersonating(data.isImpersonating || false);
            if (data.tenant) setAuditedFirmName(data.tenant.firm_name);
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, pinOrPassword) => {
    const data = await API.login(identifier, pinOrPassword);
    localStorage.setItem('mandi_jwt_token', data.token);
    setUser(data.user);
    setIsImpersonating(false);
    setAuditedFirmName('');
    return data;
  };

  const signup = async (formData) => {
    const data = await API.signup(formData);
    localStorage.setItem('mandi_jwt_token', data.token);
    setUser(data.user);
    setIsImpersonating(false);
    setAuditedFirmName('');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('mandi_jwt_token');
    setUser(null);
    setIsImpersonating(false);
    setAuditedFirmName('');
  };

  const startImpersonation = async (targetTenantId) => {
    const res = await API.startImpersonation(targetTenantId);
    localStorage.setItem('mandi_jwt_token', res.token);
    setIsImpersonating(true);
    setAuditedFirmName(res.targetTenant.firm_name);
    return res;
  };

  const stopImpersonation = async () => {
    const res = await API.stopImpersonation();
    localStorage.setItem('mandi_jwt_token', res.token);
    setIsImpersonating(false);
    setAuditedFirmName('');
    return res;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isImpersonating,
      auditedFirmName,
      login,
      signup,
      logout,
      startImpersonation,
      stopImpersonation
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
