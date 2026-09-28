import {
  mysqlTable,
  varchar,
  int,
  text,
  datetime,
  boolean,
  mysqlEnum,
  index,
  bigint,
} from 'drizzle-orm/mysql-core'
// thumbnail_data added via migration (text column on notice_documents)
import { societies } from './cluster'
import { users } from './users'
import { notices } from './communications'

// ============================================
// NOTICE DOCUMENTS
// Documents/files attached to notices (DMS core entity)
// ============================================
export const noticeDocuments = mysqlTable('notice_documents', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  noticeId: int('notice_id')
    .notNull()
    .references(() => notices.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  // Folder support (folderized structure). Self-referencing parent for nested folders.
  folderId: int('folder_id'),
  folderPath: varchar('folder_path', { length: 1024 }).default('/'),
  // File info
  fileName: varchar('file_name', { length: 255 }),
  fileUrl: varchar('file_url', { length: 500 }),
  mimeType: varchar('mime_type', { length: 150 }),
  fileExtension: varchar('file_extension', { length: 20 }),
  fileSize: bigint('file_size', { mode: 'number' }),
  /** Base64 data URL content for local storage mode (kept out of list queries) */
  fileData: text('file_data'),
  /** Small base64 preview thumbnail for images (safe to return in list queries) */
  thumbnailData: text('thumbnail_data'),
  /** Cloudinary public id when stored in cloud */
  cloudPublicId: varchar('cloud_public_id', { length: 255 }),
  storageType: mysqlEnum('storage_type', ['local', 'cloudinary']).default('local'),
  // Classification
  docType: mysqlEnum('doc_type', [
    'file',
    'photo',
    'link',
    'note',
  ]).default('file'),
  category: mysqlEnum('category', [
    'circular',
    'invoice',
    'receipt',
    'agreement',
    'id_proof',
    'photo_gallery',
    'announcement',
    'other',
  ]).default('other'),
  tags: varchar('tags', { length: 500 }),
  // DMS properties
  version: int('version').default(1),
  downloadCount: int('download_count').default(0),
  viewCount: int('view_count').default(0),
  isStarred: boolean('is_starred').default(false),
  isActive: boolean('is_active').default(true),
  // Access control mirror: private docs inherit notice visibility
  visibility: mysqlEnum('visibility', ['private', 'public']).default('private'),
  uploadedBy: int('uploaded_by').notNull().references(() => users.id),
  lastAccessedAt: datetime('last_accessed_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('notice_documents_notice_id_idx').on(table.noticeId),
  index('notice_documents_society_id_idx').on(table.societyId),
  index('notice_documents_folder_id_idx').on(table.folderId),
  index('notice_documents_uploaded_by_idx').on(table.uploadedBy),
  index('notice_documents_visibility_idx').on(table.societyId, table.visibility),
])

// ============================================
// NOTICE SHARE LINKS
// Token-based public sharing. Only PUBLIC notices can have links.
// ============================================
export const noticeShares = mysqlTable('notice_shares', {
  id: int('id').primaryKey().autoincrement(),
  noticeId: int('notice_id')
    .notNull()
    .references(() => notices.id, { onDelete: 'cascade' }),
  societyId: int('society_id').notNull().references(() => societies.id),
  /** URL-safe unique token used in /share/{token} */
  token: varchar('token', { length: 64 }).notNull().unique(),
  /** Who created the share link */
  sharedBy: int('shared_by').notNull().references(() => users.id),
  /** Optional expiry for the link */
  expiresAt: datetime('expires_at'),
  /** Optional max view limit; NULL = unlimited */
  maxViews: int('max_views'),
  viewCount: int('view_count').default(0),
  isRevoked: boolean('is_revoked').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('notice_shares_notice_id_idx').on(table.noticeId),
  index('notice_shares_token_idx').on(table.token),
  index('notice_shares_society_id_idx').on(table.societyId),
])

// ============================================
// NOTICE DOCUMENT FOLDERS
// Virtual folders for organizing notice documents
// ============================================
export const noticeDocumentFolders = mysqlTable('notice_document_folders', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: int('parent_id'),
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('folder'),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('notice_document_folders_society_id_idx').on(table.societyId),
  index('notice_document_folders_parent_id_idx').on(table.parentId),
])
