import { db } from '@/db'
import { eq, desc, asc, and, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'

// ============================================
// MEMBER REPOSITORY
// ============================================
export const memberRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.members).orderBy(desc(schema.members.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.members).where(eq(schema.members.id, id)).limit(1)
    return result[0] || null
  },

  async create(data: any) {
    const result = await db.insert(schema.members).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.members).set(data).where(eq(schema.members.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.members).where(eq(schema.members.id, id))
    return result[0].affectedRows > 0
  },

  async count() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.members)
    return result[0].count
  },
}

// ============================================
// FLAT REPOSITORY
// ============================================
export const flatRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.flats).orderBy(desc(schema.flats.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.flats).where(eq(schema.flats.id, id)).limit(1)
    return result[0] || null
  },

  async create(data: any) {
    const result = await db.insert(schema.flats).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.flats).set(data).where(eq(schema.flats.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.flats).where(eq(schema.flats.id, id))
    return result[0].affectedRows > 0
  },

  async count() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.flats)
    return result[0].count
  },
}

// ============================================
// INVOICE REPOSITORY (replaces Due)
// ============================================
export const invoiceRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.invoices).orderBy(desc(schema.invoices.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1)
    return result[0] || null
  },

  async findByFlatId(flatId: number) {
    return db.select().from(schema.invoices).where(eq(schema.invoices.flatId, flatId))
  },

  async create(data: any) {
    const result = await db.insert(schema.invoices).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.invoices).set(data).where(eq(schema.invoices.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.invoices).where(eq(schema.invoices.id, id))
    return result[0].affectedRows > 0
  },

  async count() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.invoices)
    return result[0].count
  },

  async getSummary() {
    const allInvoices = await db.select().from(schema.invoices)
    
    const totalExpected = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const collected = allInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
    const pending = allInvoices
      .filter((inv) => inv.status === 'draft' || inv.status === 'sent')
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0)
    const overdue = allInvoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0)

    return { totalExpected, collected, pending, overdue }
  },
}

// ============================================
// PAYMENT REPOSITORY
// ============================================
export const paymentRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.payments).orderBy(desc(schema.payments.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.payments).where(eq(schema.payments.id, id)).limit(1)
    return result[0] || null
  },

  async findByInvoiceId(invoiceId: number) {
    return db.select().from(schema.payments).where(eq(schema.payments.invoiceId, invoiceId))
  },

  async create(data: any) {
    const result = await db.insert(schema.payments).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.payments).set(data).where(eq(schema.payments.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.payments).where(eq(schema.payments.id, id))
    return result[0].affectedRows > 0
  },
}

// ============================================
// SERVICE REQUEST REPOSITORY (was maintenanceRequestRepository)
// ============================================
export const maintenanceRequestRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.serviceRequests).orderBy(desc(schema.serviceRequests.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.serviceRequests).where(eq(schema.serviceRequests.id, id)).limit(1)
    return result[0] || null
  },

  async findByStatus(status: string) {
    return db.select().from(schema.serviceRequests).where(eq(schema.serviceRequests.status, status as any))
  },

  async create(data: any) {
    const result = await db.insert(schema.serviceRequests).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.serviceRequests).set(data).where(eq(schema.serviceRequests.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.serviceRequests).where(eq(schema.serviceRequests.id, id))
    return result[0].affectedRows > 0
  },

  async count() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.serviceRequests)
    return result[0].count
  },
}

// ============================================
// NOTICE REPOSITORY
// ============================================
export const noticeRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.notices).orderBy(desc(schema.notices.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.notices).where(eq(schema.notices.id, id)).limit(1)
    return result[0] || null
  },

  async findPinned() {
    return db.select().from(schema.notices).where(eq(schema.notices.isPinned, true)).orderBy(desc(schema.notices.createdAt))
  },

  async create(data: any) {
    const result = await db.insert(schema.notices).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.notices).set(data).where(eq(schema.notices.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.notices).where(eq(schema.notices.id, id))
    return result[0].affectedRows > 0
  },
}

// ============================================
// MEETING REPOSITORY
// ============================================
export const meetingRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.meetings).orderBy(desc(schema.meetings.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.meetings).where(eq(schema.meetings.id, id)).limit(1)
    return result[0] || null
  },

  async findUpcoming() {
    return db.select().from(schema.meetings).where(eq(schema.meetings.status, 'scheduled')).orderBy(asc(schema.meetings.meetingDate))
  },

  async create(data: any) {
    const result = await db.insert(schema.meetings).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.meetings).set(data).where(eq(schema.meetings.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.meetings).where(eq(schema.meetings.id, id))
    return result[0].affectedRows > 0
  },
}

// ============================================
// VISITOR REPOSITORY
// ============================================
export const visitorRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.visitors).orderBy(desc(schema.visitors.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.visitors).where(eq(schema.visitors.id, id)).limit(1)
    return result[0] || null
  },

  async findCurrentlyInside() {
    return db.select().from(schema.visitors).where(sql`${schema.visitors.exitTime} IS NULL`)
  },

  async create(data: any) {
    const result = await db.insert(schema.visitors).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.visitors).set(data).where(eq(schema.visitors.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.visitors).where(eq(schema.visitors.id, id))
    return result[0].affectedRows > 0
  },
}

// ============================================
// EXPENSE REPOSITORY
// ============================================
export const expenseRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.expenses).orderBy(desc(schema.expenses.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).limit(1)
    return result[0] || null
  },

  async create(data: any) {
    const result = await db.insert(schema.expenses).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.expenses).set(data).where(eq(schema.expenses.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.expenses).where(eq(schema.expenses.id, id))
    return result[0].affectedRows > 0
  },

  async getSummary() {
    const allExpenses = await db.select().from(schema.expenses)
    
    const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const paid = allExpenses.filter((e) => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0)
    const pending = allExpenses.filter((e) => e.status === 'pending' || e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0)

    return { totalExpenses, paid, pending, budget: 150000 }
  },
}

// ============================================
// PET REPOSITORY
// ============================================
export const petRepository = {
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 100 } = options || {}
    const offset = (page - 1) * limit
    return db.select().from(schema.pets).orderBy(desc(schema.pets.id)).limit(limit).offset(offset)
  },

  async findById(id: number) {
    const result = await db.select().from(schema.pets).where(eq(schema.pets.id, id)).limit(1)
    return result[0] || null
  },

  async findByMemberId(memberId: number) {
    return db.select().from(schema.pets).where(eq(schema.pets.memberId, memberId))
  },

  async findByFlatId(flatId: number) {
    return db.select().from(schema.pets).where(eq(schema.pets.flatId, flatId))
  },

  async create(data: any) {
    const result = await db.insert(schema.pets).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.pets).set(data).where(eq(schema.pets.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.pets).where(eq(schema.pets.id, id))
    return result[0].affectedRows > 0
  },

  async count() {
    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.pets)
    return result[0].count
  },

  async countByType() {
    const all = await db.select().from(schema.pets).where(eq(schema.pets.isActive, true))
    const byType: Record<string, number> = {}
    for (const pet of all) {
      byType[pet.type] = (byType[pet.type] || 0) + 1
    }
    return byType
  },
}

// ============================================
// PET RULES REPOSITORY
// ============================================
export const petRuleRepository = {
  async findAll() {
    return db.select().from(schema.petRules).orderBy(desc(schema.petRules.createdAt))
  },

  async findById(id: number) {
    const result = await db.select().from(schema.petRules).where(eq(schema.petRules.id, id)).limit(1)
    return result[0] || null
  },

  async create(data: any) {
    const result = await db.insert(schema.petRules).values(data)
    return this.findById(Number(result[0].insertId))
  },

  async update(id: number, data: any) {
    await db.update(schema.petRules).set(data).where(eq(schema.petRules.id, id))
    return this.findById(id)
  },

  async delete(id: number) {
    const result = await db.delete(schema.petRules).where(eq(schema.petRules.id, id))
    return result[0].affectedRows > 0
  },
}
