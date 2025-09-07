import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // 로컬스토리지에서 복구
  useEffect(() => {
    const saved = localStorage.getItem('auth:user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const loginWithCredential = (credential) => {
    const payload = parseJwt(credential);
    if (!payload) return;
    const profile = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      // 필요시 서버 검증 요청을 여기서 수행
    };
    setUser(profile);
    localStorage.setItem('auth:user', JSON.stringify(profile));
  };

  const logout = () => {
    try {
      // 자동선택 해제(One Tap 자동 로그인 방지)
      if (window.google?.accounts?.id?.disableAutoSelect) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch {}
    setUser(null);
    localStorage.removeItem('auth:user');
  };

  return (
    <AuthContext.Provider value={{ user, loginWithCredential, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
