import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, Loader2, Volume2 } from 'lucide-react';

export default function Interview({ data }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [allAnswers, setAllAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => prev + " " + currentTranscript.trim());
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript(''); // Clear previous for a fresh start on this question
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
    if (isListening) recognitionRef.current?.stop();
    setIsListening(false);

    const updatedAnswers = [...allAnswers];
    updatedAnswers[currentQ] = transcript;
    setAllAnswers(updatedAnswers);

    if (currentQ < data.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setTranscript('');
    } else {
      // Submit
      setSubmitting(true);
      try {
        const res = await fetch('http://localhost:5000/api/interview/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId: data.interviewId,
            transcript: updatedAnswers
          })
        });
        if (!res.ok) throw new Error('Failed to evaluate');
        navigate(`/report/${data.interviewId}`);
      } catch (err) {
        console.error(err);
        alert("Evaluation failed. Check console.");
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>AI Interview Session</h2>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
          Question {currentQ + 1} of {data.questions.length}
        </div>
      </div>

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
            style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px' }}
            title="Read Question Out Loud"
          >
            <Volume2 size={20} />
          </button>

          <h3 style={{ fontSize: '2rem', lineHeight: 1.4, fontWeight: 500, marginBottom: '1rem', maxWidth: '90%' }}>
            {data.questions[currentQ]}
          </h3>
        </div>

        {/* Answer Area */}
        <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
          <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--text-muted)' }}>Your Answer</h4>
              
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
                  animation: isListening ? 'pulse-ring 2s infinite' : 'none'
                }}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening ? "Stop Recording" : "Start Speaking"}
              </button>
            </div>

            <textarea 
              className="glass-input"
              style={{ flex: 1, resize: 'none', background: 'rgba(0,0,0,0.2)', fontSize: '1.1rem', lineHeight: 1.6 }}
              placeholder={isListening ? "Listening..." : "Click 'Start Speaking' and answer the question or type your answer here..."}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button 
          className="glass-button" 
          onClick={handleNext}
          disabled={submitting || (!transcript.trim() && !isListening)}
        >
          {submitting ? (
            <><Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Evaluating...</>
          ) : (
            currentQ < data.questions.length - 1 ? "Next Question" : "Submit Interview"
          )}
        </button>
      </div>
    </div>
  );
}
