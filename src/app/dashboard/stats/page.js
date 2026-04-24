import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getGlobalStats } from '@/app/actions/stats';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const stats = await getGlobalStats();

  const totalHits = stats.totalCorrect + stats.totalWrong;
  const rate = totalHits > 0 ? Math.round((stats.totalCorrect / totalHits) * 100) : 0;

  return (
    <section className="screen active" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <header className="top-bar">
        <div className="top-bar-left">
          <Link href="/dashboard" className="btn btn-ghost" style={{textDecoration: 'none'}}>← Zurück</Link>
          <h2 style={{ marginLeft: '15px' }}>Erweiterte Statistik</h2>
        </div>
        <div className="top-bar-right">
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
            <span className="stat-label">Gesamt Vokabeln</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalCorrect}</span>
            <span className="stat-label">Gesamt Richtig</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.totalWrong}</span>
            <span className="stat-label">Gesamt Falsch</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{rate}%</span>
            <span className="stat-label">Globale Trefferquote</span>
          </div>
        </div>

        <div className="stages-overview" style={{ marginTop: '40px' }}>
          <h3>Globale Verteilung in den Fächern</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Zeigt an, wie viele deiner Vokabeln sich in welchem Karteikasten-Fach befinden.</p>
          
          <div className="stages-grid">
            {Array.from({ length: 7 }, (_, i) => {
              const stage = i + 1;
              const match = stats.stageDistribution.find(s => s.stage === stage);
              const count = match ? match.count : 0;
              return (
                <div key={stage} className={`stage-card ${count > 0 ? '' : 'empty'}`}>
                  <h4>Fach {stage}</h4>
                  <div className="stage-count">{count} Karten</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
