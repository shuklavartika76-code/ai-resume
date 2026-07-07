import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Briefcase, Star, ChevronRight, Loader2, FileSearch } from 'lucide-react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStart = async () => {
    if (!file || !role) {
      setError('Please upload a resume and specify your target role.');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      // 1. Upload Resume & Parse PDF
      const formData = new FormData();
      formData.append('resume', file);
      const uploadRes = await fetch('http://localhost:5000/api/interview/upload', {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Resume parsing failed');
      const uploadData = await uploadRes.json();

      // 2. Run ATS Analysis
      const atsRes = await fetch('http://localhost:5000/api/interview/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          resumeText: uploadData.resumeText
        })
      });
      if (!atsRes.ok) throw new Error('ATS analysis failed');
      const atsData = await atsRes.json();
      
      // Navigate to ATS Dashboard
      navigate('/ats', { 
        state: { 
          role, 
          experience, 
          resumeText: uploadData.resumeText,
          atsData 
        } 
      });

    } catch (err) {
      console.error(err);
      setError('An error occurred. Please ensure the backend is running and the API key is valid.');
    } finally {
      setLoading(false);
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
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: '#FCA5A5', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
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
          onClick={() => fileInputRef.current.click()}
          style={{ 
            border: '2px dashed rgba(255,255,255,0.2)', 
            borderRadius: '16px', 
            padding: '3rem 2rem', 
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: file ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
            marginBottom: '2.5rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-glow)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" style={{ display: 'none' }} />
          <UploadCloud size={48} color={file ? 'var(--primary-glow)' : 'var(--text-muted)'} style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {file ? file.name : "Upload your Resume"}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {file ? "Click to change file (PDF only)" : "Drag & drop or click to browse (PDF)"}
          </p>
        </div>

        <button 
          className="glass-button" 
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Analyzing Resume ATS...</>
          ) : (
            <><FileSearch size={20} /> Analyze ATS & Continue <ChevronRight /></>
          )}
        </button>
      </div>
    </div>
  );
}
