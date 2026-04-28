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