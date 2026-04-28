import { z } from 'zod';

const requiredField = (field) =>
  z.string().trim().min(1, `El campo ${field} es obligatorio`);

const mongoIdSchema = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');

const dateSchema = z.coerce.date({
  errorMap: () => ({ message: 'Fecha inválida' }),
});

const workerSchema = z.object({
  name: requiredField('nombre del trabajador'),
  hours: z.coerce.number().min(0, 'Las horas deben ser 0 o superiores'),
});

const materialItemSchema = z.object({
  material: requiredField('material'),
  quantity: z.coerce.number().min(0, 'La cantidad debe ser 0 o superior'),
  unit: requiredField('unidad'),
});

const baseDeliveryNoteBodySchema = z.object({
  client: mongoIdSchema,
  project: mongoIdSchema,
  format: z.enum(['material', 'hours'], {
    message: 'El formato debe ser material o hours',
  }),
  description: requiredField('descripción'),
  workDate: dateSchema,

  material: z.string().trim().optional(),
  quantity: z.coerce.number().min(0, 'La cantidad debe ser 0 o superior').optional(),
  unit: z.string().trim().optional(),

  hours: z.coerce.number().min(0, 'Las horas deben ser 0 o superiores').optional(),
  workers: z.array(workerSchema).optional(),

  materials: z.array(materialItemSchema).optional(),
});

export const createDeliveryNoteSchema = z.object({
  body: baseDeliveryNoteBodySchema.superRefine((data, ctx) => {
    if (data.format === 'material') {
      const hasSimpleMaterial =
        !!data.material?.trim() &&
        data.quantity !== undefined &&
        !!data.unit?.trim();

      const hasMaterialsArray = Array.isArray(data.materials) && data.materials.length > 0;

      if (!hasSimpleMaterial && !hasMaterialsArray) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Debes enviar material, quantity y unit o una lista de materials para un albarán de tipo material',
          path: ['materials'],
        });
      }
    }

    if (data.format === 'hours') {
      const hasSimpleHours = data.hours !== undefined;
      const hasWorkersArray = Array.isArray(data.workers) && data.workers.length > 0;

      if (!hasSimpleHours && !hasWorkersArray) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Debes enviar hours o una lista de workers para un albarán de tipo hours',
          path: ['workers'],
        });
      }
    }
  }),
});

export const deliveryNoteParamsSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
});

export const listDeliveryNotesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    project: mongoIdSchema.optional(),
    client: mongoIdSchema.optional(),
    format: z.enum(['material', 'hours']).optional(),
    signed: z.enum(['true', 'false']).optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
    sort: z
      .enum(['workDate', '-workDate', 'createdAt', '-createdAt'])
      .optional(),
  }),
});

export const signDeliveryNoteSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
});