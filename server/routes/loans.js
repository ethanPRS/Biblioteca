import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// Helper: map DB row → Loan shape
const mapLoan = (row) => ({
  id: String(row.id_prestamo),
  bookId: row.id_libro,
  userId: String(row.id_usuario),
  borrowDate: row.fecha_prestamo,
  dueDate: row.fecha_vencimiento,
  status: row.estatus,
  loanCopyId: row.id_ejemplar,
  finePaid: row.finePaid === 1 || row.finePaid === true,
});

// GET all loans (joined with EJEMPLAR to get id_libro)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        P.id_prestamo,
        P.id_usuario,
        P.id_ejemplar,
        E.id_libro,
        P.fecha_prestamo,
        P.fecha_vencimiento,
        P.estatus,
        CASE WHEN M.id_multa IS NOT NULL AND M.estatus_pago = 'Pagada' THEN 1 ELSE 0 END as finePaid
      FROM PRESTAMO P
      JOIN EJEMPLAR E ON P.id_ejemplar = E.id_ejemplar
      LEFT JOIN MULTA M ON M.id_prestamo = P.id_prestamo
      GROUP BY P.id_prestamo
    `).all();
    res.json(rows.map(mapLoan));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create loan
router.post('/', (req, res) => {
  const { bookId, userId, borrowDate, dueDate, status, loanCopyId } = req.body;
  try {
    // If loanCopyId is provided use it; otherwise find an available exemplar for the book
    let exemplarId = loanCopyId;
    if (!exemplarId) {
      const exemplar = db.prepare(`
        SELECT id_ejemplar FROM EJEMPLAR 
        WHERE id_libro = ? AND estatus = 'Disponible' LIMIT 1
      `).get(bookId);
      if (!exemplar) return res.status(400).json({ error: 'No hay ejemplares disponibles para este libro' });
      exemplarId = exemplar.id_ejemplar;
    }
    // Mark exemplar as Prestado
    db.prepare(`UPDATE EJEMPLAR SET estatus = 'Prestado' WHERE id_ejemplar = ?`).run(exemplarId);

    const result = db.prepare(`
      INSERT INTO PRESTAMO (id_usuario, id_ejemplar, fecha_prestamo, fecha_vencimiento, estatus)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, exemplarId, borrowDate, dueDate, status || 'Activo');

    res.status(201).json({ id: String(result.lastInsertRowid), bookId, userId, borrowDate, dueDate, status: status || 'Activo', finePaid: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update loan (status, finePaid)
router.put('/:id', (req, res) => {
  const { status, finePaid, returnDate, condition, notes } = req.body;
  try {
    if (status) {
      db.prepare(`UPDATE PRESTAMO SET estatus = ? WHERE id_prestamo = ?`).run(status, req.params.id);
    }

    // If returning loan, mark exemplar available and insert DEVOLUCION
    if (status === 'Devuelto') {
      const loan = db.prepare(`SELECT id_ejemplar FROM PRESTAMO WHERE id_prestamo = ?`).get(req.params.id);
      if (loan) {
        db.prepare(`UPDATE EJEMPLAR SET estatus = 'Disponible' WHERE id_ejemplar = ?`).run(loan.id_ejemplar);
        db.prepare(`
          INSERT INTO DEVOLUCION (id_prestamo, fecha_devolucion, condicion_entrega, observaciones)
          VALUES (?, ?, ?, ?)
        `).run(req.params.id, returnDate || new Date().toISOString().split('T')[0], condition || 'Buena', notes || '');
      }
    }

    // Handle fine payment
    if (finePaid === true) {
      const existing = db.prepare(`SELECT id_multa FROM MULTA WHERE id_prestamo = ?`).get(req.params.id);
      if (existing) {
        db.prepare(`UPDATE MULTA SET estatus_pago = 'Pagada' WHERE id_prestamo = ?`).run(req.params.id);
      } else {
        db.prepare(`
          INSERT INTO MULTA (id_usuario, id_prestamo, tipo, monto, dias_retraso, estatus_pago, fecha_generacion)
          SELECT P.id_usuario, P.id_prestamo, 'Retraso', 0, 0, 'Pagada', date('now')
          FROM PRESTAMO P WHERE P.id_prestamo = ?
        `).run(req.params.id);
      }
    }

    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE loan
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM PRESTAMO WHERE id_prestamo = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
