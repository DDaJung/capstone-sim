
import React, { useRef } from 'react';

export default function TagInput({ value = [], onChange, placeholder = '태그 입력' }) {
  const inputRef = useRef(null);
  const add = (t) => {
    const tag = String(t).trim();
    if (!tag) return;
    const set = new Set(value);
    set.add(tag);
    onChange && onChange(Array.from(set));
    if (inputRef.current) inputRef.current.value = '';
  };
  const remove = (t) => {
    const next = (value || []).filter(v => v !== t);
    onChange && onChange(next);
  };
  const onKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && !e.shiftKey) {
      e.preventDefault();
      add(e.currentTarget.value);
    } else if (e.key === 'Backspace' && !e.currentTarget.value && value?.length) {
      // 마지막 태그 제거
      remove(value[value.length - 1]);
    }
  };
  return (
    <div className="tag-input">
      <div className="tag-input-list">
        {(value || []).map((t,i)=>(
          <span key={i} className="tag token">
            {t} <button className="x" onClick={()=>remove(t)} aria-label="remove">×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="tag-input-field"
          placeholder={placeholder}
          onKeyDown={onKeyDown}
        />
      </div>
      <style>{`
        .tag-input-list{ display:flex; flex-wrap:wrap; gap:6px; padding:4px; border:1px solid #d1d5db; border-radius:6px; }
        .tag.token{ font-size:12px; padding:2px 6px; background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; border-radius:6px; }
        .tag.token .x{ background:transparent; border:none; cursor:pointer; margin-left:4px; }
        .tag-input-field{ flex:1; min-width:120px; border:none; outline:none; padding:6px; }
      `}</style>
    </div>
  );
}
