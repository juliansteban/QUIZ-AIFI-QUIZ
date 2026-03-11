import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'eduplatform.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'exam' CHECK(type IN ('exam', 'practice')),
    min_score INTEGER NOT NULL DEFAULT 60,
    time_limit INTEGER, -- in minutes
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reinforcement_materials (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('video', 'audio', 'pdf', 'exercise')),
    url TEXT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scheduled_exams (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'missed', 'failed_once', 'failed_final')),
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    score INTEGER,
    passed BOOLEAN,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );
`);

// Migration for scheduled_exams table to support new statuses
try {
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='scheduled_exams'").get() as any;
  if (tableInfo && !tableInfo.sql.includes('failed_once')) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_exams_new (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        scheduled_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'missed', 'failed_once', 'failed_final')),
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    db.exec(`
      INSERT OR IGNORE INTO scheduled_exams_new (id, exam_id, student_id, scheduled_date, status, created_by, created_at)
      SELECT id, exam_id, student_id, scheduled_date, status, created_by, created_at FROM scheduled_exams;
    `);
    db.exec(`DROP TABLE scheduled_exams;`);
    db.exec(`ALTER TABLE scheduled_exams_new RENAME TO scheduled_exams;`);
  }
} catch (error) {
  console.error("Migration error for scheduled_exams:", error);
}

// Migration for exams table to support 'type'
try {
  db.exec(`ALTER TABLE exams ADD COLUMN type TEXT NOT NULL DEFAULT 'exam' CHECK(type IN ('exam', 'practice'))`);
} catch (error) {
  // Column might already exist
}

// Migration for questions table to support 'text' media_type and 'info' type
try {
  // Check if the old table exists and has the old check constraints
  // We'll just create a new table, copy data, and replace the old one
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions_new (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('multiple_choice', 'true_false', 'fill_blanks', 'open', 'match', 'order', 'oral', 'info')),
      text TEXT NOT NULL,
      media_url TEXT,
      media_type TEXT CHECK(media_type IN ('image', 'audio', 'video', 'text')),
      points INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL,
      options TEXT,
      correct_answer TEXT,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );
  `);

  // Check if the old questions table exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'").get();
  
  if (tableExists) {
    db.transaction(() => {
      // Disable foreign keys temporarily to allow dropping/renaming tables
      db.pragma('foreign_keys = OFF');
      
      // Copy data from old to new
      db.exec(`
        INSERT OR IGNORE INTO questions_new (id, exam_id, type, text, media_url, media_type, points, order_index, options, correct_answer)
        SELECT id, exam_id, type, text, media_url, media_type, points, order_index, options, correct_answer FROM questions;
      `);
      
      // Drop old table
      db.exec(`DROP TABLE questions;`);

      // Rename new table to questions
      db.exec(`ALTER TABLE questions_new RENAME TO questions;`);
      
      // Re-enable foreign keys
      db.pragma('foreign_keys = ON');
    })();
  }
} catch (error) {
  console.error("Migration error (might be already migrated):", error);
}

// Ensure answers table exists (depends on questions)
db.exec(`
  CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_text TEXT, -- For text answers
    answer_media_url TEXT, -- For oral recordings
    is_correct BOOLEAN,
    points_awarded INTEGER,
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  );
`);

export default db;
