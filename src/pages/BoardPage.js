import { useState } from 'react';
import { Link } from 'react-router-dom';
import './BoardPage.css';

function BoardPage() {
  const [view, setView] = useState('free');

  const freePosts = [
    { id: 1, title: '팀 회의록 정리 공유', author: '홍길동' },
    { id: 2, title: '새로운 기능 제안', author: '김지원' },
    { id: 3, title: '이번 주 회식 일정 조율', author: '이철수' },
  ];

  const myPosts = [
    { id: 101, title: '내가 작성한 글 A', date: '2025-05-22' },
    { id: 102, title: '업무 공유 사항', date: '2025-05-20' },
  ];

  return (
    <div className="board-page-horizontal">
      <div className="left-section notice-card">
        <h2>📢 공지사항</h2>
        <ul className="notice-list">
          <li><strong>[공지]</strong> 협업툴 베타 오픈 안내</li>
          <li><strong>[업데이트]</strong> 새로운 캘린더 기능 출시</li>
          <li><strong>[점검]</strong> 5월 30일 서버 점검 안내</li>
        </ul>
      </div>

      <div className="right-section">
        <div className="post-tabs">
          <button className={view === 'free' ? 'active' : ''} onClick={() => setView('free')}>자유게시판</button>
          <button className={view === 'my' ? 'active' : ''} onClick={() => setView('my')}>내 게시물</button>
        </div>

        <div className="posts-section">
          {view === 'free' ? (
            <>
              <h2>📝 자유게시판</h2>
              <ul className="post-list">
                {freePosts.map(post => (
                  <li key={post.id}>
                    <Link to={`/board/${post.id}`} className="post-link">
                      <strong>{post.title}</strong>
                    </Link>
                    <span>{post.author}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2>🙋 내 게시물</h2>
              <ul className="post-list">
                {myPosts.map(post => (
                  <li key={post.id}>
                    <Link to={`/board/${post.id}`} className="post-link">
                      <strong>{post.title}</strong>
                    </Link>
                    <span>{post.date}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BoardPage;
