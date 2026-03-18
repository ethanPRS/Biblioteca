import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// GET all fines — enriched with loan + user + book info
router.get('/', (req, res) => {
  try {
    const fines = db.prepare(`
      SELECT 
        M.id_multa as id,
        M.id_usuario as userId,
        M.id_prestamo as loanId,
        M.tipo as type,
        M.monto as amount,
        M.dias_retraso as daysOverdue,
        M.estatus_pago as paymentStatus,
        M.fecha_generacion as createdAt,
        P.fecha_prestamo as borrowDate,
        P.fecha_vencimiento as dueDate,
        P.estatus as loanStatus,
        E.id_libro as bookId
      FROM MULTA M
      LEFT JOIN PRESTAMO P ON M.id_prestamo = P.id_prestamo
      LEFT JOIN EJEMPLAR E ON P.id_ejemplar = E.id_ejemplar
      ORDER BY M.fecha_generacion DESC
    `).all();
    res.json(fines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST generate fines for all overdue active loans (call periodically)
router.post('/generate', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find overdue loans without a pending/paid fine
    const overdueLoans = db.prepare(`
      SELECT P.id_prestamo, P.id_usuario, P.fecha_vencimiento,
             CAST((julianday('now') - julianday(P.fecha_vencimiento)) AS INTEGER) as dias_retraso,
             L.costo_multa_base
      FROM PRESTAMO P
      JOIN EJEMPLAR E ON P.id_ejemplar = E.id_ejemplar
      JOIN LIBRO L ON E.id_libro = L.id_libro
      WHERE P.estatus = 'Activo'
        AND P.fecha_vencimiento < date('now')
        AND P.id_prestamo NOT IN (SELECT id_prestamo FROM MULTA WHERE id_prestamo IS NOT NULL)
    `).all();

    const insertFine = db.prepare(`
      INSERT INTO MULTA (id_usuario, id_prestamo, tipo, monto, dias_retraso, estatus_pago, fecha_generacion)
      VALUES (?, ?, 'Retraso', ?, ?, 'Pendiente', ?)
    `);

    let created = 0;
    const insertMany = db.transaction((loans) => {
      for (const loan of loans) {
        const monto = loan.dias_retraso * (loan.costo_multa_base || 10);
        insertFine.run(loan.id_usuario, loan.id_prestamo, monto, loan.dias_retraso, today);
        created++;
      }
    });
    insertMany(overdueLoans);

    res.json({ message: `${created} multas generadas`, count: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT pay / forgive a fine
router.put('/:id', (req, res) => {
  const { paymentStatus } = req.body; // 'Pagada' | 'Condonada'
  try {
    db.prepare(`
      UPDATE MULTA SET estatus_pago = ? WHERE id_multa = ?
    `).run(paymentStatus, req.params.id);
    res.json({ id: req.params.id, paymentStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a fine (admin only)
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM MULTA WHERE id_multa = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
