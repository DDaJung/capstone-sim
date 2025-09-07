import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GoogleLoginButton from './components/LoginButton';
import { useAuth } from './auth/AuthProvider';
import DashboardPage from './pages/DashboardPage';
import TaskPage from './pages/TaskPage';
import MessagePage from './pages/MessagePage';
import BoardPage from './pages/BoardPage';
import PostDetailPage from './pages/PostDetailPage';
import CalendarPage from './pages/CalendarPage';
import { ProjectsProvider } from './context/ProjectsContext';
import { TasksProvider } from './context/TasksContext';


const Avatar = ({ src, name }) => {
  const [err, setErr] = React.useState(false);
  const initials = (name || 'U').trim().split(/\s+/).map(s => s[0]).slice(0,2).join('').toUpperCase();
  return src && !err
    ? <img src={src} alt={name} className="avatar" referrerPolicy="no-referrer" onError={()=>setErr(true)} />
    : <div className="avatar avatar-fallback" title={name}>{initials}</div>;
};

const AppHeaderRight = () => {
  const { user, logout } = useAuth();
  return (
    <div className="header-right">
      {user ? (<><Avatar src={user.picture} name={user.name} /><span className="username">{user.name}</span><button className="btn btn-logout" onClick={logout}>로그아웃</button></>)
            : (<GoogleLoginButton />)}
    </div>
  );
};

export default function App() {
  return (
    <ProjectsProvider>
      <TasksProvider>
        <Router>
          <div className="app-container">
            <header className="top-bar">
              <div className="logo"><Link to="/" className="logo-link">SyncUp</Link></div>
              <div className="section-title" />
              <div className="top-icons"><AppHeaderRight /></div>
            </header>
            <div className="main-body">
              <nav className="sidebar">
                <ul>
                  <li><Link to="/task" className="white-menu">업무</Link></li>
                  <li><Link to="/message" className="white-menu">메신저</Link></li>
                                    <li><Link to="/calendar" className="white-menu">캘린더</Link></li>
                </ul>
              </nav>
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/task" element={<TaskPage />} />
                  <Route path="/message" element={<MessagePage />} />
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
