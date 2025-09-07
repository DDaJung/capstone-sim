import React from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useProjects } from "../context/ProjectsContext";
import "./project-detail.css";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const api = useProjects();
  const p = api.list().find((x) => x.id === id);

  if (!p) return <div style={{ padding: 20 }}>프로젝트를 찾을 수 없습니다.</div>;

  return (
    <div className="pd-wrap">
      <div className="pd-head" style={{ borderLeft: `6px solid ${p.color}` }}>
        <h2>{p.name}</h2>
        <div className="pd-meta">{p.description}</div>
      </div>
      <div className="pd-tabs">
        <NavLink to="overview">개요</NavLink>
        <NavLink to="tasks">업무</NavLink>
        <NavLink to="messenger">메신저</NavLink>
        <NavLink to="calendar">캘린더</NavLink>
        <NavLink to="gantt">간트차트</NavLink>
        <NavLink to="todos">할 일</NavLink>
        <NavLink to="files">파일</NavLink>
        <NavLink to="settings">설정</NavLink>
      </div>
      <div className="pd-body"><Outlet /></div>
    </div>
  );
}
