import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET all audit logs
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('auditoria')
      .select('*, usuario ( nombre, matricula_nomina )')
      .order('fecha', { ascending: false })
      .limit(100);
    if (error) throw error;
    const logs = data.map(a => ({
      ...a,
      nombre: a.usuario?.nombre,
      username: a.usuario?.matricula_nomina,
    }));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create audit log
router.post('/', async (req, res) => {
  const { userId, action, type } = req.body;
  try {
    const { data, error } = await supabase
      .from('auditoria')
      .insert({ id_usuario: userId, accion: action, tipo: type, fecha: new Date().toISOString().split('T')[0] })
      .select().single();
    if (error) throw error;
    res.status(201).json({ id: data.id_auditoria, userId, action, type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
