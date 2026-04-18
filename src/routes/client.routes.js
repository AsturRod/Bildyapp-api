import express from 'express';
import {
	createClient,
	deleteClient,
	getArchivedClients,
	getClientById,
	getClients,
	restoreClient,
	updateClient,
} from '../controllers/client.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
	clientIdParamSchema,
	createClientSchema,
	deleteClientRequestSchema,
	listClientsQuerySchema,
	updateClientRequestSchema,
} from '../validators/client.validator.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createClientSchema), createClient);
router.get('/', validate(listClientsQuerySchema), getClients);
router.get('/archived', validate(listClientsQuerySchema), getArchivedClients);
router.get('/:id', validate(clientIdParamSchema), getClientById);
router.put('/:id', validate(updateClientRequestSchema), updateClient);
router.delete('/:id', validate(deleteClientRequestSchema), deleteClient);
router.patch('/:id/restore', validate(clientIdParamSchema), restoreClient);

export default router;
