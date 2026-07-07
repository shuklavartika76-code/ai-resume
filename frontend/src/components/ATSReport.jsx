import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, AlertCircle, ChevronRight, Loader2, Zap } from 'lucide-react';

export default function ATSReport({ onStartInterview }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // If user navigated directly here without state, send them back
  if (!location.state) {
    navigate('/');
    return null;
  }

  const { role, experience, resumeText, atsData } = location.state;

  const handleStartInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, experience, resumeText })
      });
      if (!res.ok) throw new Error('Question generation failed');
      const genData = await res.json();
      
      onStartInterview({
        interviewId: genData.interviewId,
        questions: genData.questions,
        role,
        experience
      });
      navigate('/interview');
    } catch (error) {
      console.error(error);
      alert('Failed to generate interview. Check console.');
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700 }}>ATS Resume Analysis</h2>
        <p style={{ color: 'var(--text-muted)' }}>Target Role: <span style={{ color: 'white', fontWeight: 600 }}>{role}</span></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Score Card */}
        <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Match Score</h3>
          <div style={{ 
            width: '180px', height: '180px', borderRadius: '50%', 
            background: `conic-gradient(${atsData.atsScore >= 75 ? 'var(--accent-green)' : atsData.atsScore >= 50 ? 'var(--accent-gold)' : 'var(--accent-red)'} ${atsData.atsScore}%, rgba(255,255,255,0.1) 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              width: '160px', height: '160px', borderRadius: '50%', 
              background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 800 }}>{atsData.atsScore}%</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            {atsData.atsScore >= 75 ? "Great match! You're ready." : 
             atsData.atsScore >= 50 ? "Good, but missing some keywords." : 
             "Low match. Consider adding missing keywords."}
          </p>
        </div>

        {/* Keywords */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', marginBottom: '1rem' }}>
              <CheckCircle2 size={20} /> Matched Keywords
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {atsData.matchingKeywords.map((kw, i) => (
                <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                  {kw}
                </span>
              ))}
              {atsData.matchingKeywords.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No strong matches found.</span>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', marginBottom: '1rem' }}>
              <AlertCircle size={20} /> Missing Keywords
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {atsData.missingKeywords.map((kw, i) => (
                <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: '#FCA5A5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                  {kw}
                </span>
              ))}
              {atsData.missingKeywords.length === 0 && <span style={{ color: 'var(--text-muted)' }}>You hit all the key terms!</span>}
            </div>
          </div>
        </div>

      </div>

      {/* Improvement Tips */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary-glow)', marginBottom: '1.5rem' }}>
          <Zap /> Resume Improvement Plan
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {atsData.improvementTips.map((tip, i) => (
            <li key={i} style={{ display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
              <Target size={20} style={{ color: 'var(--primary-glow)', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ lineHeight: 1.5, color: '#E2E8F0' }}>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
        <button 
          className="glass-button" 
          style={{ padding: '16px 32px', fontSize: '1.2rem' }}
          onClick={handleStartInterview}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Preparing AI Interviewer...</>
          ) : (
            <>Proceed to Mock Interview <ChevronRight size={24} /></>
          )}
        </button>
      </div>
    </div>
  );
}
