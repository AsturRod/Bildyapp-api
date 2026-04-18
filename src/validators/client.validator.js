import { z } from 'zod';

const requiredField = (field) => z.string().trim().min(1, `El campo ${field} es obligatorio`);
const emailSchema = z.string().trim().toLowerCase().email('Email inválido');
const cifSchema = z.string().trim().toUpperCase().min(1, 'El campo CIF es obligatorio');
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido');

const addressSchema = z.object({
  street: requiredField('calle'),
  number: requiredField('número'),
  postal: requiredField('código postal'),
  city: requiredField('ciudad'),
  province: requiredField('provincia')
});

const updateClientBodySchema = z.object({
  name: requiredField('nombre').optional(),
  cif: cifSchema.optional(),
  email: emailSchema.optional(),
  phone: z.string().trim().optional(),
  address: addressSchema.partial().optional(),
});

export const createClientSchema = z.object({
  body: z.object({
    name: requiredField('nombre'),
    cif: cifSchema,
    email: emailSchema,
    phone: z.string().trim().optional(),
    address: addressSchema
  })
});

export const updateClientRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: updateClientBodySchema,
}).superRefine((data, ctx) => {
  if (Object.keys(data.body).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes enviar al menos un campo para actualizar',
      path: ['body'],
    });
  }
});

export const listClientsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    name: z.string().trim().optional(),
    sort: z.enum(['name', 'createdAt', '-name', '-createdAt']).optional()
  })
});

export const clientIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const deleteClientRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    soft: z.enum(['true', 'false']).optional(),
  }),
});