import request from 'supertest';
import app from '../src/app.js';
import { createVerifiedCompanySession } from './helpers/auth.js';

const buildClientPayload = (suffix) => ({
  name: `Cliente Proyecto ${suffix}`,
  cif: `B2200000${suffix}`,
  email: `project-client-${suffix}@bildyapp.test`,
  phone: '600999888',
  address: {
    street: 'Calle Proyecto',
    number: '10',
    postal: '28001',
    city: 'Madrid',
    province: 'Madrid',
  },
});

const buildProjectPayload = (clientId, suffix) => ({
  client: clientId,
  name: `Proyecto Reforma ${suffix}`,
  projectCode: `PRJ-REAL-${suffix}`,
  address: {
    street: 'Obra Central',
    number: '3',
    postal: '28002',
    city: 'Madrid',
    province: 'Madrid',
  },
  email: `proyecto-${suffix}@bildyapp.test`,
  notes: 'Proyecto de integración real',
  active: true,
});

describe('Project endpoints', () => {
  it('creates, lists, updates, archives and restores projects with the real API', async () => {
    const session = await createVerifiedCompanySession({
      email: 'project-flow@bildyapp.test',
      companyCif: 'B90000200',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('A'));

    expect(clientRes.statusCode).toBe(201);

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'A'));

    expect(projectRes.statusCode).toBe(201);
    expect(projectRes.body.data.name).toBe('Proyecto Reforma A');

    const listRes = await request(app)
      .get('/api/project?page=1&limit=10&name=Reforma&active=true')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.pagination).toBeDefined();

    const updateRes = await request(app)
      .put(`/api/project/${projectRes.body.data._id}`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ notes: 'Proyecto actualizado' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.notes).toBe('Proyecto actualizado');

    const archiveRes = await request(app)
      .delete(`/api/project/${projectRes.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(archiveRes.statusCode).toBe(200);

    const archivedRes = await request(app)
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(archivedRes.statusCode).toBe(200);
    expect(archivedRes.body.data.some((project) => project._id === projectRes.body.data._id)).toBe(true);

    const restoreRes = await request(app)
      .patch(`/api/project/${projectRes.body.data._id}/restore`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(restoreRes.statusCode).toBe(200);

    const hardDeleteRes = await request(app)
      .delete(`/api/project/${projectRes.body.data._id}`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(hardDeleteRes.statusCode).toBe(200);
  });

  it('returns the expected error codes for project lifecycle failures', async () => {
    const session = await createVerifiedCompanySession({
      email: 'project-errors@bildyapp.test',
      companyCif: 'B90000203',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('C'));

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'C'));

    const missingProjectId = '64f000000000000000000002';

    const duplicateRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'C'));

    expect(duplicateRes.statusCode).toBe(409);

    const invalidIdRes = await request(app)
      .get('/api/project/invalid-id')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(invalidIdRes.statusCode).toBe(400);

    const updateMissingRes = await request(app)
      .put(`/api/project/${missingProjectId}`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ notes: 'No existe' });

    expect(updateMissingRes.statusCode).toBe(404);

    const restoreActiveRes = await request(app)
      .patch(`/api/project/${projectRes.body.data._id}/restore`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(restoreActiveRes.statusCode).toBe(404);
  });

  it('paginates archived projects with the correct totalItems', async () => {
    const session = await createVerifiedCompanySession({
      email: 'project-archived-pagination@bildyapp.test',
      companyCif: 'B90000203',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('C'));

    const firstProjectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'C1'));

    const secondProjectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'C2'));

    const firstArchiveRes = await request(app)
      .delete(`/api/project/${firstProjectRes.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    const secondArchiveRes = await request(app)
      .delete(`/api/project/${secondProjectRes.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(firstArchiveRes.statusCode).toBe(200);
    expect(secondArchiveRes.statusCode).toBe(200);

    const archivedPageRes = await request(app)
      .get('/api/project/archived?page=1&limit=1')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(archivedPageRes.statusCode).toBe(200);
    expect(archivedPageRes.body.data).toHaveLength(1);
    expect(archivedPageRes.body.pagination.totalItems).toBe(2);
    expect(archivedPageRes.body.pagination.totalPages).toBe(2);
  });

  it('rejects projects with a client from another company', async () => {
    const sessionA = await createVerifiedCompanySession({
      email: 'project-company-a@bildyapp.test',
      companyCif: 'B90000201',
    });

    const sessionB = await createVerifiedCompanySession({
      email: 'project-company-b@bildyapp.test',
      companyCif: 'B90000202',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${sessionB.accessToken}`)
      .send(buildClientPayload('B'));

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${sessionA.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'B'));

    expect(projectRes.statusCode).toBe(400);
    expect(projectRes.body.message).toMatch(/cliente no existe|no pertenece/i);
  });
});