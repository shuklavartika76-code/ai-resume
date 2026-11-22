import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Upload from './components/Upload';
import ATSReport from './components/ATSReport';
import Interview from './components/Interview';
import Report from './components/Report';
import { Bot } from 'lucide-react';
import './index.css';

const Navbar = () => (
  <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: 'linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Bot size={24} color="white" />
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        Interviewer<span className="text-gradient">.ai</span>
      </h1>
    </div>
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
        AI-Powered Placement Platform
      </span>
    </div>
  </nav>
);

// Persist interview data in sessionStorage so it survives React state resets
const saveInterviewData = (data) => {
  try { sessionStorage.setItem('interviewData', JSON.stringify(data)); } catch (e) { /* ignore */ }
};
const loadInterviewData = () => {
  try {
    const raw = sessionStorage.getItem('interviewData');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
};

const AppContent = () => {
  const [interviewData, setInterviewData] = useState(() => loadInterviewData());

  const handleStartInterview = (data) => {
    setInterviewData(data);
    saveInterviewData(data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/ats" element={<ATSReport onStartInterview={handleStartInterview} />} />
          <Route
            path="/interview"
            element={interviewData
              ? <Interview data={interviewData} />
              : <Navigate to="/" replace />
            }
          />
          <Route path="/report/:id" element={<Report />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
