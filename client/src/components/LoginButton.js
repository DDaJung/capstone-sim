import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton({ text = '구글 계정으로 로그인' }) {
  const { loginWithCredential } = useAuth();
  const btnRef = useRef(null);
  const [ready, setReady] = useState(false);

  // 스크립트 동적 로드 (중복 방지)
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setReady(true);
      return;
    }
    const id = 'google-identity-script';
    if (document.getElementById(id)) return;

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.id = id;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!ready || !CLIENT_ID || !btnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (res) => {
        if (res?.credential) loginWithCredential(res.credential);
      },
      ux_mode: 'popup',                 // 팝업 로그인
      auto_select: false,
      use_fedcm_for_prompt: true,       // 브라우저 FedCM
      login_uri: undefined,             // 백엔드 없으니 미사용
      context: 'signin',
    });

    // 구글 기본 버튼 렌더(디자인 심플)
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'medium',
      text: 'signin_with',
      shape: 'pill',
      locale: 'ko',
      logo_alignment: 'left',
      width: 240,
    });

    // One Tap은 원하면 주석 해제
    // window.google.accounts.id.prompt();

  }, [ready]);

  return (
    <div>
      <div ref={btnRef} />
      {!CLIENT_ID && <small style={{color:'#f87171'}}>REACT_APP_GOOGLE_CLIENT_ID 설정 필요</small>}
    </div>
  );
}
