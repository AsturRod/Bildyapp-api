import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
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

const generateVerificationCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const buildAuthResponse = (user) => {
  return {
    user: {
      email: user.email,
      status: user.status,
      role: user.role,
    },
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const user = await User.create({
      email,
      password: hashedPassword,
      verificationCode,
      verificationAttempts: 3,
    });

    notificationService.emit('userregistered', user);

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.validated.body;
    const user = req.user;

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

    notificationService.emit('userverified', user);

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

    return res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};