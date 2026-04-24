'use client';

import { useTransition, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function NotebookClient({ notebook, vocabs, importVocabs }) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef(null);
  const toast = useToast();

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

  return (
    <section className="screen active" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <header className="top-bar">
        <div className="top-bar-left">
          <Link href="/dashboard" className="btn btn-ghost" style={{textDecoration: 'none'}}>← Zurück</Link>
          <h2 style={{ marginLeft: '15px' }}>{notebook.name}</h2>
        </div>
        <div className="top-bar-right">
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} hidden />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current.click()} disabled={isPending} title="Akzeptiert Vokabel-JSON oder Profile">
            {isPending ? '⏳ Lädt...' : '📥 Import (JSON/Profil)'}
          </button>
          <button className="btn btn-ghost" onClick={handleExport}>
            💾 Export
          </button>
        </div>
      </header>

      <div className="dashboard-body" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        
        <div className="stages-overview" style={{ marginTop: '20px' }}>
          <h3>Karteikasten-Übersicht</h3>
          <div className="stages-grid">
            {stagesCount.map((count, i) => (
              <div key={i} className={`stage-card ${count > 0 ? '' : 'empty'}`}>
                <h4>Fach {i + 1}</h4>
                <div className="stage-count">{count} Karten</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link href={`/dashboard/notebook/${notebook.id}/practice`} className="btn btn-primary btn-xl" style={{textDecoration: 'none'}}>
            <span className="btn-icon">🎯</span> Training starten
          </Link>
        </div>

      </div>
    </section>
  );
}
