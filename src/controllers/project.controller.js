import Client from '../models/Client.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

const ALLOWED_SORTS = new Set(['name', '-name', 'createdAt', '-createdAt']);

const getCompanyId = (user) => {
  if (!user?.company) return null;
  if (typeof user.company === 'object' && user.company._id) return user.company._id;
  return user.company;
};

const parseListOptions = (validatedQuery = {}) => {
  const page = validatedQuery.page ?? 1;
  const limit = validatedQuery.limit ?? 10;
  const client = validatedQuery.client;
  const name = validatedQuery.name?.trim();
  const active = validatedQuery.active;
  const requestedSort = validatedQuery.sort || '-createdAt';
  const sort = ALLOWED_SORTS.has(requestedSort) ? requestedSort : '-createdAt';
  const skip = (page - 1) * limit;

  return { page, limit, client, name, active, sort, skip };
};

const ensureCompanyClient = async (clientId, companyId) => {
  const client = await Client.findOne({
    _id: clientId,
    company: companyId,
  }).lean();

  if (!client) {
    throw AppError.badRequest('El cliente no existe o no pertenece a tu compañía');
  }

  return client;
};

export const getProjects = async (req, res, next) => {
  try {
    const { page, limit, client, name, active, sort, skip } = parseListOptions(req.validated.query);
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const filter = { company: companyId, deleted: { $ne: true } };

    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active !== undefined) filter.active = active === 'true';

    const [projects, totalItems] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user company client')
        .lean(),
      Project.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      status: 'success',
      data: projects,
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

export const createProject = async (req, res, next) => {
  try {
    const projectData = req.validated.body;
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    await ensureCompanyClient(projectData.client, companyId);

    projectData.user = req.user._id;
    projectData.company = companyId;

    const project = await Project.create(projectData);
    const populated = await Project.findById(project._id)
      .populate('user company client')
      .lean();

    return res.status(201).json({
      status: 'success',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(AppError.conflict('El código de proyecto ya existe en esta compañía'));
    }

    return next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const project = await Project.findOne({
      _id: req.validated.params.id,
      company: companyId,
    })
      .populate('user company client')
      .lean();

    if (!project) {
      return next(AppError.notFound('Proyecto no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      data: project,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    if (req.validated.body.client) {
      await ensureCompanyClient(req.validated.body.client, companyId);
    }

    const updatedProject = await Project.findOneAndUpdate(
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
      .populate('user company client')
      .lean();

    if (!updatedProject) {
      return next(AppError.notFound('Proyecto no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Proyecto actualizado correctamente',
      data: updatedProject,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(AppError.conflict('El código de proyecto ya existe en esta compañía'));
    }

    return next(error);
  }
};

export const deleteProject = async (req, res, next) => {
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
      const archivedProject = await Project.findOneAndUpdate(
        baseFilter,
        { deleted: true },
        { returnDocument: 'after', runValidators: false }
      ).lean();

      if (!archivedProject) {
        return next(AppError.notFound('Proyecto no encontrado'));
      }

      return res.status(200).json({
        status: 'success',
        message: 'Proyecto archivado correctamente',
      });
    }

    const deletedProject = await Project.findOneAndDelete(baseFilter).lean();

    if (!deletedProject) {
      return next(AppError.notFound('Proyecto no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Proyecto eliminado definitivamente',
    });
  } catch (error) {
    return next(error);
  }
};

export const getArchivedProjects = async (req, res, next) => {
  try {
    const { page, limit, client, name, active, sort, skip } = parseListOptions(req.validated.query);
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const filter = { company: companyId, deleted: true };

    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active !== undefined) filter.active = active === 'true';

    const [projects, totalItems] = await Promise.all([
      Project.find(filter)
        .setOptions({ includeDeleted: true })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user company client')
        .lean(),
      Project.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      status: 'success',
      data: projects,
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

export const restoreProject = async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.user);

    if (!companyId) {
      return next(AppError.forbidden('El usuario no tiene una compañía asociada'));
    }

    const restoredProject = await Project.findOneAndUpdate(
      {
        _id: req.validated.params.id,
        company: companyId,
        deleted: true,
      },
      { deleted: false },
      { returnDocument: 'after', runValidators: false }
    )
      .setOptions({ includeDeleted: true })
      .populate('user company client')
      .lean();

    if (!restoredProject) {
      return next(AppError.notFound('Proyecto archivado no encontrado'));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Proyecto restaurado correctamente',
      data: restoredProject,
    });
  } catch (error) {
    return next(error);
  }
};