import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .pipe(z.email())
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres');

const addressSchema = z.object({
  street: z.string().trim().min(1, 'La calle no puede estar vacía'),
  number: z.string().trim().min(1, 'El número es obligatorio'),
  postal: z.string().trim().min(1, 'El código postal es obligatorio'),
  city: z.string().trim().min(1, 'La ciudad es obligatoria'),
  province: z.string().trim().min(1, 'La provincia es obligatoria'),
});

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const validationCodeSchema = z.object({
  body: z.object({
    code: z.string().regex(/^\d{6}$/, 'El código de validación debe tener 6 dígitos'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const updatePersonalDataSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'El nombre no puede estar vacío'),
    lastName: z.string().trim().min(1, 'El apellido no puede estar vacío'),
    nif: z.string().trim().min(1, 'El NIF es obligatorio'),
  }),
});

export const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'El nombre de la empresa no puede estar vacío'),
    cif: z.string().trim().min(1, 'El CIF es obligatorio'),
    address: addressSchema,
    isFreelance: z.boolean(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().trim().min(1, 'El token de actualización es obligatorio'),
  }),
});

export const deleteUserSchema = z.object({
  query: z.object({
    soft: z.enum(['true', 'false']).optional(),
  }),
});

export const updatePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: passwordSchema,
      newPassword: passwordSchema,
    }),
  })
  .refine((data) => data.body.currentPassword !== data.body.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['body', 'newPassword'],
  });

export const inviteUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});