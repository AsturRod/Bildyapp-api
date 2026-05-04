import express from 'express';
import {
  register,
  validateEmail,
  login,
  getUser,
  updatePersonalData,
  updateCompany,
  uploadLogo,
  refreshToken,
  logout,
  deleteUser,
  changePassword,
  inviteUser,
  resendValidationCode,
} from '../controllers/user.controller.js';

import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import upload from '../middleware/upload.js';

import {
  registerSchema,
  validationCodeSchema,
  resendValidationCodeSchema,
  loginSchema,
  personalDataSchema,
  companySchema,
  refreshSchema,
  passwordUpdateSchema,
  inviteSchema,
  deleteUserSchema
} from '../validators/user.validator.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: User
 *     description: Registro, autenticacion y perfil de usuario
 *
 * /user/register:
 *   post:
 *     tags:
 *       - User
 *     summary: Registrar usuario
 *     requestBody:
 *       $ref: '#/components/requestBodies/RegisterBody'
 *     responses:
 *       '201':
 *         description: Usuario registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: Iniciar sesion
 *     requestBody:
 *       $ref: '#/components/requestBodies/LoginBody'
 *     responses:
 *       '200':
 *         description: Sesion iniciada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *
 * /user:
 *   get:
 *     tags:
 *       - User
 *     summary: Obtener usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Usuario obtenido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

router.post('/register', validate(registerSchema), register);
router.put('/validation', authMiddleware, validate(validationCodeSchema), validateEmail);
router.post('/validation/resend', validate(resendValidationCodeSchema), resendValidationCode);
router.post('/login', validate(loginSchema), login);

router.get('/', authMiddleware, getUser);
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);
router.patch('/company', authMiddleware, validate(companySchema), updateCompany);
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);

router.post('/refresh', validate(refreshSchema), refreshToken);
router.post('/logout', authMiddleware, logout);

router.delete('/', authMiddleware, validate(deleteUserSchema), deleteUser);
router.put('/password', authMiddleware, validate(passwordUpdateSchema), changePassword);
router.post('/invite', authMiddleware, roleMiddleware('admin'), validate(inviteSchema), inviteUser);

export default router;