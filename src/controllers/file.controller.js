import { prisma } from "../utils/prisma.js";
import path from "path";
import fs from "fs";

export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const file = await prisma.file.create({
    data: {
      filename: req.file.originalname,
      path: req.file.filename,
      userId: req.user.id
    }
  });

  res.json(file);
};

export const getMyFiles = async (req, res) => {
  const files = await prisma.file.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" }
  });
  res.json(files);
};

export const downloadFile = async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file || file.userId !== req.user.id)
    return res.status(404).json({ error: "Not found" });

  const filePath = path.join("src/uploads", file.path);
  res.sendFile(path.resolve(filePath));
};

export const deleteFile = async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file || file.userId !== req.user.id)
    return res.status(404).json({ error: "Not found" });

  fs.unlinkSync(path.join("src/uploads", file.path));
  await prisma.file.delete({ where: { id: req.params.id } });

  res.json({ message: "Deleted" });
};
