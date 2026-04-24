'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PracticeClient({ notebook, initialVocabs, updateVocabStage }) {
  const searchParams = useSearchParams();
  const preferredDir = searchParams.get('dir') || 'en-de';
  
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoreCorrect, setScoreCorrect] = useState(0);
  const [scoreWrong, setScoreWrong] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Generate practice queue using weights (Leitner System)
    const weighted = [];
    initialVocabs.forEach(v => {
      const weight = 8 - (v.stage || 1);
      for (let i = 0; i < weight; i++) {
        weighted.push(v);
      }
    });

    // Shuffle weighted pool
    const shuffled = [...weighted].sort(() => Math.random() - 0.5);

    // Deduplicate and pick first 20
    const seen = new Set();
    const finalQueue = [];
    const maxCards = Math.min(20, initialVocabs.length);

    for (const v of shuffled) {
      if (finalQueue.length >= maxCards) break;
      if (!seen.has(v.id)) {
        seen.add(v.id);
        
        // Resolve direction for this card
        let effectiveDir = preferredDir;
        if (preferredDir === 'random') {
          effectiveDir = Math.random() < 0.5 ? 'en-de' : 'de-en';
        }

        finalQueue.push({ ...v, effectiveDir });
      }
    }

    setQueue(finalQueue);
  }, [initialVocabs, preferredDir]);

  const currentVocab = queue[currentIndex];
  const prompt = currentVocab?.effectiveDir === 'en-de' ? currentVocab?.english : currentVocab?.german;
  const answer = currentVocab?.effectiveDir === 'en-de' ? currentVocab?.german : currentVocab?.english;

  const handleAssessment = (isCorrect) => {
    if (isPending || !currentVocab) return;

    let newStage = currentVocab.stage;
    if (isCorrect) {
      newStage = Math.min(7, newStage + 1);
      setScoreCorrect(s => s + 1);
    } else {
      newStage = Math.max(1, newStage - 1);
      setScoreWrong(s => s + 1);
    }

    startTransition(async () => {
      await updateVocabStage(currentVocab.id, newStage, isCorrect);
      setIsRevealed(false);
      setCurrentIndex(i => i + 1);
    });
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (currentIndex >= queue.length) return;
      if (!isRevealed && (e.code === 'Space' || e.code === 'Enter')) {
        setIsRevealed(true);
      } else if (isRevealed) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') handleAssessment(false);
        if (e.code === 'Digit2' || e.code === 'Numpad2') handleAssessment(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRevealed, currentIndex, queue, isPending]);

  if (queue.length === 0) {
    return (
      <section className="screen active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Keine Vokabeln vorhanden!</h2>
          <Link href={`/dashboard/notebook/${notebook.id}`} className="btn btn-secondary" style={{ marginTop: '20px', textDecoration: 'none' }}>Zurück zum Notizbuch</Link>
        </div>
      </section>
    );
  }

  if (currentIndex >= queue.length) {
    const total = scoreCorrect + scoreWrong;
    const rate = total > 0 ? Math.round((scoreCorrect / total) * 100) : 0;
    
    return (
      <section className="screen active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="results-container" style={{ margin: '0 auto', maxWidth: '600px', width: '90%' }}>
          <div className="results-header" style={{ textAlign: 'center' }}>
            <div className="results-icon" style={{ fontSize: '4rem' }}>🏆</div>
            <h2>Runde abgeschlossen!</h2>
          </div>
          <div className="results-stats" style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '30px 0' }}>
            <div className="result-stat correct" style={{ textAlign: 'center' }}>
              <span className="result-stat-value" style={{ display: 'block', fontSize: '2rem', color: 'var(--success)' }}>{scoreCorrect}</span>
              <span className="result-stat-label">Richtig</span>
            </div>
            <div className="result-stat wrong" style={{ textAlign: 'center' }}>
              <span className="result-stat-value" style={{ display: 'block', fontSize: '2rem', color: 'var(--danger)' }}>{scoreWrong}</span>
              <span className="result-stat-label">Falsch</span>
            </div>
            <div className="result-stat rate" style={{ textAlign: 'center' }}>
              <span className="result-stat-value" style={{ display: 'block', fontSize: '2rem', color: 'var(--text-primary)' }}>{rate}%</span>
              <span className="result-stat-label">Quote</span>
            </div>
          </div>
          <div className="results-actions" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link href={`/dashboard/notebook/${notebook.id}/practice?dir=${preferredDir}`} className="btn btn-primary btn-lg" style={{textDecoration:'none'}}>🔄 Nochmal trainieren</Link>
            <Link href={`/dashboard/notebook/${notebook.id}`} className="btn btn-secondary btn-lg" style={{textDecoration:'none'}}>📊 Zum Notizbuch</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen active" style={{ display: 'flex', flexDirection: 'column' }}>
      <header className="top-bar practice-bar">
        <Link href={`/dashboard/notebook/${notebook.id}`} className="btn btn-ghost" style={{textDecoration: 'none'}}>← Zurück</Link>
        <div className="practice-progress" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ minWidth: '50px' }}>{currentIndex + 1} / {queue.length}</span>
          <div className="progress-bar-mini" style={{ width: '150px', marginLeft: '10px' }}>
            <div className="progress-bar-mini-fill" style={{ width: `${((currentIndex) / queue.length) * 100}%` }}></div>
          </div>
        </div>
        <div className="practice-score" style={{ display: 'flex', gap: '10px' }}>
          <span className="score-correct">✅ {scoreCorrect}</span>
          <span className="score-wrong">❌ {scoreWrong}</span>
        </div>
      </header>

      <div className="card-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flashcard" style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.2s', width: '90%', maxWidth: '500px' }}>
          <div className="flashcard-stage" style={{ background: `var(--stage-${currentVocab.stage})` }}>Fach {currentVocab.stage}</div>
          <div className="flashcard-prompt">{prompt}</div>
          
          {!isRevealed ? (
            <div className="flashcard-reveal-area">
              <button className="btn btn-primary btn-lg" onClick={() => setIsRevealed(true)}>
                👁️ Lösung anzeigen
              </button>
            </div>
          ) : (
            <div className="flashcard-assessment-area">
              <div className="revealed-label" style={{ color: 'var(--text-secondary)' }}>Lösung:</div>
              <div className="revealed-translation" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '15px 0' }}>
                {answer}
              </div>
              <div className="assessment-actions" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button className="btn btn-danger btn-lg" onClick={() => handleAssessment(false)}>❌ Nicht gewusst</button>
                <button className="btn btn-success btn-lg" onClick={() => handleAssessment(true)}>✅ Gewusst</button>
              </div>
              <div className="assessment-hint" style={{ marginTop: '15px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Tastenkürzel: [1] Nicht gewusst &nbsp;|&nbsp; [2] Gewusst
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
