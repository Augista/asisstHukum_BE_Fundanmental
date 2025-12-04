const successResponse = (res, statusCode = 200, message, data = null) => {
  const response = {
    success: true,
    message: message || 'Success',
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode = 400, message, errorCode = null, error = null) => {
  const response = {
    success: false,
    message: message || 'An error occurred',
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errorCode: 'VALIDATION_ERROR',
    errors: errors
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse
};
