import db from './src/db.js';
import { v4 as uuidv4 } from 'uuid';

async function seedExam() {
  // Get users
  const teacher = db.prepare('SELECT * FROM users WHERE email = ?').get('profesor@eduplatform.com') as any;
  const student = db.prepare('SELECT * FROM users WHERE email = ?').get('estudiante@eduplatform.com') as any;

  if (!teacher || !student) {
    console.error('Usuarios no encontrados. Ejecuta seed.ts primero.');
    return;
  }

  // Create Exam
  const examId = uuidv4();
  db.prepare(`
    INSERT INTO exams (id, title, description, min_score, time_limit, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(examId, 'Examen de Inglés Básico - Nivel A1', 'Evaluación de vocabulario y gramática básica en inglés.', 60, 30, teacher.id);

  // Create Questions
  const q1Id = uuidv4();
  db.prepare(`
    INSERT INTO questions (id, exam_id, type, text, points, order_index, options, correct_answer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(q1Id, examId, 'multiple_choice', '¿Cómo se dice "Manzana" en inglés?', 50, 1, JSON.stringify(['Apple', 'Banana', 'Orange', 'Grape']), 'Apple');

  const q2Id = uuidv4();
  db.prepare(`
    INSERT INTO questions (id, exam_id, type, text, points, order_index, options, correct_answer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(q2Id, examId, 'multiple_choice', 'Elige el verbo correcto: "She ___ playing tennis."', 50, 2, JSON.stringify(['am', 'is', 'are', 'be']), 'is');

  // Create Reinforcement Material
  db.prepare(`
    INSERT INTO reinforcement_materials (id, exam_id, title, description, type, url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), examId, 'Vocabulario Básico: Frutas', 'Repasa los nombres de las frutas en inglés con este video.', 'video', 'https://www.youtube.com/watch?v=ut-NO_0E1zE');

  db.prepare(`
    INSERT INTO reinforcement_materials (id, exam_id, title, description, type, url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), examId, 'Gramática: Verbo To Be', 'Guía en PDF sobre el uso del verbo To Be (am, is, are).', 'pdf', 'https://www.ejemplos.co/verbo-to-be/');

  // Create Failed Attempt
  const attemptId = uuidv4();
  db.prepare(`
    INSERT INTO attempts (id, exam_id, student_id, score, passed, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-1 hour'), datetime('now', '-30 minutes'))
  `).run(attemptId, examId, student.id, 0, 0); // 0 points, failed (0)

  // Create Answers for the attempt (both incorrect)
  db.prepare(`
    INSERT INTO answers (id, attempt_id, question_id, answer_text, is_correct, points_awarded)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), attemptId, q1Id, 'Banana', 0, 0);

  db.prepare(`
    INSERT INTO answers (id, attempt_id, question_id, answer_text, is_correct, points_awarded)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), attemptId, q2Id, 'are', 0, 0);

  console.log('Examen de inglés creado, intento fallido registrado y material de refuerzo añadido.');
}

seedExam().catch(console.error);
