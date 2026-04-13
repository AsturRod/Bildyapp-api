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
  inviteUser
} from '../controllers/user.controller.js';

import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import upload from '../middleware/upload.js';

import {
  registerSchema,
  validationCodeSchema,
  loginSchema,
  personalDataSchema,
  companySchema,
  refreshSchema,
  passwordUpdateSchema,
  inviteSchema,
  deleteUserSchema
} from '../validators/user.validator.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.put('/validation', authMiddleware, validate(validationCodeSchema), validateEmail);
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