// controllers/file.controller.js
const prisma = require('../utils/prismaClient');
const path = require('path');
const fs = require('fs');
const { successResponse, errorResponse } = require('../utils/response');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

async function downloadFileBusiness(req, res, next) {
  try {
    const fileId = Number(req.params.fileId);
    if (Number.isNaN(fileId)) return errorResponse(res, 400, 'Invalid fileId', 'INVALID_ID');

    const file = await prisma.fileBusiness.findUnique({ where: { id: fileId } });
    if (!file) return errorResponse(res, 404, 'File not found', 'NOT_FOUND');

    const filename = path.basename(file.url);
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return errorResponse(res, 404, 'File not found on server', 'FILE_NOT_FOUND');

    return res.download(filePath, file.filename);
  } catch (error) {
    next(error);
  }
}

// Delete a file for a business (and remove disk file if present)
async function deleteFileBusiness(req, res, next) {
  try {
    const fileId = Number(req.params.fileId);
    if (Number.isNaN(fileId)) return errorResponse(res, 400, 'Invalid fileId', 'INVALID_ID');

    const file = await prisma.fileBusiness.findUnique({ where: { id: fileId } });
    if (!file) return errorResponse(res, 404, 'File not found', 'NOT_FOUND');

    const filename = path.basename(file.url);
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.fileBusiness.delete({ where: { id: fileId } });

    return successResponse(res, 200, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
}

async function downloadPermit(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid permit id', 'INVALID_ID');

    const permit = await prisma.permit.findUnique({ where: { id } });
    if (!permit) return errorResponse(res, 404, 'Permit not found', 'NOT_FOUND');

    const filename = path.basename(permit.url);
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return errorResponse(res, 404, 'Permit not found on server', 'FILE_NOT_FOUND');

    return res.download(filePath, permit.filename);
  } catch (err) {
    next(err);
  }
}

async function deletePermit(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid permit id', 'INVALID_ID');

    const permit = await prisma.permit.findUnique({ where: { id } });
    if (!permit) return errorResponse(res, 404, 'Permit not found', 'NOT_FOUND');

    const filePath = path.join(UPLOAD_DIR, path.basename(permit.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.permit.delete({ where: { id } });

    return successResponse(res, 200, 'Permit deleted successfully');
  } catch (err) {
    next(err);
  }
}

async function downloadFileResult(req, res, next) {
  try {
    const fileId = Number(req.params.fileId);
    if (Number.isNaN(fileId)) return errorResponse(res, 400, 'Invalid fileId', 'INVALID_ID');

    const file = await prisma.fileResult.findUnique({ where: { id: fileId } });
    if (!file) return errorResponse(res, 404, 'File not found', 'NOT_FOUND');

    const filename = path.basename(file.url);
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return errorResponse(res, 404, 'File not found on server', 'FILE_NOT_FOUND');

    return res.download(filePath, file.filename);
  } catch (err) {
    next(err);
  }
}

async function deleteFileResult(req, res, next) {
  try {
    const fileId = Number(req.params.fileId);
    if (Number.isNaN(fileId)) return errorResponse(res, 400, 'Invalid fileId', 'INVALID_ID');

    const file = await prisma.fileResult.findUnique({ where: { id: fileId } });
    if (!file) return errorResponse(res, 404, 'File not found', 'NOT_FOUND');

    const filePath = path.join(UPLOAD_DIR, path.basename(file.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.fileResult.delete({ where: { id: fileId } });

    return successResponse(res, 200, 'File deleted successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  downloadFileBusiness,
  deleteFileBusiness,
  downloadPermit,
  deletePermit,
  downloadFileResult,
  deleteFileResult
};
