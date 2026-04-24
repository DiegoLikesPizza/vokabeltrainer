'use client';
import { useTransition, useState } from 'react';
import Link from 'next/link';

export default function DashboardClient({ notebooks, stats, createNotebook, deleteNotebook, logoutAction }) {
  const [isPending, startTransition] = useTransition();
  const [newNbName, setNewNbName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newNbName) return;
    const formData = new FormData();
    formData.append('name', newNbName);
    startTransition(async () => {
      await createNotebook(formData);
      setNewNbName('');
    });
  };

  const handleDelete = (id) => {
    if (!confirm('Dieses Notizbuch löschen? Alle Vokabeln darin gehen verloren!')) return;
    startTransition(async () => {
      await deleteNotebook(id);
    });
  };

  const progressPercent = stats.totalVocabs > 0 
    ? Math.round((stats.totalCorrect / ((stats.totalCorrect + stats.totalWrong) || 1)) * 100) 
    : 0;

  return (
    <section className="screen active" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="logo-small">📚</span>
          <h2>Dein Dashboard</h2>
        </div>
        <div className="top-bar-right">
          <Link href="/dashboard/stats" className="btn btn-ghost" style={{textDecoration: 'none'}}>
            <span>📊</span> Erweiterte Statistik
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-ghost btn-danger" type="submit">
              <span>🚪</span> Logout
            </button>
          </form>
        </div>
      </header>

      <div className="dashboard-body" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        
        <div className="stats-bar" style={{ marginTop: '20px' }}>
          <div className="stat-item">
            <span className="stat-value">{stats.totalVocabs}</span>
            <span className="stat-label">Gesamt-Vokabeln</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.totalCorrect}</span>
            <span className="stat-label">Gemeistert (Hits)</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{progressPercent}%</span>
            <span className="stat-label">Trefferquote</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-md)', marginTop: '30px', border: '1px solid var(--border)' }}>
          <h3>Neues Notizbuch erstellen</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <input 
              type="text" 
              className="answer-input" 
              placeholder="z.B. Lektion 1-5" 
              value={newNbName} 
              onChange={e => setNewNbName(e.target.value)} 
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Erstellt...' : 'Erstellen'}
            </button>
          </form>
        </div>

        <div className="stages-overview" style={{ marginTop: '30px' }}>
          <h3>Deine Notizbücher</h3>
          <div className="stages-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginTop: '15px' }}>
            {notebooks.map(nb => (
              <div key={nb.id} className="stage-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{nb.name}</h4>
                  <div className="stage-count">{nb.vocabCount} Vokabeln</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                  <Link href={`/dashboard/notebook/${nb.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>Öffnen</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(nb.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
          {notebooks.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '15px' }}>Noch keine Notizbücher vorhanden. Erstelle eins, um loszulegen!</p>
          )}
        </div>

      </div>
    </section>
  );
}
