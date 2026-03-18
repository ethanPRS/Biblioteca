import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// Get all audit logs
router.get('/', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.nombre, u.matricula_nomina as username
      FROM AUDITORIA a 
      LEFT JOIN USUARIO u ON a.id_usuario = u.id_usuario 
      ORDER BY a.fecha DESC 
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create an audit log
router.post('/', (req, res) => {
  const { userId, action, type } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO AUDITORIA (id_usuario, accion, tipo, fecha) VALUES (?, ?, ?, ?)');
    const info = stmt.run(userId, action, type, new Date().toISOString());
    res.status(201).json({ id: info.lastInsertRowid, userId, action, type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
