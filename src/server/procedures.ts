import { os } from '@orpc/server'
import { z } from 'zod'
import { db } from '@/db'
import { and, eq, desc, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'society-erp-jwt-secret-key-2025')

// ============================================
// AUTH PROCEDURES
// ============================================
export const authProcedures = {
  login: os
    .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
    .handler(async ({ input }) => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, input.email)).limit(1)
      if (!user) throw new Error('Invalid email or password')
      
      const valid = await bcrypt.compare(input.password, user.passwordHash)
      if (!valid) throw new Error('Invalid email or password')
      
      // Use real role from database
      const userRole = (user as any).role || 'member'
      const userPermissions = (user as any).permissions || null
      
      const token = await new SignJWT({ userId: user.id, email: user.email, role: userRole, permissions: userPermissions })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET)
      
      // Update last login
      await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id))
      
      return {
        token,
        user: { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: userRole, permissions: userPermissions, profileImage: user.profileImage || null },
      }
    }),

  me: os
    .input(z.object({ token: z.string() }))
    .handler(async ({ input }) => {
      try {
        const { payload } = await jwtVerify(input.token, JWT_SECRET)
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).limit(1)
        if (!user) return null
        const userRole = payload.role || (user as any).role || 'member'
        const userPermissions = payload.permissions || (user as any).permissions || null
        return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: userRole, permissions: userPermissions, profileImage: user.profileImage || null }
      } catch {
        return null
      }
    }),
}

// ============================================
// MEMBER PROCEDURES
// ============================================
export const memberProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.members).orderBy(desc(schema.members.id)).limit(limit).offset((page - 1) * limit)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.members).where(eq(schema.members.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().min(10),
      email: z.string().email().optional(),
      role: z.enum(['owner', 'tenant', 'secretary', 'treasurer', 'chairman', 'committee_member']),
      flatId: z.number().optional(),
      idProofImage: z.string().optional(),
      documents: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.members).values({ ...input, isActive: true, residentType: input.role === 'tenant' ? 'tenant' : 'owner' })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.members).set(input.data).where(eq(schema.members.id, input.id))
      const [result] = await db.select().from(schema.members).where(eq(schema.members.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.members).where(eq(schema.members.id, input.id))
      return { success: true }
    }),
}

// ============================================
// FLAT PROCEDURES
// ============================================
export const flatProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.flats).orderBy(desc(schema.flats.id)).limit(limit).offset((page - 1) * limit)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.flats).where(eq(schema.flats.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      flatNumber: z.string(),
      wing: z.string().optional(),
      floor: z.number(),
      type: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'villa', 'shop', 'office']),
      maintenanceAmount: z.number(),
      area: z.number().optional(),
      images: z.string().optional(),
      documents: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.flats).values({
        societyId: input.societyId,
        flatNumber: input.flatNumber,
        wing: input.wing,
        floor: input.floor,
        type: input.type,
        maintenanceAmount: String(input.maintenanceAmount),
        area: input.area != null ? String(input.area) : undefined,
        images: input.images,
        documents: input.documents,
        isOccupied: true,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.flats).set(input.data).where(eq(schema.flats.id, input.id))
      const [result] = await db.select().from(schema.flats).where(eq(schema.flats.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.flats).where(eq(schema.flats.id, input.id))
      return { success: true }
    }),
}

// ============================================
// INVOICE PROCEDURES
// ============================================
export const invoiceProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.invoices).orderBy(desc(schema.invoices.id)).limit(limit).offset((page - 1) * limit)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, input.id)).limit(1)
      return result || null
    }),

  summary: os.handler(async () => {
    const all = await db.select().from(schema.invoices)
    const totalExpected = all.reduce((s, i) => s + Number(i.totalAmount), 0)
    const collected = all.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.paidAmount), 0)
    const pending = all.filter(i => i.status === 'sent').reduce((s, i) => s + (Number(i.totalAmount) - Number(i.paidAmount)), 0)
    const overdue = all.filter(i => i.status === 'overdue').reduce((s, i) => s + (Number(i.totalAmount) - Number(i.paidAmount)), 0)
    return { totalExpected, collected, pending, overdue }
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      flatId: z.number(),
      invoiceNumber: z.string(),
      totalAmount: z.number(),
      period: z.string(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.invoices).values({
        societyId: input.societyId,
        flatId: input.flatId,
        invoiceNumber: input.invoiceNumber,
        totalAmount: String(input.totalAmount),
        period: input.period,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        subtotal: String(input.totalAmount),
        gstAmount: '0',
        paidAmount: '0',
        status: 'draft',
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.invoices).set(input.data).where(eq(schema.invoices.id, input.id))
      const [result] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.invoices).where(eq(schema.invoices.id, input.id))
      return { success: true }
    }),
}

// ============================================
// EXPENSE PROCEDURES
// ============================================
export const expenseProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.expenses).orderBy(desc(schema.expenses.id)).limit(limit).offset((page - 1) * limit)
    }),

  summary: os.handler(async () => {
    const all = await db.select().from(schema.expenses)
    const totalExpenses = all.reduce((s, e) => s + Number(e.amount), 0)
    const paid = all.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.amount), 0)
    const pending = all.filter(e => e.status === 'pending' || e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0)
    return { totalExpenses, paid, pending, budget: 150000 }
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      category: z.enum(['maintenance', 'electricity', 'water', 'security', 'cleaning', 'gardening', 'repairs', 'insurance', 'salary', 'other']),
      description: z.string().min(1),
      amount: z.number(),
      gstAmount: z.number().optional(),
      tdsAmount: z.number().optional(),
      vendorId: z.number().optional(),
      invoiceNumber: z.string().optional(),
      expenseDate: z.string().optional(),
      receiptImage: z.string().optional(),
      documents: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.expenses).values({
        societyId: input.societyId,
        category: input.category,
        description: input.description,
        amount: String(input.amount),
        gstAmount: input.gstAmount != null ? String(input.gstAmount) : undefined,
        tdsAmount: input.tdsAmount != null ? String(input.tdsAmount) : undefined,
        vendorId: input.vendorId,
        invoiceNumber: input.invoiceNumber,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
        receiptImage: input.receiptImage,
        documents: input.documents,
        status: 'pending',
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.expenses).set(input.data).where(eq(schema.expenses.id, input.id))
      const [result] = await db.select().from(schema.expenses).where(eq(schema.expenses.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.expenses).where(eq(schema.expenses.id, input.id))
      return { success: true }
    }),

  approve: os
    .input(z.object({ id: z.number(), approvedBy: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.expenses).set({ approvedBy: input.approvedBy, status: 'approved' }).where(eq(schema.expenses.id, input.id))
      return { success: true }
    }),
}

// ============================================
// VISITOR PROCEDURES
// ============================================
export const visitorProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.visitors).orderBy(desc(schema.visitors.id)).limit(limit).offset((page - 1) * limit)
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      phone: z.string().optional(),
      purpose: z.string().optional(),
      flatId: z.number(),
      vehicleNumber: z.string().optional(),
      idProofImage: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.visitors).values({
        ...input,
        entryTime: new Date(),
        status: 'inside',
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.visitors).set(input.data).where(eq(schema.visitors.id, input.id))
      const [result] = await db.select().from(schema.visitors).where(eq(schema.visitors.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.visitors).where(eq(schema.visitors.id, input.id))
      return { success: true }
    }),

  checkOut: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.visitors).set({ exitTime: new Date(), status: 'checked_out' }).where(eq(schema.visitors.id, input.id))
      return { success: true }
    }),
}

// ============================================
// NOTICE PROCEDURES
// ============================================
export const noticeProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.notices).orderBy(desc(schema.notices.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      title: z.string().min(1),
      content: z.string().min(1),
      postedBy: z.number(),
      priority: z.enum(['low', 'medium', 'high']),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.notices).values({ ...input, isPinned: false, isActive: true })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.notices).set(input.data).where(eq(schema.notices.id, input.id))
      const [result] = await db.select().from(schema.notices).where(eq(schema.notices.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.notices).where(eq(schema.notices.id, input.id))
      return { success: true }
    }),
}

// ============================================
// MEETING PROCEDURES
// ============================================
export const meetingProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.meetings).orderBy(desc(schema.meetings.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      meetingDate: z.any(),
      location: z.string().optional(),
      organizedBy: z.any().optional(),
      status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.meetings).values({
        ...input,
        meetingDate: input.meetingDate instanceof Date ? input.meetingDate : new Date(input.meetingDate),
        organizedBy: typeof input.organizedBy === 'string' ? 1 : (input.organizedBy || 1),
        status: input.status || 'scheduled',
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.meetings).set(input.data).where(eq(schema.meetings.id, input.id))
      const [result] = await db.select().from(schema.meetings).where(eq(schema.meetings.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.meetings).where(eq(schema.meetings.id, input.id))
      return { success: true }
    }),
}

// ============================================
// MAINTENANCE PROCEDURES
// ============================================
// ============================================
// SERVICE COMPANY PROCEDURES
// ============================================
export const serviceCompanyProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.serviceCompanies).orderBy(desc(schema.serviceCompanies.id))
  }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.serviceCompanies).where(eq(schema.serviceCompanies.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      services: z.string().optional(),
      gstNumber: z.string().optional(),
      panNumber: z.string().optional(),
      rating: z.number().optional(),
      contractStart: z.string().optional(),
      contractEnd: z.string().optional(),
      monthlyRetainer: z.number().optional(),
      profileImage: z.string().optional(),
      documents: z.string().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.serviceCompanies).values({
        societyId: input.societyId,
        name: input.name,
        contactPerson: input.contactPerson,
        phone: input.phone,
        email: input.email,
        address: input.address,
        services: input.services,
        gstNumber: input.gstNumber,
        panNumber: input.panNumber,
        rating: input.rating,
        contractStart: input.contractStart ? new Date(input.contractStart) : undefined,
        contractEnd: input.contractEnd ? new Date(input.contractEnd) : undefined,
        monthlyRetainer: input.monthlyRetainer != null ? String(input.monthlyRetainer) : undefined,
        profileImage: input.profileImage,
        documents: input.documents,
        notes: input.notes,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.serviceCompanies).set(input.data).where(eq(schema.serviceCompanies.id, input.id))
      const [result] = await db.select().from(schema.serviceCompanies).where(eq(schema.serviceCompanies.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.serviceCompanies).where(eq(schema.serviceCompanies.id, input.id))
      return { success: true }
    }),
}

// ============================================
// SERVICE PERSON PROCEDURES
// ============================================
export const servicePersonProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.servicePersons).orderBy(desc(schema.servicePersons.id))
  }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.servicePersons).where(eq(schema.servicePersons.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      companyId: z.number().optional(),
      staffId: z.number().optional(),
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      specialization: z.string().optional(),
      skillLevel: z.enum(['apprentice', 'junior', 'senior', 'expert']).optional(),
      hourlyRate: z.number().optional(),
      availability: z.enum(['available', 'busy', 'on_leave', 'inactive']).optional(),
      profileImage: z.string().optional(),
      idProofImage: z.string().optional(),
      documents: z.string().optional(),
      rating: z.number().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.servicePersons).values({
        societyId: input.societyId,
        companyId: input.companyId,
        staffId: input.staffId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        specialization: input.specialization,
        skillLevel: input.skillLevel ?? 'junior',
        hourlyRate: input.hourlyRate != null ? String(input.hourlyRate) : undefined,
        availability: input.availability ?? 'available',
        profileImage: input.profileImage,
        idProofImage: input.idProofImage,
        documents: input.documents,
        rating: input.rating,
        notes: input.notes,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.servicePersons).set(input.data).where(eq(schema.servicePersons.id, input.id))
      const [result] = await db.select().from(schema.servicePersons).where(eq(schema.servicePersons.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.servicePersons).where(eq(schema.servicePersons.id, input.id))
      return { success: true }
    }),
}

export const maintenanceProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.serviceRequests).orderBy(desc(schema.serviceRequests.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      flatId: z.number(),
      memberId: z.number(),
      categoryId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.serviceRequests).values({ ...input, status: 'open' })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.serviceRequests).set(input.data).where(eq(schema.serviceRequests.id, input.id))
      const [result] = await db.select().from(schema.serviceRequests).where(eq(schema.serviceRequests.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.serviceRequests).where(eq(schema.serviceRequests.id, input.id))
      return { success: true }
    }),
}

// ============================================
// AMENITY PROCEDURES
// ============================================
export const amenityProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.amenities).orderBy(desc(schema.amenities.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(['sports', 'recreation', 'fitness', 'community', 'kids', 'other']),
      type: z.enum(['free', 'paid']).optional(),
      price: z.number().optional(),
      capacity: z.number().optional(),
      location: z.string().optional(),
      operatingHoursStart: z.string().optional(),
      operatingHoursEnd: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.amenities).values({
        societyId: input.societyId,
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price !== undefined ? String(input.price) : '0',
        capacity: input.capacity || 10,
        isActive: true,
        location: input.location,
        operatingHoursStart: input.operatingHoursStart,
        operatingHoursEnd: input.operatingHoursEnd,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.amenities).set(input.data).where(eq(schema.amenities.id, input.id))
      const [result] = await db.select().from(schema.amenities).where(eq(schema.amenities.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.amenities).where(eq(schema.amenities.id, input.id))
      return { success: true }
    }),
}

// ============================================
// AMENITY BOOKING PROCEDURES
// ============================================
export const amenityBookingProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.amenityBookings).orderBy(desc(schema.amenityBookings.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      amenityId: z.number(),
      memberId: z.number(),
      flatId: z.number(),
      bookingDate: z.date(),
      startTime: z.string(),
      endTime: z.string(),
      guests: z.number().optional(),
      guestNames: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [amenity] = await db.select().from(schema.amenities).where(eq(schema.amenities.id, input.amenityId)).limit(1)
      const totalAmount = amenity?.price || 0
      const [result] = await db.insert(schema.amenityBookings).values({
        ...input,
        totalAmount: String(totalAmount),
        status: 'confirmed',
      })
      return { id: Number(result.insertId), ...input, totalAmount }
    }),

  cancel: os
    .input(z.object({ id: z.number(), cancellationReason: z.string().optional() }))
    .handler(async ({ input }) => {
      await db.update(schema.amenityBookings)
        .set({ status: 'cancelled', cancellationReason: input.cancellationReason })
        .where(eq(schema.amenityBookings.id, input.id))
      return { success: true }
    }),
}

// ============================================
// SOCIETY PROCEDURES
// ============================================
export const societyProcedures = {
  get: os.handler(async () => {
    const [society] = await db.select().from(schema.societies).limit(1)
    return society || null
  }),

  create: os
    .input(z.object({
      name: z.string().min(1),
      registrationNumber: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      // Find or create a default cluster
      let [cluster] = await db.select().from(schema.clusters).limit(1)
      if (!cluster) {
        const [result] = await db.insert(schema.clusters).values({
          name: 'Default Cluster',
          description: 'Default cluster for society management',
          isActive: true,
        })
        const clusterId = Number(result.insertId)
        ;[cluster] = await db.select().from(schema.clusters).where(eq(schema.clusters.id, clusterId)).limit(1)
      }
      // Create the society
      const [result] = await db.insert(schema.societies).values({
        clusterId: cluster!.id,
        name: input.name,
        registrationNumber: input.registrationNumber || undefined,
        address: input.address || undefined,
        city: input.city || undefined,
        state: input.state || undefined,
        pincode: input.pincode || undefined,
        contactEmail: input.contactEmail || undefined,
        contactPhone: input.contactPhone || undefined,
        isActive: true,
      })
      const societyId = Number(result.insertId)
      const [society] = await db.select().from(schema.societies).where(eq(schema.societies.id, societyId)).limit(1)
      return society
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.societies).set({ ...input.data, updatedAt: new Date() }).where(eq(schema.societies.id, input.id))
      const [result] = await db.select().from(schema.societies).where(eq(schema.societies.id, input.id)).limit(1)
      return result
    }),
}

// ============================================
// PARKING PROCEDURES
// ============================================
export const parkingProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.parkingSpaces).orderBy(desc(schema.parkingSpaces.id)).limit(limit).offset((page - 1) * limit)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.parkingSpaces).where(eq(schema.parkingSpaces.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      slotNumber: z.string(),
      floor: z.string().optional(),
      section: z.string().optional(),
      type: z.enum(['covered', 'open', 'basement']),
      vehicleType: z.string().optional(),
      flatId: z.number().optional(),
      allocatedVehicleId: z.number().optional(),
      isVisitorParking: z.boolean().optional(),
      monthlyCharges: z.number().optional(),
      dimensions: z.string().optional(),
      hasCctv: z.boolean().optional(),
      hasCharging: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.parkingSpaces).values({
        societyId: input.societyId,
        slotNumber: input.slotNumber,
        floor: input.floor,
        section: input.section,
        type: input.type,
        vehicleType: input.vehicleType,
        flatId: input.flatId,
        isVisitorParking: input.isVisitorParking,
        monthlyCharges: input.monthlyCharges != null ? String(input.monthlyCharges) : undefined,
        dimensions: input.dimensions,
        hasCctv: input.hasCctv,
        hasCharging: input.hasCharging,
        notes: input.notes,
        isOccupied: !!input.flatId,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.parkingSpaces).set(input.data).where(eq(schema.parkingSpaces.id, input.id))
      const [result] = await db.select().from(schema.parkingSpaces).where(eq(schema.parkingSpaces.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.parkingSpaces).where(eq(schema.parkingSpaces.id, input.id))
      return { success: true }
    }),
}

// ============================================
// VISITOR PARKING PROCEDURES
// ============================================
export const visitorParkingProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.visitorParking).orderBy(desc(schema.visitorParking.id))
  }),

  create: os
    .input(z.object({
      visitorId: z.number(),
      visitorName: z.string().optional(),
      visitorPhone: z.string().optional(),
      parkingSpaceId: z.number().optional(),
      flatId: z.number().optional(),
      vehicleNumber: z.string().optional(),
      vehicleType: z.string().optional(),
      vehicleColor: z.string().optional(),
      purpose: z.string().optional(),
      visitingMemberName: z.string().optional(),
      idProofImage: z.string().optional(),
      expectedDuration: z.string().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.visitorParking).values({
        ...input,
        entryTime: new Date(),
        status: 'parked',
        charges: '0',
      })
      // Mark parking space as occupied if assigned
      if (input.parkingSpaceId) {
        await db.update(schema.parkingSpaces).set({ isOccupied: true }).where(eq(schema.parkingSpaces.id, input.parkingSpaceId))
      }
      return { id: Number(result.insertId), ...input }
    }),

  checkOut: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [record] = await db.select().from(schema.visitorParking).where(eq(schema.visitorParking.id, input.id)).limit(1)
      if (record) {
        await db.update(schema.visitorParking).set({ exitTime: new Date(), status: 'exited' }).where(eq(schema.visitorParking.id, input.id))
        if (record.parkingSpaceId) {
          await db.update(schema.parkingSpaces).set({ isOccupied: false }).where(eq(schema.parkingSpaces.id, record.parkingSpaceId))
        }
      }
      return { success: true }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.visitorParking).where(eq(schema.visitorParking.id, input.id))
      return { success: true }
    }),
}

// ============================================
// VEHICLE MOVEMENT PROCEDURES
// ============================================
export const vehicleMovementProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.vehicleMovements).orderBy(desc(schema.vehicleMovements.id)).limit(limit).offset((page - 1) * limit)
    }),

  create: os
    .input(z.object({
      vehicleId: z.number().optional(),
      vehicleNumber: z.string(),
      gateId: z.number().optional(),
      type: z.enum(['visitor', 'resident', 'delivery', 'utility']),
      direction: z.enum(['entry', 'exit']),
      guardId: z.number().optional(),
      purpose: z.string().optional(),
      photoUrl: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.vehicleMovements).values({
        ...input,
        timestamp: new Date(),
      })
      return { id: Number(result.insertId), ...input }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.vehicleMovements).where(eq(schema.vehicleMovements.id, input.id))
      return { success: true }
    }),
}

// ============================================
// VEHICLE PROCEDURES
// ============================================
export const vehicleProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.vehicles).orderBy(desc(schema.vehicles.id)).limit(limit).offset((page - 1) * limit)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      memberId: z.number(),
      flatId: z.number(),
      vehicleNumber: z.string(),
      type: z.enum(['car', 'bike', 'scooter', 'bicycle', 'other']),
      brand: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
      yearOfManufacture: z.number().optional(),
      fuelType: z.string().optional(),
      insuranceExpiry: z.string().optional(),
      rcExpiry: z.string().optional(),
      numberPlateImage: z.string().optional(),
      bodyImage: z.string().optional(),
      images: z.string().optional(),
      documents: z.string().optional(),
      parkingSpaceId: z.number().optional(),
      isPrimary: z.boolean().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.vehicles).values({
        memberId: input.memberId,
        flatId: input.flatId,
        vehicleNumber: input.vehicleNumber,
        type: input.type,
        brand: input.brand,
        model: input.model,
        color: input.color,
        yearOfManufacture: input.yearOfManufacture,
        fuelType: input.fuelType,
        insuranceExpiry: input.insuranceExpiry ? new Date(input.insuranceExpiry) : undefined,
        rcExpiry: input.rcExpiry ? new Date(input.rcExpiry) : undefined,
        numberPlateImage: input.numberPlateImage,
        bodyImage: input.bodyImage,
        images: input.images,
        documents: input.documents,
        parkingSpaceId: input.parkingSpaceId,
        isPrimary: input.isPrimary ?? false,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.vehicles).set(input.data).where(eq(schema.vehicles.id, input.id))
      const [result] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.vehicles).where(eq(schema.vehicles.id, input.id))
      return { success: true }
    }),
}

// ============================================
// ACCOUNT HEADS PROCEDURES
// ============================================
export const accountHeadProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.accountHeads).orderBy(desc(schema.accountHeads.id))
  }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.accountHeads).where(eq(schema.accountHeads.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string(),
      code: z.string().optional(),
      type: z.enum(['asset', 'liability', 'income', 'expense']),
      parentId: z.number().optional(),
      description: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.accountHeads).values({ ...input, isActive: true })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.accountHeads).set(input.data).where(eq(schema.accountHeads.id, input.id))
      const [result] = await db.select().from(schema.accountHeads).where(eq(schema.accountHeads.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.accountHeads).where(eq(schema.accountHeads.id, input.id))
      return { success: true }
    }),
}

// ============================================
// JOURNAL VOUCHERS PROCEDURES
// ============================================
export const journalVoucherProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.journalVouchers).orderBy(desc(schema.journalVouchers.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      voucherNumber: z.string(),
      date: z.string(),
      type: z.enum(['journal', 'receipt', 'payment', 'contra', 'adjustment']),
      narration: z.string().optional(),
      debitAccountHeadId: z.number().optional(),
      creditAccountHeadId: z.number().optional(),
      amount: z.number(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.journalVouchers).values({
        societyId: input.societyId,
        voucherNumber: input.voucherNumber,
        date: new Date(input.date),
        type: input.type,
        narration: input.narration,
        debitAccountHeadId: input.debitAccountHeadId,
        creditAccountHeadId: input.creditAccountHeadId,
        amount: String(input.amount),
        status: 'draft',
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.journalVouchers).set(input.data).where(eq(schema.journalVouchers.id, input.id))
      const [result] = await db.select().from(schema.journalVouchers).where(eq(schema.journalVouchers.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.journalVouchers).where(eq(schema.journalVouchers.id, input.id))
      return { success: true }
    }),
}

// ============================================
// BANK ACCOUNTS PROCEDURES
// ============================================
export const bankAccountProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.bankAccounts).orderBy(desc(schema.bankAccounts.id))
  }),

  summary: os.handler(async () => {
    const accounts = await db.select().from(schema.bankAccounts)
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)
    return { totalBalance, accountCount: accounts.length }
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      bankName: z.string().min(1),
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      branch: z.string().optional(),
      accountType: z.enum(['savings', 'current', 'fixed_deposit']).optional(),
      openingBalance: z.number().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.bankAccounts).values({
        societyId: input.societyId,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        ifscCode: input.ifscCode,
        branch: input.branch,
        accountType: input.accountType || 'savings',
        balance: '0',
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.bankAccounts).set(input.data).where(eq(schema.bankAccounts.id, input.id))
      const [result] = await db.select().from(schema.bankAccounts).where(eq(schema.bankAccounts.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.bankAccounts).where(eq(schema.bankAccounts.id, input.id))
      return { success: true }
    }),
}

// ============================================
// ASSETS PROCEDURES
// ============================================
export const assetProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.assets).orderBy(desc(schema.assets.id))
  }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.assets).where(eq(schema.assets.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      location: z.string().optional(),
      purchaseDate: z.string().optional(),
      purchasePrice: z.number().optional(),
      currentValue: z.number().optional(),
      warrantyExpiry: z.string().optional(),
      manufacturer: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      quantity: z.number().optional(),
      images: z.string().optional(),
      documents: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.assets).values({
        societyId: input.societyId,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        location: input.location,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        purchasePrice: input.purchasePrice != null ? String(input.purchasePrice) : undefined,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
        manufacturer: input.manufacturer,
        model: input.model,
        serialNumber: input.serialNumber,
        quantity: input.quantity,
        images: input.images,
        documents: input.documents,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.assets).set(input.data).where(eq(schema.assets.id, input.id))
      const [result] = await db.select().from(schema.assets).where(eq(schema.assets.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.assets).where(eq(schema.assets.id, input.id))
      return { success: true }
    }),
}

// ============================================
// ASSET CATEGORIES PROCEDURES
// ============================================
export const assetCategoryProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.assetCategories).orderBy(desc(schema.assetCategories.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string(),
      description: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.assetCategories).values({
        societyId: input.societyId,
        name: input.name,
        description: input.description,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),
}

// ============================================
// INVENTORY PROCEDURES
// ============================================
export const inventoryProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.inventory).orderBy(desc(schema.inventory.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      sku: z.string().optional(),
      quantity: z.number().optional(),
      minQuantity: z.number().optional(),
      unitPrice: z.number().optional(),
      location: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.inventory).values({
        societyId: input.societyId,
        name: input.name,
        description: input.description,
        location: input.location,
        quantity: input.quantity,
        minQuantity: input.minQuantity,
        unitPrice: input.unitPrice != null ? String(input.unitPrice) : undefined,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.inventory).set(input.data).where(eq(schema.inventory.id, input.id))
      const [result] = await db.select().from(schema.inventory).where(eq(schema.inventory.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.inventory).where(eq(schema.inventory.id, input.id))
      return { success: true }
    }),
}

// ============================================
// STAFF PROCEDURES
// ============================================
export const staffProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      let query = db.select().from(schema.staff).orderBy(desc(schema.staff.id))
      // Note: filtering would need where clause, keeping it simple for now
      const results = await db.select().from(schema.staff).orderBy(desc(schema.staff.id))
      return results
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.staff).where(eq(schema.staff.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      department: z.enum(['security', 'housekeeping', 'maintenance', 'gardening', 'admin', 'other']),
      designation: z.string().optional(),
      shift: z.string().optional(),
      salary: z.number().optional(),
      joiningDate: z.string().optional(),
      idProofImage: z.string().optional(),
      documents: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.staff).values({
        ...input,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.staff).set(input.data).where(eq(schema.staff.id, input.id))
      const [result] = await db.select().from(schema.staff).where(eq(schema.staff.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.staff).where(eq(schema.staff.id, input.id))
      return { success: true }
    }),
}

// ============================================
// STAFF ATTENDANCE PROCEDURES
// ============================================
export const attendanceProcedures = {
  list: os
    .input(z.object({ staffId: z.number().optional(), date: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const results = await db.select().from(schema.staffAttendance).orderBy(desc(schema.staffAttendance.id))
      return results
    }),

  checkIn: os
    .input(z.object({
      staffId: z.number(),
      status: z.enum(['present', 'late', 'half_day']).optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const today = new Date().toISOString().split('T')[0]
      const [result] = await db.insert(schema.staffAttendance).values({
        staffId: input.staffId,
        date: new Date(),
        checkIn: new Date(),
        status: input.status || 'present',
        notes: input.notes,
      })
      return { id: Number(result.insertId), ...input }
    }),

  checkOut: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.staffAttendance).set({ checkOut: new Date() }).where(eq(schema.staffAttendance.id, input.id))
      const [result] = await db.select().from(schema.staffAttendance).where(eq(schema.staffAttendance.id, input.id)).limit(1)
      return result
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.staffAttendance).set(input.data).where(eq(schema.staffAttendance.id, input.id))
      const [result] = await db.select().from(schema.staffAttendance).where(eq(schema.staffAttendance.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.staffAttendance).where(eq(schema.staffAttendance.id, input.id))
      return { success: true }
    }),
}

// ============================================
// STAFF LEAVE PROCEDURES
// ============================================
export const staffLeaveProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.staffLeaves).orderBy(desc(schema.staffLeaves.id))
  }),

  create: os
    .input(z.object({
      staffId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional(),
      type: z.enum(['sick', 'casual', 'earned', 'unpaid', 'other']).optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.staffLeaves).values({
        staffId: input.staffId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        type: input.type || 'casual',
        status: 'pending',
      })
      return { id: Number(result.insertId), ...input }
    }),

  approve: os
    .input(z.object({ id: z.number(), approvedBy: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.staffLeaves).set({ status: 'approved', approvedBy: input.approvedBy, approvedAt: new Date() }).where(eq(schema.staffLeaves.id, input.id))
      return { success: true }
    }),
}

// ============================================
// STAFF SALARY PROCEDURES
// ============================================
export const staffSalaryProcedures = {
  list: os
    .input(z.object({ staffId: z.number().optional(), month: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const results = await db.select().from(schema.staffSalaries).orderBy(desc(schema.staffSalaries.id))
      return results
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.staffSalaries).where(eq(schema.staffSalaries.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      staffId: z.number(),
      month: z.string(),
      basicSalary: z.number(),
      allowances: z.number().optional(),
      deductions: z.number().optional(),
      overtime: z.number().optional(),
      paymentMethod: z.enum(['cash', 'bank_transfer', 'upi']).optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const netPay = input.basicSalary + (input.allowances || 0) - (input.deductions || 0) + (input.overtime || 0)
      const [result] = await db.insert(schema.staffSalaries).values({
        staffId: input.staffId,
        month: input.month,
        basicSalary: String(input.basicSalary),
        allowances: String(input.allowances || 0),
        deductions: String(input.deductions || 0),
        overtime: String(input.overtime || 0),
        netPay: String(netPay),
        paymentMethod: input.paymentMethod || 'bank_transfer',
        status: 'pending',
        notes: input.notes,
      })
      return { id: Number(result.insertId), ...input, netPay }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      // If status is being set to paid, set paymentDate
      if (input.data.status === 'paid') {
        input.data.paymentDate = new Date()
      }
      await db.update(schema.staffSalaries).set(input.data).where(eq(schema.staffSalaries.id, input.id))
      const [result] = await db.select().from(schema.staffSalaries).where(eq(schema.staffSalaries.id, input.id)).limit(1)
      return result
    }),

  markPaid: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.staffSalaries).set({ status: 'paid', paymentDate: new Date() }).where(eq(schema.staffSalaries.id, input.id))
      return { success: true }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.staffSalaries).where(eq(schema.staffSalaries.id, input.id))
      return { success: true }
    }),

  payrollSummary: os
    .input(z.object({ month: z.string() }).optional())
    .handler(async ({ input }) => {
      const records = await db.select().from(schema.staffSalaries)
      const allStaff = await db.select().from(schema.staff)
      const totalPaid = records.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.netPay || 0), 0)
      const totalPending = records.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.netPay || 0), 0)
      const totalDeductions = records.reduce((s, r) => s + Number(r.deductions || 0), 0)
      return { totalPaid, totalPending, totalDeductions, totalRecords: records.length, activeStaff: allStaff.filter(s => s.isActive).length }
    }),
}

// ============================================
// VENDOR PROCEDURES
// ============================================
export const vendorProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.vendors).orderBy(desc(schema.vendors.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      category: z.string().optional(),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.vendors).values({
        societyId: input.societyId,
        name: input.name,
        category: input.category,
        contactPerson: input.contactPerson,
        phone: input.phone,
        email: input.email,
        address: input.address,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.vendors).set(input.data).where(eq(schema.vendors.id, input.id))
      const [result] = await db.select().from(schema.vendors).where(eq(schema.vendors.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.vendors).where(eq(schema.vendors.id, input.id))
      return { success: true }
    }),
}

// ============================================
// SOCIETY LAYOUT PROCEDURES
// ============================================
export const societyLayoutProcedures = {
  // Create tower with auto-generated flats
  createTower: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      totalFloors: z.number().min(1).max(100),
      flatsPerFloor: z.number().min(1).max(20),
      hasLift: z.boolean().optional(),
      hasCctv: z.boolean().optional(),
      hasFireAlarm: z.boolean().optional(),
      profileImage: z.string().optional(),
      images: z.array(z.string()).optional(),
      flatType: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'villa', 'shop', 'office']).optional(),
      flatArea: z.number().optional(),
      maintenanceAmount: z.number().optional(),
    }))
    .handler(async ({ input }) => {
      // Create tower
      const [towerResult] = await db.insert(schema.towers).values({
        societyId: input.societyId,
        name: input.name,
        description: input.description || null,
        totalFloors: input.totalFloors,
        flatsPerFloor: input.flatsPerFloor,
        hasLift: input.hasLift || false,
        hasCctv: input.hasCctv || false,
        hasFireAlarm: input.hasFireAlarm || false,
        profileImage: input.profileImage || null,
        images: input.images && input.images.length > 0 ? JSON.stringify(input.images) : null,
        isActive: true,
      })
      const towerId = Number(towerResult.insertId)

      // Auto-generate flats for each floor
      const flatValues: any[] = []
      for (let floor = 1; floor <= input.totalFloors; floor++) {
        for (let flatIdx = 1; flatIdx <= input.flatsPerFloor; flatIdx++) {
          flatValues.push({
            societyId: input.societyId,
            towerId,
            flatNumber: `${floor}${String(flatIdx).padStart(2, '0')}`,
            floor,
            type: input.flatType || '2BHK',
            maintenanceAmount: String(input.maintenanceAmount || 5000),
            area: input.flatArea ? String(input.flatArea) : undefined,
            isOccupied: false,
            isActive: true,
          })
        }
      }
      if (flatValues.length > 0) {
        await db.insert(schema.flats).values(flatValues)
      }

      return { id: towerId, name: input.name, totalFloors: input.totalFloors, flatsPerFloor: input.flatsPerFloor, flatsCreated: flatValues.length, profileImage: input.profileImage || null, images: input.images || [] }
    }),

  // Update tower
  updateTower: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.towers).set(input.data).where(eq(schema.towers.id, input.id))
      const [result] = await db.select().from(schema.towers).where(eq(schema.towers.id, input.id)).limit(1)
      return result
    }),

  // Delete tower (moves flats to root)
  deleteTower: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.flats).set({ towerId: null }).where(eq(schema.flats.towerId, input.id))
      await db.delete(schema.towers).where(eq(schema.towers.id, input.id))
      return { success: true }
    }),

  // Full layout: society → towers → floors → flats with occupancy
  getLayout: os.handler(async () => {
    const [society] = await db.select().from(schema.societies).limit(1)
    if (!society) return null

    const allTowers = await db.select().from(schema.towers).where(eq(schema.towers.societyId, society.id))
    const allFlats = await db.select().from(schema.flats).where(eq(schema.flats.societyId, society.id))
    const allGates = await db.select().from(schema.gates).where(eq(schema.gates.societyId, society.id))
    const allMembers = await db.select().from(schema.members).where(eq(schema.members.societyId, society.id))
    const allParking = await db.select().from(schema.parkingSpaces).where(eq(schema.parkingSpaces.societyId, society.id))

    // Build tower → floors → flats structure
    const towersWithFlats = allTowers.map(tower => {
      const towerFlats = allFlats.filter(f => f.towerId === tower.id)
      const floorMap = new Map<number, typeof towerFlats>()
      towerFlats.forEach(f => {
        const floor = f.floor
        if (!floorMap.has(floor)) floorMap.set(floor, [])
        floorMap.get(floor)!.push(f)
      })

      const floors = Array.from(floorMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([floorNum, flats]) => ({
          floorNumber: floorNum,
          flats: flats.sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true })),
        }))

      return {
        ...tower,
        floors,
        totalFlats: towerFlats.length,
        totalOccupied: towerFlats.filter(f => f.isOccupied).length,
        totalVacant: towerFlats.filter(f => !f.isOccupied).length,
        occupancyRate: towerFlats.length > 0 ? Math.round((towerFlats.filter(f => f.isOccupied).length / towerFlats.length) * 100) : 0,
      }
    })

    // Occupancy summary
    const totalFlats = allFlats.length
    const occupiedFlats = allFlats.filter(f => f.isOccupied).length
    const vacantFlats = totalFlats - occupiedFlats
    const byType = ['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'villa', 'shop', 'office'].map(type => ({
      type,
      total: allFlats.filter(f => f.type === type).length,
      occupied: allFlats.filter(f => f.type === type && f.isOccupied).length,
    })).filter(t => t.total > 0)

    return {
      society: { id: society.id, name: society.name, totalTowers: allTowers.length, totalFlats, totalMembers: allMembers.length },
      towers: towersWithFlats,
      gates: allGates,
      summary: { totalFlats, occupiedFlats, vacantFlats, occupancyRate: totalFlats > 0 ? Math.round((occupiedFlats / totalFlats) * 100) : 0, byType, totalParking: allParking.length, occupiedParking: allParking.filter(p => p.isOccupied).length },
    }
  }),

  // Flat detail with member info
  getFlatDetail: os
    .input(z.object({ flatId: z.number() }))
    .handler(async ({ input }) => {
      const [flat] = await db.select().from(schema.flats).where(eq(schema.flats.id, input.flatId)).limit(1)
      if (!flat) return null
      const [member] = await db.select().from(schema.members).where(eq(schema.members.flatId, input.flatId)).limit(1)
      return { flat, member: member || null }
    }),
}

// ============================================
// CELEBRATIONS PROCEDURES
// ============================================
export const celebrationProcedures = {
  list: os
    .input(z.object({ category: z.string().optional(), status: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const results = await db.select().from(schema.celebrations).orderBy(desc(schema.celebrations.eventDate))
      return results
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.celebrations).where(eq(schema.celebrations.id, input.id)).limit(1)
      if (!result) return null
      const attendees = await db.select().from(schema.celebrationAttendees).where(eq(schema.celebrationAttendees.celebrationId, input.id))
      const budget = await db.select().from(schema.celebrationBudgets).where(eq(schema.celebrationBudgets.celebrationId, input.id))
      const tasks = await db.select().from(schema.celebrationTasks).where(eq(schema.celebrationTasks.celebrationId, input.id))
      const photos = await db.select().from(schema.celebrationPhotos).where(eq(schema.celebrationPhotos.celebrationId, input.id))
      const comments = await db.select().from(schema.celebrationComments).where(eq(schema.celebrationComments.celebrationId, input.id))
      return { ...result, attendees, budget, tasks, photos, comments }
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(['religious', 'social', 'cultural', 'festival', 'birthday', 'anniversary', 'party', 'puja', 'other']),
      subcategory: z.string().optional(),
      eventDate: z.string(),
      endDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      organizedBy: z.number().optional(),
      maxAttendees: z.number().optional(),
      contactPerson: z.string().optional(),
      contactPhone: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.celebrations).values({
        ...input,
        eventDate: new Date(input.eventDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        status: 'planned',
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.celebrations).set({ ...input.data, updatedAt: new Date() }).where(eq(schema.celebrations.id, input.id))
      const [result] = await db.select().from(schema.celebrations).where(eq(schema.celebrations.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.celebrations).where(eq(schema.celebrations.id, input.id))
      return { success: true }
    }),

  // RSVP
  rsvp: os
    .input(z.object({
      celebrationId: z.number(),
      memberId: z.number(),
      status: z.enum(['going', 'maybe', 'not_going']),
      guestCount: z.number().optional(),
      guestNames: z.string().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      // Upsert attendance
      const [existing] = await db.select().from(schema.celebrationAttendees)
        .where(eq(schema.celebrationAttendees.celebrationId, input.celebrationId))
        .limit(100)
      const found = existing?.memberId === input.memberId ? existing : null
      if (found) {
        await db.update(schema.celebrationAttendees).set({ status: input.status, guestCount: input.guestCount || 0, guestNames: input.guestNames, notes: input.notes, responseDate: new Date() }).where(eq(schema.celebrationAttendees.id, found.id))
      } else {
        await db.insert(schema.celebrationAttendees).values({
          celebrationId: input.celebrationId,
          memberId: input.memberId,
          status: input.status,
          guestCount: input.guestCount || 0,
          guestNames: input.guestNames,
          notes: input.notes,
          responseDate: new Date(),
        })
      }
      return { success: true }
    }),

  // Budget
  addBudgetItem: os
    .input(z.object({
      celebrationId: z.number(),
      category: z.string(),
      description: z.string().optional(),
      estimatedAmount: z.number(),
      paidTo: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.celebrationBudgets).values({
        ...input,
        estimatedAmount: input.estimatedAmount.toString(),
        status: 'pending',
      })
      return { id: Number(result.insertId), ...input }
    }),

  approveBudgetItem: os
    .input(z.object({ id: z.number(), approvedBy: z.number(), actualAmount: z.number().optional() }))
    .handler(async ({ input }) => {
      await db.update(schema.celebrationBudgets).set({
        status: 'approved',
        approvedBy: input.approvedBy,
        actualAmount: input.actualAmount?.toString(),
      }).where(eq(schema.celebrationBudgets.id, input.id))
      return { success: true }
    }),

  // Tasks
  addTask: os
    .input(z.object({
      celebrationId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      assignedTo: z.number().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      dueDate: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.celebrationTasks).values({
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: 'pending',
      })
      return { id: Number(result.insertId), ...input }
    }),

  completeTask: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.celebrationTasks).set({ status: 'completed', completedAt: new Date() }).where(eq(schema.celebrationTasks.id, input.id))
      return { success: true }
    }),

  // Summary
  summary: os.handler(async () => {
    const all = await db.select().from(schema.celebrations)
    const now = new Date()
    const upcoming = all.filter(e => new Date(e.eventDate) >= now && e.status !== 'cancelled').length
    const completed = all.filter(e => e.status === 'completed').length
    const thisMonth = all.filter(e => {
      const d = new Date(e.eventDate)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { total: all.length, upcoming, completed, thisMonth }
  }),
}

// ============================================
// PET PROCEDURES
// ============================================
export const petProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100 } = input || {}
      return db.select().from(schema.pets).orderBy(desc(schema.pets.id)).limit(limit).offset((page - 1) * limit)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.pets).where(eq(schema.pets.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      memberId: z.number(),
      flatId: z.number(),
      name: z.string().min(1),
      type: z.enum(['dog', 'cat', 'bird', 'fish', 'other']),
      breed: z.string().optional(),
      age: z.number().optional(),
      weight: z.number().optional(),
      color: z.string().optional(),
      gender: z.enum(['male', 'female']).optional(),
      photoUrl: z.string().optional(),
      vaccinationStatus: z.string().optional(),
      lastVaccinationDate: z.string().optional(),
      nextVaccinationDate: z.string().optional(),
      insuranceExpiry: z.string().optional(),
      registrationNumber: z.string().optional(),
      microchipNumber: z.string().optional(),
      isNeutered: z.boolean().optional(),
      images: z.string().optional(),
      documents: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.pets).values({
        memberId: input.memberId,
        flatId: input.flatId,
        name: input.name,
        type: input.type,
        breed: input.breed,
        age: input.age,
        weight: input.weight != null ? String(input.weight) : undefined,
        color: input.color,
        photoUrl: input.photoUrl,
        images: input.images,
        documents: input.documents,
        vaccinationStatus: input.vaccinationStatus,
        isRegistered: true,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.pets).set(input.data).where(eq(schema.pets.id, input.id))
      const [result] = await db.select().from(schema.pets).where(eq(schema.pets.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.pets).where(eq(schema.pets.id, input.id))
      return { success: true }
    }),

  summary: os.handler(async () => {
    const all = await db.select().from(schema.pets).where(eq(schema.pets.isActive, true))
    const byType: Record<string, number> = {}
    for (const pet of all) {
      byType[pet.type] = (byType[pet.type] || 0) + 1
    }
    return { total: all.length, byType }
  }),
}

// ============================================
// PET RULES PROCEDURES
// ============================================
export const petRuleProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.petRules).orderBy(desc(schema.petRules.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      rule: z.string().min(1),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.petRules).values({
        societyId: input.societyId,
        rule: input.rule,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.petRules).set(input.data).where(eq(schema.petRules.id, input.id))
      const [result] = await db.select().from(schema.petRules).where(eq(schema.petRules.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.petRules).where(eq(schema.petRules.id, input.id))
      return { success: true }
    }),
}

// ============================================
// PET VACCINATION PROCEDURES
// ============================================
export const petVaccinationProcedures = {
  list: os
    .input(z.object({ petId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { petId } = input || {}
      if (petId) {
        return db.select().from(schema.petVaccinations).where(eq(schema.petVaccinations.petId, petId)).orderBy(desc(schema.petVaccinations.administeredDate))
      }
      return db.select().from(schema.petVaccinations).orderBy(desc(schema.petVaccinations.administeredDate))
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.petVaccinations).where(eq(schema.petVaccinations.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      petId: z.number(),
      vaccineName: z.string().min(1),
      vaccineType: z.string().optional(),
      administeredDate: z.any(),
      nextDueDate: z.any().optional(),
      veterinarian: z.string().optional(),
      clinicName: z.string().optional(),
      batchNumber: z.string().optional(),
      cost: z.number().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const administeredDate = input.administeredDate instanceof Date ? input.administeredDate : new Date(input.administeredDate)
      const nextDueDate = input.nextDueDate ? (input.nextDueDate instanceof Date ? input.nextDueDate : new Date(input.nextDueDate)) : undefined
      const [result] = await db.insert(schema.petVaccinations).values({
        petId: input.petId,
        vaccineName: input.vaccineName,
        vaccineType: input.vaccineType,
        administeredDate,
        nextDueDate,
        veterinarian: input.veterinarian,
        clinicName: input.clinicName,
        batchNumber: input.batchNumber,
        cost: input.cost != null ? String(input.cost) : undefined,
        notes: input.notes,
        status: 'completed',
        isReminderSent: false,
      })
      // Update pet's vaccination status
      await db.update(schema.pets).set({
        vaccinationStatus: 'Up to date',
      }).where(eq(schema.pets.id, input.petId))
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.petVaccinations).set(input.data).where(eq(schema.petVaccinations.id, input.id))
      const [result] = await db.select().from(schema.petVaccinations).where(eq(schema.petVaccinations.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.petVaccinations).where(eq(schema.petVaccinations.id, input.id))
      return { success: true }
    }),

  getUpcoming: os.handler(async () => {
    const now = new Date()
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    return db.select().from(schema.petVaccinations)
      .where(sql`${schema.petVaccinations.nextDueDate} >= ${now} AND ${schema.petVaccinations.nextDueDate} <= ${threeMonthsLater}`)
      .orderBy(schema.petVaccinations.nextDueDate)
  }),
}

// ============================================
// PET HEALTH RECORD PROCEDURES
// ============================================
export const petHealthRecordProcedures = {
  list: os
    .input(z.object({ petId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { petId } = input || {}
      if (petId) {
        return db.select().from(schema.petHealthRecords).where(eq(schema.petHealthRecords.petId, petId)).orderBy(desc(schema.petHealthRecords.visitDate))
      }
      return db.select().from(schema.petHealthRecords).orderBy(desc(schema.petHealthRecords.visitDate))
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.petHealthRecords).where(eq(schema.petHealthRecords.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      petId: z.number(),
      recordType: z.enum(['checkup', 'surgery', 'illness', 'injury', 'dental', 'grooming', 'other']),
      title: z.string().min(1),
      description: z.string().optional(),
      visitDate: z.any(),
      veterinarian: z.string().optional(),
      clinicName: z.string().optional(),
      diagnosis: z.string().optional(),
      treatment: z.string().optional(),
      medications: z.string().optional(),
      cost: z.number().optional(),
      nextVisitDate: z.any().optional(),
    }))
    .handler(async ({ input }) => {
      const visitDate = input.visitDate instanceof Date ? input.visitDate : new Date(input.visitDate)
      const nextVisitDate = input.nextVisitDate ? (input.nextVisitDate instanceof Date ? input.nextVisitDate : new Date(input.nextVisitDate)) : undefined
      const [result] = await db.insert(schema.petHealthRecords).values({
        petId: input.petId,
        recordType: input.recordType,
        title: input.title,
        description: input.description,
        visitDate,
        veterinarian: input.veterinarian,
        clinicName: input.clinicName,
        diagnosis: input.diagnosis,
        treatment: input.treatment,
        medications: input.medications,
        cost: input.cost != null ? String(input.cost) : undefined,
        nextVisitDate,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.petHealthRecords).set(input.data).where(eq(schema.petHealthRecords.id, input.id))
      const [result] = await db.select().from(schema.petHealthRecords).where(eq(schema.petHealthRecords.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.petHealthRecords).where(eq(schema.petHealthRecords.id, input.id))
      return { success: true }
    }),
}

// ============================================
// PET REMINDER PROCEDURES
// ============================================
export const petReminderProcedures = {
  list: os
    .input(z.object({ petId: z.number().optional(), includeCompleted: z.boolean().optional() }).optional())
    .handler(async ({ input }) => {
      const { petId, includeCompleted = false } = input || {}
      const conditions = []
      if (petId) {
        conditions.push(eq(schema.petReminders.petId, petId))
      }
      if (!includeCompleted) {
        conditions.push(eq(schema.petReminders.isCompleted, false))
      }
      return db.select().from(schema.petReminders).where(and(...conditions)).orderBy(schema.petReminders.dueDate)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.petReminders).where(eq(schema.petReminders.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      petId: z.number(),
      reminderType: z.enum(['vaccination', 'medication', 'grooming', 'checkup', 'insurance', 'other']),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.any(),
      isRecurring: z.boolean().optional(),
      recurringInterval: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.petReminders).values({
        ...input,
        dueDate: input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate),
        isCompleted: false,
        isReminderSent: false,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.petReminders).set(input.data).where(eq(schema.petReminders.id, input.id))
      const [result] = await db.select().from(schema.petReminders).where(eq(schema.petReminders.id, input.id)).limit(1)
      return result
    }),

  complete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.petReminders).set({
        isCompleted: true,
        completedDate: new Date(),
      }).where(eq(schema.petReminders.id, input.id))
      return { success: true }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.petReminders).where(eq(schema.petReminders.id, input.id))
      return { success: true }
    }),

  getOverdue: os.handler(async () => {
    const now = new Date()
    return db.select().from(schema.petReminders)
      .where(sql`${schema.petReminders.dueDate} < ${now} AND ${schema.petReminders.isCompleted} = false`)
      .orderBy(schema.petReminders.dueDate)
  }),
}

// ============================================
// PET ACTIVITY LOG PROCEDURES
// ============================================
export const petActivityLogProcedures = {
  list: os
    .input(z.object({ petId: z.number().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { petId, limit = 50 } = input || {}
      if (petId) {
        return db.select().from(schema.petActivityLog).where(eq(schema.petActivityLog.petId, petId)).orderBy(desc(schema.petActivityLog.activityDate)).limit(limit)
      }
      return db.select().from(schema.petActivityLog).orderBy(desc(schema.petActivityLog.activityDate)).limit(limit)
    }),

  create: os
    .input(z.object({
      petId: z.number(),
      activityType: z.enum(['feeding', 'walking', 'grooming', 'medication', 'training', 'play', 'other']),
      description: z.string().optional(),
      activityDate: z.any(),
      duration: z.number().optional(),
      recordedBy: z.number().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.petActivityLog).values({
        ...input,
        activityDate: input.activityDate instanceof Date ? input.activityDate : new Date(input.activityDate),
      })
      return { id: Number(result.insertId), ...input }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.petActivityLog).where(eq(schema.petActivityLog.id, input.id))
      return { success: true }
    }),
}

// ============================================
// USER MANAGEMENT PROCEDURES
// ============================================
export const userManagementProcedures = {
  list: os
    .input(z.object({ page: z.number().optional(), limit: z.number().optional(), search: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const { page = 1, limit = 100, search } = input || {}
      let results
      if (search) {
        const searchTerm = `%${search}%`
        results = await db.select().from(schema.users)
          .where(sql`(${schema.users.firstName} LIKE ${searchTerm}) OR (${schema.users.lastName} LIKE ${searchTerm}) OR (${schema.users.email} LIKE ${searchTerm}) OR (${schema.users.phone} LIKE ${searchTerm})`)
          .orderBy(desc(schema.users.id)).limit(limit).offset((page - 1) * limit)
      } else {
        results = await db.select().from(schema.users).orderBy(desc(schema.users.id)).limit(limit).offset((page - 1) * limit)
      }
      return results.map(({ passwordHash, ...rest }) => rest)
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.users).where(eq(schema.users.id, input.id)).limit(1)
      if (!result) return null
      const { passwordHash, ...rest } = result
      return rest
    }),

  getRoles: os.handler(async () => {
    return db.select().from(schema.roles).orderBy(desc(schema.roles.id))
  }),

  getUserRoles: os
    .input(z.object({ userId: z.number() }))
    .handler(async ({ input }) => {
      const userRolesResult = await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, input.userId))
      const roleIds = userRolesResult.map(ur => ur.roleId)
      if (roleIds.length === 0) return []
      return db.select().from(schema.roles).where(sql`${schema.roles.id} IN (${sql.join(roleIds.map(id => sql`${id}`), sql`, `)})`)
    }),

  assignRole: os
    .input(z.object({ userId: z.number(), roleId: z.number(), societyId: z.number().optional() }))
    .handler(async ({ input }) => {
      const [existing] = await db.select().from(schema.userRoles)
        .where(sql`${schema.userRoles.userId} = ${input.userId} AND ${schema.userRoles.roleId} = ${input.roleId}`)
        .limit(1)
      if (existing) return { success: true, message: 'Role already assigned' }
      const [result] = await db.insert(schema.userRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        societyId: input.societyId,
      })
      return { id: Number(result.insertId), success: true }
    }),

  removeRole: os
    .input(z.object({ userId: z.number(), roleId: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.userRoles)
        .where(sql`${schema.userRoles.userId} = ${input.userId} AND ${schema.userRoles.roleId} = ${input.roleId}`)
      return { success: true }
    }),

  create: os
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      password: z.string().min(6),
      roleIds: z.array(z.number()).optional(),
    }))
    .handler(async ({ input }) => {
      const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, input.email)).limit(1)
      if (existing) throw new Error('Email already exists')
      const passwordHash = await bcrypt.hash(input.password, 10)
      const [result] = await db.insert(schema.users).values({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        passwordHash,
        isActive: true,
      })
      const userId = Number(result.insertId)
      if (input.roleIds && input.roleIds.length > 0) {
        for (const roleId of input.roleIds) {
          await db.insert(schema.userRoles).values({ userId, roleId })
        }
      }
      return { id: userId, email: input.email, firstName: input.firstName, lastName: input.lastName }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      const { password, ...updateData } = input.data as any
      if (password && password.length > 0) {
        updateData.passwordHash = await bcrypt.hash(password, 10)
      }
      updateData.updatedAt = new Date()
      await db.update(schema.users).set(updateData).where(eq(schema.users.id, input.id))
      const [result] = await db.select().from(schema.users).where(eq(schema.users.id, input.id)).limit(1)
      if (!result) return null
      const { passwordHash, ...rest } = result
      return rest
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.userRoles).where(eq(schema.userRoles.userId, input.id))
      await db.delete(schema.users).where(eq(schema.users.id, input.id))
      return { success: true }
    }),

  toggleActive: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, input.id)).limit(1)
      if (!user) throw new Error('User not found')
      await db.update(schema.users).set({ isActive: !user.isActive, updatedAt: new Date() }).where(eq(schema.users.id, input.id))
      return { success: true, isActive: !user.isActive }
    }),

  updatePermissions: os
    .input(z.object({ id: z.number(), permissions: z.record(z.string(), z.object({ access: z.boolean(), view: z.boolean(), modify: z.boolean(), read: z.boolean() })) }))
    .handler(async ({ input }) => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, input.id)).limit(1)
      if (!user) throw new Error('User not found')
      const permissionsJson = JSON.stringify(input.permissions)
      await db.update(schema.users).set({ permissions: permissionsJson, updatedAt: new Date() }).where(eq(schema.users.id, input.id))
      return { success: true, permissions: permissionsJson }
    }),

  getPermissions: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, input.id)).limit(1)
      if (!user) throw new Error('User not found')
      return { permissions: user.permissions || null, role: user.role || 'member' }
    }),

  summary: os.handler(async () => {
    const all = await db.select().from(schema.users)
    const total = all.length
    const active = all.filter(u => u.isActive).length
    const inactive = total - active
    return { total, active, inactive }
  }),
}

// ============================================
// PROFILE PROCEDURES
// ============================================
export const profileProcedures = {
  get: os
    .input(z.object({ token: z.string() }))
    .handler(async ({ input }) => {
      try {
        const { payload } = await jwtVerify(input.token, JWT_SECRET)
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).limit(1)
        if (!user) return null
        const { passwordHash, ...rest } = user
        return rest
      } catch {
        return null
      }
    }),

  update: os
    .input(z.object({
      token: z.string(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      profileImage: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const { payload } = await jwtVerify(input.token, JWT_SECRET)
      const updateData: any = { updatedAt: new Date() }
      if (input.firstName) updateData.firstName = input.firstName
      if (input.lastName) updateData.lastName = input.lastName
      if (input.phone !== undefined) updateData.phone = input.phone
      if (input.profileImage !== undefined) updateData.profileImage = input.profileImage || null
      await db.update(schema.users).set(updateData).where(eq(schema.users.id, payload.userId as number))
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).limit(1)
      if (!user) return null
      const { passwordHash, ...rest } = user
      return rest
    }),

  changePassword: os
    .input(z.object({
      token: z.string(),
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    }))
    .handler(async ({ input }) => {
      const { payload } = await jwtVerify(input.token, JWT_SECRET)
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId as number)).limit(1)
      if (!user) throw new Error('User not found')
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash)
      if (!valid) throw new Error('Current password is incorrect')
      const passwordHash = await bcrypt.hash(input.newPassword, 10)
      await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, payload.userId as number))
      return { success: true }
    }),
}

// ============================================
// DOCUMENT FOLDER PROCEDURES
// ============================================
export const documentFolderProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      return db.select().from(schema.documentFolders).orderBy(desc(schema.documentFolders.sortOrder), desc(schema.documentFolders.id))
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.documentFolders).where(eq(schema.documentFolders.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.number().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.documentFolders).values({
        ...input,
        color: input.color || '#3b82f6',
        icon: input.icon || 'folder',
        sortOrder: 0,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.documentFolders).set({ ...input.data, updatedAt: new Date() }).where(eq(schema.documentFolders.id, input.id))
      const [result] = await db.select().from(schema.documentFolders).where(eq(schema.documentFolders.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      // Move all docs in this folder to root (folderId = null)
      await db.update(schema.documents).set({ folderId: null }).where(eq(schema.documents.folderId, input.id))
      // Delete subfolders
      const subfolders = await db.select().from(schema.documentFolders).where(eq(schema.documentFolders.parentId, input.id))
      for (const sub of subfolders) {
        await db.update(schema.documents).set({ folderId: null }).where(eq(schema.documents.folderId, sub.id))
        await db.delete(schema.documentFolders).where(eq(schema.documentFolders.id, sub.id))
      }
      await db.delete(schema.documentFolders).where(eq(schema.documentFolders.id, input.id))
      return { success: true }
    }),
}

// ============================================
// EMERGENCY CONTACT PROCEDURES
// ============================================
export const emergencyContactProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional(), category: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, category } = input || {}
      if (category && category !== 'all') {
        return db.select().from(schema.emergencyContacts)
          .where(sql`${schema.emergencyContacts.societyId} = ${societyId} AND ${schema.emergencyContacts.category} = ${category} AND ${schema.emergencyContacts.isActive} = true`)
          .orderBy(schema.emergencyContacts.name)
      }
      return db.select().from(schema.emergencyContacts)
        .where(sql`${schema.emergencyContacts.societyId} = ${societyId} AND ${schema.emergencyContacts.isActive} = true`)
        .orderBy(schema.emergencyContacts.category, schema.emergencyContacts.name)
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      category: z.enum(['hospital', 'ambulance', 'police', 'fire', 'gas', 'electricity', 'water', 'plumber', 'electrician', 'security', 'other']),
      phone: z.string().min(1),
      phone2: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      distance: z.number().optional(),
      distanceText: z.string().optional(),
      isAvailable24x7: z.boolean().optional(),
      operatingHours: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.emergencyContacts).values({
        societyId: input.societyId,
        name: input.name,
        category: input.category,
        phone: input.phone,
        phone2: input.phone2,
        email: input.email,
        website: input.website,
        address: input.address,
        distance: input.distance != null ? String(input.distance) : undefined,
        distanceText: input.distanceText,
        isAvailable24x7: input.isAvailable24x7,
        operatingHours: input.operatingHours,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.emergencyContacts).set({ ...input.data, updatedAt: new Date() }).where(eq(schema.emergencyContacts.id, input.id))
      return { success: true }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.emergencyContacts).set({ isActive: false }).where(eq(schema.emergencyContacts.id, input.id))
      return { success: true }
    }),
}

// ============================================
// DISTRESS ALERT PROCEDURES
// ============================================
export const distressAlertProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional(), status: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, status } = input || {}
      if (status) {
        return db.select().from(schema.distressAlerts)
          .where(sql`${schema.distressAlerts.societyId} = ${societyId} AND ${schema.distressAlerts.status} = ${status}`)
          .orderBy(desc(schema.distressAlerts.createdAt))
      }
      return db.select().from(schema.distressAlerts)
        .where(eq(schema.distressAlerts.societyId, societyId))
        .orderBy(desc(schema.distressAlerts.createdAt))
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      memberId: z.number().optional(),
      flatId: z.number().optional(),
      alertType: z.enum(['panic', 'fire', 'medical', 'security', 'gas_leak', 'flood', 'earthquake', 'other']),
      message: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      notifySecurity: z.boolean().optional(),
      notifyNeighbors: z.boolean().optional(),
      notifyEmergencyServices: z.boolean().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.distressAlerts).values({
        ...input,
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
        status: 'active',
      })
      return { id: Number(result.insertId), ...input, status: 'active' }
    }),

  acknowledge: os
    .input(z.object({ id: z.number(), acknowledgedBy: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.distressAlerts).set({
        status: 'acknowledged',
        acknowledgedBy: input.acknowledgedBy,
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(schema.distressAlerts.id, input.id))
      return { success: true }
    }),

  resolve: os
    .input(z.object({ id: z.number(), resolvedBy: z.number(), notes: z.string().optional() }))
    .handler(async ({ input }) => {
      await db.update(schema.distressAlerts).set({
        status: 'resolved',
        resolvedBy: input.resolvedBy,
        resolvedAt: new Date(),
        notes: input.notes,
        updatedAt: new Date(),
      }).where(eq(schema.distressAlerts.id, input.id))
      return { success: true }
    }),

  falseAlarm: os
    .input(z.object({ id: z.number(), notes: z.string().optional() }))
    .handler(async ({ input }) => {
      await db.update(schema.distressAlerts).set({
        status: 'false_alarm',
        notes: input.notes,
        updatedAt: new Date(),
      }).where(eq(schema.distressAlerts.id, input.id))
      return { success: true }
    }),

  getActive: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      return db.select().from(schema.distressAlerts)
        .where(sql`${schema.distressAlerts.societyId} = ${societyId} AND ${schema.distressAlerts.status} = 'active'`)
        .orderBy(desc(schema.distressAlerts.createdAt))
    }),

  summary: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      const all = await db.select().from(schema.distressAlerts).where(eq(schema.distressAlerts.societyId, societyId))
      return {
        total: all.length,
        active: all.filter(a => a.status === 'active').length,
        acknowledged: all.filter(a => a.status === 'acknowledged').length,
        resolved: all.filter(a => a.status === 'resolved').length,
        falseAlarm: all.filter(a => a.status === 'false_alarm').length,
        byType: all.reduce((acc, a) => { acc[a.alertType] = (acc[a.alertType] || 0) + 1; return acc }, {} as Record<string, number>),
      }
    }),
}

// ============================================
// NEARBY FACILITY PROCEDURES
// ============================================
export const nearbyFacilityProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional(), category: z.string().optional(), search: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, category, search } = input || {}
      let results = await db.select().from(schema.nearbyFacilities)
        .where(sql`${schema.nearbyFacilities.societyId} = ${societyId} AND ${schema.nearbyFacilities.isActive} = true`)
        .orderBy(schema.nearbyFacilities.distance)
      if (category && category !== 'all') {
        results = results.filter(f => f.category === category)
      }
      if (search) {
        const q = search.toLowerCase()
        results = results.filter(f => f.name?.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q))
      }
      return results
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      category: z.enum(['hospital', 'clinic', 'pharmacy', 'ambulance', 'police_station', 'fire_station', 'gas_agency', 'electricity_office', 'water_office', 'bank', 'atm', 'petrol_pump', 'market', 'supermarket', 'mall', 'school', 'college', 'park', 'gym', 'restaurant', 'hotel', 'airport', 'railway_station', 'bus_stand', 'city_center', 'other']),
      subcategory: z.string().optional(),
      description: z.string().optional(),
      phone: z.string().optional(),
      phone2: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      distance: z.number().optional(),
      distanceText: z.string().optional(),
      travelTime: z.string().optional(),
      roadDistance: z.string().optional(),
      isAvailable24x7: z.boolean().optional(),
      operatingHours: z.string().optional(),
      photoUrl: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.nearbyFacilities).values({
        ...input,
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
        distance: input.distance?.toString(),
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.nearbyFacilities).set({ ...input.data, updatedAt: new Date() }).where(eq(schema.nearbyFacilities.id, input.id))
      return { success: true }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.nearbyFacilities).set({ isActive: false }).where(eq(schema.nearbyFacilities.id, input.id))
      return { success: true }
    }),
}

// ============================================
// SOCIETY LOCATION PROCEDURES
// ============================================
export const societyLocationProcedures = {
  get: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      const [result] = await db.select().from(schema.societyLocation).where(eq(schema.societyLocation.societyId, societyId)).limit(1)
      return result || null
    }),

  upsert: os
    .input(z.object({
      societyId: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      nearestCity: z.string().optional(),
      nearestCityDistance: z.number().optional(),
      nearestAirport: z.string().optional(),
      nearestAirportDistance: z.number().optional(),
      nearestRailwayStation: z.string().optional(),
      nearestRailwayDistance: z.number().optional(),
      nearestBusStand: z.string().optional(),
      nearestBusStandDistance: z.number().optional(),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
      website: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [existing] = await db.select().from(schema.societyLocation).where(eq(schema.societyLocation.societyId, input.societyId)).limit(1)
      const data = {
        ...input,
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
        nearestCityDistance: input.nearestCityDistance?.toString(),
        nearestAirportDistance: input.nearestAirportDistance?.toString(),
        nearestRailwayDistance: input.nearestRailwayDistance?.toString(),
        nearestBusStandDistance: input.nearestBusStandDistance?.toString(),
      }
      if (existing) {
        await db.update(schema.societyLocation).set({ ...data, updatedAt: new Date() }).where(eq(schema.societyLocation.id, existing.id))
      } else {
        await db.insert(schema.societyLocation).values(data)
      }
      return { success: true }
    }),
}

// ============================================
// DOCUMENT PROCEDURES
// ============================================
export const documentProcedures = {
  list: os
    .input(z.object({
      folderId: z.number().nullable().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      starred: z.boolean().optional(),
      sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'fileSize']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .handler(async ({ input }) => {
      const { folderId, category, search, starred, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 100 } = input || {}
      let results = await db.select().from(schema.documents).where(eq(schema.documents.isActive, true))

      // Filter by folder
      if (folderId === null || folderId === undefined) {
        results = results.filter(d => d.folderId === null || d.folderId === undefined)
      } else if (folderId !== undefined) {
        results = results.filter(d => d.folderId === folderId)
      }

      // Filter by category
      if (category && category !== 'all') {
        results = results.filter(d => d.category === category)
      }

      // Filter starred
      if (starred) {
        results = results.filter(d => d.isStarred)
      }

      // Search
      if (search) {
        const q = search.toLowerCase()
        results = results.filter(d =>
          d.title?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.tags?.toLowerCase().includes(q)
        )
      }

      // Sort
      results.sort((a, b) => {
        let aVal: any, bVal: any
        if (sortBy === 'title') { aVal = a.title || ''; bVal = b.title || '' }
        else if (sortBy === 'fileSize') { aVal = a.fileSize || 0; bVal = b.fileSize || 0 }
        else if (sortBy === 'updatedAt') { aVal = a.updatedAt || a.createdAt; bVal = b.updatedAt || b.createdAt }
        else { aVal = a.createdAt; bVal = b.createdAt }
        if (sortOrder === 'asc') return aVal > bVal ? 1 : -1
        return aVal < bVal ? 1 : -1
      })

      return results
    }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.documents).where(eq(schema.documents.id, input.id)).limit(1)
      if (result) {
        // Track access
        await db.update(schema.documents).set({ lastAccessedAt: new Date() }).where(eq(schema.documents.id, input.id))
      }
      return result || null
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.enum(['personal', 'society', 'management', 'financial', 'legal', 'other']),
      folderId: z.number().nullable().optional(),
      flatId: z.number().optional(),
      memberId: z.number().optional(),
      fileUrl: z.string().min(1),
      fileName: z.string().optional(),
      mimeType: z.string().optional(),
      fileSize: z.number().optional(),
      fileData: z.string().optional(),
      tags: z.string().optional(),
      uploadedBy: z.number(),
    }))
    .handler(async ({ input }) => {
      try {
        const [result] = await db.insert(schema.documents).values({
          societyId: input.societyId,
          title: input.title,
          description: input.description,
          category: input.category,
          folderId: input.folderId ?? null,
          flatId: input.flatId,
          memberId: input.memberId,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileData: input.fileData || null,
          tags: input.tags,
          uploadedBy: input.uploadedBy,
          version: 1,
          downloadCount: 0,
          isStarred: false,
          isActive: true,
        })
        return { id: Number(result.insertId), ...input }
      } catch (err) {
        console.error('[documents.create] Error:', err)
        throw err
      }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.documents).set({ ...input.data, updatedAt: new Date() }).where(eq(schema.documents.id, input.id))
      const [result] = await db.select().from(schema.documents).where(eq(schema.documents.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.documents).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.documents.id, input.id))
      return { success: true }
    }),

  permanentDelete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.documents).where(eq(schema.documents.id, input.id))
      return { success: true }
    }),

  toggleStar: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [doc] = await db.select().from(schema.documents).where(eq(schema.documents.id, input.id)).limit(1)
      if (!doc) throw new Error('Document not found')
      await db.update(schema.documents).set({ isStarred: !doc.isStarred, updatedAt: new Date() }).where(eq(schema.documents.id, input.id))
      return { success: true, isStarred: !doc.isStarred }
    }),

  moveToFolder: os
    .input(z.object({ id: z.number(), folderId: z.number().nullable() }))
    .handler(async ({ input }) => {
      await db.update(schema.documents).set({ folderId: input.folderId, updatedAt: new Date() }).where(eq(schema.documents.id, input.id))
      return { success: true }
    }),

  copy: os
    .input(z.object({ id: z.number(), folderId: z.number().nullable().optional() }))
    .handler(async ({ input }) => {
      const [original] = await db.select().from(schema.documents).where(eq(schema.documents.id, input.id)).limit(1)
      if (!original) throw new Error('Document not found')
      const { id: _id, createdAt: _ca, ...rest } = original as any
      const [result] = await db.insert(schema.documents).values({
        ...rest,
        title: `${original.title} (Copy)`,
        folderId: input.folderId ?? original.folderId,
        version: 1,
        downloadCount: 0,
        isStarred: false,
      })
      return { id: Number(result.insertId) }
    }),

  search: os
    .input(z.object({ query: z.string().min(1), societyId: z.number().optional() }))
    .handler(async ({ input }) => {
      const q = input.query.toLowerCase()
      const all = await db.select().from(schema.documents).where(eq(schema.documents.isActive, true))
      return all.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.tags?.toLowerCase().includes(q) ||
        d.fileName?.toLowerCase().includes(q)
      )
    }),

  stats: os.handler(async () => {
    const all = await db.select().from(schema.documents).where(eq(schema.documents.isActive, true))
    const folders = await db.select().from(schema.documentFolders).where(eq(schema.documentFolders.isActive, true))
    const totalSize = all.reduce((sum, d) => sum + (d.fileSize || 0), 0)
    const byCategory: Record<string, number> = {}
    for (const d of all) { byCategory[d.category] = (byCategory[d.category] || 0) + 1 }
    const starred = all.filter(d => d.isStarred).length
    const recent = all.filter(d => {
      if (!d.createdAt) return false
      const diff = Date.now() - new Date(d.createdAt).getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    }).length
    return { total: all.length, totalFolders: folders.length, totalSize, byCategory, starred, recentThisWeek: recent }
  }),
}

// ============================================
// MEETING ATTENDEE PROCEDURES
// ============================================
export const meetingAttendeeProcedures = {
  list: os
    .input(z.object({ meetingId: z.number() }))
    .handler(async ({ input }) => {
      return db.select().from(schema.meetingAttendees).where(eq(schema.meetingAttendees.meetingId, input.meetingId))
    }),

  add: os
    .input(z.object({
      meetingId: z.number(),
      memberId: z.number(),
    }))
    .handler(async ({ input }) => {
      const [existing] = await db.select().from(schema.meetingAttendees)
        .where(eq(schema.meetingAttendees.meetingId, input.meetingId))
        .limit(1000)
      const alreadyInvited = existing?.memberId === input.memberId
      if (alreadyInvited) return { success: true, skipped: true }
      const [result] = await db.insert(schema.meetingAttendees).values({
        meetingId: input.meetingId,
        memberId: input.memberId,
        status: 'invited',
      })
      return { id: Number(result.insertId) }
    }),

  addBulk: os
    .input(z.object({
      meetingId: z.number(),
      memberIds: z.array(z.number()),
    }))
    .handler(async ({ input }) => {
      const values = input.memberIds.map(memberId => ({
        meetingId: input.meetingId,
        memberId,
        status: 'invited' as const,
      }))
      if (values.length > 0) {
        await db.insert(schema.meetingAttendees).values(values)
      }
      return { success: true, count: values.length }
    }),

  remove: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.meetingAttendees).where(eq(schema.meetingAttendees.id, input.id))
      return { success: true }
    }),
}

// ============================================
// SECURITY DEPOSIT PROCEDURES
// ============================================
export const securityDepositProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.securityDeposits).orderBy(desc(schema.securityDeposits.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      memberId: z.number(),
      type: z.enum(['move_in', 'amenity', 'parking', 'other']),
      amount: z.number(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.securityDeposits).values({
        ...input,
        amount: String(input.amount),
        status: 'held',
        returnAmount: '0',
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.securityDeposits).set(input.data).where(eq(schema.securityDeposits.id, input.id))
      const [result] = await db.select().from(schema.securityDeposits).where(eq(schema.securityDeposits.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.securityDeposits).where(eq(schema.securityDeposits.id, input.id))
      return { success: true }
    }),
}

// ============================================
// ADVANCE PAYMENT PROCEDURES
// ============================================
export const advancePaymentProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.advancePayments).orderBy(desc(schema.advancePayments.id))
  }),

  create: os
    .input(z.object({
      societyId: z.number(),
      memberId: z.number(),
      amount: z.number(),
      type: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.advancePayments).values({
        ...input,
        amount: String(input.amount),
        usedAmount: '0',
        balance: String(input.amount),
      })
      return { id: Number(result.insertId), ...input, balance: input.amount }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.advancePayments).set(input.data).where(eq(schema.advancePayments.id, input.id))
      const [result] = await db.select().from(schema.advancePayments).where(eq(schema.advancePayments.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.advancePayments).where(eq(schema.advancePayments.id, input.id))
      return { success: true }
    }),
}

// ============================================
// SECURITY CAMERA PROCEDURES
// ============================================
export const securityCameraProcedures = {
  // List all cameras with zone info
  list: os
    .input(z.object({ societyId: z.number().optional(), zone: z.string().optional(), status: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, zone, status } = input || {}
      let q = db.select().from(schema.securityCameras).where(eq(schema.securityCameras.societyId, societyId))
      const results = await q
      let filtered = results
      if (zone && zone !== 'all') filtered = filtered.filter(c => c.zone === zone)
      if (status && status !== 'all') filtered = filtered.filter(c => c.status === status)
      return filtered
    }),

  // Get single camera
  get: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.securityCameras).where(eq(schema.securityCameras.id, input.id)).limit(1)
      return result || null
    }),

  // Create camera
  create: os
    .input(z.object({
      societyId: z.number(),
      cameraName: z.string().min(1),
      cameraCode: z.string().optional(),
      zone: z.string().optional(),
      location: z.string().optional(),
      locationDetail: z.string().optional(),
      towerId: z.number().optional(),
      gateId: z.number().optional(),
      floor: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      type: z.string().optional(),
      resolution: z.string().optional(),
      fieldOfView: z.number().optional(),
      nightVision: z.boolean().optional(),
      hasAudio: z.boolean().optional(),
      nvrName: z.string().optional(),
      nvrChannel: z.number().optional(),
      storageDays: z.number().optional(),
      storageSizeGb: z.number().optional(),
      bitrate: z.number().optional(),
      ipAddress: z.string().optional(),
      macAddress: z.string().optional(),
      streamUrl: z.string().optional(),
      coverageArea: z.string().optional(),
      coverageRadius: z.number().optional(),
      installationHeight: z.string().optional(),
      status: z.string().optional(),
      purchaseCost: z.number().optional(),
      monthlyAmc: z.number().optional(),
      profileImage: z.string().optional(),
      installationImage: z.string().optional(),
      images: z.array(z.string()).optional(),
      notes: z.string().optional(),
      installDate: z.string().optional(),
      warrantyExpiry: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.securityCameras).values({
        societyId: input.societyId,
        cameraName: input.cameraName,
        cameraCode: input.cameraCode || null,
        zone: input.zone || null,
        location: input.location || null,
        locationDetail: input.locationDetail || null,
        towerId: input.towerId || null,
        gateId: input.gateId || null,
        floor: input.floor || null,
        brand: input.brand || null,
        model: input.model || null,
        type: (input.type as any) || 'dome',
        resolution: input.resolution || null,
        fieldOfView: input.fieldOfView || null,
        nightVision: input.nightVision || false,
        hasAudio: input.hasAudio || false,
        nvrName: input.nvrName || null,
        nvrChannel: input.nvrChannel || null,
        storageDays: input.storageDays || null,
        storageSizeGb: input.storageSizeGb || null,
        bitrate: input.bitrate || null,
        ipAddress: input.ipAddress || null,
        macAddress: input.macAddress || null,
        streamUrl: input.streamUrl || null,
        coverageArea: input.coverageArea || null,
        coverageRadius: input.coverageRadius || null,
        installationHeight: input.installationHeight || null,
        status: (input.status as any) || 'online',
        purchaseCost: input.purchaseCost ? String(input.purchaseCost) : null,
        monthlyAmc: input.monthlyAmc ? String(input.monthlyAmc) : null,
        profileImage: input.profileImage || null,
        installationImage: input.installationImage || null,
        images: input.images && input.images.length > 0 ? JSON.stringify(input.images) : null,
        notes: input.notes || null,
        installDate: input.installDate ? new Date(input.installDate) : null,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
      }).execute()
      return { id: Number(result.insertId), ...input }
    }),

  // Update camera
  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.securityCameras).set(input.data).where(eq(schema.securityCameras.id, input.id))
      const [result] = await db.select().from(schema.securityCameras).where(eq(schema.securityCameras.id, input.id)).limit(1)
      return result
    }),

  // Delete camera
  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.securityCameras).where(eq(schema.securityCameras.id, input.id))
      return { success: true }
    }),

  // Storage calculator: estimate days based on cameras + storage
  storageEstimate: os
    .input(z.object({
      totalCameras: z.number(),
      resolution: z.string().optional(),
      bitrateMbps: z.number().optional(),
      totalStorageGb: z.number(),
      recordingHours: z.number().optional(), // hours per day (default 24)
    }))
    .handler(async ({ input }) => {
      // Mbps to MB/s: divide by 8
      const resolutionBitrates: Record<string, number> = {
        '480p': 2, '720p': 4, '1080p': 8, '2K': 12, '4K': 20,
        '3MP': 6, '5MP': 10, '8MP': 16,
      }
      const bitrateMbps = input.bitrateMbps || resolutionBitrates[input.resolution || '1080p'] || 8
      const mbpsToMbs = bitrateMbps / 8 // MB/s
      const hoursPerDay = input.recordingHours || 24
      const mbPerSecond = mbpsToMbs
      const mbPerCameraPerDay = mbPerSecond * 3600 * hoursPerDay
      const mbPerDayTotal = mbPerCameraPerDay * input.totalCameras
      const gbPerDayTotal = mbPerDayTotal / 1024
      const daysEstimate = gbPerDayTotal > 0 ? Math.floor(input.totalStorageGb / gbPerDayTotal) : 999
      return {
        bitrateMbps,
        mbPerCameraPerDay: Math.round(mbPerCameraPerDay),
        gbPerDayTotal: Math.round(gbPerDayTotal * 10) / 10,
        daysEstimate: Math.min(daysEstimate, 365),
        totalStorageGb: input.totalStorageGb,
        totalCameras: input.totalCameras,
      }
    }),

  // Summary stats
  summary: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      const cameras = await db.select().from(schema.securityCameras).where(eq(schema.securityCameras.societyId, societyId))
      const total = cameras.length
      const online = cameras.filter(c => c.status === 'online').length
      const offline = cameras.filter(c => c.status === 'offline').length
      const faulty = cameras.filter(c => c.status === 'faulty').length
      const maintenance = cameras.filter(c => c.status === 'maintenance').length
      const totalStorageDays = cameras.reduce((sum, c) => sum + (c.storageDays || 0), 0) / (total || 1)
      const zones = [...new Set(cameras.map(c => c.zone).filter(Boolean))]
      const totalMonthlyAmc = cameras.reduce((sum, c) => sum + Number(c.monthlyAmc || 0), 0)
      const totalPurchaseCost = cameras.reduce((sum, c) => sum + Number(c.purchaseCost || 0), 0)
      const expiringWarranty = cameras.filter(c => {
        if (!c.warrantyExpiry) return false
        const exp = new Date(c.warrantyExpiry)
        const now = new Date()
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysLeft > 0 && daysLeft <= 30
      }).length
      return { total, online, offline, faulty, maintenance, avgStorageDays: Math.round(totalStorageDays), zones: zones.length, totalMonthlyAmc, totalPurchaseCost, expiringWarranty }
    }),
}

// ============================================
// CAMERA ZONE PROCEDURES
// ============================================
export const cameraZoneProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      return await db.select().from(schema.cameraZones).where(eq(schema.cameraZones.societyId, societyId))
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      color: z.string().optional(),
      mapPoints: z.string().optional(),
      mapCenterLat: z.string().optional(),
      mapCenterLng: z.string().optional(),
      mapZoom: z.number().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.cameraZones).values({
        societyId: input.societyId,
        name: input.name,
        description: input.description || null,
        color: input.color || null,
        mapPoints: input.mapPoints || null,
        mapCenterLat: input.mapCenterLat || null,
        mapCenterLng: input.mapCenterLng || null,
        mapZoom: input.mapZoom || null,
      }).execute()
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.cameraZones).set(input.data).where(eq(schema.cameraZones.id, input.id))
      const [result] = await db.select().from(schema.cameraZones).where(eq(schema.cameraZones.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.cameraZones).where(eq(schema.cameraZones.id, input.id))
      return { success: true }
    }),
}

// ============================================
// NVR SERVER PROCEDURES
// ============================================
export const nvrServerProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      return await db.select().from(schema.nvrServers).where(eq(schema.nvrServers.societyId, societyId))
    }),

  create: os
    .input(z.object({
      societyId: z.number(),
      name: z.string().min(1),
      brand: z.string().optional(),
      model: z.string().optional(),
      type: z.string().optional(),
      totalChannels: z.number().optional(),
      usedChannels: z.number().optional(),
      totalStorageGb: z.number().optional(),
      usedStorageGb: z.number().optional(),
      raidConfig: z.string().optional(),
      estimatedDays: z.number().optional(),
      ipAddress: z.string().optional(),
      port: z.number().optional(),
      username: z.string().optional(),
      accessUrl: z.string().optional(),
      status: z.string().optional(),
      firmwareVersion: z.string().optional(),
      purchaseCost: z.number().optional(),
      purchaseDate: z.string().optional(),
      warrantyExpiry: z.string().optional(),
      notes: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.nvrServers).values({
        societyId: input.societyId,
        name: input.name,
        brand: input.brand || null,
        model: input.model || null,
        type: (input.type as any) || 'nvr',
        totalChannels: input.totalChannels || 16,
        usedChannels: input.usedChannels || 0,
        totalStorageGb: input.totalStorageGb || null,
        usedStorageGb: input.usedStorageGb || null,
        raidConfig: input.raidConfig || null,
        estimatedDays: input.estimatedDays || null,
        ipAddress: input.ipAddress || null,
        port: input.port || null,
        username: input.username || null,
        accessUrl: input.accessUrl || null,
        status: (input.status as any) || 'online',
        firmwareVersion: input.firmwareVersion || null,
        purchaseCost: input.purchaseCost ? String(input.purchaseCost) : null,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
        notes: input.notes || null,
      }).execute()
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.nvrServers).set(input.data).where(eq(schema.nvrServers.id, input.id))
      const [result] = await db.select().from(schema.nvrServers).where(eq(schema.nvrServers.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.nvrServers).where(eq(schema.nvrServers.id, input.id))
      return { success: true }
    }),
}

// ============================================
// COMBINED ROUTER
// ============================================
// ============================================
// ROLE MANAGEMENT PROCEDURES
// ============================================
export const roleManagementProcedures = {
  list: os.handler(async () => {
    return db.select().from(schema.roles).orderBy(desc(schema.roles.id))
  }),

  getById: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [result] = await db.select().from(schema.roles).where(eq(schema.roles.id, input.id)).limit(1)
      return result || null
    }),

  create: os
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      permissions: z.string().optional(), // JSON string of permissions
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.roles).values({
        name: input.name,
        description: input.description,
        permissions: input.permissions,
      })
      return { id: Number(result.insertId), name: input.name, description: input.description, permissions: input.permissions }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db.update(schema.roles).set(input.data).where(eq(schema.roles.id, input.id))
      const [result] = await db.select().from(schema.roles).where(eq(schema.roles.id, input.id)).limit(1)
      return result
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.roles).where(eq(schema.roles.id, input.id))
      return { success: true }
    }),

  // Get users assigned to a role
  getUsersByRole: os
    .input(z.object({ roleId: z.number() }))
    .handler(async ({ input }) => {
      const results = await db
        .select({
          userId: schema.userRoles.userId,
          userName: schema.users.firstName,
          userLastName: schema.users.lastName,
          userEmail: schema.users.email,
        })
        .from(schema.userRoles)
        .leftJoin(schema.users, eq(schema.userRoles.userId, schema.users.id))
        .where(eq(schema.userRoles.roleId, input.roleId))
      return results
    }),

  // Assign role to user
  assignRole: os
    .input(z.object({
      userId: z.number(),
      roleId: z.number(),
      societyId: z.number().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.userRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        societyId: input.societyId,
      })
      return { id: Number(result.insertId) }
    }),

  // Remove role from user
  removeRole: os
    .input(z.object({ userId: z.number(), roleId: z.number() }))
    .handler(async ({ input }) => {
      await db
        .delete(schema.userRoles)
        .where(and(eq(schema.userRoles.userId, input.userId), eq(schema.userRoles.roleId, input.roleId)))
      return { success: true }
    }),
}

// Help center procedures imported from separate file
import {
  faqCategoryProcedures,
  faqProcedures,
  helpTicketProcedures,
  contactMessageProcedures,
  inAppNotificationProcedures,
} from './help-center-procedures'

export const router = {
  auth: authProcedures,
  members: memberProcedures,
  flats: flatProcedures,
  invoices: invoiceProcedures,
  expenses: expenseProcedures,
  visitors: visitorProcedures,
  notices: noticeProcedures,
  meetings: meetingProcedures,
  maintenance: maintenanceProcedures,
  serviceCompanies: serviceCompanyProcedures,
  servicePersons: servicePersonProcedures,
  amenities: amenityProcedures,
  amenityBookings: amenityBookingProcedures,
  societies: societyProcedures,
  parking: parkingProcedures,
  visitorParking: visitorParkingProcedures,
  vehicleMovements: vehicleMovementProcedures,
  vehicles: vehicleProcedures,
  accountHeads: accountHeadProcedures,
  journalVouchers: journalVoucherProcedures,
  bankAccounts: bankAccountProcedures,
  assets: assetProcedures,
  assetCategories: assetCategoryProcedures,
  inventory: inventoryProcedures,
  staff: staffProcedures,
  attendance: attendanceProcedures,
  staffLeaves: staffLeaveProcedures,
  staffSalaries: staffSalaryProcedures,
  societyLayout: societyLayoutProcedures,
  celebrations: celebrationProcedures,
  pets: petProcedures,
  petRules: petRuleProcedures,
  petVaccinations: petVaccinationProcedures,
  petHealthRecords: petHealthRecordProcedures,
  petReminders: petReminderProcedures,
  petActivityLog: petActivityLogProcedures,
  vendors: vendorProcedures,
  meetingAttendees: meetingAttendeeProcedures,
  securityDeposits: securityDepositProcedures,
  advancePayments: advancePaymentProcedures,
  userManagement: userManagementProcedures,
  roleManagement: roleManagementProcedures,
  profile: profileProcedures,
  documentFolders: documentFolderProcedures,
  documents: documentProcedures,
  emergencyContacts: emergencyContactProcedures,
  distressAlerts: distressAlertProcedures,
  nearbyFacilities: nearbyFacilityProcedures,
  societyLocation: societyLocationProcedures,
  securityCameras: securityCameraProcedures,
  cameraZones: cameraZoneProcedures,
  nvrServers: nvrServerProcedures,
  faqCategories: faqCategoryProcedures,
  faqs: faqProcedures,
  helpTickets: helpTicketProcedures,
  contactMessages: contactMessageProcedures,
  inAppNotifications: inAppNotificationProcedures,
}

export type AppRouter = typeof router;
