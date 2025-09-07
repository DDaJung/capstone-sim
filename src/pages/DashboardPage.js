// client/src/pages/DashboardPage.js
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext";
import ProjectPreview from "../components/ProjectPreview";
import ProjectCreateModal from "../components/ProjectCreateModal";
import "./dashboard.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const projectsAPI = useProjects();
  const [openNew, setOpenNew] = useState(false);
  const list = projectsAPI.list();

  const openProject = useCallback((p) => {
    projectsAPI.select(p.id);
    navigate("/task");
  }, [navigate, projectsAPI]);

  const onCreate = useCallback((data) => {
    const created = projectsAPI.create(data);
    setOpenNew(false);
    openProject(created);
  }, [openProject, projectsAPI]);

  const handleDelete = useCallback((proj) => {
    const title = proj?.name || proj?.title || "이 프로젝트";
    if (!window.confirm(`정말 '${title}'을(를) 삭제할까요?`)) return;
    projectsAPI.remove(proj.id);
  }, [projectsAPI]);

  const pinned = list.filter(p => p.pinned);
  const others = list.filter(p => !p.pinned);

  return (
    <div className="dash">
      <div className="dash-head">
        <h2>프로젝트 대시보드</h2>
        <button className="btn-primary" onClick={() => setOpenNew(true)}>새 프로젝트 생성</button>
      </div>

      {list.length === 0 ? (
        <div className="dash-empty">아직 생성된 프로젝트가 없습니다.</div>
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <h3 className="dash-sub">📌 고정된 프로젝트</h3>
              <div className="grid">
                {pinned.map(p => (
                  <ProjectPreview
                    key={p.id}
                    project={p}
                    onOpen={openProject}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}

          <h3 className="dash-sub">모든 프로젝트</h3>
          <div className="grid">
            {others.map(p => (
              <ProjectPreview
                key={p.id}
                project={p}
                onOpen={openProject}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {openNew && (
        <ProjectCreateModal
          onClose={() => setOpenNew(false)}
          onSubmit={onCreate}
        />
      )}
    </div>
  );
}
