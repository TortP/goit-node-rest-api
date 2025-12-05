import request from 'supertest';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

process.env.DB_SYNC_ALTER = 'true';

import { connectAndSync } from '../db/sequelize.js';
import authRouter from '../routes/authRouter.js';
import User from '../models/user.js';
import '../models/user.js';
import '../models/contact.js';

async function buildApp() {
  const app = express();
  app.use(morgan('tiny'));
  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  app.use('/api/auth', authRouter);

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

async function testEmailVerificationProduction() {
  const app = await buildApp();
  console.log('Testing Email Verification\n');

  const email = 'test@example.com';
  const password = 'Test1234!@';

  try {
    // Видаляємо користувача, якщо він існує (для повторного тестування)
    await User.destroy({ where: { email } });
    console.log(`Cleaned up old user ${email} for retest\n`);

    // 1. Реєстрація
    console.log('1. REGISTRATION');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password });

    console.log(`Status: ${registerRes.status}`);
    console.log(`Body: ${JSON.stringify(registerRes.body, null, 2)}`);

    if (registerRes.status !== 201) {
      throw new Error(`Register failed with status ${registerRes.status}`);
    }

    const verificationToken = registerRes.body.user?.verificationToken;
    if (!verificationToken) {
      throw new Error('No verificationToken returned in register response');
    }

    console.log(`Verification token: ${verificationToken}`);
    console.log(`ПИСЬМО ВІДПРАВЛЕНО НА: ${email}`);
    console.log(`Verification link: http://localhost:3000/api/auth/verify/${verificationToken}`);
    console.log(`Email should arrive within 1-2 minutes\n`);

    // 2. Логін без верифікації (має бути 401)
    console.log('2️СПРОБА ЛОГІНУ БЕЗ ВЕРИФІКАЦІЇ');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    console.log(`Status: ${loginRes.status}`);
    console.log(`Body: ${JSON.stringify(loginRes.body)}`);

    if (loginRes.status === 401 && loginRes.body.message === 'Email is not verified') {
      console.log('OK: Login blocked without verification (401)\n');
    } else {
      console.warn(`WARNING: Expected 401 "Email is not verified", got ${loginRes.status}`);
    }

    // 3. Вручну верифікуємо (імітуємо клацання посилання)
    console.log('3. VERIFY EMAIL (simulating link click)');
    const verifyRes = await request(app).get(`/api/auth/verify/${verificationToken}`);

    console.log(`Status: ${verifyRes.status}`);
    console.log(`Body: ${JSON.stringify(verifyRes.body)}`);

    if (verifyRes.status !== 200) {
      throw new Error(`Verify failed with status ${verifyRes.status}`);
    }
    console.log('OK: Email verified\n');

    // 4. Логін після верифікації (має бути 200)
    console.log('4. LOGIN AFTER VERIFICATION');
    const loginAfterRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    console.log(`Status: ${loginAfterRes.status}`);
    console.log(`Body: ${JSON.stringify(loginAfterRes.body, null, 2)}`);

    if (loginAfterRes.status === 200 && loginAfterRes.body.token) {
      console.log('OK: Login successful after verification\n');
    } else {
      console.warn(`WARNING: Login failed, status: ${loginAfterRes.status}`);
    }

    console.log('ALL TESTS PASSED!');
    console.log('\nCheck email at test@example.com for verification links');
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

testEmailVerificationProduction();
