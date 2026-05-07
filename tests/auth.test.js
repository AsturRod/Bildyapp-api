

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

  it('rejects missing, malformed and invalid access tokens', async () => {
    const noTokenRes = await request(app).get('/api/user');

    expect(noTokenRes.statusCode).toBe(401);

    const malformedRes = await request(app)
      .get('/api/user')
      .set('Authorization', 'Token abc');

    expect(malformedRes.statusCode).toBe(401);

    const { email, password } = buildFixture();

    const registerRes = await request(app)
      .post('/api/user/register')
      .send({ email, password });

    const invalidTokenRes = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}x`);

    expect(invalidTokenRes.statusCode).toBe(401);
  });

  it('rejects company-scoped resources before a company is assigned', async () => {
    const { email, password } = buildFixture();

    const registerRes = await request(app)
      .post('/api/user/register')
      .send({ email, password });

    const pendingUser = await User.findOne({ email }).select('+verificationCode');

    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ code: pendingUser.verificationCode });

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });

    const clientRes = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(clientRes.statusCode).toBe(403);
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

  it('returns user error contracts for validation, profile and company actions', async () => {
    const pendingFixture = buildFixture();

    const pendingRegisterRes = await request(app)
      .post('/api/user/register')
      .send(pendingFixture);

    const pendingUser = await User.findOne({ email: pendingFixture.email }).select('+verificationCode');

    const loginBeforeVerifyRes = await request(app)
      .post('/api/user/login')
      .send(pendingFixture);

    expect(loginBeforeVerifyRes.statusCode).toBe(403);

    const wrongValidationRes = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${pendingRegisterRes.body.accessToken}`)
      .send({ code: '000000' });

    expect(wrongValidationRes.statusCode).toBe(400);

    const secondWrongValidationRes = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${pendingRegisterRes.body.accessToken}`)
      .send({ code: '111111' });

    expect(secondWrongValidationRes.statusCode).toBe(400);

    const thirdWrongValidationRes = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${pendingRegisterRes.body.accessToken}`)
      .send({ code: '222222' });

    expect(thirdWrongValidationRes.statusCode).toBe(429);

    const resendNotFoundRes = await request(app)
      .post('/api/user/validation/resend')
      .send({ email: 'missing-user@bildyapp.test' });

    expect(resendNotFoundRes.statusCode).toBe(404);

    const verifiedFixture = buildFixture();

    const verifiedRegisterRes = await request(app)
      .post('/api/user/register')
      .send(verifiedFixture);

    const verifiedUser = await User.findOne({ email: verifiedFixture.email }).select('+verificationCode');

    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${verifiedRegisterRes.body.accessToken}`)
      .send({ code: verifiedUser.verificationCode });

    const verifiedLoginRes = await request(app)
      .post('/api/user/login')
      .send(verifiedFixture);

    const resendVerifiedRes = await request(app)
      .post('/api/user/validation/resend')
      .send({ email: verifiedFixture.email });

    expect(resendVerifiedRes.statusCode).toBe(400);

    const updateCompanyRes = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${verifiedLoginRes.body.accessToken}`)
      .send({
        name: 'Autónomo sin NIF',
        cif: 'B12345679',
        address: {
          street: 'Gran Via',
          number: '25',
          postal: '28013',
          city: 'Madrid',
          province: 'Madrid',
        },
        isFreelance: true,
      });

    expect(updateCompanyRes.statusCode).toBe(400);

    const uploadLogoRes = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${verifiedLoginRes.body.accessToken}`)
      .field('note', 'sin archivo');

    expect(uploadLogoRes.statusCode).toBe(400);

    const inviteRes = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${verifiedLoginRes.body.accessToken}`)
      .send({
        email: 'invitado@bildyapp.test',
        password: 'Password123',
        name: 'Invitado',
        lastName: 'Prueba',
        nif: '12345678Z',
      });

    expect(inviteRes.statusCode).toBe(400);

    const changePasswordRes = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${verifiedLoginRes.body.accessToken}`)
      .send({
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword123',
      });

    expect(changePasswordRes.statusCode).toBe(401);

    const refreshInvalidRes = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: `${verifiedLoginRes.body.refreshToken}x` });

    expect(refreshInvalidRes.statusCode).toBe(401);
  });
});
