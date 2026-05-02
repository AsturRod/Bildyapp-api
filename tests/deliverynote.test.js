import request from 'supertest';
import app from '../src/app.js';
import { createVerifiedCompanySession } from './helpers/auth.js';

const buildClientPayload = (suffix) => ({
  name: `Cliente Albaranes ${suffix}`,
  cif: `B3300000${suffix}`,
  email: `cliente-albaranes-${suffix}@bildyapp.test`,
  phone: '600111222',
  address: {
    street: 'Calle Uno',
    number: '10',
    postal: '28001',
    city: 'Madrid',
    province: 'Madrid',
  },
});

const buildProjectPayload = (clientId, suffix) => ({
  client: clientId,
  name: `Proyecto Albaranes ${suffix}`,
  projectCode: `PRJ-DELIVERY-${suffix}`,
  address: {
    street: 'Obra Principal',
    number: '1',
    postal: '28002',
    city: 'Madrid',
    province: 'Madrid',
  },
  email: `proyecto-${suffix}@albaranes.test`,
  notes: 'Notas del proyecto',
  active: true,
});

const buildMaterialPayload = ({ client, project, description = 'Entrega de material' }) => ({
  client: String(client._id),
  project: String(project._id),
  format: 'material',
  description,
  workDate: '2026-05-02',
  material: 'Ladrillos',
  quantity: 100,
  unit: 'uds',
});

const buildHoursPayload = ({ client, project, description = 'Parte de horas' }) => ({
  client: String(client._id),
  project: String(project._id),
  format: 'hours',
  description,
  workDate: '2026-05-02',
  hours: 8,
  workers: [{ name: 'Juan', hours: 8 }],
});

const createSignatureBuffer = () => Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x60, 0x00, 0x00, 0x00,
  0x02, 0x00, 0x01, 0xe5, 0x27, 0xd4, 0xa2, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe('Delivery note endpoints', () => {
  it('creates material and hours delivery notes with the real API', async () => {
    const session = await createVerifiedCompanySession({
      email: 'delivery-flow@bildyapp.test',
      companyCif: 'B90000300',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('A'));

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'A'));

    const materialRes = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildMaterialPayload({ client: clientRes.body.data, project: projectRes.body.data }));

    expect(materialRes.statusCode).toBe(201);
    expect(materialRes.body.data.format).toBe('material');

    const hoursRes = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildHoursPayload({ client: clientRes.body.data, project: projectRes.body.data }));

    expect(hoursRes.statusCode).toBe(201);
    expect(hoursRes.body.data.format).toBe('hours');
  });

  it('lists, filters and retrieves delivery notes', async () => {
    const session = await createVerifiedCompanySession({
      email: 'delivery-list@bildyapp.test',
      companyCif: 'B90000301',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('B'));

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'B'));

    const createdRes = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildHoursPayload({ client: clientRes.body.data, project: projectRes.body.data }));

    const listRes = await request(app)
      .get('/api/deliverynote?page=1&limit=10&format=hours&signed=false')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.pagination).toBeDefined();
    expect(listRes.body.data.some((note) => note._id === createdRes.body.data._id)).toBe(true);

    const detailRes = await request(app)
      .get(`/api/deliverynote/${createdRes.body.data._id}`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.body.data._id).toBe(createdRes.body.data._id);
  });

  it('signs, downloads and blocks deletion of signed delivery notes', async () => {
    const session = await createVerifiedCompanySession({
      email: 'delivery-sign@bildyapp.test',
      companyCif: 'B90000302',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildClientPayload('C'));

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'C'));

    const createdRes = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(buildMaterialPayload({ client: clientRes.body.data, project: projectRes.body.data, description: 'Firma albarán' }));

    const signRes = await request(app)
      .patch(`/api/deliverynote/${createdRes.body.data._id}/sign`)
      .set('Authorization', `Bearer ${session.accessToken}`)
      .attach('signature', createSignatureBuffer(), 'signature.png');

    expect(signRes.statusCode).toBe(200);
    expect(signRes.body.data.signed).toBe(true);
    expect(signRes.body.data.signatureUrl).toBeDefined();
    expect(signRes.body.data.pdfUrl).toBe(`/api/deliverynote/pdf/${createdRes.body.data._id}`);

    const pdfRes = await request(app)
      .get(`/api/deliverynote/pdf/${createdRes.body.data._id}`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(pdfRes.statusCode).toBe(200);
    expect(pdfRes.headers['content-type']).toMatch(/application\/pdf/);

    const deleteRes = await request(app)
      .delete(`/api/deliverynote/${createdRes.body.data._id}`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(deleteRes.statusCode).toBe(400);
  });

  it('rejects delivery notes when client and project belong to different companies', async () => {
    const sessionA = await createVerifiedCompanySession({
      email: 'delivery-mismatch-a@bildyapp.test',
      companyCif: 'B90000303',
    });

    const sessionB = await createVerifiedCompanySession({
      email: 'delivery-mismatch-b@bildyapp.test',
      companyCif: 'B90000304',
    });

    const clientRes = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${sessionA.accessToken}`)
      .send(buildClientPayload('D'));

    const projectRes = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${sessionB.accessToken}`)
      .send(buildProjectPayload(clientRes.body.data._id, 'D'));

    expect(projectRes.statusCode).toBe(400);
  });
});