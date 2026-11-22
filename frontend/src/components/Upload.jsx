import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Briefcase, Star, ChevronRight, Loader2, FileSearch } from 'lucide-react';

const API = '/api/interview';

const fetchWithTimeout = (url, options, timeoutMs = 120000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

export default function Upload() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.type !== 'application/pdf') {
        setError('Please upload a PDF file only.');
        return;
      }
      setError('');
      setFile(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') {
      setError('');
      setFile(f);
    } else {
      setError('Please drop a PDF file only.');
    }
  };

  const handleStart = async () => {
    if (!file) {
      setError('Please upload your resume (PDF).');
      return;
    }
    if (!role.trim()) {
      setError('Please enter your target role.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Step 1: Parse PDF
      setLoadingStep('Parsing your resume...');
      const formData = new FormData();
      formData.append('resume', file);

      const uploadRes = await fetchWithTimeout(`${API}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || `Resume upload failed (HTTP ${uploadRes.status})`);
      }
      const uploadData = await uploadRes.json();

      if (!uploadData.resumeText || uploadData.resumeText.trim().length < 10) {
        throw new Error('Could not extract text from your PDF. Make sure it is a text-based PDF (not a scanned image).');
      }

      // Step 2: ATS Analysis
      setLoadingStep('Running ATS analysis with AI...');
      const atsRes = await fetchWithTimeout(`${API}/ats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: role.trim(), resumeText: uploadData.resumeText })
      });

      if (!atsRes.ok) {
        const errData = await atsRes.json().catch(() => ({}));
        throw new Error(errData.error || `ATS analysis failed (HTTP ${atsRes.status})`);
      }
      const atsData = await atsRes.json();

      navigate('/ats', {
        state: {
          role: role.trim(),
          experience,
          resumeText: uploadData.resumeText,
          atsData
        }
      });

    } catch (err) {
      console.error('Upload error:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. The AI is taking too long — please try again.');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('fetch')) {
        setError('Cannot connect to the backend server. Make sure it is running on port 5000.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>
          Acing your next <br />
          <span className="text-gradient">Tech Interview.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Get an instant ATS analysis on your resume, then practice with our AI interviewer to get placement-oriented feedback.
        </p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--accent-red)',
            color: '#FCA5A5',
            padding: '14px 16px',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>
            <Briefcase size={18} /> Target Role
          </label>
          <input
            type="text"
            className="glass-input"
            placeholder="e.g. Frontend Developer, SDE-1..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 500 }}>
            <Star size={18} /> Experience Level
          </label>
          <select
            className="glass-input"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            style={{ appearance: 'none', cursor: 'pointer' }}
          >
            <option value="Fresher" style={{ color: '#000' }}>Fresher (0 years)</option>
            <option value="Junior (1-3 years)" style={{ color: '#000' }}>Junior (1-3 years)</option>
            <option value="Mid-Level (3-5 years)" style={{ color: '#000' }}>Mid-Level (3-5 years)</option>
            <option value="Senior (5+ years)" style={{ color: '#000' }}>Senior (5+ years)</option>
          </select>
        </div>

        <div
          onClick={() => !loading && fileInputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: `2px dashed ${file ? 'var(--primary-glow)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: file ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
            marginBottom: '2.5rem'
          }}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.borderColor = 'var(--primary-glow)'; }}
          onMouseOut={(e) => { if (!file) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" style={{ display: 'none' }} />
          <UploadCloud size={48} color={file ? 'var(--primary-glow)' : 'var(--text-muted)'} style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {file ? file.name : 'Upload your Resume'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {file ? 'Click to change file (PDF only)' : 'Drag & drop or click to browse (PDF only)'}
          </p>
        </div>

        <button
          className="glass-button"
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              {loadingStep || 'Processing...'}
            </>
          ) : (
            <><FileSearch size={20} /> Analyze ATS & Continue <ChevronRight /></>
          )}
        </button>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
