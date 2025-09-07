// client/src/api/mattermost.js

// 프록시 서버(Express) 베이스 URL
// 예) client/.env 에서 REACT_APP_API_BASE=/api  또는 http://localhost:4000
const API = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

// 공통 응답 처리
async function handleResponse(res) {
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    // JSON이 아닐 수 있음 → body는 null 유지
  }

  if (!res.ok) {
    const msg =
      (body && (body.error || body.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg); // ✅ Error 객체로 throw (ESLint no-throw-literal 대응)
  }
  return body;
}

/* =========================
 *  메시지 읽기 / 쓰기
 * ========================= */

// 특정 채널 메시지 조회
// params: channelId (필수), limit=50
export async function fetchChannelMessages(channelId, limit = 50) {
  if (!channelId) throw new Error('channelId가 필요합니다.');
  const res = await fetch(
    `${API}/api/mm/messages?channelId=${encodeURIComponent(channelId)}&limit=${limit}`
  );
  return handleResponse(res);
}

// 메시지 전송
// params: channelId (필수), text (필수)
export async function sendChannelMessage(channelId, text) {
  if (!channelId) throw new Error('channelId가 필요합니다.');
  if (!text || !text.trim()) throw new Error('text가 필요합니다.');
  const res = await fetch(`${API}/api/mm/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId, text }),
  });
  return handleResponse(res);
}

/* =========================
 *  (선택) 유틸
 * ========================= */

// 채널 정보 조회 (이름 등)
export async function fetchChannelInfo(channelId) {
  if (!channelId) throw new Error('channelId가 필요합니다.');
  const res = await fetch(
    `${API}/api/mm/channels/${encodeURIComponent(channelId)}`
  );
  return handleResponse(res);
}

// ✅ 사용자 정보 조회 (user_id → username 등)
export async function fetchUserInfo(userId) {
  if (!userId) throw new Error('userId가 필요합니다.');
  const res = await fetch(
    `${API}/api/mm/users/${encodeURIComponent(userId)}`
  );
  return handleResponse(res);
}

/* =========================
 *  호환용 별칭 (MessagePage 기존 코드 유지)
 * ========================= */
export const getMessages = fetchChannelMessages;
export const sendMessage = sendChannelMessage;
