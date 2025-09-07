
import React, { useMemo, useRef, useState } from 'react';

/**
 * ProjectBoard
 * - Simple per-project board stored in localStorage by projectId
 * - Props: projectId (string|number)
 */
export default function ProjectBoard({ projectId }){
  const storageKey = useMemo(()=>`boards:${projectId}`, [projectId]);
  const initial = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  };
  const [posts, setPosts] = useState(initial);
  const titleRef = useRef(null);
  const authorRef = useRef(null);
  const contentRef = useRef(null);

  const save = (next) => {
    setPosts(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const addPost = (e) => {
    e.preventDefault();
    const title = titleRef.current?.value?.trim();
    const author = authorRef.current?.value?.trim() || '익명';
    const content = contentRef.current?.value?.trim();
    if(!title){ alert('제목을 입력하세요'); return; }
    const id = Date.now().toString(36);
    const date = new Date().toISOString().slice(0,10);
    const next = [{ id, title, author, content, date }, ...posts];
    save(next);
    e.target.reset();
  };

  const remove = (id) => {
    if(!window.confirm('삭제할까요?')) return;
    save(posts.filter(p=>p.id !== id));
  };

  return (
    <div className="proj-board">
      <form className="pb-form" onSubmit={addPost}>
        <input className="input" placeholder="제목" ref={titleRef} />
        <input className="input" placeholder="작성자(선택)" ref={authorRef} />
        <textarea className="input" placeholder="내용(선택)" ref={contentRef} rows={3} />
        <button className="primary" type="submit">등록</button>
      </form>
      <ul className="pb-list">
        {posts.map(p => (
          <li key={p.id} className="pb-item">
            <div className="pb-head">
              <strong>{p.title}</strong>
              <span className="pb-meta">{p.author} · {p.date}</span>
            </div>
            {p.content && <div className="pb-body">{p.content}</div>}
            <div className="pb-actions">
              <button className="btn" onClick={()=>remove(p.id)}>삭제</button>
            </div>
          </li>
        ))}
        {posts.length === 0 && <div className="empty">게시물이 없습니다.</div>}
      </ul>
    </div>
  );
}
