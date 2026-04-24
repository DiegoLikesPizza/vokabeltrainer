import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getVocabs, importVocabs } from '@/app/actions/studying';
import NotebookClient from './NotebookClient';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NotebookPage({ params }) {
  const session = await getSession();
  if (!session) redirect('/');

  const { id } = await params;
  
  const nbRecord = db.prepare("SELECT * FROM notebooks WHERE id = ?").get(id);
  // Ensure notebook exists and belongs to the user
  if (!nbRecord || nbRecord.user_id !== session.id) redirect('/dashboard');

  const vocabs = await getVocabs(id);

  return (
    <NotebookClient 
      notebook={nbRecord} 
      vocabs={vocabs} 
      importVocabs={importVocabs} 
    />
  );
}
