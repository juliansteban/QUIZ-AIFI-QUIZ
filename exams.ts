import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all exams
router.get('/', authenticate, (req: AuthRequest, res) => {
  try {
    const exams = db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get practice exams
router.get('/practice', authenticate, (req: AuthRequest, res) => {
  try {
    const exams = db.prepare("SELECT * FROM exams WHERE type = 'practice' ORDER BY created_at DESC").all();
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single exam with questions
router.get('/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id) as any;
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (req.user!.role === 'student' && exam.type !== 'practice') {
      // Check if there is a pending or failed_once scheduled exam for today
      const scheduled = db.prepare(`
        SELECT id FROM scheduled_exams 
        WHERE exam_id = ? AND student_id = ? AND status IN ('pending', 'failed_once') AND scheduled_date = date('now', 'localtime')
      `).get(req.params.id, req.user!.id);

      if (!scheduled) {
        return res.status(403).json({ error: 'No tienes este examen programado para hoy o ya agotaste tus intentos.' });
      }
    }

    const questions = db.prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY order_index ASC').all(req.params.id);
    res.json({ ...exam, questions });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create exam (Admin only)
router.post('/', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { title, description, type, min_score, time_limit, questions, reinforcements } = req.body;
  const examId = uuidv4();
  const examType = type || 'exam';

  const insertExam = db.prepare('INSERT INTO exams (id, title, description, type, min_score, time_limit, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertQuestion = db.prepare(`
    INSERT INTO questions (id, exam_id, type, text, media_url, media_type, points, order_index, options, correct_answer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReinforcement = db.prepare(`
    INSERT INTO reinforcement_materials (id, exam_id, title, description, type, url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertExam.run(examId, title, description, examType, min_score, time_limit, req.user!.id);
    
    if (questions && Array.isArray(questions)) {
      questions.forEach((q: any, index: number) => {
        insertQuestion.run(
          uuidv4(),
          examId,
          q.type,
          q.text,
          q.media_url || null,
          q.media_type || null,
          q.points || 1,
          index,
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer ? JSON.stringify(q.correct_answer) : null
        );
      });
    }

    if (reinforcements && Array.isArray(reinforcements)) {
      reinforcements.forEach((r: any) => {
        insertReinforcement.run(
          uuidv4(),
          examId,
          r.title,
          r.description || null,
          r.type,
          r.url
        );
      });
    }
  });

  try {
    transaction();
    res.status(201).json({ id: examId, message: 'Exam created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Submit exam attempt
router.post('/:id/submit', authenticate, (req: AuthRequest, res) => {
  const { answers } = req.body; // Array of { question_id, answer_text, answer_media_url }
  const examId = req.params.id;
  const attemptId = uuidv4();
  
  try {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId) as any;
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const questions = db.prepare('SELECT * FROM questions WHERE exam_id = ?').all(examId) as any[];
    
    let totalScore = 0;
    const processedAnswers = answers.map((ans: any) => {
      const question = questions.find(q => q.id === ans.question_id);
      let isCorrect = false;
      let pointsAwarded = 0;

      if (question) {
        if (question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'fill_blanks') {
          // Auto-grade
          const correct = JSON.parse(question.correct_answer);
          if (ans.answer_text === correct) {
            isCorrect = true;
            pointsAwarded = question.points;
            totalScore += pointsAwarded;
          }
        }
        // For open, oral, match, order - might need manual grading or more complex logic
        // We'll leave pointsAwarded = 0 for manual grading types for now
      }

      return {
        id: uuidv4(),
        attempt_id: attemptId,
        question_id: ans.question_id,
        answer_text: ans.answer_text || null,
        answer_media_url: ans.answer_media_url || null,
        is_correct: isCorrect,
        points_awarded: pointsAwarded
      };
    });

    const passed = totalScore >= exam.min_score;

    const insertAttempt = db.prepare('INSERT INTO attempts (id, exam_id, student_id, score, passed, completed_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    const insertAnswer = db.prepare('INSERT INTO answers (id, attempt_id, question_id, answer_text, answer_media_url, is_correct, points_awarded) VALUES (?, ?, ?, ?, ?, ?, ?)');

    let scheduledId: string | null = null;
    let currentStatus: string | null = null;
    if (req.user!.role === 'student' && exam.type !== 'practice') {
      const scheduled = db.prepare(`
        SELECT id, status FROM scheduled_exams 
        WHERE exam_id = ? AND student_id = ? AND status IN ('pending', 'failed_once') AND scheduled_date = date('now', 'localtime')
      `).get(examId, req.user!.id) as any;

      if (!scheduled) {
        return res.status(403).json({ error: 'No tienes este examen programado para hoy o ya agotaste tus intentos.' });
      }
      scheduledId = scheduled.id;
      currentStatus = scheduled.status;
    }

    const transaction = db.transaction(() => {
      insertAttempt.run(attemptId, examId, req.user!.id, totalScore, passed ? 1 : 0);
      processedAnswers.forEach((ans: any) => {
        insertAnswer.run(ans.id, ans.attempt_id, ans.question_id, ans.answer_text, ans.answer_media_url, ans.is_correct ? 1 : 0, ans.points_awarded);
      });
      if (scheduledId) {
        let newStatus = 'completed';
        if (!passed) {
          newStatus = currentStatus === 'pending' ? 'failed_once' : 'failed_final';
        }
        db.prepare("UPDATE scheduled_exams SET status = ? WHERE id = ?").run(newStatus, scheduledId);
      }
    });

    transaction();
    
    res.json({ 
      message: 'Exam submitted successfully',
      attemptId,
      score: totalScore,
      passed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
