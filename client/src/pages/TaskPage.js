import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './TaskPage.css';
import TagInput from '../components/TagInput';

/* ====== 작은 배지 컴포넌트 ====== */
function StatusBadge({ status, onClick }) {
    const map = { todo: '할 일', doing: '진행중', done: '완료' };
    const cls = status === 'done' ? 'green' : status === 'doing' ? 'orange' : 'gray';
    return (
        <button type="button" className={`status-badge ${cls}`} onClick={onClick} title="상태 바꾸기">
            {map[status] || status}
        </button>
    );
}
function PriorityTag({ value, onClick }) {
    const cls =
        ({ '매우 낮음': 'vlow', 낮음: 'low', 보통: 'normal', 높음: 'high', '매우 높음': 'vhigh', '우선순위 없음': 'none' }[value]) ||
        'normal';
    return (
        <button type="button" className={`prio-tag ${cls}`} onClick={onClick} title="우선순위 바꾸기">
            {value}
        </button>
    );
}

/* ====== 페이지 ====== */
export default function TaskPage({ projectName: propProjectName }) {
    const projectName =
        propProjectName ||
        localStorage.getItem('currentProjectName') ||
        localStorage.getItem('project:name') ||
        '프로젝트';
    // 프로젝트별로 키 바꾸면 됨 (예: tasks:projectId)
    const STORAGE_KEY = 'tasks:default';

    const [tasks, setTasks] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch { }
    }, [tasks]);

    // 모달/폼
    const [showForm, setShowForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        assignee: '',
        cc: '', // 콤마 구분
        start: '',
        due: '',
        status: 'todo',
        priority: '우선순위 없음', // 우선순위 없음 | 매우 높음 | 높음 | 보통 | 낮음 | 매우 낮음
        tags: [],
        descHtml: '',
        attachments: [], // {name,size,type}
    });

    // 모달 열릴 때 스크롤 잠금
    useEffect(() => {
        document.body.classList.toggle('no-scroll', showForm);
        return () => document.body.classList.remove('no-scroll');
    }, [showForm]);

    // 검색/필터
    const [q, setQ] = useState('');
    const [prioFilter, setPrioFilter] = useState('전체');

    // 단축키: ESC로 모달 닫기
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && showForm) setShowForm(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showForm]);

    // 필터링
    const filtered = useMemo(() => {
        const kw = q.trim().toLowerCase();
        return (tasks || []).filter((t) => {
            const okQ =
                !kw ||
                (t.title && t.title.toLowerCase().includes(kw)) ||
                (t.assignee && t.assignee.toLowerCase().includes(kw));
            const okPrio = prioFilter === '전체' ? true : t.priority === prioFilter;
            return okQ && okPrio;
        });
    }, [tasks, q, prioFilter]);

    // 칸반 그룹
    const byCol = useMemo(
        () => ({
            todo: filtered.filter((t) => t.status === 'todo'),
            doing: filtered.filter((t) => t.status === 'doing'),
            done: filtered.filter((t) => t.status === 'done'),
        }),
        [filtered]
    );

    // 진행률
    const totalCount = byCol.todo.length + byCol.doing.length + byCol.done.length;
    const progressPct = totalCount > 0 ? Math.round((byCol.done.length / totalCount) * 100) : 0;

    // 상태/우선순위 토글
    const cycleStatus = (cur) => {
        const order = ['todo', 'doing', 'done'];
        return order[(order.indexOf(cur) + 1) % order.length];
    };
    const nextPriority = (cur) => {
        const order = ['우선순위 없음', '매우 높음', '높음', '보통', '낮음', '매우 낮음'];
        return order[(order.indexOf(cur) + 1) % order.length];
    };

    // 첨부
    const onFiles = (files) => {
        const list = Array.from(files || []).map((f) => ({ name: f.name, size: f.size, type: f.type }));
        setNewTask((v) => ({ ...v, attachments: [...v.attachments, ...list] }));
    };

    // 간단 RTE
    const editorRef = useRef(null);
    const exec = (cmd, val = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        setNewTask((v) => ({ ...v, descHtml: editorRef.current?.innerHTML || '' }));
    };
    const syncHtml = () => setNewTask((v) => ({ ...v, descHtml: editorRef.current?.innerHTML || '' }));

    // 등록
    const handleAddTask = (e) => {
        e?.preventDefault?.();
        if (!newTask.title.trim()) return alert('제목을 입력하세요.');
        const t = { ...newTask, id: Date.now(), createdAt: new Date().toISOString() };
        setTasks((prev) => [t, ...prev]);
        setNewTask({
            title: '',
            assignee: '',
            cc: '',
            start: '',
            due: '',
            status: 'todo',
            priority: '우선순위 없음',
            tags: [],
            descHtml: '',
            attachments: [],
        });
        setShowForm(false);
    };

    /* ====== 멤버별 업무 현황 집계 ======
       멤버: 현재 데이터 구조상 '담당자(assignee)' 기준으로 집계
       지표: 할 일 / 진행중 / 완료 / 미정(담당자 없음) / 지연(마감 지나고 완료 아님) / 진행률(완료/모수)
    */
    const memberStats = useMemo(() => {
        const map = new Map(); // name -> { todo, doing, done, unassigned, overdue, total }
        const today = new Date();
        const norm = (s) => (s || '').trim();

        const ensure = (name) => {
            if (!map.has(name)) map.set(name, { todo: 0, doing: 0, done: 0, unassigned: 0, overdue: 0, total: 0 });
            return map.get(name);
        };

        (tasks || []).forEach((t) => {
            const assignee = norm(t.assignee) || '(미정)';
            const status = t.status || 'todo';
            const bucket = ensure(assignee);

            if (!t.assignee) {
                const u = ensure('(미정)');
                u.unassigned += 1;
            }

            if (status === 'todo') bucket.todo += 1;
            else if (status === 'doing') bucket.doing += 1;
            else if (status === 'done') bucket.done += 1;

            // 진행률 분모: 담당 지정된 업무만 포함
            if (assignee !== '(미정)') bucket.total += 1;

            // 지연: 마감일 과거 + 완료 아님
            if (t.due) {
                const due = new Date(t.due);
                if (!isNaN(due) && due < today && status !== 'done') {
                    bucket.overdue += 1;
                }
            }
        });

        const rows = Array.from(map.entries()).map(([name, s]) => {
            const den = Math.max(1, s.total);
            const progress = Math.round((s.done / den) * 100);
            return { name, ...s, progress };
        });
        rows.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        return rows;
    }, [tasks]);

    return (
        <div className="task-page">
            <div className="task-page__header">
                <h2>업무</h2>
                <div className="filters">
                    <input className="input" placeholder="검색: 제목/담당자" value={q} onChange={(e) => setQ(e.target.value)} />
                    <select className="select" value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)}>
                        <option value="전체">전체 우선순위</option>
                        <option value="우선순위 없음">우선순위 없음</option>
                        <option value="매우 높음">매우 높음</option>
                        <option value="높음">높음</option>
                        <option value="보통">보통</option>
                        <option value="낮음">낮음</option>
                        <option value="매우 낮음">매우 낮음</option>
                    </select>
                    <button className="primary" onClick={() => setShowForm(true)}>
                        + 업무 추가
                    </button>
                </div>
            </div>
            {/* 진행률 */}
            <div className="proj-progress">
                {/* ▶ 새 헤더 */}
                <div className="proj-progress__header">
                    <div className="proj-progress__title">
                        <span className="proj-progress__project">{projectName}</span>
                        <span className="proj-progress__label">진행률</span>
                    </div>
                    <div className="proj-progress__value">
                        <strong>{progressPct}</strong><span className="pct">%</span>
                    </div>
                </div>

                {/* 진행 바 */}
                <div className="proj-progress__bar">
                    <div className="proj-progress__fill" style={{ width: progressPct + '%' }} />
                </div>

                {/* 통계 라인 */}
                <div className="proj-progress__stats">
                    <span>할 일 {byCol.todo.length}</span>
                    <span>진행중 {byCol.doing.length}</span>
                    <span>완료 {byCol.done.length}</span>
                    <span>총 {totalCount}</span>
                </div>
            </div>

            
            {/* 칸반 */}
            <div className="board">
                {['todo', 'doing', 'done'].map((col) => (
                    <section key={col} className="col">
                        <h3>{col === 'todo' ? '할 일' : col === 'doing' ? '진행중' : '완료'} ({byCol[col].length})</h3>
                        {byCol[col].length === 0 ? (
                            <div className="empty">비어있습니다</div>
                        ) : (
                            byCol[col].map((task) => (
                                <div key={task.id} className="task-card">
                                    <div className="task-card__title">{task.title}</div>
                                    <div className="task-card__meta">
                                        <div>담당자: {task.assignee || '-'}</div>
                                        <div>
                                            기간: {task.start || '-'} ~ {task.due || '-'}
                                        </div>
                                    </div>
                                    <div className="task-card__footer">
                                        <PriorityTag
                                            value={task.priority}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, priority: nextPriority(t.priority) } : t)));
                                            }}
                                        />
                                        <StatusBadge
                                            status={task.status}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: cycleStatus(t.status) } : t)));
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                ))}
            </div>

            {/* === 멤버별 업무 현황 === */}
            <div className="member-stats card">
                <div className="member-stats__title">멤버별 업무 현황</div>
                <div className="member-stats__table">
                    <div className="ms-row ms-head">
                        <div className="ms-cell ms-name">멤버</div>
                        <div className="ms-cell">진행률</div>
                        <div className="ms-cell green">할 일</div>
                        <div className="ms-cell blue">진행 중</div>
                        <div className="ms-cell gray">완료</div>
                        <div className="ms-cell indigo">미정</div>
                        <div className="ms-cell red">지연</div>
                    </div>
                    {memberStats.length === 0 ? (
                        <div className="ms-empty">데이터가 없습니다</div>
                    ) : (
                        memberStats.map((r) => (
                            <div key={r.name} className="ms-row">
                                <div className="ms-cell ms-name">{r.name}</div>
                                <div className="ms-cell">{r.progress}%</div>
                                <div className="ms-cell green">{r.todo}</div>
                                <div className="ms-cell blue">{r.doing}</div>
                                <div className="ms-cell gray">{r.done}</div>
                                <div className="ms-cell indigo">{r.unassigned}</div>
                                <div className="ms-cell red">{r.overdue}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* === 업무 추가 모달 (portal) === */}
            {showForm &&
                createPortal(
                    <>
                        <div className="modal-overlay" onClick={() => setShowForm(false)} />
                        <form className="modal-card modal-form" onSubmit={handleAddTask} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>업무 추가</h3>
                                <button type="button" className="icon-btn" onClick={() => setShowForm(false)}>
                                    ✕
                                </button>
                            </div>

                            {/* 큰 제목 입력 */}
                            <input
                                className="title-input"
                                placeholder="제목을 입력해 주세요."
                                value={newTask.title}
                                onChange={(e) => setNewTask((v) => ({ ...v, title: e.target.value }))}
                                autoFocus
                                required
                            />

                            {/* 담당/우선 */}
                            <div className="grid-2">
                                <div className="field">
                                    <label>담당자</label>
                                    <input
                                        className="input"
                                        placeholder="이름, 메일 주소"
                                        value={newTask.assignee}
                                        onChange={(e) => setNewTask((v) => ({ ...v, assignee: e.target.value }))}
                                    />
                                </div>
                                <div className="field">
                                    <label>우선순위</label>
                                    <select
                                        className="select"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask((v) => ({ ...v, priority: e.target.value }))}
                                    >
                                        <option>우선순위 없음</option>
                                        <option>매우 높음</option>
                                        <option>높음</option>
                                        <option>보통</option>
                                        <option>낮음</option>
                                        <option>매우 낮음</option>
                                    </select>
                                </div>
                            </div>

                            {/* 참조자 */}
                            <div className="field">
                                <label>참조자</label>
                                <input
                                    className="input"
                                    placeholder="콤마(,)로 구분하여 입력"
                                    value={newTask.cc}
                                    onChange={(e) => setNewTask((v) => ({ ...v, cc: e.target.value }))}
                                />
                            </div>

                            {/* 날짜/시간 */}
                            <div className="grid-2">
                                <div className="field">
                                    <label>시작일</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={newTask.start}
                                        onChange={(e) => setNewTask((v) => ({ ...v, start: e.target.value }))}
                                    />
                                </div>
                                <div className="field">
                                    <label>만기일</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={newTask.due}
                                        onChange={(e) => setNewTask((v) => ({ ...v, due: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* 태그 */}
                            <div className="field">
                                <label>태그</label>
                                <TagInput
                                    value={newTask.tags}
                                    onChange={(tags) => setNewTask((v) => ({ ...v, tags }))}
                                    placeholder="예: backend, urgent"
                                />
                            </div>

                            {/* 첨부 */}
                            <div className="field">
                                <label>첨부</label>
                                <div className="attach-row">
                                    <input type="file" multiple onChange={(e) => onFiles(e.target.files)} />
                                    {newTask.attachments.length > 0 && (
                                        <div className="attach-list">
                                            {newTask.attachments.map((f, i) => (
                                                <span key={i} className="attach-chip" title={`${f.name} • ${f.size}B`}>
                                                    📎 {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 리치 텍스트 에디터 */}
                            <div className="rte">
                                <div className="rte-toolbar">
                                    <button type="button" onClick={() => exec('bold')} title="굵게">
                                        <b>B</b>
                                    </button>
                                    <button type="button" onClick={() => exec('italic')} title="기울임">
                                        <i>I</i>
                                    </button>
                                    <button type="button" onClick={() => exec('underline')} title="밑줄">
                                        <u>U</u>
                                    </button>
                                    <button type="button" onClick={() => exec('strikeThrough')} title="취소선">
                                        S̶
                                    </button>
                                    <span className="sep" />
                                    <button type="button" onClick={() => exec('insertUnorderedList')} title="글머리">
                                        •⃝
                                    </button>
                                    <button type="button" onClick={() => exec('insertOrderedList')} title="번호">
                                        1.
                                    </button>
                                    <button type="button" onClick={() => exec('formatBlock', 'blockquote')} title="인용">
                                        “”
                                    </button>
                                    <button type="button" onClick={() => exec('formatBlock', 'pre')} title="코드">
                                        {'</>'}
                                    </button>
                                </div>
                                <div
                                    className="rte-editor"
                                    ref={editorRef}
                                    contentEditable
                                    onInput={syncHtml}
                                    suppressContentEditableWarning
                                    placeholder="설명을 입력하세요..."
                                    dangerouslySetInnerHTML={{ __html: newTask.descHtml }}
                                />
                            </div>

                            <div className="proj-progress">
                                {/* ▶ 변경된 헤더 */}
                                <div className="proj-progress__header">
                                    <div className="proj-progress__title">
                                        <span className="proj-progress__project">{projectName}</span>
                                        <span className="proj-progress__label">진행률</span>
                                    </div>
                                    <div className="proj-progress__value">
                                        <strong>{progressPct}</strong><span className="pct">%</span>
                                    </div>
                                </div>

                                {/* 진행 바 */}
                                <div className="proj-progress__bar">
                                    <div className="proj-progress__fill" style={{ width: progressPct + '%' }} />
                                </div>

                                {/* 통계 라인 */}
                                <div className="proj-progress__stats">
                                    <span>할 일 {byCol.todo.length}</span>
                                    <span>진행중 {byCol.doing.length}</span>
                                    <span>완료 {byCol.done.length}</span>
                                    <span>총 {totalCount}</span>
                                </div>
                            </div>


                            <div className="modal-actions">
                                <button type="submit" className="primary">
                                    저장
                                </button>
                                <button type="button" onClick={() => setShowForm(false)}>
                                    취소
                                </button>
                            </div>
                        </form>
                    </>,
                    document.body
                )}
        </div>
    );
}
