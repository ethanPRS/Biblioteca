import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// Get all loan requests
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        id_lista_espera as id, 
        id_libro as bookId, 
        id_usuario as userId, 
        fecha_registro as requestDate, 
        estatus as status 
      FROM LISTA_ESPERA 
      ORDER BY fecha_registro DESC
    `).all();
    
    res.json(rows.map(r => ({
      ...r,
      id: String(r.id),
      userId: String(r.userId)
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new loan request
router.post('/', (req, res) => {
  const { bookId, userId, requestDate, status } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO LISTA_ESPERA (id_usuario, id_libro, fecha_registro, estatus)
      VALUES (?, ?, ?, ?)
    `).run(userId, bookId, requestDate, status || 'Pendiente');

    res.status(201).json({ 
      id: String(result.lastInsertRowid), 
      bookId, 
      userId, 
      requestDate, 
      status: status || 'Pendiente' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a loan request (e.g. approve or reject)
router.put('/:id', (req, res) => {
  const { status } = req.body;
  try {
    if (status) {
      db.prepare(`UPDATE LISTA_ESPERA SET estatus = ? WHERE id_lista_espera = ?`).run(status, req.params.id);
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
