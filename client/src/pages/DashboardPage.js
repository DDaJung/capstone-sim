
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext";
import ProjectPreview from "../components/ProjectPreview";
import ProjectCreateModal from "../components/ProjectCreateModal";
import "./dashboard.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const projects = useProjects();
  const [openNew, setOpenNew] = useState(false);

  const openProject = useCallback((p) => {
    const id = p?.id ?? p?.identifier ?? p?.slug;
    if (id == null) return;
    projects?.select?.(id);
    try { localStorage.setItem("selectedProjectId", String(id)); } catch {}
    navigate("/task");
  }, [navigate, projects]);

  const onCreate = useCallback(async (data) => {
    try {
      const created = await (projects?.create?.(data) || Promise.reject(new Error("create 미구현")));
      openProject(created);
    } catch (e) {
      console.error(e);
      alert("프로젝트 생성 실패: " + (e?.message || e));
    }
  }, [projects, openProject]);

  const onDelete = useCallback(async (p) => {
    if (!p?.id) return;
    if (!window.confirm(`'${p.name || p.title}' 프로젝트를 삭제할까요?`)) return;
    try {
      await projects?.remove?.(p.id);
    } catch (e) {
      console.error(e);
      alert("삭제 실패: " + (e?.message || e));
    }
  }, [projects]);

  const list = (projects?.list?.() || projects?.projects || []);
  const pinned = (projects?.pinned?.() || list.filter(p => p?.pinned));
  const others = (projects?.others?.() || list.filter(p => !p?.pinned));

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>프로젝트 대시보드</h2>
        <button className="btn primary" onClick={() => setOpenNew(true)}>+ 새 프로젝트 만들기</button>
      </div>

      {openNew && (
        <ProjectCreateModal
          onClose={() => setOpenNew(false)}
          onSubmit={onCreate}
        />
      )}

      {Array.isArray(pinned) && pinned.length > 0 && (
        <>
          <h3 className="dash-sub">고정된 프로젝트</h3>
          <div className="grid">
            {pinned.map((p) => (
              <ProjectPreview
                key={p?.id ?? p?.identifier ?? p?.slug}
                project={p}
                onOpen={() => openProject(p)}
                onDelete={() => onDelete(p)}
              />
            ))}
          </div>
        </>
      )}

      <h3 className="dash-sub">모든 프로젝트</h3>
      <div className="grid">
        {(Array.isArray(others) ? others : []).map((p) => (
          <ProjectPreview
            key={p?.id ?? p?.identifier ?? p?.slug}
            project={p}
            onOpen={() => openProject(p)}
            onDelete={() => onDelete(p)}
          />
        ))}
        {(!others || others.length === 0) && (!pinned || pinned.length === 0) && (
          <div className="empty">프로젝트가 없습니다. ‘+ 새 프로젝트 만들기’를 눌러 시작하세요.</div>
        )}
      </div>
    </div>
  );
}
