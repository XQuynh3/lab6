const express = require('express');
const request = require('supertest');
const db = require('../db/mysql');
const authRouter = require('../routes/auth.routes');
const adminRouter = require('../routes/admin.routes');

(async () => {
  await db.ready; // ensure DB ready
  // run setup to ensure users seeded
  if (authRouter.setupDb) await authRouter.setupDb();

  const app = express();
  app.use(express.json());
  app.use('/', authRouter);
  app.use('/', adminRouter);

  try {
    console.log('Testing login (admin)...');
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'admin', password: '123' })
      .set('Accept', 'application/json');
    console.log('Login response:', loginRes.status, loginRes.body);
    const token = loginRes.body.token;
    if (!token) throw new Error('No token returned for admin');

    console.log('Testing /profile with admin token...');
    const profileRes = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${token}`);
    console.log('/profile response:', profileRes.status, profileRes.body);

    console.log('Testing /admin with admin token...');
    const adminRes = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    console.log('/admin response (admin):', adminRes.status, adminRes.body);

    console.log('Testing login (user)...');
    const loginUser = await request(app)
      .post('/login')
      .send({ username: 'user', password: '123' });
    console.log('User login response:', loginUser.status, loginUser.body);
    const userToken = loginUser.body.token;

    console.log('Testing /admin with user token (should be blocked)...');
    const adminUserRes = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${userToken}`);
    console.log('/admin response (user):', adminUserRes.status, adminUserRes.body);

    console.log('All tests complete');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
