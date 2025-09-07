// client/src/App.js
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import DashboardPage from './pages/DashboardPage';
import TaskPage from './pages/TaskPage';
import MessagePage from './pages/MessagePage';
import BoardPage from './pages/BoardPage';
import PostDetailPage from './pages/PostDetailPage';
import CalendarPage from './pages/CalendarPage';

import { ProjectsProvider } from './context/ProjectsContext';
import { TasksProvider } from './context/TasksContext';

function App() {
  return (
    <ProjectsProvider>
      <TasksProvider>
        <Router>
          <div className="app-container">
            <header className="top-bar">
              <div className="logo">
                <Link to="/" className="logo-link">SyncUp</Link>
              </div>
              <div className="section-title"></div>
              <div className="top-icons">
                <span className="icon">👤</span>
              </div>
            </header>

            <div className="main-body">
              <nav className="sidebar">
                <ul>
                  <li><Link to="/task" className="white-menu">업무</Link></li>
                  <li><Link to="/message" className="white-menu">메신저</Link></li>
                  <li><Link to="/board" className="white-menu">게시판</Link></li>
                  <li><Link to="/calendar" className="white-menu">캘린더</Link></li>
                </ul>
              </nav>

              <main className="main-content">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/task" element={<TaskPage />} />
                  <Route path="/message" element={<MessagePage />} />
                  <Route path="/board" element={<BoardPage />} />
                  <Route path="/board/:id" element={<PostDetailPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </TasksProvider>
    </ProjectsProvider>
  );
}

export default App;
