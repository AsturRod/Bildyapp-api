import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

let counter = 0;

const buildSuffix = () => `${Date.now()}-${++counter}`;

export const buildAuthFixture = (overrides = {}) => {
  const suffix = buildSuffix();

  return {
    email: overrides.email || `user-${suffix}@bildyapp.test`,
    password: overrides.password || 'Password123',
    personalData: {
      name: overrides.name || 'Nombre',
      lastName: overrides.lastName || 'Apellidos',
      nif: overrides.nif || `1234567${counter % 10}Z`,
    },
    companyData: {
      name: overrides.companyName || `Empresa ${suffix}`,
      cif: overrides.companyCif || `B${String(suffix).replace(/\D/g, '').slice(0, 8).padEnd(8, '0')}`,
      address: overrides.address || {
        street: 'Gran Via',
        number: '25',
        postal: '28013',
        city: 'Madrid',
        province: 'Madrid',
      },
      isFreelance: overrides.isFreelance ?? false,
    },
  };
};

export const createVerifiedCompanySession = async (overrides = {}) => {
  const fixture = buildAuthFixture(overrides);

  const registerRes = await request(app)
    .post('/api/user/register')
    .send({ email: fixture.email, password: fixture.password });

  if (registerRes.statusCode !== 201) {
    throw new Error(`Register failed for ${fixture.email}: ${registerRes.statusCode}`);
  }

  const pendingUser = await User.findOne({ email: fixture.email }).select('+verificationCode');

  if (!pendingUser?.verificationCode) {
    throw new Error(`Verification code not found for ${fixture.email}`);
  }

  const validationRes = await request(app)
    .put('/api/user/validation')
    .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
    .send({ code: pendingUser.verificationCode });

  if (validationRes.statusCode !== 200) {
    throw new Error(`Validation failed for ${fixture.email}: ${validationRes.statusCode}`);
  }

  const personalRes = await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
    .send(fixture.personalData);

  if (personalRes.statusCode !== 200) {
    throw new Error(`Personal data setup failed for ${fixture.email}: ${personalRes.statusCode}`);
  }

  const companyRes = await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
    .send(fixture.companyData);

  if (companyRes.statusCode !== 200) {
    throw new Error(`Company setup failed for ${fixture.email}: ${companyRes.statusCode}`);
  }

  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email: fixture.email, password: fixture.password });

  if (loginRes.statusCode !== 200) {
    throw new Error(`Login failed for ${fixture.email}: ${loginRes.statusCode}`);
  }

  const user = await User.findOne({ email: fixture.email }).populate('company');

  return {
    ...fixture,
    registerRes,
    validationRes,
    personalRes,
    companyRes,
    loginRes,
    accessToken: loginRes.body.accessToken,
    refreshToken: loginRes.body.refreshToken,
    user,
    company: user?.company || null,
  };
};