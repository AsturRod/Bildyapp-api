import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

const ALLOWED_SORTS = new Set(['name', 'createdAt', '-name', '-createdAt']);

const getCompanyId = (user) => {
  if (!user?.company) return null;
  if (typeof user.company === 'object' && user.company._id) return user.company._id;
  return user.company;
};

const parseListOptions = (validatedQuery = {}) => {
  const page = validatedQuery.page ?? 1;
  const limit = validatedQuery.limit ?? 10;
  const name = validatedQuery.name?.trim();
  const requestedSort = validatedQuery.sort || 'createdAt';
  const sort = ALLOWED_SORTS.has(requestedSort) ? requestedSort : 'createdAt';
  const skip = (page - 1) * limit;

  return { page, limit, name, sort, skip };
};

export const getClients = async (req, res, next) => {
  try {
    const { page, limit, name, sort, skip } = parseListOptions(req.validated.query);
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const filter = { company: companyId };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const [clients, totalItems] = await Promise.all([
      Client.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user company')
        .lean(),
      Client.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      status: 'success',
      data: clients,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const clientData = req.validated.body;
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    clientData.user = req.user._id;
    clientData.company = companyId;

    const client = await Client.create(clientData);
    const populated = await Client.findById(client._id)
      .populate('user company')
      .lean();

    return res.status(201).json({ status: 'success', data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return next(AppError.conflict('CIF ya existe en esta compañía'));
    }
    return next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const client = await Client.findOne({
      _id: req.validated.params.id,
      company: companyId,
    })
      .populate('user company')
      .lean();

    if (!client) {
      return next(AppError.notFound('Cliente no encontrado'));
    }

    return res.status(200).json({ status: 'success', data: client });
  } catch (error) {
    return next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const updatedClient = await Client.findOneAndUpdate(
      {
        _id: req.validated.params.id,
        company: companyId,
      },
      req.validated.body,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    )
      .populate('user company')
      .lean();

    if (!updatedClient) {
      return next(AppError.notFound('Cliente no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cliente actualizado correctamente',
      data: updatedClient,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(AppError.conflict('CIF ya existe en esta compañía'));
    }

    return next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const baseFilter = {
      _id: req.validated.params.id,
      company: companyId,
    };

    if (req.validated.query.soft === 'true') {
      const existingClient = await Client.findOne(baseFilter)
        .setOptions({ includeDeleted: true })
        .lean();

      if (!existingClient) {
        return next(AppError.notFound('Cliente no encontrado'));
      }

      if (existingClient.deleted) {
        return next(AppError.badRequest('El cliente ya está archivado'));
      }

      const archivedClient = await Client.findOneAndUpdate(
        baseFilter,
        { deleted: true },
        { returnDocument: 'after', runValidators: false }
      )
        .setOptions({ includeDeleted: true })
        .lean();

      if (!archivedClient) {
        return next(AppError.notFound('Cliente no encontrado'));
      }

      return res.status(200).json({
        status: 'success',
        message: 'Cliente archivado correctamente',
      });
    }

    const deletedClient = await Client.findOneAndDelete(baseFilter)
      .setOptions({ includeDeleted: true })
      .lean();

    if (!deletedClient) {
      return next(AppError.notFound('Cliente no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cliente eliminado definitivamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const getArchivedClients = async (req, res, next) => {
  try {
    const { page, limit, name, sort, skip } = parseListOptions(req.validated.query);
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const filter = { company: companyId, deleted: true };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const [clients, totalItems] = await Promise.all([
      Client.find(filter)
        .setOptions({ includeDeleted: true })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user company')
        .lean(),
      Client.countDocuments(filter).setOptions({ includeDeleted: true }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      status: 'success',
      data: clients,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const restoredClient = await Client.findOneAndUpdate(
      {
        _id: req.validated.params.id,
        company: companyId,
        deleted: true,
      },
      { deleted: false },
      { returnDocument: 'after', runValidators: false }
    )
      .setOptions({ includeDeleted: true })
      .populate('user company')
      .lean();

    if (!restoredClient) {
      return next(AppError.notFound('Cliente archivado no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cliente restaurado correctamente',
      data: restoredClient,
    });
  } catch (error) {
    return next(error);
  }
};