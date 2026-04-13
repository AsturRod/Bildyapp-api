import express from 'express';
import multer from 'multer';
import {
  //  Ya tienes
  register,
  validateEmail, 
  login,
  
  // FALTAN implementar
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

import { 
  // Ya tienes
  validate,
  
  // FALTA roleMiddleware
  authMiddleware,
  roleMiddleware 
} from '../middleware/auth.middleware.js';

//  FALTAN esquemas Zod
import {
  registerSchema,
  validationCodeSchema,
  loginSchema,
  
  //  FALTAN
  personalDataSchema,
  companySchema,
  refreshSchema,
  passwordSchema,
  inviteSchema
} from '../validators/user.validator.js';

//  Multer para logo
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo imágenes'), false);
    }
  }
});

const router = express.Router();

//  YA FUNCIONAN (1 punto cada uno)
router.post('/register', validate(registerSchema), register);
router.put('/validation', authMiddleware, validate(validationCodeSchema), validateEmail);
router.post('/login', validate(loginSchema), login);

// FALTAN 
router.get('/', authMiddleware, getUser);                                    // populate + fullName
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);  // datos personales
router.patch('/company', authMiddleware, validate(companySchema), updateCompany);            // CIF + isFreelance
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);                    // multer

router.post('/refresh', validate(refreshSchema), refreshToken);      // JWT refresh
router.post('/logout', authMiddleware, logout);                      // invalida refresh

router.delete('/', authMiddleware, deleteUser);                      // soft/hard delete
router.put('/password', authMiddleware, validate(passwordSchema), changePassword);  // bonus 0.5
router.post('/invite', authMiddleware, roleMiddleware('admin'), validate(inviteSchema), inviteUser);  // 1 punto

export default router;