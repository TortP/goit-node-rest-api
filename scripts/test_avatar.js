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
  app.use(express.static('public'));

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
    throw new Error(
      `${step} failed: expected ${expected}, got ${
        res.status
      }; body=${JSON.stringify(res.body)}`
    );
  }
}

// Create a simple test image buffer
function createTestImage() {
  // Simple 1x1 PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
}

(async () => {
  const app = await buildApp();
  console.log('DB ready; running avatar tests...\n');

  const email = randEmail();
  const password = 'Passw0rd!123';

  // 1) Register - should have gravatar avatarURL
  let res = await request(app)
    .post('/api/auth/register')
    .send({ email, password });
  assertStatus('Register', res, 201);
  console.log(`OK: Register: ${res.status}`);
  console.log(`  Gravatar avatarURL: ${res.body.user?.avatarURL || 'N/A'}`);

  const verificationToken = res.body?.user?.verificationToken;
  if (!verificationToken) {
    throw new Error('No verificationToken returned in register response');
  }

  // 2) Verify email
  res = await request(app).get(`/api/auth/verify/${verificationToken}`);
  assertStatus('Verify email', res, 200);
  console.log(`OK: Verify email: ${res.status}`);

  // 3) Login
  res = await request(app).post('/api/auth/login').send({ email, password });
  assertStatus('Login', res, 200);
  const token = res.body?.token;
  if (!token) throw new Error('No token returned from login');
  console.log(`OK: Login: ${res.status}\n`);

  const auth = { Authorization: `Bearer ${token}` };

  // 4) Upload avatar
  const testImage = createTestImage();
  res = await request(app)
    .patch('/api/auth/avatars')
    .set(auth)
    .attach('avatar', testImage, 'test.png');
  assertStatus('Upload avatar', res, 200);
  console.log(`OK: Upload avatar: ${res.status}`);
  console.log(`  New avatarURL: ${res.body?.avatarURL || 'N/A'}`);

  // 5) Verify avatar file exists
  if (res.body?.avatarURL) {
    const avatarPath = path.join('public', res.body.avatarURL);
    try {
      await fs.access(avatarPath);
      console.log(`OK: Avatar file exists: ${avatarPath}\n`);
    } catch {
      console.log(`FAIL: Avatar file NOT found: ${avatarPath}\n`);
    }
  }

  // 6) Test static file serving
  if (res.body?.avatarURL) {
    const staticRes = await request(app).get(res.body.avatarURL);
    console.log(`OK: Static file serving: ${staticRes.status}`);
    console.log(
      `  Content-Type: ${staticRes.headers['content-type'] || 'N/A'}\n`
    );
  }

  console.log('All avatar tests passed!');
  process.exit(0);
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
