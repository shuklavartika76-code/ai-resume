import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Upload from './components/Upload';
import ATSReport from './components/ATSReport';
import Interview from './components/Interview';
import Report from './components/Report';
import { Bot, Sparkles } from 'lucide-react';
import './index.css';

const Navbar = () => (
  <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Placement-Oriented Platform</span>
    </div>
  </nav>
);

const AppContent = () => {
  const [interviewData, setInterviewData] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Upload onStart={(data) => setInterviewData(data)} />} />
          <Route path="/ats" element={<ATSReport onStartInterview={(data) => setInterviewData(data)} />} />
          <Route path="/interview" element={interviewData ? <Interview data={interviewData} /> : <Navigate to="/" />} />
          <Route path="/report/:id" element={<Report />} />
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
