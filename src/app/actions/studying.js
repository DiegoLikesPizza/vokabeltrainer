'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getUserNotebooks() {
  const session = await getSession();
  if (!session) redirect('/');
  
  const notebooks = db.prepare("SELECT * FROM notebooks WHERE user_id = ? ORDER BY createdAt DESC").all(session.id);
  
  for (const nb of notebooks) {
    const counts = db.prepare("SELECT COUNT(*) as c FROM vocabs WHERE notebook_id = ?").get(nb.id);
    nb.vocabCount = counts.c;
  }
  return notebooks;
}

export async function createNotebook(formData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  const name = formData.get('name');
  if (!name) return { error: "Ungültiger Name" };

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO notebooks (id, user_id, name) VALUES (?, ?, ?)").run(id, session.id, name);
  revalidatePath('/dashboard');
  
  redirect(`/dashboard/notebook/${id}`);
}

export async function deleteNotebook(id) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  db.transaction(() => {
    db.prepare("DELETE FROM vocabs WHERE notebook_id = ?").run(id);
    db.prepare("DELETE FROM notebooks WHERE id = ? AND user_id = ?").run(id, session.id);
  })();
  revalidatePath('/dashboard');
  redirect(`/dashboard`);
}

export async function getVocabs(notebookId) {
  const session = await getSession();
  if (!session) return [];
  return db.prepare(`
    SELECT v.* FROM vocabs v
    JOIN notebooks n ON n.id = v.notebook_id
    WHERE v.notebook_id = ? AND n.user_id = ?
  `).all(notebookId, session.id);
}

export async function importVocabs(notebookId, vocabsJSON) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  try {
    let raw = JSON.parse(vocabsJSON);
    let vocabsToImport = Array.isArray(raw) ? raw : (raw.vocabs || []);
    
    if (vocabsToImport.length === 0) return { error: "Keine Vokabeln gefunden." };

    const insert = db.prepare("INSERT INTO vocabs (id, notebook_id, english, german, stage) VALUES (?, ?, ?, ?, ?)");
    
    db.transaction(() => {
      for (const v of vocabsToImport) {
        const vId = crypto.randomUUID();
        const stage = Math.max(1, Math.min(7, v.stage || 1));
        insert.run(vId, notebookId, (v.English || v.english || ''), (v.German || v.german || ''), stage);
      }
    })();
    
    revalidatePath(`/dashboard/notebook/${notebookId}`);
    return { success: true, count: vocabsToImport.length };
  } catch (error) {
    return { error: "Ungültiges Dateiformat. JSON erwartet." };
  }
}

export async function updateVocabStage(vocabId, newStage, isCorrect) {
  const session = await getSession();
  if (!session) return;
  
  const correctAdd = isCorrect ? 1 : 0;
  const wrongAdd = isCorrect ? 0 : 1;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE vocabs 
    SET stage = ?, correct_count = correct_count + ?, wrong_count = wrong_count + ?, last_practiced = ?
    WHERE id = ?
  `).run(newStage, correctAdd, wrongAdd, now, vocabId);
}
