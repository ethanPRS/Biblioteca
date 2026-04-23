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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: true, credentials: true }));
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
