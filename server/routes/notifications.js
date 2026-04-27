import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET all notifications (most recent 50)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notificacion')
      .select('id_notificacion, titulo, mensaje, tipo, fecha_creacion, id_usuario_destino')
      .order('fecha_creacion', { ascending: false })
      .limit(50);
    if (error) throw error;

    res.json(data.map(n => ({
      id: String(n.id_notificacion),
      title: n.titulo,
      message: n.mensaje,
      type: n.tipo,
      createdAt: n.fecha_creacion,
      targetUserId: n.id_usuario_destino ? String(n.id_usuario_destino) : null,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create notification
router.post('/', async (req, res) => {
  const { title, message, type, targetUserId } = req.body;
  try {
    const { data, error } = await supabase
      .from('notificacion')
      .insert({
        titulo: title,
        mensaje: message,
        tipo: type || 'info',
        id_usuario_destino: targetUserId || null,
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({
      id: String(data.id_notificacion),
      title: data.titulo,
      message: data.mensaje,
      type: data.tipo,
      createdAt: data.fecha_creacion,
      targetUserId: data.id_usuario_destino ? String(data.id_usuario_destino) : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
