import React, { useState } from "react";
import "./ProjectCreateModal.css";

export default function ProjectCreateModal({ onClose, onSubmit }) {
    const [form, setForm] = useState({ name: "", description: "", color: "#2ecc71" });
    const canSubmit = form.name.trim().length > 0;

    const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <b>새 프로젝트 생성</b>
                    <button className="x" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <label>프로젝트 이름</label>
                    <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="예: 팀 협업 플랫폼 구축" />

                    <label>설명 (선택)</label>
                    <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />

                    <label>색상</label>
                    <input type="color" value={form.color} onChange={(e) => update("color", e.target.value)} />

                    <div className="row">
                        <div>
                            <label>시작일 (선택)</label>
                            <input type="date" onChange={(e) => update("startDate", e.target.value)} />
                        </div>
                        <div>
                            <label>마감일 (선택)</label>
                            <input type="date" onChange={(e) => update("dueDate", e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="modal-foot">
                    <button onClick={onClose}>취소</button>
                    <button className="primary" disabled={!canSubmit} onClick={() => onSubmit(form)}>생성</button>
                </div>
            </div>
        </div>
    );
}
