'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function GuestDashboard() {
  const [session, setSession] = useState(null); // { vocabs: [], direction: 'en-de' }
  const [practiceState, setPracticeState] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('guest_session');
    if (saved) {
      setSession(JSON.parse(saved));
    } else {
      setSession({ vocabs: [], direction: 'en-de' });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem('guest_session', JSON.stringify(session));
    }
  }, [session]);

  const handleImportVocabs = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result);
        if (!Array.isArray(raw)) throw new Error('Not an array');
        
        const newVocabs = raw.map(v => ({
          id: Math.random().toString(36).substr(2, 9),
          english: v.English || v.english || '',
          german: v.German || v.german || '',
          stage: 1
        })).filter(v => v.english && v.german);

        setSession(prev => ({ ...prev, vocabs: [...prev.vocabs, ...newVocabs] }));
        if (typeof toast === 'function') toast(`✅ ${newVocabs.length} Vokabeln geladen!`);
      } catch (err) {
        if (typeof toast === 'function') toast('❌ Ungültiges Vokabel-Format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportProfile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.vocabs || !Array.isArray(data.vocabs)) throw new Error('Invalid profile');

        const imported = data.vocabs.map(v => ({
          id: v.id || Math.random().toString(36).substr(2, 9),
          english: v.english || '',
          german: v.german || '',
          stage: Math.max(1, Math.min(7, v.stage || 1))
        }));

        setSession({
          vocabs: imported,
          direction: data.direction || 'en-de'
        });
        if (typeof toast === 'function') toast(`✅ Profil geladen! (${imported.length} Vokabeln)`);
      } catch (err) {
        if (typeof toast === 'function') toast('❌ Ungültiges Profil-Format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportProfile = () => {
    if (!session.vocabs.length) return;
    const profile = {
      version: 1,
      exportDate: new Date().toISOString(),
      direction: session.direction,
      vocabs: session.vocabs
    };
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vokabeltrainer_profil_gast.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof toast === 'function') toast('💾 Profil exportiert!');
  };

  const startPractice = () => {
    if (!session.vocabs.length) return;
    
    const weighted = [];
    session.vocabs.forEach(v => {
      const weight = 8 - (v.stage || 1);
      for (let i = 0; i < weight; i++) weighted.push(v);
    });

    const shuffled = [...weighted].sort(() => Math.random() - 0.5);
    const seen = new Set();
    const queue = [];
    const max = Math.min(20, session.vocabs.length);

    for (const v of shuffled) {
      if (queue.length >= max) break;
      if (!seen.has(v.id)) {
        seen.add(v.id);
        queue.push(v);
      }
    }

    setPracticeState({
      queue: queue,
      index: 0,
      correct: 0,
      wrong: 0,
      revealed: false,
      finished: false
    });
  };

  const handleAssessment = (isCorrect) => {
    const current = practiceState.queue[practiceState.index];
    const newVocabs = session.vocabs.map(v => {
      if (v.id === current.id) {
        return { ...v, stage: isCorrect ? Math.min(7, v.stage + 1) : Math.max(1, v.stage - 1) };
      }
      return v;
    });

    setSession(prev => ({ ...prev, vocabs: newVocabs }));

    setPracticeState(prev => {
      const nextIndex = prev.index + 1;
      return {
        ...prev,
        index: nextIndex,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        wrong: isCorrect ? prev.wrong : prev.wrong + 1,
        revealed: false,
        finished: nextIndex >= prev.queue.length
      };
    });
  };

  if (isLoading) return <div className="screen active">Lade...</div>;

  if (practiceState && !practiceState.finished) {
    const current = practiceState.queue[practiceState.index];
    return (
      <section className="screen active" style={{ display: 'flex', flexDirection: 'column' }}>
        <header className="top-bar practice-bar">
          <button className="btn btn-ghost" onClick={() => setPracticeState(null)}>← Zurück</button>
          <div className="practice-progress">
            <span>{practiceState.index + 1} / {practiceState.queue.length}</span>
          </div>
          <div className="practice-score">
            <span>✅ {practiceState.correct}</span>
            <span style={{ marginLeft: '10px' }}>❌ {practiceState.wrong}</span>
          </div>
        </header>
        <div className="card-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="flashcard" style={{ width: '90%', maxWidth: '500px' }}>
            <div className="flashcard-stage" style={{ background: `var(--stage-${current.stage})` }}>Fach {current.stage}</div>
            <div className="flashcard-prompt">{current.english}</div>
            {!practiceState.revealed ? (
              <div className="flashcard-reveal-area">
                <button className="btn btn-primary btn-lg" onClick={() => setPracticeState(p => ({ ...p, revealed: true }))}>Lösung anzeigen</button>
              </div>
            ) : (
              <div className="flashcard-assessment-area">
                <div style={{ fontSize: '1.5rem', margin: '20px 0' }}>{current.german}</div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="btn btn-danger btn-lg" onClick={() => handleAssessment(false)}>Falsch</button>
                  <button className="btn btn-success btn-lg" onClick={() => handleAssessment(true)}>Richtig</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (practiceState && practiceState.finished) {
    return (
      <section className="screen active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="results-container">
          <div style={{fontSize: '3rem', marginBottom: '10px'}}>🏆</div>
          <h2>Training abgeschlossen!</h2>
          <div style={{ margin: '20px 0', fontSize: '1.2rem' }}>
            Richtig: {practiceState.correct} | Falsch: {practiceState.wrong}<br/>
            Quote: {Math.round((practiceState.correct / (practiceState.correct + practiceState.wrong)) * 100)}%
          </div>
          <button className="btn btn-primary" onClick={() => setPracticeState(null)}>Zum Dashboard</button>
        </div>
      </section>
    );
  }

  const stageCounts = Array(7).fill(0);
  session.vocabs.forEach(v => stageCounts[v.stage - 1]++);

  return (
    <section className="screen active" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <header className="top-bar">
        <div className="top-bar-left">
          <Link href="/" className="btn btn-ghost" style={{textDecoration: 'none'}}>← Startseite</Link>
          <h2 style={{ marginLeft: '10px' }}>Gast-Modus 🏃</h2>
        </div>
        <div className="top-bar-right">
          <button className="btn btn-ghost" onClick={handleExportProfile} disabled={!session.vocabs.length}>💾 Profil sichern</button>
          <button className="btn btn-ghost btn-danger" onClick={() => { if(confirm('Alles löschen?')) setSession({vocabs:[], direction:'en-de'}) }}>Reset</button>
        </div>
      </header>
      <div className="dashboard-body" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        
        <div style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid orange', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.9rem' }}>
          ⚠️ <strong>Daten-Sicherheit:</strong> Im Gast-Modus werden Daten nur in diesem Browser gespeichert. Nutze "Profil sichern", um ein Backup zu erstellen oder deine Daten umzuziehen.
        </div>

        <div className="landing-actions" style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input type="file" ref={fileInputRef} onChange={handleImportVocabs} hidden accept=".json" />
          <button className="btn btn-primary" onClick={() => fileInputRef.current.click()} style={{flex: 1}}>Vokabel-JSON laden</button>
          
          <input type="file" ref={profileInputRef} onChange={handleImportProfile} hidden accept=".json" />
          <button className="btn btn-secondary" onClick={() => profileInputRef.current.click()} style={{flex: 1}}>Profil laden (.json)</button>
        </div>

        <div className="stages-overview">
          <h3>Fortschritt ({session.vocabs.length} Vokabeln)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Gemeistert: {session.vocabs.filter(v => v.stage === 7).length} Vokabeln (Fach 7)
          </p>
          <div className="stages-grid">
            {stageCounts.map((c, i) => (
              <div key={i} className={`stage-card ${c === 0 ? 'empty' : ''}`}>
                <h4>Fach {i + 1}</h4>
                <div className="stage-count">{c} Karten</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          {session.vocabs.length > 0 && (
            <button className="btn btn-primary btn-xl" onClick={startPractice}>Training starten</button>
          )}
        </div>
      </div>
    </section>
  );
}
