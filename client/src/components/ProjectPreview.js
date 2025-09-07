
import React, { useMemo } from 'react';

// 문자열 안전 처리 유틸
const s = v => (typeof v === 'string' ? v.trim() : '');

export default function ProjectPreview({ project = {}, onOpen, onDelete, onPin }) {
  const name = s(project.name || project.title);
  const description = s(project.description?.raw || project.description);
  const status = s(project.status?.name || project.status);
  const due = s(project.dueDate || project.due);

  const initials = useMemo(() => {
    if (!name) return 'PR';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [name]);

  return (
    <div className="op-card" onClick={() => onOpen && onOpen(project)} style={{cursor: onOpen ? 'pointer' : 'default'}}>
      <div className="op-card__header" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div className="op-badge">{initials}</div>
          <div className="op-title">{name || '제목 없음'}</div>
        </div>
        {(onPin || onDelete) && (
          <div className="op-actions" onClick={e=>e.stopPropagation()}>
            {onPin && <button className="btn pin" title="고정" onClick={()=>onPin(project)}>📌</button>}
            {onDelete && <button className="btn delete" title="삭제" onClick={()=>onDelete(project)}>🗑️</button>}
          </div>
        )}
      </div>
      <div className="op-desc">{description || '설명 없음'}</div>
      <div className="op-meta">
        <span className="op-status">{status || '상태 없음'}</span>
        <span className="op-due">{due || '-'}</span>
      </div>
    </div>
  );
}
