import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, AlertCircle, ChevronRight, Loader2, Zap, ArrowLeft } from 'lucide-react';

const API = '/api/interview';

const fetchWithTimeout = (url, options, timeoutMs = 120000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

export default function ATSReport({ onStartInterview }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user navigated directly here without state, send them back
  if (!location.state) {
    navigate('/');
    return null;
  }

  const { role, experience, resumeText, atsData } = location.state;

  const handleStartInterview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithTimeout(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, experience, resumeText })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate questions (HTTP ${res.status})`);
      }

      const genData = await res.json();

      onStartInterview({
        interviewId: genData.interviewId,
        questions: genData.questions,
        role,
        experience
      });
      navigate('/interview');
    } catch (err) {
      console.error('Generate questions error:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out while generating questions. Please try again.');
      } else {
        setError(err.message || 'Failed to generate interview questions. Please try again.');
      }
      setLoading(false);
    }
  };

  const scoreColor = atsData.atsScore >= 75
    ? 'var(--accent-green)'
    : atsData.atsScore >= 50
    ? 'var(--accent-gold)'
    : 'var(--accent-red)';

  return (
    <div className="fade-in" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="glass-button secondary" onClick={() => navigate('/')} style={{ padding: '8px 16px' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>ATS Resume Analysis</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Target Role: <span style={{ color: 'white', fontWeight: 600 }}>{role}</span>
            {' · '}
            <span style={{ color: 'var(--text-muted)' }}>{experience}</span>
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--accent-red)',
          color: '#FCA5A5',
          padding: '14px 16px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

        {/* Score Card */}
        <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>ATS Match Score</h3>
          <div style={{
            width: '180px', height: '180px', borderRadius: '50%',
            background: `conic-gradient(${scoreColor} ${atsData.atsScore}%, rgba(255,255,255,0.08) 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '156px', height: '156px', borderRadius: '50%',
              background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor }}>{atsData.atsScore}%</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {atsData.atsScore >= 75 ? "🎉 Great match! You're ready." :
              atsData.atsScore >= 50 ? '⚠️ Good, but missing some keywords.' :
              '❌ Low match. Add missing keywords to your resume.'}
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

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button
          className="glass-button"
          style={{ padding: '16px 40px', fontSize: '1.2rem' }}
          onClick={handleStartInterview}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Preparing AI Interviewer...</>
          ) : (
            <>Proceed to Mock Interview <ChevronRight size={24} /></>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
