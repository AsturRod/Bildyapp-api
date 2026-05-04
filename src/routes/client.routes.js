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

/**
 * @openapi
 * /client:
 *   post:
 *     tags:
 *       - Client
 *     summary: Crear un cliente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/ClientBody'
 *     responses:
 *       '201':
 *         description: Cliente creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *
 *   get:
 *     tags:
 *       - Client
 *     summary: Listar clientes de la compañía
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/nameParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       '200':
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientListResponse'
 *
 * /client/{id}:
 *   get:
 *     tags:
 *       - Client
 *     summary: Obtener cliente por ID
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
 *         description: Cliente obtenido
 *
 *   put:
 *     tags:
 *       - Client
 *     summary: Actualizar cliente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       '200':
 *         description: Cliente actualizado
 *
 *   delete:
 *     tags:
 *       - Client
 *     summary: Eliminar cliente (soft/hard)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: soft
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       '200':
 *         description: Cliente eliminado
 */

router.post('/', validate(createClientSchema), createClient);
router.get('/', validate(listClientsQuerySchema), getClients);
router.get('/archived', validate(listClientsQuerySchema), getArchivedClients);
router.get('/:id', validate(clientIdParamSchema), getClientById);
router.put('/:id', validate(updateClientRequestSchema), updateClient);
router.delete('/:id', validate(deleteClientRequestSchema), deleteClient);
router.patch('/:id/restore', validate(clientIdParamSchema), restoreClient);

export default router;
