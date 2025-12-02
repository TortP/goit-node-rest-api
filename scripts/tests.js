import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import request from 'supertest';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import authRouter from '../routes/authRouter.js';
import contactsRouter from '../routes/contactsRouter.js';

process.env.DB_SYNC_ALTER = process.env.DB_SYNC_ALTER || 'true';
import { connectAndSync } from '../db/sequelize.js';
import '../models/user.js';
import '../models/contact.js';

function randEmail() {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `test_${Date.now()}_${suffix}@example.com`;
}

async function buildApp() {
  const app = express();
  app.use(morgan('tiny'));
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/contacts', contactsRouter);

  app.use((_, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  app.use((err, req, res, next) => {
    const { status = 500, message = 'Server error' } = err;
    res.status(status).json({ message });
  });

  await connectAndSync();
  return app;
}

function assertStatus(step, res, expected) {
  if (res.status !== expected) {
    throw new Error(`${step} failed: expected ${expected}, got ${res.status}; body=${JSON.stringify(res.body)}`);
  }
}

(async () => {
  const argv = process.argv.slice(2);
  const reportIndex = argv.indexOf('--report');
  const reportPath = reportIndex !== -1 ? argv[reportIndex + 1] : undefined;

  const results = [];
  const app = await buildApp();
  console.log('DB ready; running supertest E2E...');

  const email = randEmail();
  const password = 'Passw0rd!123';

  // 1) Register
  let res = await request(app).post('/api/auth/register').send({ email, password });
  if (res.status === 201) {
    console.log(`Register: ${res.status} ✓`);
  } else if (res.status === 409) {
    console.log('Register: email in use, continuing to login');
  } else {
    throw new Error(`Register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  results.push({ step: 'register', status: res.status, data: res.body });

  // 2) Login
  res = await request(app).post('/api/auth/login').send({ email, password });
  assertStatus('Login', res, 200);
  const token = res.body?.token;
  if (!token) throw new Error('No token returned from login');
  console.log(`Login: ${res.status} ✓`);
  results.push({ step: 'login', status: res.status, data: { token: token.slice(0, 12) + '...', user: res.body?.user } });

  const auth = { Authorization: `Bearer ${token}` };

  // 3) Current
  res = await request(app).get('/api/auth/current').set(auth);
  assertStatus('Current', res, 200);
  console.log(`Current: ${res.status} ✓`);
  results.push({ step: 'current', status: res.status, data: res.body });

  // 4) Create contact
  const contactBody = { name: 'JS E2E', email: `c_${email}`, phone: '100-200-300' };
  res = await request(app).post('/api/contacts').set(auth).send(contactBody);
  assertStatus('Create contact', res, 201);
  const contactId = res.body?.id;
  console.log(`Create contact: ${res.status} ✓ id=${contactId}`);
  results.push({ step: 'contacts:create', status: res.status, data: res.body });

  // 5) Get contact by id
  res = await request(app).get(`/api/contacts/${contactId}`).set(auth);
  assertStatus('Get contact', res, 200);
  console.log(`Get contact: ${res.status} ✓`);
  results.push({ step: 'contacts:get', status: res.status, data: res.body });

  // 6) Update contact
  res = await request(app)
    .put(`/api/contacts/${contactId}`)
    .set(auth)
    .send({ name: 'JS E2E Updated', email: `u_${email}`, phone: '555-666-777' });
  assertStatus('Update contact', res, 200);
  console.log(`Update contact: ${res.status} ✓`);
  results.push({ step: 'contacts:update', status: res.status, data: res.body });

  // 7) Patch favorite
  res = await request(app).patch(`/api/contacts/${contactId}/favorite`).set(auth).send({ favorite: true });
  assertStatus('Patch favorite', res, 200);
  if (res.body?.favorite !== true) throw new Error('Favorite not set to true');
  console.log(`Patch favorite: ${res.status} ✓`);
  results.push({ step: 'contacts:favorite', status: res.status, data: res.body });

  // 8) List favorites filter
  res = await request(app).get('/api/contacts?favorite=true').set(auth);
  assertStatus('List favorites', res, 200);
  if (!Array.isArray(res.body)) throw new Error('List favorites did not return array');
  console.log(`List favorites: ${res.status} ✓ count=${res.body.length}`);
  results.push({ step: 'contacts:list_favorites', status: res.status, data: { count: res.body.length } });

  // 9) Delete contact
  res = await request(app).delete(`/api/contacts/${contactId}`).set(auth);
  assertStatus('Delete contact', res, 200);
  console.log(`Delete contact: ${res.status} ✓`);
  results.push({ step: 'contacts:delete', status: res.status, data: res.body });

  // 10) Logout
  res = await request(app).post('/api/auth/logout').set(auth);
  if (res.status !== 204) throw new Error(`Logout failed: ${res.status} ${JSON.stringify(res.body)}`);
  console.log('Logout: 204 ✓');
  results.push({ step: 'logout', status: res.status });

  // 11) Protected after logout
  res = await request(app).get('/api/contacts').set(auth);
  if (res.status !== 401) throw new Error(`Protected route after logout should be 401, got ${res.status}`);
  console.log('Protected route after logout: 401 ✓');
  results.push({ step: 'contacts:after_logout', status: res.status });

  console.log('\nAll steps passed!');

  if (reportPath) {
    const full = path.resolve(reportPath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, JSON.stringify({ ok: true, results }, null, 2), 'utf8');
    console.log(`Report written to: ${full}`);
  }
  process.exit(0);
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
