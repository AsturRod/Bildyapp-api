

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

let counter = 0;

const buildFixture = () => {
  counter += 1;
  return {
    email: `auth-${counter}@bildyapp.test`,
    password: 'Password123',
  };
};

describe('Auth endpoints', () => {
  it('registers, validates and logs in with the real API', async () => {
    const { email, password } = buildFixture();

    const registerRes = await request(app)
      .post('/api/user/register')
      .send({ email, password });

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body).toHaveProperty('accessToken');
    expect(registerRes.body).toHaveProperty('refreshToken');
    expect(registerRes.body.user.email).toBe(email);

    const pendingUser = await User.findOne({ email }).select('+verificationCode');
    expect(pendingUser?.verificationCode).toBeTruthy();

    const validationRes = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ code: pendingUser.verificationCode });

    expect(validationRes.statusCode).toBe(200);

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('accessToken');
    expect(loginRes.body).toHaveProperty('refreshToken');

    const meRes = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.email).toBe(email);

    const refreshRes = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');
  });

  it('updates personal data and assigns a company with the real API', async () => {
    const { email, password } = buildFixture();

    const registerRes = await request(app)
      .post('/api/user/register')
      .send({ email, password });

    const pendingUser = await User.findOne({ email }).select('+verificationCode');

    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ code: pendingUser.verificationCode });

    const personalRes = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: 'Pepe', lastName: 'García', nif: '12345678Z' });

    expect(personalRes.statusCode).toBe(200);

    const companyRes = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({
        name: 'Bildy Solutions SL',
        cif: 'B12345678',
        address: {
          street: 'Gran Via',
          number: '25',
          postal: '28013',
          city: 'Madrid',
          province: 'Madrid',
        },
        isFreelance: false,
      });

    expect(companyRes.statusCode).toBe(200);
    expect(companyRes.body.data.company).toBeTruthy();
    expect(companyRes.body.data.company.name).toBe('Bildy Solutions SL');

    const meRes = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.company).toBeTruthy();
  });
});
