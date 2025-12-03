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

const businessAssignSchema = z
  .object({
    ownerId: z
      .number({
        invalid_type_error: 'ownerId must be a number'
      })
      .int('ownerId must be an integer')
      .positive('ownerId must be positive')
      .optional(),
    lawyerId: z
      .number({
        invalid_type_error: 'lawyerId must be a number'
      })
      .int('lawyerId must be an integer')
      .positive('lawyerId must be positive')
      .optional()
  })
  .refine(
    (data) => data.ownerId !== undefined || data.lawyerId !== undefined,
    { message: 'ownerId or lawyerId is required' }
  );

// =====================
// CONSULTATION SCHEMAS
// =====================

const consultationSchema = z.object({
  businessId: z
    .number({
      required_error: 'businessId is required',
      invalid_type_error: 'businessId must be a number'
    })
    .int('businessId must be an integer')
    .positive('businessId must be positive'),
  note: z.string().min(10, 'Note must be at least 10 characters')
});

const consultationAssignSchema = z.object({
  lawyerId: z
    .number({
      required_error: 'lawyerId is required',
      invalid_type_error: 'lawyerId must be a number'
    })
    .int('lawyerId must be an integer')
    .positive('lawyerId must be positive')
});

const consultationStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    required_error: 'status is required',
    invalid_type_error: 'status must be a valid value'
  })
});

const consultationResultSchema = z
  .object({
    notes: z
      .string()
      .min(5, 'notes must be at least 5 characters')
      .optional(),
    status: z
      .enum(['PENDING', 'APPROVED', 'REJECTED'])
      .optional()
  })
  .refine(
    (data) => data.notes !== undefined || data.status !== undefined,
    { message: 'notes or status is required' }
  );

module.exports = {
  registerSchema,
  loginSchema,
  businessSchema,
  businessUpdateSchema,
  businessAssignSchema,
  consultationSchema,
  consultationAssignSchema,
  consultationStatusSchema,
  consultationResultSchema
};