// client/src/components/TaskModal.js
import React, { useState, useEffect } from "react";
import "../pages/TaskPage.css";

export default function TaskModal({ open, initial, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setDesc(initial?.desc || "");
      setPriority(initial?.priority || "normal");
      setStatus(initial?.status || "todo");
      setDueDate(initial?.dueDate || "");
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해 주세요.");
    onSubmit({ title: title.trim(), desc: desc.trim(), priority, status, dueDate });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initial ? "업무 수정" : "새 업무"}</h3>
        <form onSubmit={submit} className="form">
          <label>제목</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="업무 제목" />

          <label>설명</label>
          <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} rows={4} placeholder="간단한 설명" />

          <div className="grid2">
            <div>
              <label>우선순위</label>
              <select value={priority} onChange={(e)=>setPriority(e.target.value)}>
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
            <div>
              <label>상태</label>
              <select value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option value="todo">할 일</option>
                <option value="doing">진행중</option>
                <option value="done">완료</option>
              </select>
            </div>
          </div>

          <label>기한</label>
          <input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />

          <div className="modal-actions">
            <button type="button" className="btn-muted" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary">{initial ? "저장" : "추가"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
