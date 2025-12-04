const { ZodError } = require('zod');
const { validationErrorResponse } = require('../utils/response');

function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return validationErrorResponse(res, err.errors);
      }

      next(err);
    }
  };
}

module.exports = { validate };
