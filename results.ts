import express from 'express';
import db from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get results for a student
router.get('/my', authenticate, (req: AuthRequest, res) => {
  try {
    const attempts = db.prepare(`
      SELECT a.*, e.title as exam_title, e.min_score, e.type as exam_type
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.student_id = ?
      ORDER BY a.completed_at DESC
    `).all(req.user!.id);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all results (Admin only)
router.get('/all', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const attempts = db.prepare(`
      SELECT a.*, e.title as exam_title, e.type as exam_type, u.name as student_name, u.email as student_email
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN users u ON a.student_id = u.id
      ORDER BY a.completed_at DESC
    `).all();
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get detailed result
router.get('/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const attempt = db.prepare(`
      SELECT a.*, e.title as exam_title, e.min_score, e.type as exam_type
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.id = ? AND (a.student_id = ? OR ? = 'admin')
    `).get(req.params.id, req.user!.id, req.user!.role);

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    const answers = db.prepare(`
      SELECT a.*, q.text as question_text, q.type as question_type, q.points as max_points
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.attempt_id = ?
    `).all(req.params.id);

    res.json({ ...attempt, answers });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
