import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all scheduled exams (Admin sees all, Student sees theirs)
router.get('/', authenticate, (req: AuthRequest, res) => {
  try {
    if (req.user!.role === 'admin') {
      const schedules = db.prepare(`
        SELECT s.*, e.title as exam_title, u.name as student_name, u.email as student_email
        FROM scheduled_exams s
        JOIN exams e ON s.exam_id = e.id
        JOIN users u ON s.student_id = u.id
        ORDER BY s.scheduled_date DESC
      `).all();
      res.json(schedules);
    } else {
      const schedules = db.prepare(`
        SELECT s.*, e.title as exam_title, e.description as exam_description, e.time_limit
        FROM scheduled_exams s
        JOIN exams e ON s.exam_id = e.id
        WHERE s.student_id = ?
        ORDER BY s.scheduled_date ASC
      `).all(req.user!.id);
      res.json(schedules);
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Schedule an exam for a student (Admin only)
router.post('/', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { exam_id, student_id, scheduled_date } = req.body;
  const id = uuidv4();

  try {
    // Check if exam exists and is not a practice exam
    const exam = db.prepare('SELECT id, type FROM exams WHERE id = ?').get(exam_id) as any;
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (exam.type === 'practice') return res.status(400).json({ error: 'Cannot schedule practice exams' });

    // Check if student exists
    const student = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(student_id, 'student');
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Check if there is already a pending or failed_once schedule for this exam, student, and date
    const existingSchedule = db.prepare(`
      SELECT id FROM scheduled_exams 
      WHERE exam_id = ? AND student_id = ? AND scheduled_date = ? AND status IN ('pending', 'failed_once')
    `).get(exam_id, student_id, scheduled_date);

    if (existingSchedule) {
      return res.status(400).json({ error: 'El estudiante ya tiene este examen programado para esta fecha.' });
    }

    const stmt = db.prepare('INSERT INTO scheduled_exams (id, exam_id, student_id, scheduled_date, created_by) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, exam_id, student_id, scheduled_date, req.user!.id);
    
    res.status(201).json({ id, message: 'Exam scheduled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a scheduled exam (Admin only)
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const stmt = db.prepare('DELETE FROM scheduled_exams WHERE id = ?');
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Scheduled exam not found' });
    }
    res.json({ message: 'Scheduled exam deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
