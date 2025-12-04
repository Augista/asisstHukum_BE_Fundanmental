const { errorResponse } = require('../utils/response');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      code: err.code,
      name: err.name,
      statusCode: err.statusCode,
      stack: err.stack
    });
  }

  if (err instanceof AppError) {
    return errorResponse(res, err.statusCode, err.message, err.errorCode);
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid or expired token', 'UNAUTHORIZED');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token has expired', 'TOKEN_EXPIRED');
  }

  if (err.status || err.statusCode) {
    const statusCode = err.status || err.statusCode;
    const errorCode = err.errorCode || getErrorCode(statusCode);
    return errorResponse(res, statusCode, err.message || 'An error occurred', errorCode);
  }

  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  if (err.name === 'MulterError') {
    return handleMulterError(err, res);
  }

  if (err.name === 'ZodError') {
    return errorResponse(res, 400, 'Validation error', 'VALIDATION_ERROR');
  }

  if (err.name === 'CastError' || err.name === 'TypeError') {
    return errorResponse(res, 400, 'Invalid data format', 'INVALID_FORMAT');
  }

  return errorResponse(res, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? err.message : undefined
  );
}

function handlePrismaError(err, res) {
  const prismaErrors = {
    P2000: { status: 400, message: 'Value too long for column', code: 'VALUE_TOO_LONG' },
    P2001: { status: 404, message: 'Record not found', code: 'NOT_FOUND' },
    P2002: { status: 409, message: 'Duplicate entry. This record already exists.', code: 'DUPLICATE_ENTRY' },
    P2003: { status: 400, message: 'Foreign key constraint failed', code: 'FOREIGN_KEY_CONSTRAINT' },
    P2004: { status: 400, message: 'Constraint failed', code: 'CONSTRAINT_FAILED' },
    P2005: { status: 400, message: 'Invalid value for field', code: 'INVALID_FIELD_VALUE' },
    P2006: { status: 400, message: 'Invalid value provided', code: 'INVALID_VALUE' },
    P2007: { status: 400, message: 'Data validation error', code: 'DATA_VALIDATION_ERROR' },
    P2008: { status: 400, message: 'Query parsing error', code: 'QUERY_PARSING_ERROR' },
    P2009: { status: 400, message: 'Query validation error', code: 'QUERY_VALIDATION_ERROR' },
    P2010: { status: 500, message: 'Raw query failed', code: 'RAW_QUERY_FAILED' },
    P2011: { status: 400, message: 'Null constraint violation', code: 'NULL_CONSTRAINT' },
    P2012: { status: 400, message: 'Missing required value', code: 'MISSING_REQUIRED_VALUE' },
    P2013: { status: 400, message: 'Missing required argument', code: 'MISSING_REQUIRED_ARGUMENT' },
    P2014: { status: 400, message: 'Relation violation', code: 'RELATION_VIOLATION' },
    P2015: { status: 404, message: 'Record not found', code: 'NOT_FOUND' },
    P2016: { status: 400, message: 'Query interpretation error', code: 'QUERY_INTERPRETATION_ERROR' },
    P2017: { status: 400, message: 'Records for relation not connected', code: 'RECORDS_NOT_CONNECTED' },
    P2018: { status: 404, message: 'Required connected records not found', code: 'REQUIRED_RECORDS_NOT_FOUND' },
    P2019: { status: 400, message: 'Input error', code: 'INPUT_ERROR' },
    P2020: { status: 400, message: 'Value out of range', code: 'VALUE_OUT_OF_RANGE' },
    P2021: { status: 404, message: 'Table does not exist', code: 'TABLE_NOT_FOUND' },
    P2022: { status: 404, message: 'Column does not exist', code: 'COLUMN_NOT_FOUND' },
    P2023: { status: 400, message: 'Inconsistent column data', code: 'INCONSISTENT_COLUMN_DATA' },
    P2024: { status: 408, message: 'Timed out fetching a new connection from the connection pool', code: 'CONNECTION_TIMEOUT' },
    P2025: { status: 404, message: 'Record not found', code: 'NOT_FOUND' },
    P2026: { status: 400, message: 'Unsupported feature', code: 'UNSUPPORTED_FEATURE' },
    P2027: { status: 500, message: 'Multiple errors occurred', code: 'MULTIPLE_ERRORS' },
    P2028: { status: 500, message: 'Transaction API error', code: 'TRANSACTION_ERROR' },
    P2030: { status: 500, message: 'Full-text search index not found', code: 'FULLTEXT_INDEX_NOT_FOUND' },
    P2031: { status: 500, message: 'MongoDB replica set required', code: 'MONGODB_REPLICA_SET_REQUIRED' },
    P2033: { status: 500, message: 'Number exceeds 64-bit integer', code: 'NUMBER_EXCEEDS_INTEGER' },
    P2034: { status: 500, message: 'Transaction failed', code: 'TRANSACTION_FAILED' }
  };

  const errorInfo = prismaErrors[err.code] || {
    status: 500,
    message: 'Database error occurred',
    code: 'DATABASE_ERROR'
  };

  return errorResponse(res, errorInfo.status, errorInfo.message, errorInfo.code);
}

function handleMulterError(err, res) {
  const multerErrors = {
    LIMIT_FILE_SIZE: { message: 'File too large', code: 'FILE_TOO_LARGE' },
    LIMIT_FILE_COUNT: { message: 'Too many files', code: 'TOO_MANY_FILES' },
    LIMIT_FIELD_KEY: { message: 'Field name too long', code: 'FIELD_NAME_TOO_LONG' },
    LIMIT_FIELD_VALUE: { message: 'Field value too long', code: 'FIELD_VALUE_TOO_LONG' },
    LIMIT_FIELD_COUNT: { message: 'Too many fields', code: 'TOO_MANY_FIELDS' },
    LIMIT_UNEXPECTED_FILE: { message: 'Unexpected file field', code: 'UNEXPECTED_FILE' },
    MISSING_FIELD_NAME: { message: 'Missing field name', code: 'MISSING_FIELD_NAME' }
  };

  const errorInfo = multerErrors[err.code] || {
    message: 'File upload error',
    code: 'FILE_UPLOAD_ERROR'
  };

  return errorResponse(res, 400, errorInfo.message, errorInfo.code);
}

function getErrorCode(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };
  return codes[statusCode] || 'UNKNOWN_ERROR';
}

module.exports = errorHandler;
