import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'vokabel.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS access_keys (
    id TEXT PRIMARY KEY,
    key_val TEXT UNIQUE NOT NULL,
    used_by_user_id TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(used_by_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notebooks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS vocabs (
    id TEXT PRIMARY KEY,
    notebook_id TEXT NOT NULL,
    english TEXT NOT NULL,
    german TEXT NOT NULL,
    stage INTEGER DEFAULT 1,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    last_practiced DATETIME,
    FOREIGN KEY(notebook_id) REFERENCES notebooks(id)
  );
`);

// Create default admin if not exists
const adminCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'ADMIN'").get();
if (adminCount.count === 0) {
  const hash = bcrypt.hashSync('admin', 10);
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)").run(id, 'admin', hash, 'ADMIN');
}

export default db;
