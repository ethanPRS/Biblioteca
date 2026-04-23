import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

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

const mapUser = (row) => ({
  id: String(row.id_usuario),
  username: row.matricula_nomina,
  role: mapRole(row.rol),
  name: row.nombre || row.matricula_nomina,
  email: row.email || `${row.matricula_nomina?.toLowerCase()}@biblioteca.edu`,
  avatar: row.avatar || '',
  status: row.estatus,
  funcion: row.funcion,
  passwordHash: row.contrasena_hash,
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar');
    if (error) throw error;
    res.json(data.map(mapUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar')
      .eq('id_usuario', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(mapUser(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'La matrícula o nómina es requerida.' });

  try {
    // Check if already registered
    const { data: existing } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('matricula_nomina', username)
      .single();
    if (existing) return res.status(400).json({ error: 'El usuario ya está registrado en el sistema.' });

    // Lookup in ESCOLAR
    let externalUser = null, computedRole = '', computedFuncion = '', foundName = '';

    const { data: escolarRow } = await supabase
      .from('escolar')
      .select('nombre, carrera, estatus, correo')
      .eq('matricula', username)
      .single();

    if (escolarRow) {
      externalUser = escolarRow;
      computedRole = 'Alumno';
      computedFuncion = 'Estudiante';
      foundName = escolarRow.nombre;
    } else {
      const { data: capitalRow } = await supabase
        .from('capital_humano')
        .select('nombre, puesto, estatus, correo')
        .eq('matricula_nomina', username)
        .single();
      if (capitalRow) {
        externalUser = capitalRow;
        computedRole = capitalRow.puesto.toLowerCase().includes('profesor') ? 'Profesor' : 'Administrador';
        computedFuncion = capitalRow.puesto;
        foundName = capitalRow.nombre;
      }
    }

    if (!externalUser) {
      return res.status(404).json({ error: 'La matrícula o nómina no existe en los registros de la institución.' });
    }

    const email = externalUser.correo || `${username.toLowerCase()}@udem.edu`;

    const { data: newUser, error: insertErr } = await supabase
      .from('usuario')
      .insert({
        matricula_nomina: username,
        rol: computedRole,
        funcion: computedFuncion,
        contrasena_hash: username,
        estatus: 'Activo',
        nombre: foundName,
        email,
        avatar: '',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({ id: String(newUser.id_usuario), username, role: computedRole, name: foundName, email, avatar: '', status: 'Activo' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  const { username, role, name, email, avatar, status, funcion, passwordHash } = req.body;
  try {
    const { error } = await supabase
      .from('usuario')
      .update({
        matricula_nomina: username,
        rol: role,
        funcion,
        contrasena_hash: passwordHash,
        estatus: status,
        nombre: name,
        email,
        avatar,
      })
      .eq('id_usuario', req.params.id);
    if (error) throw error;
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('usuario').delete().eq('id_usuario', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET external user
router.get('/external/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const { data: existing } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('matricula_nomina', username)
      .single();
    if (existing) return res.status(400).json({ error: 'El usuario ya está registrado en el sistema local.' });

    let externalUser = null, computedRole = '', foundName = '';

    const { data: escolarRow } = await supabase
      .from('escolar')
      .select('nombre, carrera, estatus, correo')
      .eq('matricula', username)
      .single();

    if (escolarRow) {
      externalUser = escolarRow;
      computedRole = 'Alumno';
      foundName = escolarRow.nombre;
    } else {
      const { data: capitalRow } = await supabase
        .from('capital_humano')
        .select('nombre, puesto, estatus, correo')
        .eq('matricula_nomina', username)
        .single();
      if (capitalRow) {
        externalUser = capitalRow;
        computedRole = capitalRow.puesto.toLowerCase().includes('profesor') ? 'Profesor' : 'Administrador';
        foundName = capitalRow.nombre;
      }
    }

    if (!externalUser) {
      return res.status(404).json({ error: 'La matrícula o nómina no existe en los registros de la institución.' });
    }

    const email = externalUser.correo || `${username.toLowerCase()}@udem.edu`;
    res.json({ username, name: foundName, role: computedRole, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST login verify
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, matricula_nomina, rol, funcion, contrasena_hash, estatus, nombre, email, avatar')
      .eq('matricula_nomina', username)
      .eq('estatus', 'Activo')
      .single();

    if (error || !data || data.contrasena_hash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    res.json(mapUser(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
