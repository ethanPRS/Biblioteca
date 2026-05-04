import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET all loan requests
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lista_espera')
      .select('id_lista_espera, id_libro, id_usuario, fecha_registro, estatus')
      .order('fecha_registro', { ascending: false });
    if (error) throw error;
    res.json(data.map(r => ({
      id: String(r.id_lista_espera),
      bookId: r.id_libro,
      userId: String(r.id_usuario),
      requestDate: r.fecha_registro,
      status: r.estatus,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create loan request
router.post('/', async (req, res) => {
  const { bookId, userId, requestDate, status } = req.body;
  try {
    // Check if user has pending fines
    const { data: userFines, error: finesError } = await supabase
      .from('multa')
      .select('estatus_pago')
      .eq('id_usuario', userId)
      .eq('estatus_pago', 'Pendiente');

    if (finesError) throw finesError;

    if (userFines && userFines.length > 0) {
      return res.status(403).json({ error: 'El usuario tiene multas pendientes y no puede solicitar préstamos.' });
    }

    const { data, error } = await supabase
      .from('lista_espera')
      .insert({ id_usuario: userId, id_libro: bookId, fecha_registro: requestDate, estatus: status || 'Pendiente' })
      .select().single();
    if (error) throw error;
    res.status(201).json({ id: String(data.id_lista_espera), bookId, userId, requestDate, status: status || 'Pendiente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update loan request
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  try {
    if (status) {
      const { error } = await supabase.from('lista_espera').update({ estatus: status }).eq('id_lista_espera', req.params.id);
      if (error) throw error;
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
