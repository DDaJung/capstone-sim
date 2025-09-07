// client/src/pages/TaskPage.js
import React, { useMemo, useState } from "react";
import { useProjects } from "../context/ProjectsContext";
import { useTasks } from "../context/TasksContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import "./TaskPage.css";

export default function TaskPage() {
  const projects = useProjects();
  const tasks = useTasks();

  const current = (projects.getSelected && projects.getSelected()) || projects.list()[0];
  const projectId = current?.id;

  const [q, setQ] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const all = projectId ? tasks.listByProject(projectId) : [];
  const filtered = useMemo(() => {
    return all.filter(t => {
      const okQ = q.trim() ? (t.title?.toLowerCase().includes(q.toLowerCase()) || t.desc?.toLowerCase().includes(q.toLowerCase())) : true;
      const okP = filterPriority === "all" ? true : t.priority === filterPriority;
      const okS = filterStatus === "all" ? true : t.status === filterStatus;
      return okQ && okP && okS;
    });
  }, [all, q, filterPriority, filterStatus]);

  const byCol = useMemo(() => ({
    todo: filtered.filter(t => t.status === "todo"),
    doing: filtered.filter(t => t.status === "doing"),
    done: filtered.filter(t => t.status === "done"),
  }), [filtered]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const editTask = (task) => { setEditing(task); setModalOpen(true); };

  const submitTask = (data) => {
    if (!projectId) { alert("먼저 프로젝트를 선택해 주세요."); return; }
    if (editing) {
      tasks.update(projectId, editing.id, data);
    } else {
      tasks.create(projectId, data);
    }
    setModalOpen(false);
  };

  const removeTask = (task) => {
    if (!window.confirm(`'${task.title}' 업무를 삭제할까요?`)) return;
    tasks.remove(projectId, task.id);
  };
  const changeStatus = (task, next) => tasks.update(projectId, task.id, { status: next });

  if (!projectId) {
    return <div className="task-wrap"><div className="empty">선택된 프로젝트가 없습니다.</div></div>;
  }

  return (
    <div className="task-wrap">
      <div className="task-head">
        <div>
          <div className="subtitle">프로젝트</div>
          <h2 className="title">{current?.name || current?.title}</h2>
        </div>
        <div className="task-head-actions">
          <input className="input" placeholder="업무 검색..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <select className="select" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
            <option value="all">전체 상태</option>
            <option value="todo">할 일</option>
            <option value="doing">진행중</option>
            <option value="done">완료</option>
          </select>
          <select className="select" value={filterPriority} onChange={(e)=>setFilterPriority(e.target.value)}>
            <option value="all">전체 우선순위</option>
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>
          <button className="btn-primary" onClick={openNew}>새 업무</button>
        </div>
      </div>

      <div className="board">
        <section className="col">
          <h3>할 일 ({byCol.todo.length})</h3>
          {byCol.todo.length === 0 ? <div className="empty">비어있습니다</div> :
            byCol.todo.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onEdit={()=>editTask(t)}
                onDelete={()=>removeTask(t)}
                onStatusChange={(next)=>changeStatus(t, next)}
              />
            ))
          }
        </section>

        <section className="col">
          <h3>진행중 ({byCol.doing.length})</h3>
          {byCol.doing.length === 0 ? <div className="empty">비어있습니다</div> :
            byCol.doing.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onEdit={()=>editTask(t)}
                onDelete={()=>removeTask(t)}
                onStatusChange={(next)=>changeStatus(t, next)}
              />
            ))
          }
        </section>

        <section className="col">
          <h3>완료 ({byCol.done.length})</h3>
          {byCol.done.length === 0 ? <div className="empty">비어있습니다</div> :
            byCol.done.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                onEdit={()=>editTask(t)}
                onDelete={()=>removeTask(t)}
                onStatusChange={(next)=>changeStatus(t, next)}
              />
            ))
          }
        </section>
      </div>

      <TaskModal
        open={modalOpen}
        initial={editing}
        onClose={()=>setModalOpen(false)}
        onSubmit={submitTask}
      />
    </div>
  );
}
