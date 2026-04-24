'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function getGlobalStats() {
  const session = await getSession();
  if (!session) return null;
  
  const stats = db.prepare(`
    SELECT 
      IFNULL(SUM(v.correct_count), 0) as totalCorrect,
      IFNULL(SUM(v.wrong_count), 0) as totalWrong,
      COUNT(v.id) as totalVocabs,
      COUNT(CASE WHEN v.stage = 7 THEN 1 END) as masteredCount
    FROM notebooks n
    LEFT JOIN vocabs v ON v.notebook_id = n.id
    WHERE n.user_id = ?
  `).get(session.id);
  
  const stageStats = db.prepare(`
    SELECT v.stage, COUNT(v.id) as count
    FROM notebooks n
    JOIN vocabs v ON v.notebook_id = n.id
    WHERE n.user_id = ?
    GROUP BY v.stage
  `).all(session.id);

  return { ...stats, stageDistribution: stageStats };
}
