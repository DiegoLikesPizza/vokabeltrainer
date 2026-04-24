'use client';
import { useTransition } from 'react';

export default function AdminPageClient({ keys, generateKeyAction, logoutAction }) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      await generateKeyAction();
    });
  };

  return (
    <section className="screen active" style={{ display: 'flex', alignItems: 'flex-start', overflowY: 'auto' }}>
      <div className="dashboard-body" style={{ width: '100%', maxWidth: '800px', padding: '20px', margin: '0 auto' }}>
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="logo-small">🛡️</span>
            <h2>Admin Dashboard</h2>
          </div>
          <div className="top-bar-right">
            <form action={logoutAction}>
              <button className="btn btn-ghost" type="submit">Logout</button>
            </form>
          </div>
        </header>

        <div className="stages-overview" style={{ marginTop: '30px', textAlign: 'left' }}>
          <h3>Access Keys verwalten</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Erstelle Zugangscodes, damit sich neue Benutzer registrieren können.</p>
          
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isPending}>
            {isPending ? 'Wird erstellt...' : '➕ Neuen Code generieren'}
          </button>

          <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px' }}>Code</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace' }}>{k.key_val}</td>
                  <td style={{ padding: '10px' }}>
                    {k.used_by_user_id ? '🔴 Benutzt' : '🟢 Frei'}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                    {new Date(k.createdAt).toLocaleString('de-DE')}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Keine Codes gefunden.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
