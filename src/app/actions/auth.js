'use server';

import db from '@/lib/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createSession, clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData) {
  const username = formData.get('username');
  const password = formData.get('password');
  
  if (!username || !password) return { error: 'Bitte füllen Sie alle Felder aus.' };
  
  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return { error: 'Ungültiger Benutzername oder Passwort' };
    }
    
    await createSession({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    return { error: 'Serverfehler.' };
  }
  
  redirect('/dashboard');
}

export async function registerAction(formData) {
  const username = formData.get('username');
  const password = formData.get('password');
  const accessKey = formData.get('access_key');
  
  if (!username || !password || !accessKey) {
    return { error: 'Bitte füllen Sie alle Felder aus.' };
  }
  
  try {
    const keyRecord = db.prepare("SELECT * FROM access_keys WHERE key_val = ? AND used_by_user_id IS NULL").get(accessKey);
    if (!keyRecord) {
      return { error: 'Ungültiger oder bereits benutzter Zugangscode.' };
    }
    
    const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (exists) {
      return { error: 'Benutzername ist bereits vergeben.' };
    }
    
    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync(password, 10);
    
    db.transaction(() => {
      db.prepare("INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)").run(id, username, hash, 'USER');
      db.prepare("UPDATE access_keys SET used_by_user_id = ? WHERE key_val = ?").run(id, accessKey);
    })();
    
    await createSession({ id, username, role: 'USER' });
  } catch (error) {
    return { error: 'Serverfehler.' };
  }
  
  redirect('/dashboard');
}

export async function logoutAction() {
  await clearSession();
  redirect('/');
}
