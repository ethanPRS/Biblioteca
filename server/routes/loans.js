import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET all loans
router.get('/', async (req, res) => {
  try {
    const { data: prestamos, error } = await supabase
      .from('prestamo')
      .select(`id_prestamo, id_usuario, id_ejemplar, fecha_prestamo, fecha_vencimiento, estatus,
        ejemplar ( id_libro ),
        multa ( id_multa, estatus_pago, monto, tipo )`);
    if (error) throw error;

    const loans = prestamos.map(p => ({
      id: String(p.id_prestamo),
      bookId: p.ejemplar?.id_libro,
      userId: String(p.id_usuario),
      borrowDate: p.fecha_prestamo,
      dueDate: p.fecha_vencimiento,
      status: p.estatus,
      loanCopyId: p.id_ejemplar,
      finePaid: p.multa?.some(m => m.estatus_pago === 'Pagada') ?? false,
      fines: p.multa || [],
    }));
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create loan
router.post('/', async (req, res) => {
  const { bookId, userId, borrowDate, dueDate, status, loanCopyId } = req.body;
  try {
    let exemplarId = loanCopyId;
    if (!exemplarId) {
      const { data: exemplar } = await supabase
        .from('ejemplar').select('id_ejemplar').eq('id_libro', bookId).eq('estatus', 'Disponible').limit(1).single();
      if (!exemplar) return res.status(400).json({ error: 'No hay ejemplares disponibles' });
      exemplarId = exemplar.id_ejemplar;
    }
    await supabase.from('ejemplar').update({ estatus: 'Prestado' }).eq('id_ejemplar', exemplarId);
    const { data: loan, error } = await supabase
      .from('prestamo')
      .insert({ id_usuario: userId, id_ejemplar: exemplarId, fecha_prestamo: borrowDate, fecha_vencimiento: dueDate, estatus: status || 'Activo' })
      .select().single();
    if (error) throw error;
    res.status(201).json({ id: String(loan.id_prestamo), bookId, userId, borrowDate, dueDate, status: status || 'Activo', finePaid: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update loan
router.put('/:id', async (req, res) => {
  const { status, finePaid, returnDate, condition, notes } = req.body;
  const loanId = req.params.id;
  try {
    // For returns: update ejemplar and insert devolucion BEFORE updating prestamo status,
    // so that when SSE fires for the prestamo change the exemplar is already Disponible.
    if (status === 'Devuelto') {
      const { data: loan } = await supabase.from('prestamo')
        .select(`
          id_ejemplar, 
          id_usuario, 
          ejemplar (
            id_libro,
            libro ( precio )
          )
        `)
        .eq('id_prestamo', loanId)
        .single();

      if (loan) {
        const estatusEjemplar = condition === 'Se perdio' ? 'Perdido' : 'Disponible';
        await supabase.from('ejemplar').update({ estatus: estatusEjemplar }).eq('id_ejemplar', loan.id_ejemplar);
        await supabase.from('devolucion').insert({
          id_prestamo: loanId,
          fecha_devolucion: returnDate || new Date().toISOString().split('T')[0],
          condicion_entrega: condition || 'Buen Estado',
          observaciones: notes || '',
        });

        if (condition === 'Mal Estado' || condition === 'Se perdio') {
          // libro might be an object or an array depending on foreign key
          const libroObj = Array.isArray(loan.ejemplar?.libro) ? loan.ejemplar.libro[0] : loan.ejemplar?.libro;
          const precio = libroObj?.precio || 0;
          const { data: config } = await supabase.from('configuracion_multas').select('porcentaje_dano, porcentaje_perdida').single();
          const pDano = config ? parseFloat(config.porcentaje_dano) : 0.5;
          const pPerdida = config ? parseFloat(config.porcentaje_perdida) : 1.0;

          const porcentaje = condition === 'Se perdio' ? pPerdida : pDano;
          const montoMulta = precio * porcentaje;

          if (montoMulta > 0) {
            await supabase.from('multa').insert({
              id_usuario: loan.id_usuario,
              id_prestamo: loanId,
              tipo: condition === 'Se perdio' ? 'Pérdida' : 'Daño',
              monto: montoMulta,
              dias_retraso: 0,
              estatus_pago: 'Pendiente',
              fecha_generacion: new Date().toISOString().split('T')[0],
            });
          }
        }
      }
    }

    if (status) await supabase.from('prestamo').update({ estatus: status }).eq('id_prestamo', loanId);

    if (finePaid === true) {
      const { data: existing } = await supabase.from('multa').select('id_multa').eq('id_prestamo', loanId).single();
      if (existing) {
        await supabase.from('multa').update({ estatus_pago: 'Pagada' }).eq('id_prestamo', loanId);
      } else {
        const { data: loan } = await supabase.from('prestamo').select('id_usuario').eq('id_prestamo', loanId).single();
        if (loan) {
          await supabase.from('multa').insert({
            id_usuario: loan.id_usuario, id_prestamo: loanId, tipo: 'Retraso',
            monto: 0, dias_retraso: 0, estatus_pago: 'Pagada',
            fecha_generacion: new Date().toISOString().split('T')[0],
          });
        }
      }
    }
    res.json({ id: loanId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE loan
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('prestamo').delete().eq('id_prestamo', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
