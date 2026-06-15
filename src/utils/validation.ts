import { z } from 'zod'

export const UserSchema = z.object({
  name:     z.string().min(2).max(50),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
  role:     z.enum(['admin', 'user']).default('user'),
})

export const ProductSchema = z.object({
  name:        z.string().min(1).max(100),
  price:       z.number().positive(),
  stock:       z.number().int().nonnegative(),
  category:    z.string().min(1),
  description: z.string().max(500).optional(),
})

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export type UserInput    = z.infer<typeof UserSchema>
export type ProductInput = z.infer<typeof ProductSchema>
export type LoginInput   = z.infer<typeof LoginSchema>

export function validateUser(data: unknown) {
  return UserSchema.safeParse(data)
}

export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data)
}

export function validateLogin(data: unknown) {
  return LoginSchema.safeParse(data)
}
