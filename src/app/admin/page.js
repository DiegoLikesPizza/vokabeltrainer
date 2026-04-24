import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAccessKeys, generateKeyAction } from '@/app/actions/admin';
import { logoutAction } from '@/app/actions/auth';
import AdminPageClient from './AdminPageClient';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/');
  }

  const keys = await getAccessKeys();

  return <AdminPageClient keys={keys} generateKeyAction={generateKeyAction} logoutAction={logoutAction} />;
}
