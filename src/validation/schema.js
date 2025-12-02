const { z } = require('zod');

// =====================
// AUTH SCHEMAS
// =====================

const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
  // role intentionally omitted: default OWNER, only admin can change via other flow
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// =====================
// BUSINESS SCHEMAS
// =====================

const businessSchema = z.object({
  name: z.string().min(3, 'Business name must be at least 3 characters'),
  // NIB Indonesia umumnya 13 digit; optional tapi jika diisi harus 13 karakter
  nib: z
    .string()
    .length(13, 'NIB must be exactly 13 characters')
    .optional()
});

// Untuk update: semua field optional
const businessUpdateSchema = businessSchema.partial();

// =====================
// CONSULTATION SCHEMAS
// =====================

const consultationSchema = z.object({
  // businessId sekarang integer (autoincrement) di Prisma
  businessId: z
    .number({
      required_error: 'businessId is required',
      invalid_type_error: 'businessId must be a number'
    })
    .int('businessId must be an integer')
    .positive('businessId must be positive'),
  note: z.string().min(10, 'Note must be at least 10 characters')
});

module.exports = {
  registerSchema,
  loginSchema,
  businessSchema,
  businessUpdateSchema,
  consultationSchema
};