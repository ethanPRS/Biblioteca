import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET all books with their available copies count
router.get('/', async (req, res) => {
  try {
    const { data: libros, error } = await supabase
      .from('libro')
      .select(`
        id_libro, titulo, autor, foto, isbn,
        editorial_clave, edicion, precio, sinopsis, formato, estatus_catalogo,
        ejemplar (
          id_ejemplar, estatus,
          ubicacion ( seccion, estanteria )
        )
      `);

    if (error) throw error;

    const books = libros.map(l => {
      const copies = l.ejemplar || [];
      const availableCopies = copies.filter(e => e.estatus === 'Disponible').length;
      const firstCopy = copies[0];
      return {
        id: l.id_libro,
        title: l.titulo,
        author: l.autor,
        cover: l.foto,
        category: firstCopy?.ubicacion?.seccion || 'N/A',
        status: availableCopies > 0 ? 'Disponible' : 'Prestado',
        location: firstCopy?.ubicacion?.estanteria || 'N/A',
        isbn: l.isbn,
        editorial: l.editorial_clave,
        edition: l.edicion,
        price: l.precio,
        synopsis: l.sinopsis,
        format: l.formato,
        availabilityStatus: l.estatus_catalogo,
        totalCopies: copies.length,
        availableCopies,
      };
    });

    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new book
router.post('/', async (req, res) => {
  const b = req.body;
  try {
    // Insert libro
    const { data: libro, error: libroErr } = await supabase
      .from('libro')
      .insert({
        titulo: b.title,
        autor: b.author,
        editorial_clave: b.editorial || '',
        edicion: b.edition || '',
        precio: b.price || 0,
        sinopsis: b.synopsis || '',
        formato: b.format || 'Físico',
        estatus_catalogo: b.availabilityStatus || 'Disponible para préstamo a casa',
        isbn: b.isbn || '',
        foto: b.cover || '',
      })
      .select()
      .single();

    if (libroErr) throw libroErr;
    const bookId = libro.id_libro;

    // Manage Ubicacion
    let { data: ub } = await supabase
      .from('ubicacion')
      .select('id_ubicacion')
      .eq('estanteria', b.location || 'N/A')
      .eq('seccion', b.category || 'N/A')
      .single();

    if (!ub) {
      const { data: newUb, error: ubErr } = await supabase
        .from('ubicacion')
        .insert({ estanteria: b.location || 'N/A', seccion: b.category || 'N/A', codigo_clasificacion: 'N/A' })
        .select()
        .single();
      if (ubErr) throw ubErr;
      ub = newUb;
    }

    // Insert Ejemplares
    const totalCopies = parseInt(b.totalCopies) || 1;
    const ejemplares = Array.from({ length: totalCopies }, (_, i) => ({
      id_libro: bookId,
      id_ubicacion: ub.id_ubicacion,
      codigo_inventario: `INV-${bookId}-${Date.now()}-${i}`,
      tipo_disponibilidad: 'Préstamo a casa',
      estatus: 'Disponible',
    }));

    const { error: ejErr } = await supabase.from('ejemplar').insert(ejemplares);
    if (ejErr) throw ejErr;

    res.status(201).json({ id: bookId, ...b });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a book
router.put('/:id', async (req, res) => {
  const b = req.body;
  const id = req.params.id;
  try {
    const { error: updateErr } = await supabase
      .from('libro')
      .update({
        titulo: b.title,
        autor: b.author,
        editorial_clave: b.editorial,
        edicion: b.edition,
        precio: b.price,
        sinopsis: b.synopsis,
        formato: b.format,
        estatus_catalogo: b.availabilityStatus,
        isbn: b.isbn,
        foto: b.cover,
      })
      .eq('id_libro', id);

    if (updateErr) throw updateErr;

    // Manage Ubicacion
    let { data: ub } = await supabase
      .from('ubicacion')
      .select('id_ubicacion')
      .eq('estanteria', b.location || 'N/A')
      .eq('seccion', b.category || 'N/A')
      .single();

    if (!ub) {
      const { data: newUb, error: ubErr } = await supabase
        .from('ubicacion')
        .insert({ estanteria: b.location || 'N/A', seccion: b.category || 'N/A', codigo_clasificacion: 'N/A' })
        .select()
        .single();
      if (ubErr) throw ubErr;
      ub = newUb;
    }

    await supabase.from('ejemplar').update({ id_ubicacion: ub.id_ubicacion }).eq('id_libro', id);

    // Adjust total copies
    const { data: currentCopies } = await supabase
      .from('ejemplar')
      .select('id_ejemplar')
      .eq('id_libro', id)
      .order('id_ejemplar', { ascending: true });

    const desiredCopies = parseInt(b.totalCopies) || 1;
    const diff = desiredCopies - (currentCopies?.length || 0);

    if (diff > 0) {
      const newEj = Array.from({ length: diff }, (_, i) => ({
        id_libro: id,
        id_ubicacion: ub.id_ubicacion,
        codigo_inventario: `INV-${id}-${Date.now()}-${i}`,
        tipo_disponibilidad: 'Préstamo a casa',
        estatus: 'Disponible',
      }));
      await supabase.from('ejemplar').insert(newEj);
    } else if (diff < 0) {
      const { data: toDelete } = await supabase
        .from('ejemplar')
        .select('id_ejemplar')
        .eq('id_libro', id)
        .eq('estatus', 'Disponible')
        .order('id_ejemplar', { ascending: false })
        .limit(Math.abs(diff));
      if (toDelete?.length) {
        await supabase.from('ejemplar').delete().in('id_ejemplar', toDelete.map(e => e.id_ejemplar));
      }
    }

    res.json({ id: Number(id), ...b });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a book
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('libro').delete().eq('id_libro', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
