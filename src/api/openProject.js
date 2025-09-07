// client/src/api/openProject.js

// 프록시 서버(Express) 베이스 URL
// 예) client/.env 에서 REACT_APP_API_BASE=http://localhost:4000
const API = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

// 공통: 응답 처리 유틸
async function handleResponse(res) {
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    // JSON 아닌 응답일 수 있으니 조용히 무시
  }
  if (!res.ok) {
    // OpenProject 에러는 body 안에 상세 메시지가 들어있는 경우가 많음
    const err = body || { message: `HTTP ${res.status}` };
    throw err;
  }
  return body;
}

/* =========================
 *  프로젝트 (Projects)
 * ========================= */

// 프로젝트 목록
export async function fetchProjects() {
  const res = await fetch(`${API}/api/op/projects`);
  const data = await handleResponse(res);
  // OpenProject 목록은 _embedded.elements 안에 있음
  return data?._embedded?.elements || [];
}

// 프로젝트 생성
// params: { name, identifier?, description?, isPublic?=true }
export async function createProject({ name, identifier, description, isPublic = true }) {
  const res = await fetch(`${API}/api/op/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, identifier, description, isPublic }),
  });
  // 반환값은 생성된 프로젝트의 전체 JSON (id 포함)
  return handleResponse(res);
}

/* =========================
 *  일감 (Work Packages)
 * ========================= */

// 특정 프로젝트의 일감 목록
export async function fetchWorkPackages(projectId, pageSize = 100) {
  if (!projectId) throw { message: 'projectId가 필요합니다.' };
  const res = await fetch(`${API}/api/op/work-packages?projectId=${projectId}&pageSize=${pageSize}`);
  const data = await handleResponse(res);
  return data?._embedded?.elements || [];
}

// 일감 생성
// params: {
//   projectId (필수), subject (필수), description?, startDate?, dueDate?,
//   typeId?, assigneeId?, priorityId?
// }
export async function createWorkPackage({
  projectId,
  subject,
  description,
  startDate,
  dueDate,
  typeId,
  assigneeId,
  priorityId,
}) {
  if (!projectId) throw { message: 'projectId가 필요합니다.' };
  if (!subject || !subject.trim()) throw { message: 'subject(제목)가 필요합니다.' };

  const res = await fetch(`${API}/api/op/work-packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      subject,
      description,
      startDate,
      dueDate,
      typeId,
      assigneeId,
      priorityId,
    }),
  });
  // 반환값은 생성된 work package의 전체 JSON (id 포함)
  return handleResponse(res);
}

/* =========================
 *  (선택) 보조 API
 * ========================= */

// 작업 유형(Type) 목록 (드롭다운 등에 활용)
export async function fetchTypes() {
  const res = await fetch(`${API}/api/op/types`);
  const data = await handleResponse(res);
  return data?._embedded?.elements || [];
}
