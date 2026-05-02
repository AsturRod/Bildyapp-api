import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import notificationService from '../services/notification.service.js';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id.toString() },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiration }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id.toString() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiration }
  );
};

const issueTokensForUser = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const generateVerificationCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const normalizeCompany = (company) => {
  if (!company || typeof company === 'string') return null;
  if (company._id) return company;
  return null;
};

const buildAuthResponse = (user, tokens) => {
  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name ?? null,
      lastName: user.lastName ?? null,
      fullName: user.fullName ?? null,
      status: user.status,
      role: user.role,
      company: normalizeCompany(user.company),
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;

    const existingVerifiedUser = await User.findOne({
      email,
      status: 'verified',
      deleted: false,
    });

    if (existingVerifiedUser) {
      return next(AppError.conflict('Ya existe un usuario validado con ese email'));
    }

    const existingPendingUser = await User.findOne({
      email,
      status: 'pending',
      deleted: false,
    });

    const verificationCode = generateVerificationCode();

    if (existingPendingUser) {
      return next(
        AppError.conflict(
          'Ya existe un registro pendiente con ese email. Solicita reenvío del código de validación.'
        )
      );
    }

    const user = await User.create({
      email,
      password,
      verificationCode,
      verificationAttempts: 3,
      verificationCodeSentAt: new Date(),
      verificationResendWindowStart: new Date(),
      verificationResendCount: 0,
      role: 'admin',
      status: 'pending',
    });
    const tokens = await issueTokensForUser(user);

    notificationService.emit('user:registered', user);

    return res.status(201).json(buildAuthResponse(user, tokens));
  } catch (error) {
    return next(error);
  }
};

export const resendValidationCode = async (req, res, next) => {
  try {
    const { email } = req.validated.body;

    const user = await User.findOne({
      email,
      deleted: false,
    }).select(
      '+verificationCode +verificationAttempts +verificationCodeSentAt +verificationResendWindowStart +verificationResendCount'
    );

    if (!user) {
      return next(AppError.notFound('No existe un usuario con ese email'));
    }

    if (user.status === 'verified') {
      return next(AppError.badRequest('El usuario ya está verificado'));
    }

    const now = Date.now();
    const COOLDOWN_MS = 60 * 1000;
    const WINDOW_MS = 60 * 60 * 1000;
    const MAX_RESENDS_PER_WINDOW = 5;

    if (
      user.verificationCodeSentAt &&
      now - new Date(user.verificationCodeSentAt).getTime() < COOLDOWN_MS
    ) {
      return next(AppError.tooManyRequests('Espera al menos 60 segundos para solicitar otro código'));
    }

    const windowStart = user.verificationResendWindowStart
      ? new Date(user.verificationResendWindowStart).getTime()
      : now;

    if (now - windowStart >= WINDOW_MS) {
      user.verificationResendWindowStart = new Date(now);
      user.verificationResendCount = 0;
    }

    if ((user.verificationResendCount ?? 0) >= MAX_RESENDS_PER_WINDOW) {
      return next(AppError.tooManyRequests('Has alcanzado el máximo de reenvíos en la última hora'));
    }

    user.verificationCode = generateVerificationCode();
    user.verificationAttempts = 3;
    user.verificationCodeSentAt = new Date(now);
    user.verificationResendCount = (user.verificationResendCount ?? 0) + 1;
    await user.save();

    notificationService.emit('user:verification-code-resent', user);

    return res.status(200).json({
      message: 'Código de validación reenviado correctamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.validated.body;
    const user = await User.findById(req.user.id).select('+verificationCode +verificationAttempts');

    if (!user || user.deleted) {
      return next(AppError.notFound('Usuario no encontrado'));
    }

    if (user.status === 'verified') {
      return res.status(200).json({
        message: 'El usuario ya estaba verificado',
      });
    }

    if (user.verificationAttempts <= 0) {
      return next(AppError.tooManyRequests('Se agotaron los intentos de validación'));
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();

      if (user.verificationAttempts <= 0) {
        return next(AppError.tooManyRequests('Se agotaron los intentos de validación'));
      }

      return next(AppError.badRequest('Código de validación incorrecto'));
    }

    user.status = 'verified';
    user.verificationCode = null;
    user.verificationAttempts = 0;
    await user.save();

    notificationService.emit('user:verified', user);

    return res.status(200).json({
      message: 'Email validado correctamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;

    const user = await User.findOne({
      email,
      deleted: false,
    }).select('+password');

    if (!user) {
      return next(AppError.unauthorized('Credenciales incorrectas'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(AppError.unauthorized('Credenciales incorrectas'));
    }

    if (user.status !== 'verified') {
      return next(AppError.forbidden('Debes verificar tu email antes de iniciar sesión'));
    }

    const tokens = await issueTokensForUser(user);

    return res.status(200).json(buildAuthResponse(user, tokens));
  } catch (error) {
    return next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('company')
      .select('-password -verificationCode -verificationAttempts');

    if (!user || user.deleted) {
      return next(AppError.notFound('Usuario no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.validated.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, lastName, nif },
      { returnDocument: 'after', runValidators: true }
    ).populate('company');

    if (!user || user.deleted) {
      return next(AppError.notFound('Usuario no encontrado'));
    }

    return res.status(200).json({
      message: 'Datos personales actualizados correctamente',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const { name, cif, address, isFreelance } = req.validated.body;

    const user = await User.findById(req.user.id);

    if (!user || user.deleted) {
      return next(AppError.notFound('Usuario no encontrado'));
    }

    if (user.status !== 'verified') {
      return next(AppError.forbidden('Debes verificar tu email antes de continuar'));
    }

    let company;

    if (isFreelance) {
      if (!user.nif) {
        return next(AppError.badRequest('El usuario debe tener NIF para crear una compañía como autónomo'));
      }

      company = await Company.findOne({ cif: user.nif, deleted: false });

      if (!company) {
        company = await Company.create({
          owner: user._id,
          name: `${user.name || ''} ${user.lastName || ''}`.trim() || name,
          cif: user.nif,
          address,
          isFreelance: true,
          deleted: false,
        });
      }

      user.company = company._id;
      user.role = 'admin';
      await user.save();
    } else {
      company = await Company.findOne({ cif, deleted: false });

      if (!company) {
        company = await Company.create({
          owner: user._id,
          name,
          cif,
          address,
          isFreelance: false,
          deleted: false,
        });

        user.company = company._id;
        user.role = 'admin';
        await user.save();
      } else {
        user.company = company._id;
        user.role = 'guest';
        await user.save();
      }
    }

    const updatedUser = await User.findById(user._id)
      .populate('company')
      .select('-password -verificationCode -verificationAttempts');

    return res.status(200).json({
      message: 'Compañía asignada correctamente',
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(AppError.badRequest('Debes subir una imagen'));
    }

    const user = await User.findById(req.user.id);

    if (!user || user.deleted) {
      return next(AppError.notFound('Usuario no encontrado'));
    }

    if (!user.company) {
      return next(AppError.badRequest('El usuario no tiene una compañía asociada'));
    }

    const company = await Company.findById(user.company);

    if (!company || company.deleted) {
      return next(AppError.notFound('Compañía no encontrada'));
    }

    company.logo = `/uploads/${req.file.filename}`;
    await company.save();

    return res.status(200).json({
      message: 'Logo subido correctamente',
      data: company,
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: providedRefreshToken } = req.validated.body;

    if (!providedRefreshToken) {
      return next(AppError.badRequest('Refresh token requerido'));
    }

    const decoded = jwt.verify(providedRefreshToken, config.jwt.refreshSecret);

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.deleted) {
      return next(AppError.unauthorized('Refresh token inválido'));
    }

    if (!user.refreshToken || user.refreshToken !== providedRefreshToken) {
      return next(AppError.unauthorized('Refresh token inválido'));
    }

    const tokens = await issueTokensForUser(user);

    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    return next(AppError.unauthorized('Refresh token inválido o expirado'));
  }
};

export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

    return res.status(200).json({
      message: 'Logout realizado correctamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { soft } = req.query;

    const user = await User.findById(req.user.id);

    if (!user || user.deleted) {
      return next(AppError.notFound('Usuario no encontrado'));
    }

    if (soft === 'true') {
      user.deleted = true;
      await user.save();

      notificationService.emit('user:deleted', user);

      return res.status(200).json({
        message: 'Usuario eliminado lógicamente',
      });
    }

    await User.findByIdAndDelete(req.user.id);

    notificationService.emit('user:deleted', user);

    return res.status(200).json({
      message: 'Usuario eliminado definitivamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validated.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user || user.deleted) {
      return next(AppError.notFound('Usuario no encontrado'));
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return next(AppError.unauthorized('La contraseña actual no es correcta'));
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const inviteUser = async (req, res, next) => {
  try {
    const { email, password, name, lastName, nif } = req.validated.body;

    const inviter = await User.findById(req.user.id);

    if (!inviter || inviter.deleted) {
      return next(AppError.notFound('Usuario invitador no encontrado'));
    }

    if (inviter.role !== 'admin') {
      return next(AppError.forbidden('No tienes permisos para invitar usuarios'));
    }

    if (!inviter.company) {
      return next(AppError.badRequest('El usuario no tiene compañía asociada'));
    }

    const existingUser = await User.findOne({ email, deleted: false });

    if (existingUser) {
      return next(AppError.conflict('Ya existe un usuario con ese email'));
    }

    const invitedUser = await User.create({
      email,
      password,
      name,
      lastName,
      nif,
      role: 'guest',
      status: 'pending',
      company: inviter.company,
      verificationCode: generateVerificationCode(),
      verificationAttempts: 3,
    });

    notificationService.emit('user:invited', invitedUser);

    return res.status(201).json({
      message: 'Usuario invitado correctamente',
      data: {
        id: invitedUser._id,
        email: invitedUser.email,
        role: invitedUser.role,
        status: invitedUser.status,
        company: invitedUser.company,
      },
    });
  } catch (error) {
    return next(error);
  }
};