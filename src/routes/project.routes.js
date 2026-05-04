import express from 'express';
import {
  createProject,
  deleteProject,
  getArchivedProjects,
  getProjectById,
  getProjects,
  restoreProject,
  updateProject,
} from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  deleteProjectRequestSchema,
  listProjectsQuerySchema,
  projectIdParamSchema,
  updateProjectRequestSchema,
} from '../validators/project.validator.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /project:
 *   post:
 *     tags:
 *       - Project
 *     summary: Crear un proyecto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/ProjectBody'
 *     responses:
 *       '201':
 *         description: Proyecto creado
 *
 *   get:
 *     tags:
 *       - Project
 *     summary: Listar proyectos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/projectClientParam'
 *       - $ref: '#/components/parameters/nameParam'
 *       - $ref: '#/components/parameters/projectActiveParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       '200':
 *         description: Lista de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectListResponse'
 *
 * /project/{id}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Obtener proyecto por ID
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
 *         description: Proyecto obtenido
 */

router.post('/', validate(createProjectSchema), createProject);
router.get('/', validate(listProjectsQuerySchema), getProjects);
router.get('/archived', validate(listProjectsQuerySchema), getArchivedProjects);
router.get('/:id', validate(projectIdParamSchema), getProjectById);
router.put('/:id', validate(updateProjectRequestSchema), updateProject);
router.delete('/:id', validate(deleteProjectRequestSchema), deleteProject);
router.patch('/:id/restore', validate(projectIdParamSchema), restoreProject);

export default router;