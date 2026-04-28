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

router.post('/', validate(createProjectSchema), createProject);
router.get('/', validate(listProjectsQuerySchema), getProjects);
router.get('/archived', validate(listProjectsQuerySchema), getArchivedProjects);
router.get('/:id', validate(projectIdParamSchema), getProjectById);
router.put('/:id', validate(updateProjectRequestSchema), updateProject);
router.delete('/:id', validate(deleteProjectRequestSchema), deleteProject);
router.patch('/:id/restore', validate(projectIdParamSchema), restoreProject);

export default router;