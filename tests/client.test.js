import request from 'supertest';
import app from '../src/app.js';
import { createVerifiedCompanySession } from './helpers/auth.js';

const buildClientPayload = (suffix) => ({
  name: `Cliente Test ${suffix}`,
  cif: `B1234567${suffix}`,
  email: `cliente-${suffix}@test.com`,
  phone: '600123123',
  address: {
    street: 'Calle Mayor',
    number: '12',
    postal: '28001',
    city: 'Madrid',
    province: 'Madrid',
  },
});

describe('Client endpoints', () => {
  it('creates, lists and retrieves clients with a real authenticated session', async () => {
    const session = await createVerifiedCompanySession({
      email: 'client-flow@bildyapp.test',
      companyCif: 'B90000100',
    });

    const createRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('A'));

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.status).toBe('success');
    expect(createRes.body.data.name).toBe('Cliente Test A');

    const listRes = await request(app)
      .get('/api/client?page=1&limit=10&name=Cliente')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.status).toBe('success');
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.pagination).toBeDefined();

    const detailRes = await request(app)
      .get(`/api/client/${createRes.body.data._id}`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.data._id).toBe(createRes.body.data._id);
  });

  it('returns the expected error codes for client lifecycle failures', async () => {
    const session = await createVerifiedCompanySession({
      email: 'client-errors@bildyapp.test',
      companyCif: 'B90000103',
    });

    const createRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('D'));

    const clientId = createRes.body.data._id;
    const missingClientId = '64f000000000000000000001';

    const invalidIdRes = await request(app)
      .put('/api/client/invalid-id')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ name: 'No importa' });

    expect(invalidIdRes.statusCode).toBe(400);

    const updateMissingRes = await request(app)
      .put(`/api/client/${missingClientId}`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ name: 'Cliente inexistente' });

    expect(updateMissingRes.statusCode).toBe(404);

    const deleteMissingRes = await request(app)
      .delete(`/api/client/${missingClientId}?soft=true`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(deleteMissingRes.statusCode).toBe(404);

    const restoreActiveRes = await request(app)
      .patch(`/api/client/${clientId}/restore`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(restoreActiveRes.statusCode).toBe(404);
  });

  it('updates, archives, restores and deletes clients in the real API', async () => {
    const session = await createVerifiedCompanySession({
      email: 'client-update@bildyapp.test',
      companyCif: 'B90000101',
    });

    const createRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('B'));

    const clientId = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ name: 'Cliente Test B Actualizado' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.name).toBe('Cliente Test B Actualizado');

    const archiveRes = await request(app)
      .delete(`/api/client/${clientId}?soft=true`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(archiveRes.statusCode).toBe(200);

    const archiveAgainRes = await request(app)
      .delete(`/api/client/${clientId}?soft=true`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(archiveAgainRes.statusCode).toBe(409);

    const archivedRes = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(archivedRes.statusCode).toBe(200);
    expect(archivedRes.body.data.some((client) => client._id === clientId)).toBe(true);

    const restoreRes = await request(app)
      .patch(`/api/client/${clientId}/restore`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(restoreRes.statusCode).toBe(200);

    const hardDeleteRes = await request(app)
      .delete(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(hardDeleteRes.statusCode).toBe(200);
  });

  it('rejects duplicated CIF inside the same company', async () => {
    const session = await createVerifiedCompanySession({
      email: 'client-dup@bildyapp.test',
      companyCif: 'B90000102',
    });

    const payload = buildClientPayload('C');

    const firstRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(payload);

    expect(firstRes.statusCode).toBe(201);

    const secondRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(payload);

    expect(secondRes.statusCode).toBe(409);
  });
});