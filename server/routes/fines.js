import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET all fines
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('multa')
      .select(`id_multa, id_usuario, id_prestamo, tipo, monto, dias_retraso, estatus_pago, fecha_generacion,
        prestamo ( fecha_prestamo, fecha_vencimiento, estatus, ejemplar ( id_libro, libro ( costo_multa_base ) ) )`)
      .order('fecha_generacion', { ascending: false });
    if (error) throw error;

    const fines = data.map(m => {
      let finalAmount = m.monto;
      let finalDaysOverdue = m.dias_retraso;

      // If the loan is still active and it's a delay fine, dynamically calculate the current fine
      if (m.tipo === 'Retraso' && m.estatus_pago === 'Pendiente' && m.prestamo?.estatus === 'Activo') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Correct timezone issue for due date string parsing
        const [year, month, day] = m.prestamo.fecha_vencimiento.split('T')[0].split('-');
        const dueDate = new Date(Number(year), Number(month) - 1, Number(day));
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - dueDate.getTime();
        const rawDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const calculatedDaysOverdue = rawDays > 0 ? rawDays + 1 : 0;
        
        if (calculatedDaysOverdue > 0) {
          finalDaysOverdue = calculatedDaysOverdue;
          const baseCost = m.prestamo?.ejemplar?.libro?.costo_multa_base || 10;
          finalAmount = finalDaysOverdue * baseCost;
        }
      }

      return {
        id: m.id_multa,
        userId: m.id_usuario,
        loanId: m.id_prestamo,
        type: m.tipo,
        amount: finalAmount,
        daysOverdue: finalDaysOverdue,
        paymentStatus: m.estatus_pago,
        createdAt: m.fecha_generacion,
        borrowDate: m.prestamo?.fecha_prestamo,
        dueDate: m.prestamo?.fecha_vencimiento,
        loanStatus: m.prestamo?.estatus,
        bookId: m.prestamo?.ejemplar?.id_libro,
      };
    });
    res.json(fines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST generate fines for overdue loans
router.post('/generate', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: finesWithLoans } = await supabase
      .from('multa').select('id_prestamo').not('id_prestamo', 'is', null);
    const loanIdsWithFines = finesWithLoans?.map(f => f.id_prestamo) || [];

    const { data: overdueLoans, error } = await supabase
      .from('prestamo')
      .select('id_prestamo, id_usuario, fecha_vencimiento, ejemplar ( libro ( costo_multa_base ) )')
      .eq('estatus', 'Activo')
      .lt('fecha_vencimiento', today);
    if (error) throw error;

    const toCreate = overdueLoans.filter(l => !loanIdsWithFines.includes(l.id_prestamo));

    if (toCreate.length === 0) return res.json({ message: '0 multas generadas', count: 0 });

    const inserts = toCreate.map(loan => {
      const rawDays = Math.floor((new Date(today) - new Date(loan.fecha_vencimiento)) / 86400000);
      const diasRetraso = rawDays > 0 ? rawDays + 1 : 0;
      const costoBase = loan.ejemplar?.libro?.costo_multa_base || 10;
      return {
        id_usuario: loan.id_usuario, id_prestamo: loan.id_prestamo,
        tipo: 'Retraso', monto: diasRetraso * costoBase,
        dias_retraso: diasRetraso, estatus_pago: 'Pendiente', fecha_generacion: today,
      };
    });

    const { error: insertErr } = await supabase.from('multa').insert(inserts);
    if (insertErr) throw insertErr;

    res.json({ message: `${inserts.length} multas generadas`, count: inserts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT verify and pay a fine (Verificar con Tesoreria)
router.put('/:id/verify', async (req, res) => {
  try {
    // 1. Verificar en tesoreria
    const { data: payment, error: tesoreriaError } = await supabase
      .from('tesoreria')
      .select('estatus_pago')
      .eq('id_multa', req.params.id)
      .eq('estatus_pago', 'Pagado')
      .maybeSingle();

    if (tesoreriaError) throw tesoreriaError;

    if (!payment) {
      return res.status(400).json({ error: 'Pago no encontrado en tesorería' });
    }

    // 2. Si existe, actualizar la tabla multa
    const { error: updateError } = await supabase
      .from('multa')
      .update({ estatus_pago: 'Pagada' })
      .eq('id_multa', req.params.id);

    if (updateError) throw updateError;

    res.json({ id: req.params.id, paymentStatus: 'Pagada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT pay / forgive a fine (Manual override si es necesario)
router.put('/:id', async (req, res) => {
  const { paymentStatus } = req.body;
  try {
    const { error } = await supabase.from('multa').update({ estatus_pago: paymentStatus }).eq('id_multa', req.params.id);
    if (error) throw error;
    res.json({ id: req.params.id, paymentStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a fine
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('multa').delete().eq('id_multa', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
