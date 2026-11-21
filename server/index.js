import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApiMiddlewareApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = createApiMiddlewareApp();
const port = Number(process.env.PORT || 3001);

if (fs.existsSync(distDir)) {
  app.use('/Alchemist-Library', express.static(distDir));
  app.use(express.static(distDir));
  app.use((_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server Alchemist Library (PostgreSQL + Prisma) berjalan di http://localhost:${port}`);
});
