'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function NotebookClient({ notebook, vocabs, importVocabs, addVocab, updateVocab, deleteVocab }) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [direction, setDirection] = useState('en-de');
  const [isManaging, setIsManaging] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        const res = await importVocabs(notebook.id, reader.result);
        if (res?.error) toast('❌ ' + res.error);
        else toast(`✅ ${res?.count || 0} Vokabeln importiert!`);
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const exportData = vocabs.map(v => ({
      English: v.english,
      German: v.german
    }));
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vokabeln_${notebook.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stagesCount = Array(7).fill(0);
  vocabs.forEach(v => {
    if (v.stage >= 1 && v.stage <= 7) stagesCount[v.stage - 1]++;
  });

  const onAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    startTransition(async () => {
      const res = await addVocab(notebook.id, formData);
      if (res.error) toast('❌ ' + res.error);
      else {
        toast('✅ Vokabel hinzugefügt!');
        e.target.reset();
      }
    });
  };

  const onUpdate = (vocabId, e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    startTransition(async () => {
      const res = await updateVocab(notebook.id, vocabId, formData);
      if (res.error) toast('❌ ' + res.error);
      else {
        toast('✅ Aktualisiert!');
        setEditingId(null);
      }
    });
  };

  const onDelete = (vocabId) => {
    if (!confirm('Diese Vokabel wirklich löschen?')) return;
    startTransition(async () => {
      await deleteVocab(notebook.id, vocabId);
      toast('🗑️ Gelöscht.');
    });
  };

  return (
    <section className="screen active" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <header className="top-bar">
        <div className="top-bar-left">
          <Link href="/dashboard" className="btn btn-ghost" style={{textDecoration: 'none'}}>← Zurück</Link>
          <h2 style={{ marginLeft: '15px' }}>{notebook.name}</h2>
        </div>
        <div className="top-bar-right">
          <button className="btn btn-toggle" onClick={() => setIsManaging(!isManaging)}>
            {isManaging ? '📊 Übersicht' : '📝 Vokabeln verwalten'}
          </button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} hidden />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current.click()} disabled={isPending} title="Akzeptiert Vokabel-JSON oder Profile">
            📥 Import
          </button>
          <button className="btn btn-ghost" onClick={handleExport}>
            💾 Export
          </button>
        </div>
      </header>

      <div className="dashboard-body" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
        
        {!isManaging ? (
          <>
            <div className="stages-overview" style={{ marginTop: '20px' }}>
              <h3>Karteikasten-Übersicht</h3>
              <div className="stages-grid">
                {stagesCount.map((count, i) => {
                  const stageLabels = ['Neu', 'Beginner', 'Lernend', 'Kenner', 'Fortgeschr.', 'Experte', 'Gemeistert'];
                  return (
                    <div key={i} className="stage-card" data-stage={i + 1}>
                      <div className="stage-number">Fach {i + 1}</div>
                      <div className="stage-count">{count}</div>
                      <div className="stage-label">{stageLabels[i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div className="direction-toggle">
                <span className="direction-label">Abfragerichtung:</span>
                <button className={`btn btn-toggle ${direction === 'en-de' ? 'active' : ''}`} onClick={() => setDirection('en-de')}>EN → DE</button>
                <button className={`btn btn-toggle ${direction === 'de-en' ? 'active' : ''}`} onClick={() => setDirection('de-en')}>DE → EN</button>
                <button className={`btn btn-toggle ${direction === 'random' ? 'active' : ''}`} onClick={() => setDirection('random')}>🔀 Zufall</button>
              </div>

              <Link href={`/dashboard/notebook/${notebook.id}/practice?dir=${direction}`} className="btn btn-primary btn-xl" style={{textDecoration: 'none'}}>
                <span className="btn-icon">🎯</span> Training starten
              </Link>
            </div>
          </>
        ) : (
          <div className="vocab-manager" style={{ width: '100%' }}>
            <div className="card-add-form" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '30px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '15px' }}>Neue Vokabel hinzufügen</h3>
              <form onSubmit={onAdd} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input name="english" className="input" placeholder="Englisch" style={{ flex: 1, minWidth: '150px' }} required />
                <input name="german" className="input" placeholder="Deutsch" style={{ flex: 1, minWidth: '150px' }} required />
                <button type="submit" className="btn btn-primary" disabled={isPending}>Hinzufügen</button>
              </form>
            </div>

            <div className="vocab-list-table" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Englisch</th>
                    <th style={{ padding: '12px' }}>Deutsch</th>
                    <th style={{ padding: '12px', width: '80px' }}>Fach</th>
                    <th style={{ padding: '12px', width: '120px', textAlign: 'right' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {vocabs.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {editingId === v.id ? (
                        <td colSpan="4" style={{ padding: '10px' }}>
                          <form onSubmit={(e) => onUpdate(v.id, e)} style={{ display: 'flex', gap: '10px' }}>
                            <input name="english" className="input" defaultValue={v.english} style={{ flex: 1 }} required />
                            <input name="german" className="input" defaultValue={v.german} style={{ flex: 1 }} required />
                            <button type="submit" className="btn btn-success">Sichern</button>
                            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>Abbrechen</button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td style={{ padding: '12px' }}>{v.english}</td>
                          <td style={{ padding: '12px' }}>{v.german}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ color: `var(--stage-${v.stage})`, fontWeight: 'bold' }}>{v.stage}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingId(v.id)} title="Bearbeiten">✏️</button>
                            <button className="btn btn-ghost" onClick={() => onDelete(v.id)} title="Löschen">🗑️</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {vocabs.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Noch keine Vokabeln in diesem Notizbuch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
