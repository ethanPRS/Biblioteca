import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import booksRouter from './routes/books.js';
import usersRouter from './routes/users.js';
import loansRouter from './routes/loans.js';
import finesRouter from './routes/fines.js';
import auditRouter from './routes/audit.js';
import chatRouter from './routes/chat.js';
import loanRequestsRouter from './routes/loanRequests.js';
import supabase from './db/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: true, credentials: true }));

// ─── SSE Realtime Endpoint (must come BEFORE express.json()) ───
const sseClients = new Set();

app.get('/api/realtime/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.status(200);
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  sseClients.add(res);
  console.log(`[Realtime] Cliente SSE conectado. Total: ${sseClients.size}`);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    console.log(`[Realtime] Cliente SSE desconectado. Total: ${sseClients.size}`);
  });
});

// Broadcast a change event to all connected SSE clients
function broadcast(domain, eventType, payload) {
  const message = JSON.stringify({ table: domain, eventType, payload });
  for (const client of sseClients) {
    client.write(`data: ${message}\n\n`);
  }
}

// Tables to watch and their corresponding frontend data domains
const WATCHED_TABLES = [
  { table: 'libro', domain: 'books' },
  { table: 'ejemplar', domain: 'books' },
  { table: 'ubicacion', domain: 'books' },
  { table: 'prestamo', domain: 'loans' },
  { table: 'lista_espera', domain: 'loanRequests' },
  { table: 'multa', domain: 'fines' },
  { table: 'auditoria', domain: 'audit' },
  { table: 'usuario', domain: 'users' },
  { table: 'devolucion', domain: 'loans' },
];

// Subscribe to Supabase Realtime for all watched tables
const realtimeChannel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public' },
    (payload) => {
      const tableName = payload.table;
      const watched = WATCHED_TABLES.find(w => w.table === tableName);
      if (watched) {
        console.log(`[Realtime] Cambio detectado en "${tableName}" (${payload.eventType})`);
        broadcast(watched.domain, payload.eventType, {
          old: payload.old_record,
          new: payload.new_record || payload.record,
        });
      }
    }
  )
  .subscribe((status) => {
    console.log(`[Realtime] Estado de suscripción: ${status}`);
  });

// ─── JSON body parser & API routes ───
app.use(express.json());

app.use('/api/books', booksRouter);
app.use('/api/users', usersRouter);
app.use('/api/loans', loansRouter);
app.use('/api/fines', finesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/chat', chatRouter);
app.use('/api/loanRequests', loanRequestsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend conectado a Supabase' });
});

app.listen(PORT, () => {
  console.log(`Server corriendo en puerto ${PORT} - Conectado a Supabase`);
});
