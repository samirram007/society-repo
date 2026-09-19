import { z } from 'zod'

// ============================================
// MEMBER SCHEMA
// ============================================
export const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  role: z.enum(['owner', 'tenant', 'secretary', 'treasurer', 'chairman']),
  flatId: z.number().positive().optional(),
  profileImage: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

export type MemberInput = z.infer<typeof memberSchema>

// ============================================
// FLAT SCHEMA
// ============================================
export const flatSchema = z.object({
  flatNumber: z.string().min(1, 'Flat number is required').max(20),
  wing: z.string().max(10).optional().or(z.literal('')),
  floor: z.number().int().min(0, 'Floor must be non-negative'),
  area: z.number().positive().optional(),
  type: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'shop']),
  maintenanceAmount: z.number().min(0, 'Amount must be non-negative').default(0),
  isActive: z.boolean().default(true),
})

export type FlatInput = z.infer<typeof flatSchema>

// ============================================
// DUE SCHEMA
// ============================================
export const dueSchema = z.object({
  flatId: z.number().positive('Flat is required'),
  memberId: z.number().positive('Member is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(255).optional().or(z.literal('')),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  dueDate: z.date(),
  status: z.enum(['pending', 'paid', 'overdue', 'partial']).default('pending'),
  paidAmount: z.number().min(0).default(0),
})

export type DueInput = z.infer<typeof dueSchema>

// ============================================
// PAYMENT SCHEMA
// ============================================
export const paymentSchema = z.object({
  dueId: z.number().positive('Due is required'),
  memberId: z.number().positive('Member is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'online']),
  transactionId: z.string().max(100).optional().or(z.literal('')),
  paymentDate: z.date().default(new Date()),
  notes: z.string().optional().or(z.literal('')),
})

export type PaymentInput = z.infer<typeof paymentSchema>

// ============================================
// MAINTENANCE REQUEST SCHEMA
// ============================================
export const maintenanceRequestSchema = z.object({
  flatId: z.number().positive('Flat is required'),
  memberId: z.number().positive('Member is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().or(z.literal('')),
  category: z.enum(['plumbing', 'electrical', 'carpentry', 'painting', 'cleaning', 'security', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
  assignedTo: z.string().max(100).optional().or(z.literal('')),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
})

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>

// ============================================
// NOTICE SCHEMA
// ============================================
export const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  postedBy: z.number().positive('Posted by is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  isPinned: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type NoticeInput = z.infer<typeof noticeSchema>

// ============================================
// MEETING SCHEMA
// ============================================
export const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().or(z.literal('')),
  meetingDate: z.date(),
  location: z.string().max(255).optional().or(z.literal('')),
  organizedBy: z.number().positive('Organizer is required'),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled'),
  minutes: z.string().optional().or(z.literal('')),
})

export type MeetingInput = z.infer<typeof meetingSchema>

// ============================================
// VISITOR SCHEMA
// ============================================
export const visitorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
  purpose: z.string().max(255).optional().or(z.literal('')),
  flatId: z.number().positive('Flat is required'),
  visitingMemberId: z.number().positive().optional(),
  entryTime: z.date().default(new Date()),
  exitTime: z.date().optional(),
  vehicleNumber: z.string().max(20).optional().or(z.literal('')),
  idProof: z.string().max(255).optional().or(z.literal('')),
})

export type VisitorInput = z.infer<typeof visitorSchema>

// ============================================
// EXPENSE SCHEMA
// ============================================
export const expenseSchema = z.object({
  category: z.enum(['maintenance', 'electricity', 'water', 'security', 'cleaning', 'gardening', 'repairs', 'insurance', 'other']),
  description: z.string().min(1, 'Description is required').max(255),
  amount: z.number().positive('Amount must be positive'),
  vendor: z.string().max(255).optional().or(z.literal('')),
  invoiceNumber: z.string().max(100).optional().or(z.literal('')),
  expenseDate: z.date().default(new Date()),
  approvedBy: z.number().positive().optional(),
  status: z.enum(['pending', 'approved', 'paid', 'rejected']).default('pending'),
})

export type ExpenseInput = z.infer<typeof expenseSchema>

// ============================================
// AUTH SCHEMA
// ============================================
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
