import { z } from 'zod';

const requiredField = (field) =>
  z.string().trim().min(1, `El campo ${field} es obligatorio`);

const emailSchema = z.string().trim().toLowerCase().email('Email inválido');
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido');
const projectCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'El campo código de proyecto es obligatorio');

const addressSchema = z.object({
  street: requiredField('calle'),
  number: requiredField('número'),
  postal: requiredField('código postal'),
  city: requiredField('ciudad'),
  province: requiredField('provincia'),
});

export const createProjectSchema = z.object({
  body: z.object({
    client: objectIdSchema,
    name: requiredField('nombre'),
    projectCode: projectCodeSchema,
    address: addressSchema,
    email: emailSchema,
    notes: z.string().trim().optional(),
    active: z.boolean().optional(),
  }),
});

export const updateProjectRequestSchema = z
  .object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: z.object({
      client: objectIdSchema.optional(),
      name: requiredField('nombre').optional(),
      projectCode: projectCodeSchema.optional(),
      address: addressSchema.partial().optional(),
      email: emailSchema.optional(),
      notes: z.string().trim().optional(),
      active: z.boolean().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data.body).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes enviar al menos un campo para actualizar',
        path: ['body'],
      });
    }
  });

export const listProjectsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    client: objectIdSchema.optional(),
    name: z.string().trim().optional(),
    active: z.enum(['true', 'false']).optional(),
    sort: z.enum(['name', '-name', 'createdAt', '-createdAt']).optional(),
  }),
});

export const projectIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const deleteProjectRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({
    soft: z.enum(['true', 'false']).optional(),
  }),
});