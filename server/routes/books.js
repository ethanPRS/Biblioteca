import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// GET all books with their available copies count
router.get('/', (req, res) => {
  try {
    const books = db.prepare(`
      SELECT 
        L.id_libro as id,
        L.titulo as title,
        L.autor as author,
        L.foto as cover,
        U.seccion as category,
        L.estatus_catalogo as status,
        U.estanteria as location,
        L.isbn,
        L.editorial_clave as editorial,
        L.edicion as edition,
        L.precio as price,
        L.costo_multa_base as finePerDay,
        L.sinopsis as synopsis,
        L.formato as format,
        L.estatus_catalogo as availabilityStatus,
        (SELECT COUNT(*) FROM EJEMPLAR E2 WHERE E2.id_libro = L.id_libro) as totalCopies,
        (SELECT COUNT(*) FROM EJEMPLAR E2 WHERE E2.id_libro = L.id_libro AND E2.estatus = 'Disponible') as availableCopies
      FROM LIBRO L
      LEFT JOIN EJEMPLAR E ON L.id_libro = E.id_libro
      LEFT JOIN UBICACION U ON E.id_ubicacion = U.id_ubicacion
      GROUP BY L.id_libro
    `).all();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new book
router.post('/', (req, res) => {
  const b = req.body;
  
  try {
    const insert = db.prepare(`
      INSERT INTO LIBRO (titulo, autor, editorial_clave, edicion, precio, sinopsis, formato, estatus_catalogo, isbn, foto, costo_multa_base)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      b.title, 
      b.author, 
      b.editorial || '', 
      b.edition || '', 
      b.price || 0, 
      b.synopsis || '', 
      b.format || 'Físico', 
      b.availabilityStatus || 'Disponible para préstamo a casa', 
      b.isbn || '', 
      b.cover || '', 
      b.finePerDay || 10
    );

    // Optionally insert a default Ejemplar and Ubicacion here so it shows up in queries properly
    // For simplicity, just return the ID
    res.status(201).json({ id: result.lastInsertRowid, ...b });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a book
router.put('/:id', (req, res) => {
  const b = req.body;
  const id = req.params.id;

  try {
    const update = db.prepare(`
      UPDATE LIBRO SET 
        titulo = ?, autor = ?, editorial_clave = ?, edicion = ?, 
        precio = ?, sinopsis = ?, formato = ?, estatus_catalogo = ?, 
        isbn = ?, foto = ?, costo_multa_base = ?
      WHERE id_libro = ?
    `);

    update.run(
      b.title, b.author, b.editorial, b.edition, 
      b.price, b.synopsis, b.format, b.availabilityStatus, 
      b.isbn, b.cover, b.finePerDay, id
    );

    res.json({ id: Number(id), ...b });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a book
router.delete('/:id', (req, res) => {
  try {
    const del = db.prepare('DELETE FROM LIBRO WHERE id_libro = ?');
    del.run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
