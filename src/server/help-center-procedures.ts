import { os } from '@orpc/server'
import { z } from 'zod'
import { db } from '@/db'
import { eq, desc, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'

// ============================================
// FAQ CATEGORY PROCEDURES
// ============================================
export const faqCategoryProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      return db.select().from(schema.faqCategories)
        .where(sql`${schema.faqCategories.societyId} = ${societyId} AND ${schema.faqCategories.isActive} = true`)
        .orderBy(schema.faqCategories.sortOrder)
    }),

  create: os
    .input(z.object({ societyId: z.number(), name: z.string().min(1), description: z.string().optional(), icon: z.string().optional() }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.faqCategories).values(input)
      return { id: Number(result.insertId), ...input, isActive: true }
    }),
}

// ============================================
// FAQ PROCEDURES
// ============================================
export const faqProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional(), categoryId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, categoryId } = input || {}
      if (categoryId) {
        return db.select().from(schema.faqs)
          .where(sql`${schema.faqs.societyId} = ${societyId} AND ${schema.faqs.categoryId} = ${categoryId} AND ${schema.faqs.isActive} = true`)
          .orderBy(schema.faqs.sortOrder)
      }
      return db.select().from(schema.faqs)
        .where(sql`${schema.faqs.societyId} = ${societyId} AND ${schema.faqs.isActive} = true`)
        .orderBy(schema.faqs.sortOrder)
    }),

  create: os
    .input(z.object({ societyId: z.number(), categoryId: z.number().optional(), question: z.string().min(1), answer: z.string().min(1) }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.faqs).values(input)
      return { id: Number(result.insertId), ...input, helpful: 0, notHelpful: 0, isActive: true }
    }),

  voteHelpful: os
    .input(z.object({ id: z.number(), helpful: z.boolean() }))
    .handler(async ({ input }) => {
      if (input.helpful) {
        await db.update(schema.faqs).set({ helpful: sql`${schema.faqs.helpful} + 1` }).where(eq(schema.faqs.id, input.id))
      } else {
        await db.update(schema.faqs).set({ notHelpful: sql`${schema.faqs.notHelpful} + 1` }).where(eq(schema.faqs.id, input.id))
      }
      return { success: true }
    }),
}

// ============================================
// HELP TICKET PROCEDURES
// ============================================
export const helpTicketProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional(), status: z.string().optional(), userId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, status, userId } = input || {}
      const conditions = [sql`${schema.helpTickets.societyId} = ${societyId}`]
      if (status && status !== 'all') conditions.push(sql`${schema.helpTickets.status} = ${status}`)
      if (userId) conditions.push(sql`${schema.helpTickets.userId} = ${userId}`)
      return db.select().from(schema.helpTickets)
        .where(sql`${conditions.join(' AND ')}`)
        .orderBy(desc(schema.helpTickets.createdAt))
    }),

  get: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [ticket] = await db.select().from(schema.helpTickets).where(eq(schema.helpTickets.id, input.id)).limit(1)
      if (!ticket) return null
      const messages = await db.select().from(schema.helpTicketMessages)
        .where(eq(schema.helpTicketMessages.ticketId, input.id))
        .orderBy(schema.helpTicketMessages.createdAt)
      return { ...ticket, messages }
    }),

  create: os
    .input(z.object({
      societyId: z.number(), userId: z.number(), subject: z.string().min(1), description: z.string().min(1),
      category: z.enum(['general', 'billing', 'technical', 'maintenance', 'security', 'amenity', 'other']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    }))
    .handler(async ({ input }) => {
      const [cnt] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.helpTickets).where(eq(schema.helpTickets.societyId, input.societyId))
      const ticketNumber = `TKT-${String((cnt?.count ?? 0) + 1).padStart(3, '0')}`
      const [result] = await db.insert(schema.helpTickets).values({ ...input, ticketNumber })
      await db.insert(schema.helpTicketMessages).values({
        ticketId: Number(result.insertId), userId: input.userId, message: input.description,
      })
      return { id: Number(result.insertId), ticketNumber, ...input, status: 'open' }
    }),

  addMessage: os
    .input(z.object({ ticketId: z.number(), userId: z.number(), message: z.string().min(1) }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.helpTicketMessages).values(input)
      await db.update(schema.helpTickets).set({ updatedAt: new Date() }).where(eq(schema.helpTickets.id, input.ticketId))
      return { id: Number(result.insertId), ...input, createdAt: new Date() }
    }),

  updateStatus: os
    .input(z.object({ id: z.number(), status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']) }))
    .handler(async ({ input }) => {
      const updates: any = { status: input.status, updatedAt: new Date() }
      if (input.status === 'resolved') updates.resolvedAt = new Date()
      if (input.status === 'closed') updates.closedAt = new Date()
      await db.update(schema.helpTickets).set(updates).where(eq(schema.helpTickets.id, input.id))
      return { success: true }
    }),

  rate: os
    .input(z.object({ id: z.number(), rating: z.number().min(1).max(5) }))
    .handler(async ({ input }) => {
      await db.update(schema.helpTickets).set({ satisfactionRating: input.rating, updatedAt: new Date() }).where(eq(schema.helpTickets.id, input.id))
      return { success: true }
    }),

  summary: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      const all = await db.select().from(schema.helpTickets).where(eq(schema.helpTickets.societyId, societyId))
      return {
        total: all.length,
        open: all.filter(t => t.status === 'open').length,
        inProgress: all.filter(t => t.status === 'in_progress').length,
        waiting: all.filter(t => t.status === 'waiting').length,
        resolved: all.filter(t => t.status === 'resolved').length,
        closed: all.filter(t => t.status === 'closed').length,
        urgent: all.filter(t => t.priority === 'urgent').length,
      }
    }),
}

// ============================================
// CONTACT MESSAGE PROCEDURES
// ============================================
export const contactMessageProcedures = {
  list: os
    .input(z.object({ status: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const { status } = input || {}
      if (status && status !== 'all') {
        return db.select().from(schema.contactMessages).where(sql`${schema.contactMessages.status} = ${status}`).orderBy(desc(schema.contactMessages.createdAt))
      }
      return db.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt))
    }),

  create: os
    .input(z.object({
      name: z.string().min(1), email: z.string().email(), phone: z.string().optional(),
      subject: z.string().min(1), message: z.string().min(1),
      category: z.enum(['general', 'support', 'sales', 'feedback', 'bug_report']).optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.contactMessages).values(input)
      return { id: Number(result.insertId), ...input, status: 'new' }
    }),

  markRead: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.contactMessages).set({ status: 'read' }).where(eq(schema.contactMessages.id, input.id))
      return { success: true }
    }),
}

// ============================================
// IN-APP NOTIFICATION PROCEDURES
// ============================================
export const inAppNotificationProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional(), userId: z.number().optional(), unreadOnly: z.boolean().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, userId = 1, unreadOnly } = input || {}
      const conditions = [
        sql`${schema.inAppNotifications.societyId} = ${societyId}`,
        sql`${schema.inAppNotifications.userId} = ${userId}`,
      ]
      if (unreadOnly) conditions.push(sql`${schema.inAppNotifications.isRead} = false`)
      return db.select().from(schema.inAppNotifications)
        .where(sql`${conditions.join(' AND ')}`)
        .orderBy(desc(schema.inAppNotifications.createdAt))
        .limit(50)
    }),

  unreadCount: os
    .input(z.object({ societyId: z.number().optional(), userId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, userId = 1 } = input || {}
      const [result] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.inAppNotifications)
        .where(sql`${schema.inAppNotifications.societyId} = ${societyId} AND ${schema.inAppNotifications.userId} = ${userId} AND ${schema.inAppNotifications.isRead} = false`)
      return { count: result?.count ?? 0 }
    }),

  markRead: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.update(schema.inAppNotifications).set({ isRead: true }).where(eq(schema.inAppNotifications.id, input.id))
      return { success: true }
    }),

  markAllRead: os
    .input(z.object({ societyId: z.number().optional(), userId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1, userId = 1 } = input || {}
      await db.update(schema.inAppNotifications).set({ isRead: true })
        .where(sql`${schema.inAppNotifications.societyId} = ${societyId} AND ${schema.inAppNotifications.userId} = ${userId} AND ${schema.inAppNotifications.isRead} = false`)
      return { success: true }
    }),

  create: os
    .input(z.object({ societyId: z.number(), userId: z.number(), title: z.string().min(1), message: z.string().min(1), type: z.enum(['info', 'warning', 'success', 'error', 'alert']).optional(), link: z.string().optional() }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.inAppNotifications).values(input)
      return { id: Number(result.insertId), ...input, isRead: false }
    }),
}
