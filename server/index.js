import fs from 'fs';
import path from 'path';
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
import db from './db/database.js'; // Ensures the database initializes on startup

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins explicitly for development/preview
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/books', booksRouter);
app.use('/api/users', usersRouter);
app.use('/api/loans', loansRouter);
app.use('/api/fines', finesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/chat', chatRouter);
app.use('/api/loanRequests', loanRequestsRouter);

// Backup endpoint
app.post('/api/backup', (req, res) => {
  try {
    const dbPath = path.join(process.cwd(), 'server', 'db', 'biblioteca.db');
    const backupsDir = path.join(process.cwd(), 'server', 'db', 'backups');
    
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `biblioteca_${timestamp}.db`);
    
    fs.copyFileSync(dbPath, backupPath);
    res.json({ success: true, message: 'Backup created successfully', backupPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
