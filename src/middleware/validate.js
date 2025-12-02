const { ZodError } = require('zod');

/**
 * Generic request body validator using Zod schema.
 * Usage: validate(registerSchema)
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      // overwrite body with parsed / sanitized data
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: err.errors
        });
      }

      next(err);
    }
  };
}

module.exports = { validate };


