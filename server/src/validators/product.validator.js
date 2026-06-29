const { z } = require('zod');

const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'used']).default('used'),
  location: z.string().optional().default(''),
  images: z.array(z.string()).optional(),
});

const updateProductSchema = createProductSchema.partial();

module.exports = { createProductSchema, updateProductSchema };
