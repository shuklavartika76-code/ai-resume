import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, Loader2, Volume2, AlertCircle } from 'lucide-react';

const API = '/api/interview';

const fetchWithTimeout = (url, options, timeoutMs = 120000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

export default function Interview({ data }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [allAnswers, setAllAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const committedRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            committedRef.current += (committedRef.current ? ' ' : '') + text.trim();
          } else {
            interim += text;
          }
        }
        setTranscript(committedRef.current);
        setInterimText(interim);
      };

      recognitionRef.current.onend = () => {
        setInterimText('');
        setIsListening(false);
      };

      recognitionRef.current.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setSpeechSupported(false);
        }
      };
    } else {
      setSpeechSupported(false);
    }

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Reset transcript when question changes
  useEffect(() => {
    setTranscript('');
    setInterimText('');
    committedRef.current = '';
  }, [currentQ]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      committedRef.current = transcript; // preserve existing typed text
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const readQuestion = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.questions[currentQ]);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = async () => {
    window.speechSynthesis?.cancel();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const finalAnswer = transcript.trim() || '(No answer provided)';
    const updatedAnswers = [...allAnswers];
    updatedAnswers[currentQ] = finalAnswer;
    setAllAnswers(updatedAnswers);

    if (currentQ < data.questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      // Submit all answers
      setSubmitting(true);
      setError('');
      try {
        const res = await fetchWithTimeout(`${API}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId: data.interviewId,
            transcript: updatedAnswers
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Submission failed (HTTP ${res.status})`);
        }

        navigate(`/report/${data.interviewId}`);
      } catch (err) {
        console.error('Submit error:', err);
        if (err.name === 'AbortError') {
          setError('Evaluation timed out. Please try submitting again.');
        } else {
          setError(err.message || 'Failed to evaluate your answers. Please try again.');
        }
        setSubmitting(false);
      }
    }
  };

  const progress = ((currentQ) / data.questions.length) * 100;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '2rem 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>AI Interview Session</h2>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
          Question {currentQ + 1} of {data.questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '2rem' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(to right, var(--primary-glow), var(--secondary-glow))',
          borderRadius: '2px',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--accent-red)',
          color: '#FCA5A5',
          padding: '14px 16px',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Question Card */}
        <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px',
            width: '150px', height: '150px', background: 'var(--primary-glow)',
            filter: 'blur(80px)', opacity: 0.3, borderRadius: '50%'
          }} />

          <button
            onClick={readQuestion}
            className="glass-button secondary"
            style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 12px' }}
            title="Read question aloud"
          >
            <Volume2 size={18} /> Read
          </button>

          <h3 style={{ fontSize: '1.8rem', lineHeight: 1.4, fontWeight: 500, marginBottom: '0', maxWidth: '90%' }}>
            {data.questions[currentQ]}
          </h3>
        </div>

        {/* Answer Area */}
        <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Your Answer</h4>

            {speechSupported ? (
              <button
                onClick={toggleListen}
                style={{
                  background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(79, 70, 229, 0.2)',
                  border: `1px solid ${isListening ? 'var(--accent-red)' : 'var(--primary-glow)'}`,
                  color: isListening ? '#FCA5A5' : 'white',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem'
                }}
              >
                {isListening
                  ? <><MicOff size={18} /> Stop Recording</>
                  : <><Mic size={18} /> Start Speaking</>
                }
              </button>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                🎤 Microphone not available — type your answer below
              </span>
            )}
          </div>

          {isListening && (
            <div style={{
              padding: '8px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-red)',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.85rem',
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', animation: 'pulse-ring 1s infinite', display: 'inline-block' }} />
              Recording… speak clearly
            </div>
          )}

          <textarea
            className="glass-input"
            style={{ flex: 1, resize: 'none', background: 'rgba(0,0,0,0.2)', fontSize: '1.05rem', lineHeight: 1.6, minHeight: '140px' }}
            placeholder={speechSupported ? "Click 'Start Speaking' and answer the question, or type here..." : 'Type your answer here...'}
            value={transcript + (interimText ? (transcript ? ' ' : '') + interimText : '')}
            onChange={(e) => {
              setTranscript(e.target.value);
              committedRef.current = e.target.value;
              setInterimText('');
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
        <button
          className="glass-button"
          onClick={handleNext}
          disabled={submitting}
          style={{ padding: '14px 28px', fontSize: '1rem' }}
        >
          {submitting ? (
            <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating...</>
          ) : currentQ < data.questions.length - 1 ? (
            <>Next Question <Send size={18} /></>
          ) : (
            <>Submit Interview <Send size={18} /></>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
