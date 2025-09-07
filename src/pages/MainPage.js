// src/pages/MainPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

export default function MainPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [isLoading, setIsLoading]     = useState(false);

  // 폼 상태
  const [newTitle, setNewTitle]       = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [leader, setLeader]           = useState('');
  const [members, setMembers]         = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const navigate = useNavigate();

  // 로컬스토리지에서 프로젝트 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('projects');
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  // 모달 닫고 폼 초기화
  const resetAndClose = () => {
    setShowModal(false);
    setNewTitle(''); setNewDesc('');
    setStartDate(''); setEndDate('');
    setLeader(''); setMembers([]); setNewMemberEmail('');
    setIsLoading(false);
  };

  // 새 프로젝트 생성
  const handleCreate = e => {
    e.preventDefault();
    setIsLoading(true);

    const newProject = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      startDate,
      endDate,
      leader,
      members,
    };
    const updated = [ newProject, ...projects ];
    setProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));

    setTimeout(() => {
      alert('프로젝트가 생성되었습니다!');
      resetAndClose();
    }, 200);
  };

  // 담당자 이메일 추가/제거
  const handleAddMember = () => {
    const email = newMemberEmail.trim();
    if (email && !members.includes(email)) {
      setMembers([...members, email]);
      setNewMemberEmail('');
    }
  };
  const handleRemoveMember = email => {
    setMembers(members.filter(m => m !== email));
  };

  // 각 프로젝트의 진행률을 계산
  const calcProgress = project => {
    const { startDate, endDate } = project;
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end   = new Date(endDate).getTime();
    const now   = Date.now();
    const percent = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(Math.round(percent), 0), 100);
  };

  // 전체 평균 진행률
  const overallPercent = useMemo(() => {
    if (projects.length === 0) return 0;
    const sum = projects.reduce((acc, p) => acc + calcProgress(p), 0);
    return Math.round(sum / projects.length);
  }, [projects]);

  return (
    <div className="dashboard-content" style={{ flex: 1, padding: '40px' }}>
      {/*  항상 보이는 새 프로젝트 버튼 */}
      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          새 프로젝트 생성
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{
          width: '100%',
          height: '60%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '1.2rem'
        }}>
          아직 생성된 프로젝트가 없습니다.
        </div>
      ) : (
        <div className="dashboard" style={{ display: 'flex', gap: '24px' }}>
          {/* 좌측 메인 대시보드 */}
          <div className="dashboard-left" style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 전체 진행률 */}
            <section style={{ padding: '16px', background: '#fff', borderRadius: 8 }}>
              <h2 style={{ marginBottom: '12px' }}>
                전체 프로젝트 진행률 <span style={{ color: '#27ae60' }}>({overallPercent}%)</span>
              </h2>
              <div style={{ background: '#eee', borderRadius: 8, overflow: 'hidden', height: '16px' }}>
                <div
                  style={{
                    width: `${overallPercent}%`,
                    background: '#27ae60',
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </section>

            {/* 오늘의 업무 */}
            <section style={{ padding: '16px', background: '#fff', borderRadius: 8 }}>
              <h3 style={{ marginBottom: '8px' }}>오늘의 업무</h3>
              <ul style={{ margin: 0, paddingLeft: '1em' }}>
                <li>로그인 버그 수정 <strong style={{ color: 'red' }}>High</strong></li>
                <li>UI 디자인 개선 <strong style={{ color: '#999' }}>Low</strong></li>
              </ul>
            </section>

            {/* 프로젝트 진행 현황 카드 */}
            <section style={{ padding: '16px', background: '#fff', borderRadius: 8 }}>
              <h3 style={{ marginBottom: '12px' }}>프로젝트 진행 현황</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                {projects.map(p => (
                  <div
                    key={p.id}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      background: '#fafafa'
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0' }}>{p.title}</h4>
                    <p style={{ margin: 0, color: '#555' }}>
                      {p.startDate} → {p.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 우측 보조 패널 */}
          <div className="dashboard-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section style={{ padding: '16px', background: '#fff', borderRadius: 8 }}>
              <h3 style={{ marginBottom: '8px' }}>최근 푸시 알림</h3>
              <ul style={{ margin: 0, paddingLeft: '1em' }}>
                <li>이슈 #123이 생성되었습니다.</li>
                <li>회사의 일정이 변경되었습니다.</li>
                <li>새로운 댓글이 달렸습니다.</li>
              </ul>
            </section>
            <section style={{ padding: '16px', background: '#fff', borderRadius: 8 }}>
              <h3 style={{ marginBottom: '8px' }}>추천 작업</h3>
              <ul style={{ margin: 0, paddingLeft: '1em' }}>
                <li>API 문서 작성</li>
              </ul>
            </section>

            {/* 캘린더 클릭 허용 */}
            <section
              onClick={() => navigate('/calendar')}
              style={{
                padding: '16px',
                background: '#fff',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              <h3 style={{ marginBottom: '8px' }}>캘린더</h3>
              <p style={{ margin: 0, color: '#555' }}>React-Calendar 컴포넌트 삽입 예정</p>
            </section>
          </div>
        </div>
      )}

      {/* 새 프로젝트 생성 모달 */}
      <Modal isOpen={showModal} title="새 프로젝트 생성" onClose={resetAndClose}>
        <form onSubmit={handleCreate} style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          width: '100%',
          maxWidth: 500
        }}>
          {/* ...생성 폼 필드 (이전 예시와 동일)... */}
        </form>
      </Modal>
    </div>
  );
}
