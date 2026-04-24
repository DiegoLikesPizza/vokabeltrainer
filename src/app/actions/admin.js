'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

export async function generateKeyAction() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error("Unauthorized");
  
  const key = 'VOK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const id = crypto.randomUUID();
  
  db.prepare("INSERT INTO access_keys (id, key_val) VALUES (?, ?)").run(id, key);
  revalidatePath('/admin');
  return key;
}

export async function getAccessKeys() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error("Unauthorized");
  return db.prepare("SELECT * FROM access_keys ORDER BY createdAt DESC").all();
}
