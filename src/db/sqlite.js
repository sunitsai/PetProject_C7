import path from 'path'
import { fileURLToPath } from 'url'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbFile = process.env.DB_FILE || path.join(__dirname, '../../data/petproject.sqlite')

let DB

export async function initDb () {
  DB = await open({ filename: dbFile, driver: sqlite3.Database })
  await DB.exec('PRAGMA foreign_keys = ON;')
  // Users table
  await DB.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`)
  // Pets table (owned by user)
  await DB.exec(`CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    age INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`)
  return DB
}

export function getDb () {
  if (!DB) throw new Error('DB not initialized. Call initDb() first.')
  return DB
}
