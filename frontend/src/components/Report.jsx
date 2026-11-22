import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ChevronLeft, Award, BookOpen, Star, Loader2 } from 'lucide-react';

const API = '/api/interview';

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API}/${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Report not found (HTTP ${res.status})`);
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, gap: '1rem' }}>
        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-glow)' }} />
        <h2 className="text-gradient">Analyzing Interview Performance...</h2>
        <p style={{ color: 'var(--text-muted)' }}>This may take a moment</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>Failed to Load Report</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
        <button className="glass-button" onClick={() => navigate('/')}>
          <ChevronLeft size={18} /> Go Home
        </button>
      </div>
    );
  }

  const scoreColor = report.score >= 80
    ? 'var(--accent-green)'
    : report.score >= 60
    ? 'var(--accent-gold)'
    : 'var(--accent-red)';

  return (
    <div className="fade-in" style={{ padding: '2rem 0' }}>

      <button
        className="glass-button secondary"
        onClick={() => navigate('/')}
        style={{ padding: '8px 16px', marginBottom: '2rem' }}
      >
        <ChevronLeft size={20} /> New Interview
      </button>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Interview <span className="text-gradient">Report</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Role: <strong style={{ color: 'white' }}>{report.role}</strong>
          {' · '}
          <span>{report.experience}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '3rem' }}>

        {/* Score Card */}
        <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Overall Score</h3>
          <div style={{
            width: '200px', height: '200px', borderRadius: '50%',
            background: `conic-gradient(${scoreColor} ${report.score}%, rgba(255,255,255,0.08) 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '178px', height: '178px', borderRadius: '50%',
              background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '4rem', fontWeight: 800, color: scoreColor }}>{report.score}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>out of 100</span>
            </div>
          </div>
          <p style={{ fontSize: '1rem', lineHeight: 1.5 }}>
            {report.score >= 80 ? '🎉 Excellent readiness for placement!' :
              report.score >= 60 ? '👍 Good potential, needs a bit of polish.' :
              '📚 Significant improvement needed.'}
          </p>
        </div>

        {/* Strengths and Weaknesses */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-green)', marginBottom: '1rem' }}>
              <CheckCircle2 /> Key Strengths
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {report.strengths?.map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Star size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: '4px' }} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-red)', marginBottom: '1rem' }}>
              <AlertTriangle /> Areas for Improvement
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {report.weaknesses?.map((w, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <BookOpen size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '4px' }} />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
        Detailed <span className="text-gradient">Question Analysis</span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {report.evaluation?.feedback?.map((f, i) => (
          <div key={i} className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--secondary-glow)', maxWidth: '85%', lineHeight: 1.4 }}>
                Q{i + 1}: {f.question}
              </h4>
              <div style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Award size={18} color="var(--accent-gold)" />
                <span style={{ fontWeight: 700 }}>{f.score}/10</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h5 style={{ color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Your Answer</h5>
                <p style={{ fontStyle: 'italic', color: '#E2E8F0', lineHeight: 1.6 }}>"{f.userAnswer}"</p>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h5 style={{ color: 'var(--accent-green)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Ideal Answer</h5>
                <p style={{ color: '#E2E8F0', lineHeight: 1.6 }}>{f.idealAnswer}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(79, 70, 229, 0.1)', borderLeft: '4px solid var(--primary-glow)', padding: '1.5rem', borderRadius: '0 12px 12px 0' }}>
              <h5 style={{ color: 'var(--primary-glow)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Actionable Feedback</h5>
              <p style={{ color: '#F8FAFC', lineHeight: 1.6 }}>{f.feedback}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
        <button className="glass-button" style={{ padding: '16px 32px', fontSize: '1.1rem' }} onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Start New Interview
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
