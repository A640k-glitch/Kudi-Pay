import { z } from "zod";

export const phoneSchema = z.string().regex(/^(080|070|090|081|091|\+234)\d{8,9}$/, "Please enter a valid Nigerian phone number");

export const signupSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, "Password is required"),
});

export const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export const businessSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  category: z.string().min(1, "Please select a category"),
  state: z.string().min(1, "Please select a state"),
  lga: z.string().min(1, "Please select an LGA"),
  logoUrl: z.string().optional(),
});

export const storefrontSchema = z.object({
  storefrontSlug: z.string().regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  theme: z.enum(["light", "brutal", "modern"]),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean(),
  trackStock: z.boolean(),
  stockCount: z.number().optional(),
  // Dynamic category-specific fields (Fashion sizes, Food dietary, etc.)
  attributes: z.record(z.string(), z.string()).optional(),
}).refine(data => {
  if (data.trackStock && (data.stockCount === undefined || data.stockCount < 0)) {
    return false;
  }
  return true;
}, {
  message: "Valid stock count is required when tracking stock",
  path: ["stockCount"],
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: phoneSchema,
  note: z.string().optional(),
});
