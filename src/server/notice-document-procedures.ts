import { os } from '@orpc/server'
import { z } from 'zod'
import { db } from '@/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'

// ============================================
// NOTICE DOCUMENT MANAGEMENT SYSTEM (DMS)
// Folderized, reusable document management for the notice board.
// Only additive — existing notice procedures are untouched.
// ============================================

const noticeDocumentInput = z.object({
  noticeId: z.number(),
  societyId: z.number().default(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
  fileExtension: z.string().optional(),
  fileSize: z.number().optional(),
  fileData: z.string().optional(),
  thumbnailData: z.string().optional(),
  cloudPublicId: z.string().optional(),
  storageType: z.enum(['local', 'cloudinary']).optional(),
  docType: z.enum(['file', 'photo', 'link', 'note']).optional(),
  category: z.enum([
    'circular',
    'invoice',
    'receipt',
    'agreement',
    'id_proof',
    'photo_gallery',
    'announcement',
    'other',
  ]).optional(),
  tags: z.string().optional(),
  folderId: z.number().nullable().optional(),
  visibility: z.enum(['private', 'public']).optional(),
  uploadedBy: z.number(),
})

// ============================================
// NOTICE DOCUMENT FOLDERS
// ============================================
export const noticeDocumentFolderProcedures = {
  list: os
    .input(z.object({ societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const { societyId = 1 } = input || {}
      return db
        .select()
        .from(schema.noticeDocumentFolders)
        .where(eq(schema.noticeDocumentFolders.societyId, societyId))
        .orderBy(schema.noticeDocumentFolders.sortOrder, schema.noticeDocumentFolders.name)
    }),

  create: os
    .input(z.object({
      societyId: z.number().default(1),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.number().nullable().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    }))
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.noticeDocumentFolders).values({
        societyId: input.societyId,
        name: input.name,
        description: input.description,
        parentId: input.parentId ?? null,
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
      await db.update(schema.noticeDocumentFolders)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(schema.noticeDocumentFolders.id, input.id))
      return { success: true }
    }),

  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      // Move docs to root, then delete subfolders + the folder itself
      const subfolders = await db
        .select()
        .from(schema.noticeDocumentFolders)
        .where(eq(schema.noticeDocumentFolders.parentId, input.id))
      for (const sub of subfolders) {
        await db
          .update(schema.noticeDocuments)
          .set({ folderId: null })
          .where(eq(schema.noticeDocuments.folderId, sub.id))
        await db.delete(schema.noticeDocumentFolders).where(eq(schema.noticeDocumentFolders.id, sub.id))
      }
      await db
        .update(schema.noticeDocuments)
        .set({ folderId: null })
        .where(eq(schema.noticeDocuments.folderId, input.id))
      await db.delete(schema.noticeDocumentFolders).where(eq(schema.noticeDocumentFolders.id, input.id))
      return { success: true }
    }),
}

// ============================================
// NOTICE DOCUMENTS CRUD
// ============================================
export const noticeDocumentProcedures = {
  /** List documents for a notice (metadata only — no fileData payloads) */
  list: os
    .input(z.object({ noticeId: z.number(), includeInactive: z.boolean().optional() }).optional())
    .handler(async ({ input }) => {
      if (!input?.noticeId) return []
      const conditions = [eq(schema.noticeDocuments.noticeId, input.noticeId)]
      if (!input.includeInactive) {
        conditions.push(eq(schema.noticeDocuments.isActive, true))
      }
      return db
        .select({
          id: schema.noticeDocuments.id,
          noticeId: schema.noticeDocuments.noticeId,
          societyId: schema.noticeDocuments.societyId,
          title: schema.noticeDocuments.title,
          description: schema.noticeDocuments.description,
          folderId: schema.noticeDocuments.folderId,
          fileName: schema.noticeDocuments.fileName,
          fileUrl: schema.noticeDocuments.fileUrl,
          thumbnailData: schema.noticeDocuments.thumbnailData,
          mimeType: schema.noticeDocuments.mimeType,
          fileExtension: schema.noticeDocuments.fileExtension,
          fileSize: schema.noticeDocuments.fileSize,
          storageType: schema.noticeDocuments.storageType,
          docType: schema.noticeDocuments.docType,
          category: schema.noticeDocuments.category,
          tags: schema.noticeDocuments.tags,
          version: schema.noticeDocuments.version,
          downloadCount: schema.noticeDocuments.downloadCount,
          viewCount: schema.noticeDocuments.viewCount,
          isStarred: schema.noticeDocuments.isStarred,
          visibility: schema.noticeDocuments.visibility,
          uploadedBy: schema.noticeDocuments.uploadedBy,
          lastAccessedAt: schema.noticeDocuments.lastAccessedAt,
          createdAt: schema.noticeDocuments.createdAt,
        })
        .from(schema.noticeDocuments)
        .where(and(...conditions))
        .orderBy(desc(schema.noticeDocuments.id))
    }),

  /** Public listing: only documents whose parent notice is PUBLIC and link valid */
  listPublic: os
    .input(z.object({ noticeId: z.number() }))
    .handler(async ({ input }) => {
      const [notice] = await db
        .select({ id: schema.notices.id, visibility: schema.notices.visibility })
        .from(schema.notices)
        .where(eq(schema.notices.id, input.noticeId))
        .limit(1)
      if (!notice || notice.visibility !== 'public') return []
      return db
        .select({
          id: schema.noticeDocuments.id,
          title: schema.noticeDocuments.title,
          fileName: schema.noticeDocuments.fileName,
          mimeType: schema.noticeDocuments.mimeType,
          fileExtension: schema.noticeDocuments.fileExtension,
          fileSize: schema.noticeDocuments.fileSize,
          docType: schema.noticeDocuments.docType,
          category: schema.noticeDocuments.category,
          downloadCount: schema.noticeDocuments.downloadCount,
          createdAt: schema.noticeDocuments.createdAt,
        })
        .from(schema.noticeDocuments)
        .where(
          and(
            eq(schema.noticeDocuments.noticeId, input.noticeId),
            eq(schema.noticeDocuments.isActive, true),
            eq(schema.noticeDocuments.visibility, 'public')
          )
        )
        .orderBy(desc(schema.noticeDocuments.id))
    }),

  getById: os
    .input(z.object({ id: z.number(), publicToken: z.string().optional() }))
    .handler(async ({ input }) => {
      const [doc] = await db
        .select()
        .from(schema.noticeDocuments)
        .where(eq(schema.noticeDocuments.id, input.id))
        .limit(1)
      if (!doc) return null

      // Public access path: must come with a valid, unexpired share token
      if (input.publicToken) {
        const share = await validateShareToken(input.publicToken)
        if (!share || share.noticeId !== doc.noticeId) return null
        const [notice] = await db
          .select({ visibility: schema.notices.visibility })
          .from(schema.notices)
          .where(eq(schema.notices.id, doc.noticeId))
          .limit(1)
        if (!notice || notice.visibility !== 'public' || doc.visibility !== 'public') return null
      } else {
        // Private access path: portal user. Private docs still allowed.
        await db
          .update(schema.noticeDocuments)
          .set({ lastAccessedAt: new Date() })
          .where(eq(schema.noticeDocuments.id, input.id))
      }
      return doc
    }),

  create: os
    .input(noticeDocumentInput)
    .handler(async ({ input }) => {
      const [result] = await db.insert(schema.noticeDocuments).values({
        noticeId: input.noticeId,
        societyId: input.societyId,
        title: input.title,
        description: input.description,
        folderId: input.folderId ?? null,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        mimeType: input.mimeType,
        fileExtension: input.fileExtension,
        fileSize: input.fileSize,
        fileData: input.fileData || null,
        thumbnailData: input.thumbnailData || null,
        cloudPublicId: input.cloudPublicId,
        storageType: input.storageType || 'local',
        docType: input.docType || 'file',
        category: input.category || 'other',
        tags: input.tags,
        visibility: input.visibility,
        uploadedBy: input.uploadedBy,
        version: 1,
        downloadCount: 0,
        viewCount: 0,
        isActive: true,
      })
      return { id: Number(result.insertId), ...input }
    }),

  update: os
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
    .handler(async ({ input }) => {
      await db
        .update(schema.noticeDocuments)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(schema.noticeDocuments.id, input.id))
      const [result] = await db
        .select()
        .from(schema.noticeDocuments)
        .where(eq(schema.noticeDocuments.id, input.id))
        .limit(1)
      return result
    }),

  /** Soft delete (trash) */
  delete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db
        .update(schema.noticeDocuments)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.noticeDocuments.id, input.id))
      return { success: true }
    }),

  permanentDelete: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db.delete(schema.noticeDocuments).where(eq(schema.noticeDocuments.id, input.id))
      return { success: true }
    }),

  toggleStar: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [doc] = await db
        .select()
        .from(schema.noticeDocuments)
        .where(eq(schema.noticeDocuments.id, input.id))
        .limit(1)
      if (!doc) throw new Error('Document not found')
      await db
        .update(schema.noticeDocuments)
        .set({ isStarred: !doc.isStarred, updatedAt: new Date() })
        .where(eq(schema.noticeDocuments.id, input.id))
      return { success: true, isStarred: !doc.isStarred }
    }),

  /** Bump download counter and return the data URL for local files */
  download: os
    .input(z.object({ id: z.number(), publicToken: z.string().optional() }))
    .handler(async ({ input }) => {
      const [doc] = await db
        .select()
        .from(schema.noticeDocuments)
        .where(eq(schema.noticeDocuments.id, input.id))
        .limit(1)
      if (!doc) throw new Error('Document not found')

      if (input.publicToken) {
        const share = await validateShareToken(input.publicToken)
        if (!share || share.noticeId !== doc.noticeId) throw new Error('Invalid or expired share link')
        if (doc.visibility !== 'public') throw new Error('This document is private')
      }

      await db
        .update(schema.noticeDocuments)
        .set({ downloadCount: (doc.downloadCount || 0) + 1, lastAccessedAt: new Date() })
        .where(eq(schema.noticeDocuments.id, input.id))

      if (doc.storageType === 'cloudinary' && doc.fileUrl) {
        return { url: doc.fileUrl, mimeType: doc.mimeType, fileName: doc.fileName, data: null }
      }
      return { url: null, mimeType: doc.mimeType, fileName: doc.fileName, data: doc.fileData }
    }),

  search: os
    .input(z.object({ query: z.string().min(1), societyId: z.number().optional() }))
    .handler(async ({ input }) => {
      const q = input.query.toLowerCase()
      const all = await db
        .select()
        .from(schema.noticeDocuments)
        .where(
          and(
            eq(schema.noticeDocuments.isActive, true),
            input.societyId ? eq(schema.noticeDocuments.societyId, input.societyId) : sql`1=1`
          )
        )
      return all
        .filter(
          (d) =>
            d.title?.toLowerCase().includes(q) ||
            d.description?.toLowerCase().includes(q) ||
            d.tags?.toLowerCase().includes(q) ||
            d.fileName?.toLowerCase().includes(q)
        )
        .map(({ fileData, ...meta }) => meta)
    }),

  stats: os
    .input(z.object({ noticeId: z.number().optional(), societyId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const conditions = [eq(schema.noticeDocuments.isActive, true)]
      if (input?.noticeId) conditions.push(eq(schema.noticeDocuments.noticeId, input.noticeId))
      if (input?.societyId) conditions.push(eq(schema.noticeDocuments.societyId, input.societyId))
      const all = await db
        .select({
          docType: schema.noticeDocuments.docType,
          category: schema.noticeDocuments.category,
          fileSize: schema.noticeDocuments.fileSize,
          isStarred: schema.noticeDocuments.isStarred,
          createdAt: schema.noticeDocuments.createdAt,
        })
        .from(schema.noticeDocuments)
        .where(and(...conditions))
      const totalSize = all.reduce((sum, d) => sum + (d.fileSize || 0), 0)
      const byType: Record<string, number> = {}
      const byCategory: Record<string, number> = {}
      for (const d of all) {
        if (d.docType) byType[d.docType] = (byType[d.docType] || 0) + 1
        if (d.category) byCategory[d.category] = (byCategory[d.category] || 0) + 1
      }
      return {
        total: all.length,
        totalSize,
        byType,
        byCategory,
        starred: all.filter((d) => d.isStarred).length,
      }
    }),
}

// ============================================
// SHARE LINKS (public / private notice sharing)
// ============================================
const shareTokenChars = 'abcdefghjkmnpqrstuvwxyz23456789'
function generateShareToken(length = 32): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += shareTokenChars[Math.floor(Math.random() * shareTokenChars.length)]
  }
  return out
}

/** Internal helper: validate a share token against the notice_shares table */
async function validateShareToken(token: string) {
  const [share] = await db
    .select()
    .from(schema.noticeShares)
    .where(eq(schema.noticeShares.token, token))
    .limit(1)
  if (!share || share.isRevoked || !share.isActive) return null
  if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) return null
  if (share.maxViews != null && (share.viewCount || 0) >= share.maxViews) return null
  return share
}

export const noticeShareProcedures = {
  /** List share links for a notice (portal-side management) */
  list: os
    .input(z.object({ noticeId: z.number() }))
    .handler(async ({ input }) => {
      return db
        .select({
          id: schema.noticeShares.id,
          noticeId: schema.noticeShares.noticeId,
          token: schema.noticeShares.token,
          viewCount: schema.noticeShares.viewCount,
          maxViews: schema.noticeShares.maxViews,
          expiresAt: schema.noticeShares.expiresAt,
          isRevoked: schema.noticeShares.isRevoked,
          createdAt: schema.noticeShares.createdAt,
          sharedBy: schema.noticeShares.sharedBy,
        })
        .from(schema.noticeShares)
        .where(eq(schema.noticeShares.noticeId, input.noticeId))
        .orderBy(desc(schema.noticeShares.id))
    }),

  /**
   * Create a share link for a PUBLIC notice.
   * Private notices cannot be shared externally — enforced here.
   */
  create: os
    .input(z.object({
      noticeId: z.number(),
      societyId: z.number().default(1),
      sharedBy: z.number(),
      expiresInDays: z.number().nullable().optional(),
      maxViews: z.number().nullable().optional(),
    }))
    .handler(async ({ input }) => {
      const [notice] = await db
        .select({ id: schema.notices.id, visibility: schema.notices.visibility, isActive: schema.notices.isActive })
        .from(schema.notices)
        .where(eq(schema.notices.id, input.noticeId))
        .limit(1)
      if (!notice) throw new Error('Notice not found')
      if (!notice.isActive) throw new Error('Notice is not active')
      if (notice.visibility !== 'public') {
        throw new Error('Only public notices can be shared externally. Change the notice visibility to public first.')
      }

      const token = generateShareToken()
      const [result] = await db.insert(schema.noticeShares).values({
        noticeId: input.noticeId,
        societyId: input.societyId ?? 1,
        token,
        sharedBy: input.sharedBy,
        expiresAt: input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : null,
        maxViews: input.maxViews ?? null,
        viewCount: 0,
        isRevoked: false,
        isActive: true,
      })
      return { id: Number(result.insertId), token }
    }),

  /** Revoke a share link */
  revoke: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await db
        .update(schema.noticeShares)
        .set({ isRevoked: true, isActive: false, updatedAt: new Date() })
        .where(eq(schema.noticeShares.id, input.id))
      return { success: true }
    }),

  /**
   * PUBLIC endpoint: resolve a share token into the shared notice.
   * Only ever returns PUBLIC notices. Increments view counter.
   */
  resolvePublic: os
    .input(z.object({ token: z.string().min(10) }))
    .handler(async ({ input }) => {
      const share = await validateShareToken(input.token)
      if (!share) throw new Error('This share link is invalid, expired or revoked')

      const [notice] = await db
        .select({
          id: schema.notices.id,
          societyId: schema.notices.societyId,
          title: schema.notices.title,
          content: schema.notices.content,
          category: schema.notices.category,
          priority: schema.notices.priority,
          visibility: schema.notices.visibility,
          isActive: schema.notices.isActive,
          createdAt: schema.notices.createdAt,
        })
        .from(schema.notices)
        .where(eq(schema.notices.id, share.noticeId))
        .limit(1)

      if (!notice || !notice.isActive || notice.visibility !== 'public') {
        throw new Error('This share link is no longer available')
      }

      await db
        .update(schema.noticeShares)
        .set({ viewCount: (share.viewCount || 0) + 1, updatedAt: new Date() })
        .where(eq(schema.noticeShares.id, share.id))

      return {
        notice: {
          id: notice.id,
          title: notice.title,
          content: notice.content,
          category: notice.category,
          priority: notice.priority,
          createdAt: notice.createdAt,
        },
        documents: await db
          .select({
            id: schema.noticeDocuments.id,
            title: schema.noticeDocuments.title,
            fileName: schema.noticeDocuments.fileName,
            mimeType: schema.noticeDocuments.mimeType,
            fileExtension: schema.noticeDocuments.fileExtension,
            fileSize: schema.noticeDocuments.fileSize,
            docType: schema.noticeDocuments.docType,
            createdAt: schema.noticeDocuments.createdAt,
          })
          .from(schema.noticeDocuments)
          .where(
            and(
              eq(schema.noticeDocuments.noticeId, notice.id),
              eq(schema.noticeDocuments.isActive, true),
              eq(schema.noticeDocuments.visibility, 'public')
            )
          )
          .orderBy(desc(schema.noticeDocuments.id)),
      }
    }),
}

// ============================================
// VISIBILITY (public/private notice toggle)
// ============================================
export const noticeVisibilityProcedures = {
  set: os
    .input(z.object({ id: z.number(), visibility: z.enum(['private', 'public']) }))
    .handler(async ({ input }) => {
      if (input.visibility === 'private') {
        // Revoking publicity: revoke all share links so external access dies
        await db
          .update(schema.noticeShares)
          .set({ isRevoked: true, isActive: false, updatedAt: new Date() })
          .where(eq(schema.noticeShares.noticeId, input.id))
      }
      await db
        .update(schema.notices)
        .set({ visibility: input.visibility, updatedAt: new Date() })
        .where(eq(schema.notices.id, input.id))
      return { success: true, visibility: input.visibility }
    }),

  get: os
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const [notice] = await db
        .select({ id: schema.notices.id, visibility: schema.notices.visibility })
        .from(schema.notices)
        .where(eq(schema.notices.id, input.id))
        .limit(1)
      return notice || null
    }),
}
