import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './MessagePage.css';
import {
  // 기존 이름 그대로 유지 (별칭 export 덕분에 문제 없음)
  getMessages,
  sendMessage,
  // ⬇️ 새로 추가된 사용자 조회 API
  fetchUserInfo,
} from '../api/mattermost';

// 네가 쓰는 채널들 (필요에 맞게 바꿔줘)
const CHANNELS = [
  { name: 'project1', id: 'sif63njwbfbftc4ospi7wscc6r' },
  // { name: '다른채널', id: '...' },
];

// MM /posts 응답을 화면 리스트로 변환
function normalizePosts(raw) {
  // 다양한 형식을 방어적으로 처리
  if (raw?.order && raw?.posts) {
    return raw.order
      .map((pid) => {
        const p = raw.posts[pid];
        if (!p) return null;
        return {
          id: p.id,
          userId: p.user_id, // username은 별도 조회
          username: null,    // 처음엔 없음 → 이후 resolve
          content: p.message || '',
          timestamp: p.create_at ? new Date(p.create_at) : new Date(),
        };
      })
      .filter(Boolean);
  }

  // 혹시 배열/다른 포맷이 올 때의 최소 처리
  const arr = Array.isArray(raw) ? raw : raw?.messages || raw?.data || [];
  return arr.map((it, idx) => ({
    id: it.id ?? idx,
    userId: it.user_id || it.userId || it.user?.id || 'unknown',
    username: it.username || it.user?.username || null,
    content: it.message || it.content || it.text || '',
    timestamp: it.timestamp ? new Date(it.timestamp) :
               it.create_at ? new Date(it.create_at) :
               it.createAt  ? new Date(it.createAt)  : new Date(),
  }));
}

function formatDate(d) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function shortId(id) {
  if (!id) return 'unknown';
  return String(id).slice(0, 8);
}

export default function MessagePage() {
  const [channels, setChannels] = useState(CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]?.id || '');
  const [messagesByChannel, setMessagesByChannel] = useState({});
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // userCache: { [userId]: username }
  const [userCache, setUserCache] = useState({});
  const pollRef = useRef(null);

  const selected = useMemo(
    () => channels.find((c) => c.id === selectedChannel),
    [channels, selectedChannel]
  );

  // 메시지 불러오기
  const fetchMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    try {
      setLoading(true);
      const raw = await getMessages(channelId, 50);
      const list = normalizePosts(raw);

      // 1) 일단 메시지 저장 (username은 아직 null일 수 있음)
      setMessagesByChannel((prev) => ({ ...prev, [channelId]: list }));

      // 2) user_id → username 매핑이 없는 것만 추려서 한번에 조회
      const missingIds = Array.from(
        new Set(
          list
            .map((m) => m.userId)
            .filter((uid) => uid && !userCache[uid])
        )
      );

      if (missingIds.length > 0) {
        const results = await Promise.allSettled(
          missingIds.map((uid) => fetchUserInfo(uid))
        );

        const nextCache = { ...userCache };
        results.forEach((res, i) => {
          const uid = missingIds[i];
          if (res.status === 'fulfilled') {
            const data = res.value || {};
            const name =
              data.username || data.nickname ||
              (data.first_name || '') + (data.last_name || '') ||
              uid;
            nextCache[uid] = String(name || uid);
          } else {
            nextCache[uid] = uid; // 실패 시 id를 그대로 표시
          }
        });
        setUserCache(nextCache);
      }
    } catch (e) {
      console.error('메시지 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, [userCache]);

  // 채널 변경 시 로드
  useEffect(() => {
    fetchMessages(selectedChannel);
  }, [selectedChannel, fetchMessages]);

  // 폴링 (5초)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMessages(selectedChannel);
    }, 5000);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [selectedChannel, fetchMessages]);

  // 전송
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !selectedChannel) return;
    try {
      await sendMessage(selectedChannel, text);
      setInputText('');
      fetchMessages(selectedChannel);
    } catch (e) {
      console.error('전송 실패:', e);
      alert('전송 중 오류가 발생했습니다.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleAddChannel = () => {
    const name = prompt('새 채널 이름을 입력하세요');
    const id = prompt('해당 채널의 Mattermost 채널 ID(26자)를 입력하세요');
    if (!name || !id) return;
    if (channels.some((c) => c.id === id)) return alert('이미 존재하는 채널 ID입니다.');
    const next = [...channels, { name, id }];
    setChannels(next);
    setSelectedChannel(id);
  };

  const msgs = messagesByChannel[selectedChannel] || [];

  return (
    <div className="messenger-page">
      {/* 채널 리스트 */}
      <div className="channel-list">
        <button className="add-channel-btn" onClick={handleAddChannel}>
          새 채널
        </button>
        {channels.map((c) => (
          <div
            key={c.id}
            className={`channel-item ${selectedChannel === c.id ? 'selected' : ''}`}
            onClick={() => setSelectedChannel(c.id)}
            title={c.id}
          >
            ⭐ {c.name}
          </div>
        ))}
      </div>

      {/* 채팅영역 */}
      <div className="messenger-wrapper">
        <div className="channel-header">
          ⭐ {selected?.name || '채널'}
          <span style={{ marginLeft: 10, fontSize: 12, color: '#666' }}>
            {loading ? '불러오는 중…' : ''}
          </span>
        </div>

        <div className="messages-container">
          {msgs.length === 0 ? (
            <div className="empty-message">메시지가 없습니다.</div>
          ) : (
            <>
              {msgs.map((msg, index) => {
                const prev = msgs[index - 1];
                const showDateDivider =
                  index === 0 ||
                  formatDate(msg.timestamp) !== formatDate(prev.timestamp);

                // 캐시에 있으면 username, 없으면 userId 축약 표시
                const displayName =
                  userCache[msg.userId] || msg.username || shortId(msg.userId);

                return (
                  <div key={msg.id ?? index} className="message-block">
                    {showDateDivider && (
                      <div className="date-divider">{formatDate(msg.timestamp)}</div>
                    )}
                    <div className="message-line">
                      <div className="message-header">
                        <span className="sender">{displayName}</span>
                        <span className="time">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="message-content">{msg.content}</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="@으로 멘션"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSend}>전송</button>
        </div>
      </div>
    </div>
  );
}
