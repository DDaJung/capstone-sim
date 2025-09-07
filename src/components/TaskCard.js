// client/src/components/TaskCard.js
import React from "react";
import "../pages/TaskPage.css";

const statusColor = {
  todo: "badge-gray",
  doing: "badge-blue",
  done: "badge-green",
};
const priorityLabel = { low: "낮음", normal: "보통", high: "높음", urgent: "긴급" };

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const { title, desc, status, priority, dueDate } = task;
  return (
    <div className="task-card">
      <div className="task-row">
        <span className={`badge ${statusColor[status] || "badge-gray"}`}>
          {status === "todo" ? "할 일" : status === "doing" ? "진행중" : "완료"}
        </span>
        <div className="task-actions">
          <select
            className="task-select"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            title="상태 변경"
          >
            <option value="todo">할 일</option>
            <option value="doing">진행중</option>
            <option value="done">완료</option>
          </select>
          <button className="btn-muted" onClick={onEdit} title="수정">✏️</button>
          <button className="btn-danger" onClick={onDelete} title="삭제">🗑️</button>
        </div>
      </div>

      <div className="task-title">{title}</div>
      {desc && <div className="task-desc">{desc}</div>}

      <div className="task-meta">
        <span className={`chip ${priority}`}>{priorityLabel[priority] || "보통"}</span>
        {dueDate && <span className="chip">기한: {dueDate}</span>}
      </div>
    </div>
  );
}
