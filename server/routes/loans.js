import express from 'express';
import supabase from '../db/supabase.js';
import { generateLoanReceiptPdf, mapLoanReceipt, sendLoanReceiptEmail } from '../services/loanReceipt.js';
import { sendWhatsAppTemplate } from '../services/whatsapp.js';

const router = express.Router();

function getRequestBaseUrl(req) {
  return process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

async function fetchLoanReceiptData(loanId) {
  const { data, error } = await supabase
    .from('prestamo')
    .select(`
      id_prestamo, id_usuario, fecha_prestamo, fecha_vencimiento,
      usuario ( id_usuario, nombre, email, matricula_nomina, rol ),
      ejemplar (
        codigo_inventario,
        libro ( titulo, autor, isbn ),
        ubicacion ( estanteria )
      )
    `)
    .eq('id_prestamo', loanId)
    .single();

  if (error) throw error;
  return mapLoanReceipt(data);
}

async function fetchUserPhone(userId) {
  const { data, error } = await supabase
    .from('usuario')
    .select('telefono')
    .eq('id_usuario', userId)
    .single();
  if (error) {
    console.warn('Error al obtener teléfono:', error.message);
    return null;
  }
  return data?.telefono;
}

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

    const receiptUrl = `${getRequestBaseUrl(req)}/api/loans/${loan.id_prestamo}/receipt.pdf?userId=${encodeURIComponent(String(userId))}`;
    let emailReceipt = { sent: false, reason: 'No se pudo generar el recibo.' };

    try {
      const receipt = await fetchLoanReceiptData(loan.id_prestamo);
      const pdfBuffer = generateLoanReceiptPdf(receipt);
      emailReceipt = await sendLoanReceiptEmail(receipt, pdfBuffer, receiptUrl);
      if (!emailReceipt.sent) {
        console.warn(`[Receipt] Correo no enviado para prestamo ${loan.id_prestamo}: ${emailReceipt.reason}`);
      }
    } catch (receiptError) {
      console.warn(`[Receipt] Error al procesar recibo para prestamo ${loan.id_prestamo}: ${receiptError.message}`);
      emailReceipt = { sent: false, reason: receiptError.message };
    }

    // [WhatsApp] Enviar mensaje de aprobación de préstamo
    console.log(`[WhatsApp Debug] Buscando teléfono para el usuario: ${userId}`);
    const telefonoUsuario = await fetchUserPhone(userId);
    console.log(`[WhatsApp Debug] Teléfono encontrado: ${telefonoUsuario}`);
    
    if (telefonoUsuario) {
      console.log(`[WhatsApp Debug] Intentando enviar plantilla de aprobación a ${telefonoUsuario}...`);
      const response = await sendWhatsAppTemplate(telefonoUsuario, 'prestamo_aprobado', [
        { type: "text", text: dueDate },
        { type: "text", text: receiptUrl }
      ]);
      console.log(`[WhatsApp Debug] Respuesta de envío:`, response);
    } else {
      console.log(`[WhatsApp Debug] No se envió mensaje porque el usuario no tiene teléfono registrado.`);
    }

    res.status(201).json({
      id: String(loan.id_prestamo),
      bookId,
      userId,
      borrowDate,
      dueDate,
      status: status || 'Activo',
      finePaid: false,
      receiptUrl,
      emailReceiptSent: emailReceipt.sent,
      emailReceiptMessage: emailReceipt.reason,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET printable loan receipt as PDF
router.get('/:id/receipt.pdf', async (req, res) => {
  try {
    const receipt = await fetchLoanReceiptData(req.params.id);
    if (!req.query.userId || String(req.query.userId) !== receipt.userId) {
      return res.status(403).json({ error: 'Este recibo solo esta disponible para el usuario del prestamo' });
    }
    const pdfBuffer = generateLoanReceiptPdf(receipt);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo-prestamo-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(404).json({ error: 'Recibo no encontrado' });
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
          fecha_vencimiento,
          ejemplar (
            id_libro,
            libro ( precio, costo_multa_base )
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

        // [WhatsApp] Enviar mensaje de éxito en devolución
        console.log(`[WhatsApp Debug] Buscando teléfono para devolución. Usuario: ${loan.id_usuario}`);
        const telefonoUsuario = await fetchUserPhone(loan.id_usuario);
        console.log(`[WhatsApp Debug] Teléfono encontrado: ${telefonoUsuario}`);
        
        if (telefonoUsuario) {
          console.log(`[WhatsApp Debug] Intentando enviar plantilla de devolución a ${telefonoUsuario}...`);
          const response = await sendWhatsAppTemplate(telefonoUsuario, 'devolucion_exitosa', []);
          console.log(`[WhatsApp Debug] Respuesta de envío:`, response);
        } else {
          console.log(`[WhatsApp Debug] No se envió mensaje de devolución porque el usuario no tiene teléfono registrado.`);
        }

        // Al devolver, congelamos el monto de la multa por retraso si existe
        const { data: multaRetraso } = await supabase.from('multa')
          .select('id_multa')
          .eq('id_prestamo', loanId)
          .eq('tipo', 'Retraso')
          .eq('estatus_pago', 'Pendiente')
          .single();
          
        if (multaRetraso) {
          const today = returnDate || new Date().toISOString().split('T')[0];
          const [yT, mT, dT] = today.split('-');
          const fechaRetorno = new Date(Number(yT), Number(mT) - 1, Number(dT));
          fechaRetorno.setHours(0, 0, 0, 0);

          const [yV, mV, dV] = loan.fecha_vencimiento.split('T')[0].split('-');
          const fechaVenc = new Date(Number(yV), Number(mV) - 1, Number(dV));
          fechaVenc.setHours(0, 0, 0, 0);

          const diff = fechaRetorno.getTime() - fechaVenc.getTime();
          const diasRetraso = Math.max(0, Math.floor(diff / 86400000));
          
          if (diasRetraso > 0) {
            const libroObj = Array.isArray(loan.ejemplar?.libro) ? loan.ejemplar.libro[0] : loan.ejemplar?.libro;
            const costoBase = libroObj?.costo_multa_base || 10;
            await supabase.from('multa')
              .update({ monto: diasRetraso * costoBase, dias_retraso: diasRetraso })
              .eq('id_multa', multaRetraso.id_multa);
          }
        }

        if (condition === 'Mal Estado' || condition === 'Se perdio') {
          // No borramos la multa por retraso, se suman ambas deudas.

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
