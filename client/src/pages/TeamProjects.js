import React from 'react';
import ProjectPreview from '../components/ProjectPreview';

const TeamProjects = () => {
    const projects = [
        { id: 1, name: 'Project1', progress: 50 },
        { id: 2, name: 'Project2', progress: 30 }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>팀 프로젝트</h2>
                <button>+ 새 프로젝트 만들기</button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                {projects.map(project => (
                    <ProjectPreview
                        key={project.id}
                        id={project.id}
                        name={project.name}
                        progress={project.progress}
                    />
                ))}
            </div>
        </div>
    );
};

export default TeamProjects;
