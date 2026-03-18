import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// Helper: map DB row → frontend User shape
const mapUser = (row) => ({
  id: String(row.id_usuario),
  username: row.matricula_nomina,
  role: mapRole(row.rol),
  name: row.nombre || row.matricula_nomina,
  email: row.email || `${row.matricula_nomina.toLowerCase()}@biblioteca.edu`,
  avatar: row.avatar || '',
  status: row.estatus,
  funcion: row.funcion,
  passwordHash: row.contrasena_hash,
});

// Map DB rol → frontend Role
const mapRole = (rol) => {
  const map = {
    'Administrador': 'Administrador',
    'Bibliotecario': 'Bibliotecario',
    'Alumno': 'Alumno',
    'Profesor': 'Profesor',
    'Colaborador': 'Colaborador',
  };
  return map[rol] || rol;
};

// GET all users
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar
      FROM USUARIO
    `).all();
    res.json(rows.map(mapUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single user
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar
      FROM USUARIO WHERE id_usuario = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(mapUser(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create user
router.post('/', (req, res) => {
  const { username, role, name, email, avatar, status, funcion, passwordHash } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO USUARIO (matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      username,
      role,
      funcion || 'Personal Administrativo',
      passwordHash || '1234',
      status || 'Activo',
      name || username,
      email || `${username.toLowerCase()}@biblioteca.edu`,
      avatar || ''
    );
    res.status(201).json({ id: String(result.lastInsertRowid), username, role, name, email, avatar, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user
router.put('/:id', (req, res) => {
  const { username, role, name, email, avatar, status, funcion, passwordHash } = req.body;
  try {
    db.prepare(`
      UPDATE USUARIO SET
        matricula_nomina = ?,
        rol = ?,
        funcion = ?,
        contrasena_hash = ?,
        estatus = ?,
        nombre = ?,
        email = ?,
        avatar = ?
      WHERE id_usuario = ?
    `).run(username, role, funcion, passwordHash, status, name, email, avatar, req.params.id);
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM USUARIO WHERE id_usuario = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST login verify
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const row = db.prepare(`
      SELECT id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar
      FROM USUARIO WHERE matricula_nomina = ? AND estatus = 'Activo'
    `).get(username);
    if (!row || row.contrasena_hash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    res.json(mapUser(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
