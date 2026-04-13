import AppError from "../utils/AppError.js";

export const validate = (schema) => {
  return (req, _res, next) => {
    console.log('VALIDATE:', req.path); // ← AÑADE
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      console.log('VALIDATION ERROR:', result.error.errors[0]); 
      return next(
        AppError.badRequest(
          'Datos de entrada no válidos',
          result.error.flatten()
        )
      );
    }

    req.validated = result.data;
    console.log('VALIDATION OK'); 
    return next();
  };
};