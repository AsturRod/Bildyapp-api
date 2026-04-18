import AppError from "../utils/AppError.js";

export const validate = (schema) => {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(
        AppError.badRequest(
          'Datos de entrada no válidos',
          result.error.flatten()
        )
      );
    }

    req.validated = result.data;
    return next();
  };
};