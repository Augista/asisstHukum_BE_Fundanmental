const { z } = require('zod');
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(3),
  role: z.enum(['owner', 'pengacara', 'admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const businessSchema = z.object({
  name: z.string().min(1),
  nib: z.string().optional()
});

const consultationSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10)
});

module.exports = { registerSchema, loginSchema, businessSchema, consultationSchema };