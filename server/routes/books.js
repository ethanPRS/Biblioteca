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
        (
          SELECT U2.seccion 
          FROM EJEMPLAR E2 
          JOIN UBICACION U2 ON E2.id_ubicacion = U2.id_ubicacion 
          WHERE E2.id_libro = L.id_libro 
          LIMIT 1
        ) as category,
        CASE 
          WHEN (SELECT COUNT(*) FROM EJEMPLAR E2 WHERE E2.id_libro = L.id_libro AND E2.estatus = 'Disponible') > 0 THEN 'Disponible' 
          ELSE 'Prestado' 
        END as status,
        (
          SELECT U2.estanteria 
          FROM EJEMPLAR E2 
          JOIN UBICACION U2 ON E2.id_ubicacion = U2.id_ubicacion 
          WHERE E2.id_libro = L.id_libro 
          LIMIT 1
        ) as location,
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
    db.transaction(() => {
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
      
      const bookId = result.lastInsertRowid;
      
      // Manage Ubicacion (Category & Location)
      let ub = db.prepare('SELECT id_ubicacion FROM UBICACION WHERE estanteria = ? AND seccion = ?').get(b.location || 'N/A', b.category || 'N/A');
      if (!ub) {
         const uRes = db.prepare('INSERT INTO UBICACION (estanteria, seccion, codigo_clasificacion) VALUES (?, ?, ?)').run(b.location || 'N/A', b.category || 'N/A', 'N/A');
         ub = { id_ubicacion: uRes.lastInsertRowid };
      }

      // Manage Copies via EJEMPLAR
      const totalCopies = parseInt(b.totalCopies) || 1;
      const insertEj = db.prepare('INSERT INTO EJEMPLAR (id_libro, id_ubicacion, codigo_inventario, tipo_disponibilidad, estatus) VALUES (?, ?, ?, ?, ?)');
      for (let i = 0; i < totalCopies; i++) {
          insertEj.run(bookId, ub.id_ubicacion, `INV-${bookId}-${Date.now()}-${i}`, 'Préstamo a casa', 'Disponible');
      }

      res.status(201).json({ id: bookId, ...b });
    })();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a book
router.put('/:id', (req, res) => {
  const b = req.body;
  const id = req.params.id;

  try {
    db.transaction(() => {
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

      // Manage Ubicacion
      let ub = db.prepare('SELECT id_ubicacion FROM UBICACION WHERE estanteria = ? AND seccion = ?').get(b.location || 'N/A', b.category || 'N/A');
      if (!ub) {
         const uRes = db.prepare('INSERT INTO UBICACION (estanteria, seccion, codigo_clasificacion) VALUES (?, ?, ?)').run(b.location || 'N/A', b.category || 'N/A', 'N/A');
         ub = { id_ubicacion: uRes.lastInsertRowid };
      }
      
      // Sync Location for all existing copies of this book
      db.prepare('UPDATE EJEMPLAR SET id_ubicacion = ? WHERE id_libro = ?').run(ub.id_ubicacion, id);

      // Adjust total copies
      const currentCopies = db.prepare('SELECT id_ejemplar FROM EJEMPLAR WHERE id_libro = ? ORDER BY id_ejemplar ASC').all(id);
      const desiredCopies = parseInt(b.totalCopies) || 1;
      
      if (desiredCopies > currentCopies.length) {
          const toAdd = desiredCopies - currentCopies.length;
          const insertEj = db.prepare('INSERT INTO EJEMPLAR (id_libro, id_ubicacion, codigo_inventario, tipo_disponibilidad, estatus) VALUES (?, ?, ?, ?, ?)');
          for (let i = 0; i < toAdd; i++) {
              insertEj.run(id, ub.id_ubicacion, `INV-${id}-${Date.now()}-${i}`, 'Préstamo a casa', 'Disponible');
          }
      } else if (desiredCopies < currentCopies.length) {
          const toRemove = currentCopies.length - desiredCopies;
          db.prepare(`
              DELETE FROM EJEMPLAR 
              WHERE id_ejemplar IN (
                  SELECT id_ejemplar FROM EJEMPLAR 
                  WHERE id_libro = ? AND estatus = 'Disponible'
                  ORDER BY id_ejemplar DESC 
                  LIMIT ?
              )
          `).run(id, toRemove);
      }

      res.json({ id: Number(id), ...b });
    })();
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
