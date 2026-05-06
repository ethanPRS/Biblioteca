import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, '../../public/receipt-logo-ducky.png');

function cleanText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function pdfText(value) {
  return cleanText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatDate(value) {
  if (!value) return 'N/A';
  const [year, month, day] = String(value).split('T')[0].split('-');
  if (!year || !month || !day) return cleanText(value);
  return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} MXN`;
}

function drawText(text, x, y, size = 10, font = 'F1') {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(text)}) Tj ET`;
}

function estimateTextWidth(text, size = 10, font = 'F1') {
  const cleaned = cleanText(text);
  const baseFactor = font === 'F2' ? 0.58 : 0.54;
  let total = 0;

  for (const char of cleaned) {
    if (char === ' ') total += 0.28;
    else if ('ilI1.,:;|'.includes(char)) total += 0.22;
    else if ('MW@#%&'.includes(char)) total += 0.9;
    else if ('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'.includes(char)) total += 0.66;
    else total += baseFactor;
  }

  return total * size;
}

function fitTextToWidth(text, maxWidth, preferredSize = 10, font = 'F1', minSize = 7) {
  const cleaned = cleanText(text) || 'N/A';
  let size = preferredSize;

  while (size > minSize && estimateTextWidth(cleaned, size, font) > maxWidth) {
    size -= 0.25;
  }

  if (estimateTextWidth(cleaned, size, font) <= maxWidth) {
    return { text: cleaned, size };
  }

  const suffix = '...';
  let shortened = cleaned;

  while (shortened.length > 1 && estimateTextWidth(`${shortened}${suffix}`, size, font) > maxWidth) {
    shortened = shortened.slice(0, -1).trimEnd();
  }

  return {
    text: `${shortened || cleaned.slice(0, 1)}${suffix}`,
    size,
  };
}

function drawFittedText(text, x, y, maxWidth, size = 10, font = 'F1', minSize = 7) {
  const fitted = fitTextToWidth(text, maxWidth, size, font, minSize);
  return drawText(fitted.text, x, y, fitted.size, font);
}

function drawLine(x1, y1, x2, y2) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function drawRect(x, y, width, height) {
  return `${x} ${y} ${width} ${height} re S`;
}

function drawImage(name, x, y, width, height) {
  return `q ${width} 0 0 ${height} ${x} ${y} cm /${name} Do Q`;
}

function fitImage(image, boxX, boxY, boxWidth, boxHeight) {
  if (!image?.width || !image?.height) {
    return { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
  }

  const ratio = image.width / image.height;
  let width = boxWidth;
  let height = width / ratio;

  if (height > boxHeight) {
    height = boxHeight;
    width = height * ratio;
  }

  return {
    x: boxX + (boxWidth - width) / 2,
    y: boxY + (boxHeight - height) / 2,
    width,
    height,
  };
}

function getJpegDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xC0 && marker <= 0xC3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return { width: 400, height: 160 };
}

function paethPredictor(left, above, upperLeft) {
  const p = left + above - upperLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - above);
  const pc = Math.abs(p - upperLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return above;
  return upperLeft;
}

function unfilterPngScanlines(data, width, height, channels) {
  const bytesPerPixel = channels;
  const stride = width * channels;
  const output = Buffer.alloc(stride * height);
  let sourceOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = data[sourceOffset++];
    const rowOffset = y * stride;
    const previousRowOffset = rowOffset - stride;

    for (let x = 0; x < stride; x++) {
      const raw = data[sourceOffset++];
      const left = x >= bytesPerPixel ? output[rowOffset + x - bytesPerPixel] : 0;
      const above = y > 0 ? output[previousRowOffset + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? output[previousRowOffset + x - bytesPerPixel] : 0;

      let value = raw;
      if (filter === 1) value = raw + left;
      if (filter === 2) value = raw + above;
      if (filter === 3) value = raw + Math.floor((left + above) / 2);
      if (filter === 4) value = raw + paethPredictor(left, above, upperLeft);

      output[rowOffset + x] = value & 0xff;
    }
  }

  return output;
}

function parsePngImage(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') throw new Error('Invalid PNG signature');

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8) throw new Error('Only 8-bit PNG logos are supported');
  if (interlace !== 0) throw new Error('Interlaced PNG logos are not supported');

  const channelsByType = {
    0: 1, // grayscale
    2: 3, // RGB
    4: 2, // grayscale + alpha
    6: 4, // RGBA
  };
  const channels = channelsByType[colorType];
  if (!channels) throw new Error('Unsupported PNG color type');

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const pixels = unfilterPngScanlines(inflated, width, height, channels);
  const rgb = Buffer.alloc(width * height * 3);

  for (let i = 0, j = 0; i < pixels.length; i += channels, j += 3) {
    if (colorType === 0) {
      rgb[j] = pixels[i];
      rgb[j + 1] = pixels[i];
      rgb[j + 2] = pixels[i];
    } else if (colorType === 2) {
      rgb[j] = pixels[i];
      rgb[j + 1] = pixels[i + 1];
      rgb[j + 2] = pixels[i + 2];
    } else if (colorType === 4) {
      const alpha = pixels[i + 1] / 255;
      const value = Math.round(pixels[i] * alpha + 255 * (1 - alpha));
      rgb[j] = value;
      rgb[j + 1] = value;
      rgb[j + 2] = value;
    } else if (colorType === 6) {
      const alpha = pixels[i + 3] / 255;
      rgb[j] = Math.round(pixels[i] * alpha + 255 * (1 - alpha));
      rgb[j + 1] = Math.round(pixels[i + 1] * alpha + 255 * (1 - alpha));
      rgb[j + 2] = Math.round(pixels[i + 2] * alpha + 255 * (1 - alpha));
    }
  }

  return {
    width,
    height,
    bytes: zlib.deflateSync(rgb),
    filter: '/FlateDecode',
  };
}

function loadLogoImage() {
  try {
    const bytes = fs.readFileSync(LOGO_PATH);
    if (LOGO_PATH.toLowerCase().endsWith('.png')) {
      return parsePngImage(bytes);
    }
    return { bytes, ...getJpegDimensions(bytes), filter: '/DCTDecode' };
  } catch {
    return null;
  }
}

function buildPdf(commands, image = null) {
  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const pageWidth = 612;
  const pageHeight = 792;
  const content = commands.join('\n');

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject(''); // page placeholder
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const contentId = addObject(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);

  let logoId = null;
  if (image) {
    logoId = addObject(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter ${image.filter} /Length ${image.bytes.length} >>\nstream\n${image.bytes.toString('binary')}\nendstream`);
  }

  const xObjectResource = logoId ? ` /XObject << /Logo ${logoId} 0 R >>` : '';
  objects[2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${xObjectResource} >> /Contents ${contentId} 0 R >>`;

  let pdf = `%PDF-1.4\n`;
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'binary');
}

export function mapLoanReceipt(row) {
  const exemplar = Array.isArray(row.ejemplar) ? row.ejemplar[0] : row.ejemplar;
  const book = Array.isArray(exemplar?.libro) ? exemplar.libro[0] : exemplar?.libro;
  const location = Array.isArray(exemplar?.ubicacion) ? exemplar.ubicacion[0] : exemplar?.ubicacion;
  const user = Array.isArray(row.usuario) ? row.usuario[0] : row.usuario;

  return {
    loanId: row.id_prestamo,
    userId: String(row.id_usuario || user?.id_usuario || ''),
    borrowDate: row.fecha_prestamo,
    dueDate: row.fecha_vencimiento,
    copyCode: exemplar?.codigo_inventario || 'N/A',
    bookTitle: book?.titulo || 'Libro',
    bookAuthor: book?.autor || 'N/A',
    isbn: book?.isbn || 'N/A',
    location: location?.estanteria || 'N/A',
    userName: user?.nombre || user?.matricula_nomina || 'Usuario',
    userEmail: user?.email || '',
    username: user?.matricula_nomina || 'N/A',
    userRole: user?.rol || 'N/A',
  };
}

function normalizeFineType(type) {
  const normalized = cleanText(type).toLowerCase();
  if (normalized.includes('retras')) return 'Retraso';
  if (normalized.includes('dan')) return 'Dano';
  if (normalized.includes('perd')) return 'Perdida';
  return cleanText(type) || 'Cargo';
}

export function mapReturnReceipt(row) {
  const base = mapLoanReceipt(row);
  const returnInfo = Array.isArray(row.devolucion) ? row.devolucion[0] : row.devolucion;
  const fines = Array.isArray(row.multa) ? row.multa : [];
  const fineItems = fines.map((fine) => ({
    type: normalizeFineType(fine.tipo),
    amount: Number(fine.monto || 0),
    daysLate: Number(fine.dias_retraso || 0),
    status: cleanText(fine.estatus_pago || 'Pendiente'),
  }));
  const totalCost = fineItems.reduce((sum, fine) => sum + fine.amount, 0);
  const costLabel = fineItems.length
    ? fineItems.map((fine) => `${fine.type}: ${formatCurrency(fine.amount)}`).join(' | ')
    : formatCurrency(0);

  return {
    ...base,
    returnDate: returnInfo?.fecha_devolucion || row.returnDate || null,
    returnCondition: returnInfo?.condicion_entrega || 'Buen Estado',
    returnNotes: returnInfo?.observaciones || '',
    totalCost,
    costLabel,
    fineItems,
  };
}

export function generateLoanReceiptPdf(receipt) {
  const logoImage = loadLogoImage();
  const logoPlacement = fitImage(logoImage, 48, 650, 216, 68);
  const commands = [
    '0.08 0.17 0.35 RG',
    '1.4 w',
    drawRect(36, 642, 240, 82),
    logoImage ? drawImage('Logo', logoPlacement.x, logoPlacement.y, logoPlacement.width, logoPlacement.height) : drawText('DUCKY UNIVERSITY', 58, 682, 18, 'F2'),

    '0 0 0 RG',
    drawText('PRESTAMO DE LIBROS BIBLIOTECA', 304, 700, 14, 'F2'),
    drawLine(288, 680, 574, 680),
    drawText('La primera, la mejor....', 360, 640, 14, 'F1'),

    drawRect(394, 592, 180, 22),
    drawText('FECHA', 400, 599, 10, 'F1'),
    drawText(formatDate(receipt.borrowDate), 456, 599, 10, 'F2'),

    drawRect(36, 536, 538, 56),
    drawLine(360, 536, 360, 592),
    drawText('NOMBRE:', 42, 574, 10, 'F2'),
    drawFittedText(receipt.userName, 108, 574, 242, 10, 'F1', 8),
    drawText('CORREO:', 42, 554, 10, 'F2'),
    drawFittedText(receipt.userEmail || 'N/A', 108, 554, 242, 9, 'F1', 7),
    drawText('MATRICULA:', 366, 574, 10, 'F2'),
    drawFittedText(receipt.username, 444, 574, 124, 10, 'F1', 8),

    drawRect(36, 492, 538, 44),
    drawLine(220, 492, 220, 536),
    drawLine(360, 492, 360, 536),
    drawText('ROL:', 42, 518, 10, 'F2'),
    drawFittedText(receipt.userRole, 74, 518, 136, 10, 'F1', 8),
    drawText('CODIGO:', 226, 518, 10, 'F2'),
    drawFittedText(receipt.copyCode, 278, 518, 76, 10, 'F1', 8),
    drawText('DIAS:', 366, 518, 10, 'F2'),
    drawText('14', 404, 518, 10, 'F1'),

    drawRect(36, 448, 538, 44),
    drawLine(360, 448, 360, 492),
    drawText('TITULO:', 42, 474, 10, 'F2'),
    drawFittedText(receipt.bookTitle, 100, 474, 252, 10, 'F1', 8),
    drawText('ISBN:', 366, 474, 10, 'F2'),
    drawFittedText(receipt.isbn, 426, 474, 142, 10, 'F1', 8),

    drawRect(36, 414, 538, 34),
    drawLine(306, 414, 306, 448),
    drawText('FECHA DE PRESTAMO:', 42, 428, 10, 'F2'),
    drawFittedText(formatDate(receipt.borrowDate), 190, 428, 108, 10, 'F1', 8),
    drawText('FECHA DE ENTREGA:', 314, 428, 10, 'F2'),
    drawFittedText(formatDate(receipt.dueDate), 462, 428, 106, 10, 'F1', 8),

    drawText('El libro autorizado en préstamo se entrega para uso académico y debe devolverse en buen estado.', 42, 390, 8, 'F1'),
    drawText('El usuario se compromete a cumplir la fecha de entrega y las politicas de biblioteca.', 42, 376, 8, 'F1'),
    drawText('En caso de maltrato o extravió, deberá cubrirse la reposición correspondiente', 42, 362, 8, 'F1'),
    drawText('La multa por retraso será de 10 pesos mexicanos por día.', 42, 348, 8, 'F2'),
    drawText('Este recibo no representa ningún cobro.', 42, 334, 8, 'F1'),

    drawText(`Folio PRE-${receipt.loanId}`, 450, 238, 8, 'F1'),
  ];

  return buildPdf(commands, logoImage);
}

export function generateReturnReceiptPdf(receipt) {
  const logoImage = loadLogoImage();
  const logoPlacement = fitImage(logoImage, 48, 650, 216, 68);
  const commands = [
    '0.08 0.17 0.35 RG',
    '1.4 w',
    drawRect(36, 642, 240, 82),
    logoImage ? drawImage('Logo', logoPlacement.x, logoPlacement.y, logoPlacement.width, logoPlacement.height) : drawText('DUCKY UNIVERSITY', 58, 682, 18, 'F2'),

    '0 0 0 RG',
    drawText('DEVOLUCION DE LIBROS BIBLIOTECA', 284, 700, 14, 'F2'),
    drawLine(288, 680, 574, 680),
    drawText('La primera, la mejor....', 360, 640, 14, 'F1'),

    drawRect(394, 592, 180, 22),
    drawText('FECHA', 400, 599, 10, 'F1'),
    drawFittedText(formatDate(receipt.returnDate), 456, 599, 112, 10, 'F2', 8),

    drawRect(36, 536, 538, 56),
    drawLine(360, 536, 360, 592),
    drawText('NOMBRE:', 42, 574, 10, 'F2'),
    drawFittedText(receipt.userName, 108, 574, 242, 10, 'F1', 8),
    drawText('CORREO:', 42, 554, 10, 'F2'),
    drawFittedText(receipt.userEmail || 'N/A', 108, 554, 242, 9, 'F1', 7),
    drawText('MATRICULA:', 366, 574, 10, 'F2'),
    drawFittedText(receipt.username, 444, 574, 124, 10, 'F1', 8),

    drawRect(36, 492, 538, 44),
    drawLine(220, 492, 220, 536),
    drawLine(360, 492, 360, 536),
    drawText('ROL:', 42, 518, 10, 'F2'),
    drawFittedText(receipt.userRole, 74, 518, 136, 10, 'F1', 8),
    drawText('CODIGO:', 226, 518, 10, 'F2'),
    drawFittedText(receipt.copyCode, 278, 518, 76, 10, 'F1', 8),
    drawText('COSTO:', 366, 518, 10, 'F2'),
    drawFittedText(formatCurrency(receipt.totalCost), 414, 518, 154, 10, 'F1', 8),

    drawRect(36, 448, 538, 44),
    drawLine(360, 448, 360, 492),
    drawText('TITULO:', 42, 474, 10, 'F2'),
    drawFittedText(receipt.bookTitle, 100, 474, 252, 10, 'F1', 8),
    drawText('ISBN:', 366, 474, 10, 'F2'),
    drawFittedText(receipt.isbn, 426, 474, 142, 10, 'F1', 8),

    drawRect(36, 404, 538, 44),
    drawLine(306, 404, 306, 448),
    drawText('FECHA LIMITE:', 42, 428, 10, 'F2'),
    drawFittedText(formatDate(receipt.dueDate), 142, 428, 156, 10, 'F1', 8),
    drawText('FECHA DE DEVOLUCION:', 314, 428, 10, 'F2'),
    drawFittedText(formatDate(receipt.returnDate), 466, 428, 102, 10, 'F1', 8),

    drawRect(36, 360, 538, 44),
    drawText('CONDICION:', 42, 386, 10, 'F2'),
    drawFittedText(receipt.returnCondition, 118, 386, 444, 10, 'F1', 8),

    drawText(`Folio DEV-${receipt.loanId}`, 450, 238, 8, 'F1'),
  ];

  return buildPdf(commands, logoImage);
}

async function sendReceiptEmail({
  receipt,
  pdfBuffer,
  receiptUrl,
  subject,
  textLines,
  html,
  filename,
}) {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length || !receipt.userEmail) {
    return {
      sent: false,
      reason: !receipt.userEmail ? 'El usuario no tiene correo registrado.' : `Falta configurar: ${missing.join(', ')}`,
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: receipt.userEmail,
    subject,
    text: textLines.join('\n'),
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  return { sent: true };
}

export async function sendLoanReceiptEmail(receipt, pdfBuffer, receiptUrl) {
  return sendReceiptEmail({
    receipt,
    pdfBuffer,
    receiptUrl,
    subject: `Recibo de prestamo - ${receipt.bookTitle}`,
    textLines: [
      `Hola ${receipt.userName},`,
      '',
      `Tu prestamo del libro "${receipt.bookTitle}" fue aprobado.`,
      `Fecha de devolucion: ${formatDate(receipt.dueDate)}.`,
      '',
      `Puedes ver o imprimir tu recibo aqui: ${receiptUrl}`,
      '',
      'Este recibo no representa ningun cobro.',
    ],
    html: `
      <p>Hola ${receipt.userName},</p>
      <p>Tu prestamo del libro <strong>${receipt.bookTitle}</strong> fue aprobado.</p>
      <p><strong>Fecha de devolucion:</strong> ${formatDate(receipt.dueDate)}</p>
      <p><a href="${receiptUrl}">Ver o imprimir recibo PDF</a></p>
      <p>Este recibo no representa ningun cobro.</p>
    `,
    filename: `recibo-prestamo-${receipt.loanId}.pdf`,
  });
}

export async function sendReturnReceiptEmail(receipt, pdfBuffer, receiptUrl) {
  return sendReceiptEmail({
    receipt,
    pdfBuffer,
    receiptUrl,
    subject: `Recibo de devolucion - ${receipt.bookTitle}`,
    textLines: [
      `Hola ${receipt.userName},`,
      '',
      `Hemos registrado la devolucion del libro "${receipt.bookTitle}".`,
      `Fecha de devolucion: ${formatDate(receipt.returnDate)}.`,
      `Costo total registrado: ${formatCurrency(receipt.totalCost)}.`,
      '',
      `Puedes ver o imprimir tu recibo aqui: ${receiptUrl}`,
    ],
    html: `
      <p>Hola ${receipt.userName},</p>
      <p>Hemos registrado la devolucion del libro <strong>${receipt.bookTitle}</strong>.</p>
      <p><strong>Fecha de devolucion:</strong> ${formatDate(receipt.returnDate)}</p>
      <p><strong>Costo total registrado:</strong> ${formatCurrency(receipt.totalCost)}</p>
      <p><a href="${receiptUrl}">Ver o imprimir recibo PDF</a></p>
    `,
    filename: `recibo-devolucion-${receipt.loanId}.pdf`,
  });
}
