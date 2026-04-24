import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserNotebooks, createNotebook, deleteNotebook } from '@/app/actions/studying';
import { getGlobalStats } from '@/app/actions/stats';
import { logoutAction } from '@/app/actions/auth';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role === 'ADMIN') redirect('/admin');

  const notebooks = await getUserNotebooks();
  const stats = await getGlobalStats();

  return (
    <DashboardClient 
      notebooks={notebooks} 
      stats={stats} 
      createNotebook={createNotebook} 
      deleteNotebook={deleteNotebook}
      logoutAction={logoutAction} 
    />
  );
}
