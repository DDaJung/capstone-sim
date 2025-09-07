// src/pages/TeamProjectDetail.js
import React from 'react';
import { useParams } from 'react-router-dom';

import './TeamProjectDetail.css';

const TeamProjectDetail = () => {
    const { id } = useParams();

    return (
        <div className="team-project-detail">
            <div className="header">
                <h2>Project {id}</h2>
                <div className="dates">
                    <p>시작일: 2025-05-01</p>
                    <p>마감일: 2025-06-10</p>
                </div>
            </div>

            <div className="top-section">
                <div className="box progress-chart">
                    <h3>진행 상태</h3>
                    <div className="progress-bar">
                        <div className="filled" style={{ width: '70%' }} />
                    </div>
                    <div className="progress-text">70%</div>
                </div>

                <div className="box issue-chart">
                    <h3>프로젝트 이슈</h3>
                    <div className="bars">
                        <div className="bar high" style={{ height: '80%' }}>High</div>
                        <div className="bar medium" style={{ height: '50%' }}>Medium</div>
                        <div className="bar low" style={{ height: '30%' }}>Low</div>
                    </div>
                </div>
            </div>

            <div className="box gantt-box">
                <h3>간트 차트</h3>
                <p>간트차트 데이터 로딩 또는 시각화 영역</p>
            </div>

            <div className="box workload-box">
                <h3>팀 워크로드</h3>
                <table>
                    <thead>
                        <tr>
                            <th>담당자</th>
                            <th>업무 배분</th>
                            <th>진행 상황</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>개발자1</td>
                            <td>OpenProject 연동</td>
                            <td>진행 중</td>
                        </tr>
                        <tr>
                            <td>개발자2</td>
                            <td>UI 디자인</td>
                            <td>진행중</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamProjectDetail;
