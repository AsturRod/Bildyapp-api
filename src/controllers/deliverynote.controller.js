import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';
import { emitToCompany } from '../services/socket.service.js';
import path from 'path';

const getCompanyId = (user) => {
  if (!user?.company) return null;
  if (typeof user.company === 'object' && user.company._id) return user.company._id;
  return user.company;
};

const isExternalPdfUrl = (pdfUrl) => {
  return typeof pdfUrl === 'string' && pdfUrl.startsWith('http') && !pdfUrl.includes('/api/deliverynote/pdf/');
};

const deliveryNotePopulate = 'user company client project';

export const createDeliveryNote = async (req, res, next) => {
  try {
    const deliveryNoteData = req.validated.body;
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const [client, project] = await Promise.all([
      Client.findOne({ _id: deliveryNoteData.client, company: companyId }).lean(),
      Project.findOne({ _id: deliveryNoteData.project, company: companyId }).lean(),
    ]);

    if (!client) {
      return next(AppError.notFound('Cliente no encontrado en la compañía del usuario'));
    }

    if (!project) {
      return next(AppError.notFound('Proyecto no encontrado en la compañía del usuario'));
    }

    if (String(project.client) !== String(client._id)) {
      return next(AppError.badRequest('El proyecto no pertenece al cliente indicado'));
    }

    deliveryNoteData.user = req.user._id;
    deliveryNoteData.company = companyId;

    const deliveryNote = await DeliveryNote.create(deliveryNoteData);

    const populated = await DeliveryNote.findById(deliveryNote._id)
      .populate(deliveryNotePopulate)
      .lean();

    emitToCompany(companyId, 'deliverynote:new', {
      _id: populated._id,
      format: populated.format,
      description: populated.description,
      workDate: populated.workDate,
      client: populated.client?.name,
      project: populated.project?.name,
      signed: populated.signed,
      createdAt: populated.createdAt,
      createdBy: populated.user?.email,
    });

    return res.status(201).json({
      status: 'success',
      data: populated,
    });
  } catch (error) {
    return next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const page = req.validated.query.page;
    const limit = req.validated.query.limit;
    const project = req.validated.query.project;
    const client = req.validated.query.client;
    const format = req.validated.query.format;
    const signed = req.validated.query.signed;
    const from = req.validated.query.from;
    const to = req.validated.query.to;
    const sort = req.validated.query.sort || '-workDate';
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const filter = { company: companyId, deleted: { $ne: true } };

    if (project) filter.project = project;
    if (client) filter.client = client;
    if (format) filter.format = format;
    if (signed !== undefined) filter.signed = signed === 'true';

    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = new Date(from);
      if (to) filter.workDate.$lte = new Date(to);

      if (Number.isNaN(new Date(from).getTime()) && from) {
        return next(AppError.badRequest('La fecha "from" no es válida'));
      }

      if (Number.isNaN(new Date(to).getTime()) && to) {
        return next(AppError.badRequest('La fecha "to" no es válida'));
      }
    }

    const skip = (page - 1) * limit;

    const [deliveryNotes, totalItems] = await Promise.all([
      DeliveryNote.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(deliveryNotePopulate)
        .lean(),
      DeliveryNote.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      status: 'success',
      data: deliveryNotes,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getDeliveryNoteById = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.validated.params.id,
      company: companyId,
    })
      .populate(deliveryNotePopulate)
      .lean();

    if (!deliveryNote) {
      return next(AppError.notFound('Albarán no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      data: deliveryNote,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.validated.params.id,
      company: companyId,
    });

    if (!deliveryNote) {
      return next(AppError.notFound('Albarán no encontrado'));
    }

    if (deliveryNote.signed) {
      return next(AppError.badRequest('No se puede borrar un albarán firmado'));
    }

    await deliveryNote.deleteOne();

    return res.status(200).json({
      status: 'success',
      message: 'Albarán eliminado correctamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.validated.params.id,
      company: companyId,
    });

    if (!deliveryNote) {
      return next(AppError.notFound('Albarán no encontrado'));
    }

    if (deliveryNote.signed) {
      return next(AppError.badRequest('El albarán ya está firmado'));
    }

    if (!req.file) {
      return next(AppError.badRequest('Debes enviar un archivo de firma'));
    }

    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    const signaturePath = req.file.path || req.file.filename;
    deliveryNote.signatureUrl = signaturePath ? path.resolve(signaturePath) : null;
    deliveryNote.pdfUrl = `/api/deliverynote/pdf/${deliveryNote._id}`;

    await deliveryNote.save();

    const populated = await DeliveryNote.findById(deliveryNote._id)
      .populate(deliveryNotePopulate)
      .lean();

    
    emitToCompany(companyId, 'deliverynote:signed', {
      _id: populated._id,
      format: populated.format,
      client: populated.client?.name,
      project: populated.project?.name,
      signedAt: populated.signedAt,
      signedBy: populated.user?.email,
      pdfUrl: populated.pdfUrl,
    });

    emitToCompany(companyId, 'deliverynote:updated', {
      _id: populated._id,
      format: populated.format,
      description: populated.description,
      workDate: populated.workDate,
      client: populated.client?.name,
      project: populated.project?.name,
      signed: populated.signed,
      signedAt: populated.signedAt,
      pdfUrl: populated.pdfUrl,
      createdAt: populated.createdAt,
      createdBy: populated.user?.email,
    });

    return res.status(200).json({
      status: 'success',
      data: populated,
    });
  } catch (error) {
    return next(error);
  }
};

export const getDeliveryNotePdf = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.validated.params.id,
      company: companyId,
    })
      .populate(deliveryNotePopulate)
      .lean();

    if (!deliveryNote) {
      return next(AppError.notFound('Albarán no encontrado'));
    }

    if (deliveryNote.signed && isExternalPdfUrl(deliveryNote.pdfUrl)) {
      return res.status(200).json({
        status: 'success',
        data: {
          pdfUrl: deliveryNote.pdfUrl,
        },
      });
    }

    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="delivery-note-${deliveryNote._id}.pdf"`);

    return res.send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
};