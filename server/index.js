const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const BASE = process.env.OPENPROJECT_BASE_URL.replace(/\/$/, '');
const TOKEN = process.env.OPENPROJECT_TOKEN;

const op = axios.create({
  baseURL: `${BASE}/api/v3`,
  auth: { username: 'apikey', password: TOKEN },
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});


// 1) 프로젝트 목록
// 프로젝트 목록
  app.get('/api/op/projects', async (req, res) => {
    try {
      const r = await op.get('/projects');
      res.json(r.data);
    } catch (e) {
      res.status(e.response?.status || 500).json({ error: e.response?.data || String(e) });
    }
  });

  // 프로젝트 생성
  app.post('/api/op/projects', async (req, res) => {
    const { name, identifier, description, isPublic } = req.body;
    const payload = {
      name,
      ...(identifier ? { identifier } : {}),
      ...(description ? { description: { raw: description } } : {}),
      ...(typeof isPublic === 'boolean' ? { public: isPublic } : {}),
    };
    try {
      const r = await op.post('/projects', payload);
      res.status(201).json(r.data);
    } catch (e) {
      res.status(e.response?.status || 500).json({ error: e.response?.data || String(e) });
    }
  });

// 3) 타입 목록(작업 유형: Task, Bug 등)
app.get('/api/op/types', async (_req, res) => {
  try {
    const r = await op.get('/types');
    res.json(r.data);
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.response?.data || String(e) });
  }
});

// 4) 특정 프로젝트의 일감(작업패키지) 목록
app.get('/api/op/work-packages', async (req, res) => {
  const { projectId, pageSize = 50 } = req.query;
  try {
    const r = await op.get(`/projects/${projectId}/work_packages`, {
      params: { pageSize },
    });
    res.json(r.data);
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.response?.data || String(e) });
  }
});

// 5) 일감(작업패키지) 생성
app.post('/api/op/work-packages', async (req, res) => {
  const {
    projectId,            // 필수
    subject,              // 필수(제목)
    description,          // 선택
    startDate, dueDate,   // 선택('YYYY-MM-DD')
    typeId,               // 선택(미지정 시 기본 Type)
    assigneeId,           // 선택(담당자 user id)
    priorityId,           // 선택
  } = req.body;

  const payload = {
    subject,
    ...(description ? { description: { raw: description } } : {}),
    ...(startDate ? { startDate } : {}),
    ...(dueDate ? { dueDate } : {}),
    _links: {
      project: { href: `/api/v3/projects/${projectId}` },
      ...(typeId ?    { type:     { href: `/api/v3/types/${typeId}` } } : {}),
      ...(assigneeId? { assignee: { href: `/api/v3/users/${assigneeId}` } } : {}),
      ...(priorityId? { priority: { href: `/api/v3/priorities/${priorityId}` } } : {}),
    },
  };

  try {
    const r = await op.post('/work_packages', payload);
    res.status(201).json(r.data);
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.response?.data || String(e) });
  }
});

/* =========================
 *  Mattermost 프록시 (/api/mm)
 *  - .env에 MATTERMOST_URL, MATTERMOST_TOKEN 필요
 *  - MATTERMOST_URL는 보통 http://<host>:8065/api/v4 형태
 * ========================= */

const MM_BASE = (process.env.MATTERMOST_URL || '').replace(/\/$/, ''); // 예: http://192.168.56.101:8065/api/v4
const MM_TOKEN = process.env.MATTERMOST_TOKEN;

function mmHeaders() {
  return {
    Authorization: `Bearer ${MM_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function sendMmError(res, e) {
  if (e?.response) {
    return res.status(e.response.status || 500).json(e.response.data || { error: 'Mattermost API error' });
  }
  return res.status(500).json({ error: e?.message || String(e) });
}

/** 채널 메시지 조회
 *  GET /api/mm/messages?channelId=...&limit=50
 *  → MM: GET /channels/{channel_id}/posts?page=0&per_page={limit}
 */
app.get('/api/mm/messages', async (req, res) => {
  const { channelId, limit = 50 } = req.query;
  if (!channelId) return res.status(400).json({ error: 'channelId가 필요합니다.' });

  try {
    const url = `${MM_BASE}/channels/${channelId}/posts?page=0&per_page=${limit}`;
    const r = await axios.get(url, { headers: mmHeaders() });
    // posts(order/map) 원본 그대로 반환(프론트에서 노멀라이즈)
    res.json(r.data);
  } catch (e) {
    sendMmError(res, e);
  }
});

/** 채널에 메시지 전송
 *  POST /api/mm/messages { channelId, text }
 *  → MM: POST /posts { channel_id, message }
 */
app.post('/api/mm/messages', async (req, res) => {
  const { channelId, text } = req.body || {};
  if (!channelId) return res.status(400).json({ error: 'channelId가 필요합니다.' });
  if (!text || !text.trim()) return res.status(400).json({ error: 'text가 필요합니다.' });

  try {
    const url = `${MM_BASE}/posts`;
    const r = await axios.post(
      url,
      { channel_id: channelId, message: text },
      { headers: mmHeaders() }
    );
    res.json(r.data);
  } catch (e) {
    sendMmError(res, e);
  }
});

/** (선택) 채널 정보 조회
 *  GET /api/mm/channels/:id
 *  → MM: GET /channels/{channel_id}
 */
app.get('/api/mm/channels/:id', async (req, res) => {
  try {
    const url = `${MM_BASE}/channels/${req.params.id}`;
    const r = await axios.get(url, { headers: mmHeaders() });
    res.json(r.data);
  } catch (e) {
    sendMmError(res, e);
  }
});


const port = process.env.PORT || 4000;

// ✅ 사용자 정보 조회 (user_id -> username 등)
app.get('/api/mm/users/:id', async (req, res) => {
  try {
    const url = `${MM_BASE}/users/${req.params.id}`;
    const r = await axios.get(url, { headers: mmHeaders() });
    res.json(r.data); // { id, username, first_name, last_name, nickname, ... }
  } catch (e) {
    if (e?.response) {
      return res
        .status(e.response.status || 500)
        .json(e.response.data || { error: 'Mattermost API error' });
    }
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.listen(port, () => console.log(`OpenProject proxy listening on :${port}`));
