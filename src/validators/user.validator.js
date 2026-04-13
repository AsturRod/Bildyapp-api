import { z } from 'zod';
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'El email no es válido' }));

const passwordSchema = z
  .string()
  .trim()
  .min(8, 'La contraseña debe tener al menos 8 caracteres');

const requiredText = (field) =>
  z.string().trim().min(1, `El campo ${field} es obligatorio`);

const addressSchema = z.object({
  street: requiredText('street'),
  number: requiredText('number'),
  postal: requiredText('postal'),
  city: requiredText('city'),
  province: requiredText('province'),
});

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const validationCodeSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'El código de validación debe tener 6 dígitos'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const personalDataSchema = z.object({
  body: z.object({
    name: requiredText('name'),
    lastName: requiredText('lastName'),
    nif: requiredText('nif'),
  }),
});

export const companySchema = z.object({
  body: z.object({
    name: requiredText('name'),
    cif: requiredText('cif'),
    address: addressSchema,
    isFreelance: z.boolean(),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .trim()
      .min(1, 'El token de actualización es obligatorio'),
  }),
});

export const deleteUserSchema = z.object({
  query: z.object({
    soft: z.enum(['true', 'false']).optional(),
  }),
});

export const passwordUpdateSchema = z
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

export const inviteSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: requiredText('name'),
    lastName: requiredText('lastName'),
    nif: requiredText('nif'),
  }),
});