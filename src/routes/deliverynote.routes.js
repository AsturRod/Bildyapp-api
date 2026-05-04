import express from 'express';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  getDeliveryNotePdf,
  signDeliveryNote,
  deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import upload from '../middleware/upload.js';
import {
  createDeliveryNoteSchema,
  deliveryNoteParamsSchema,
  listDeliveryNotesQuerySchema,
  signDeliveryNoteSchema,
} from '../validators/deliverynote.validator.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /deliverynote:
 *   post:
 *     tags:
 *       - DeliveryNote
 *     summary: Crear un albarán
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/DeliveryNoteBody'
 *     responses:
 *       '201':
 *         description: Albarán creado
 *
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Listar albaranes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/deliveryProjectParam'
 *       - $ref: '#/components/parameters/projectClientParam'
 *       - $ref: '#/components/parameters/deliveryFormatParam'
 *       - $ref: '#/components/parameters/deliverySignedParam'
 *       - $ref: '#/components/parameters/deliveryFromParam'
 *       - $ref: '#/components/parameters/deliveryToParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       '200':
 *         description: Lista de albaranes
 *
 * /deliverynote/pdf/{id}:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Descargar albarán PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: PDF o URL de PDF
 *
 * /deliverynote/{id}/sign:
 *   patch:
 *     tags:
 *       - DeliveryNote
 *     summary: Firmar un albarán
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Albarán firmado
 */

router.post('/', validate(createDeliveryNoteSchema), createDeliveryNote);
router.get('/', validate(listDeliveryNotesQuerySchema), getDeliveryNotes);
router.get('/pdf/:id', validate(deliveryNoteParamsSchema), getDeliveryNotePdf);
router.get('/:id', validate(deliveryNoteParamsSchema), getDeliveryNoteById);
router.patch(
  '/:id/sign',
  validate(signDeliveryNoteSchema),
  upload.single('signature'),
  signDeliveryNote
);
router.delete('/:id', validate(deliveryNoteParamsSchema), deleteDeliveryNote);

export default router;