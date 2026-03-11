import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get reinforcement materials for a specific exam
router.get('/:examId', authenticate, (req: AuthRequest, res) => {
  try {
    // Check if student failed this exam
    const failedAttempt = db.prepare(`
      SELECT * FROM attempts 
      WHERE student_id = ? AND exam_id = ? AND passed = 0
      ORDER BY completed_at DESC LIMIT 1
    `).get(req.user!.id, req.params.examId);

    if (!failedAttempt && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You have not failed this exam or are not authorized.' });
    }

    const materials = db.prepare('SELECT * FROM reinforcement_materials WHERE exam_id = ?').all(req.params.examId);
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Add reinforcement material (Admin only)
router.post('/', authenticate, requireAdmin, (req: AuthRequest, res) => {
  const { exam_id, title, description, type, url } = req.body;
  const id = uuidv4();

  try {
    const stmt = db.prepare('INSERT INTO reinforcement_materials (id, exam_id, title, description, type, url) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, exam_id, title, description, type, url);
    res.status(201).json({ id, message: 'Material added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
