import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getVocabs, updateVocabStage } from '@/app/actions/studying';
import PracticeClient from './PracticeClient';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PracticePage({ params }) {
  const session = await getSession();
  if (!session) redirect('/');

  const { id } = await params;
  
  const nbRecord = db.prepare("SELECT * FROM notebooks WHERE id = ?").get(id);
  if (!nbRecord || nbRecord.user_id !== session.id) redirect('/dashboard');

  const vocabs = await getVocabs(id);

  return (
    <PracticeClient 
      notebook={nbRecord} 
      initialVocabs={vocabs} 
      updateVocabStage={updateVocabStage} 
    />
  );
}
