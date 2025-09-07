// client/src/components/ProjectPreview.js
import './ProjectPreview.css';
import React, { useMemo } from 'react';

const s = (v) => (typeof v === 'string' ? v.trim() : '');
const toInitials = (name) => {
  if (!name) return 'PR';
  const clean = String(name).replace(/[^가-힣a-zA-Z0-9]/g, '');
  const two = clean.slice(0, 2);
  return /[a-z]/.test(two) ? two.toUpperCase() : two;
};

export default function ProjectPreview({
  project = {},
  onOpen,   // 카드 클릭 시 이동
  onDelete, // 삭제
}) {
  const name = s(project.name || project.title);
  const description = s(project.description?.raw || project.description);
  const status = s(project.status?.name || project.status);
  const due = s(project.dueDate || project.due);
  const initials = useMemo(() => toInitials(name), [name]);

  const hasStatus = Boolean(status);
  const hasDue = Boolean(due);
  const showMeta = hasStatus || hasDue;

  return (
    <div
      className="op-card op-card--clickable"
      onClick={() => onOpen && onOpen(project)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="op-card-actions">
        {onDelete && (
          <button
            className="op-btn op-btn-danger"
            title="프로젝트 삭제"
            onClick={(e) => { e.stopPropagation(); onDelete(project); }}
          >
            🗑️
          </button>
        )}
      </div>

      <div className="op-card__header">
        <div className="op-badge">{initials}</div>
        <div className="op-title">{name || '제목 없음'}</div>
      </div>

      <div className="op-desc">{description || '설명 없음'}</div>

      {showMeta && (
        <div className="op-meta">
          {hasStatus && <span className="op-status">{status}</span>}
          {hasDue && <span className="op-due">{due}</span>}
        </div>
      )}
    </div>
  );
}
