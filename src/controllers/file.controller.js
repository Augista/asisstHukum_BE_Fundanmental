const prisma = require('../utils/prismaClient');
const path = require('path');
const fs = require('fs');
const { successResponse, errorResponse } = require('../utils/response');

async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded', 'NO_FILE');
    }

    const businessId = Number(req.params.businessId || req.body.businessId);

    if (Number.isNaN(businessId)) {
      return errorResponse(res, 400, 'Invalid businessId', 'INVALID_ID');
    }

    const file = await prisma.file.create({
      data: {
        businessId,
        filename: req.file.originalname,
        url: req.file.filename
      }
    });

    return successResponse(res, 201, 'File uploaded successfully', file);
  } catch (error) {
    next(error);
  }
}

async function getBusinessFiles(req, res, next) {
  try {
    const businessId = Number(req.params.businessId);

    if (Number.isNaN(businessId)) {
      return errorResponse(res, 400, 'Invalid businessId', 'INVALID_ID');
    }

    const files = await prisma.file.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, 'Files fetched successfully', files);
  } catch (error) {
    next(error);
  }
}

async function downloadFile(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return errorResponse(res, 400, 'Invalid file id', 'INVALID_ID');
    }

    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return errorResponse(res, 404, 'File not found', 'NOT_FOUND');
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, file.url);

    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 404, 'File not found on server', 'FILE_NOT_FOUND');
    }

    res.download(filePath, file.filename);
  } catch (error) {
    next(error);
  }
}

async function deleteFile(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return errorResponse(res, 400, 'Invalid file id', 'INVALID_ID');
    }

    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return errorResponse(res, 404, 'File not found', 'NOT_FOUND');
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, file.url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.file.delete({ where: { id } });

    return successResponse(res, 200, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadFile,
  getBusinessFiles,
  downloadFile,
  deleteFile
};
