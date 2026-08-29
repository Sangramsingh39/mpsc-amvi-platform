import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'amvi_tests.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL, -- Easy, Easy-Moderate, Moderate, Moderate-Hard, Hard, Exam-Level, Advanced
      duration_minutes INTEGER DEFAULT 45,
      total_questions INTEGER DEFAULT 45,
      positive_marks REAL DEFAULT 1.0,
      negative_marks REAL DEFAULT 0.25,
      is_published INTEGER DEFAULT 1,
      category TEXT DEFAULT 'General',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      question_no INTEGER NOT NULL,
      section TEXT NOT NULL, -- POLITY_ECONOMICS_SCIENCE, GENERAL_AMVI_CURRENT
      subject TEXT NOT NULL, -- Polity, Economics, Science, History, Geography, Maharashtra, Reasoning, Current Affairs, Automobile, Mechanical, Motor Vehicle Laws
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question_en TEXT NOT NULL,
      question_mr TEXT,
      option_a_en TEXT NOT NULL,
      option_a_mr TEXT,
      option_b_en TEXT NOT NULL,
      option_b_mr TEXT,
      option_c_en TEXT NOT NULL,
      option_c_mr TEXT,
      option_d_en TEXT NOT NULL,
      option_d_mr TEXT,
      correct_answer TEXT NOT NULL, -- A, B, C, D
      explanation_en TEXT NOT NULL,
      explanation_mr TEXT,
      source TEXT DEFAULT 'Official MPSC / Govt Reference',
      source_url TEXT,
      current_affair INTEGER DEFAULT 0,
      current_affair_date TEXT,
      FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      user_id TEXT DEFAULT 'student_1',
      score REAL NOT NULL,
      total_marks REAL NOT NULL,
      percentage REAL NOT NULL,
      correct_count INTEGER NOT NULL,
      wrong_count INTEGER NOT NULL,
      unattempted_count INTEGER NOT NULL,
      time_spent_seconds INTEGER NOT NULL,
      user_answers TEXT NOT NULL, -- JSON string of { question_id: answer }
      section_breakdown TEXT NOT NULL, -- JSON string of subject scores
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Default Settings
    INSERT OR IGNORE INTO settings (key, value) VALUES ('default_negative_marking', '0.25');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('default_test_duration', '45');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('enable_marathi', 'true');
  `);
}

initDB();

export default db;
