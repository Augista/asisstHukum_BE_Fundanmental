const prisma = require('../utils/prismaClient');
const path = require('path');
const fs = require('fs');

async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const businessId = Number(req.params.businessId || req.body.businessId);

    if (Number.isNaN(businessId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid businessId'
      });
    }

    const file = await prisma.file.create({
      data: {
        businessId,
        filename: req.file.originalname,
        url: req.file.filename
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file
    });
  } catch (error) {
    next(error);
  }
}

async function getBusinessFiles(req, res, next) {
  try {
    const businessId = Number(req.params.businessId);

    if (Number.isNaN(businessId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid businessId'
      });
    }

    const files = await prisma.file.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: 'Files fetched successfully',
      data: files
    });
  } catch (error) {
    next(error);
  }
}

async function downloadFile(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file id'
      });
    }

    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, file.url);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
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
      return res.status(400).json({
        success: false,
        message: 'Invalid file id'
      });
    }

    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, file.url);

    // Delete physical file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await prisma.file.delete({ where: { id } });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
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
