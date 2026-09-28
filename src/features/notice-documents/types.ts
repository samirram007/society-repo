export type NoticeDocType = 'file' | 'photo' | 'link' | 'note'
export type NoticeDocCategory =
  | 'circular'
  | 'invoice'
  | 'receipt'
  | 'agreement'
  | 'id_proof'
  | 'photo_gallery'
  | 'announcement'
  | 'other'
export type NoticeVisibility = 'private' | 'public'
export type NoticeDocStorage = 'local' | 'cloudinary'

export interface NoticeDocument {
  id: number
  noticeId: number
  societyId: number
  title: string
  description: string | null
  folderId: number | null
  fileName: string | null
  fileUrl: string | null
  /** Small base64 preview for images */
  thumbnailData?: string | null
  mimeType: string | null
  fileExtension: string | null
  fileSize: number | null
  storageType: NoticeDocStorage | null
  docType: NoticeDocType | null
  category: NoticeDocCategory | null
  tags: string | null
  version: number | null
  downloadCount: number | null
  viewCount: number | null
  isStarred: boolean | null
  visibility: NoticeVisibility | null
  uploadedBy: number
  lastAccessedAt: string | null
  createdAt: string | null
}

/** Documents returned through public share links (subset, no sensitive fields) */
export interface PublicNoticeDocument {
  id: number
  title: string
  fileName: string | null
  mimeType: string | null
  fileExtension: string | null
  fileSize: number | null
  docType: NoticeDocType | null
  createdAt: string | null
}

export interface NoticeShare {
  id: number
  noticeId: number
  token: string
  viewCount: number | null
  maxViews: number | null
  expiresAt: string | null
  isRevoked: boolean | null
  createdAt: string | null
  sharedBy: number
}

export interface NoticeDocumentFolder {
  id: number
  societyId: number
  name: string
  description: string | null
  parentId: number | null
  color: string | null
  icon: string | null
  sortOrder: number | null
  isActive: boolean | null
  createdAt: string | null
}

/** File chosen in the uploader before it is persisted */
export interface PendingDocument {
  id: string
  name: string
  size: number
  mimeType: string
  docType: NoticeDocType
  /** Data URL (local) or cloud URL (cloudinary) after upload */
  data: string
  /** Small JPEG preview for images (optional) */
  thumbnail?: string
  storageType: NoticeDocStorage
  cloudPublicId?: string
  uploadedBy: number
  error?: string
}

export interface NoticeDocStats {
  total: number
  totalSize: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  starred: number
}

// ============================================
// DISPLAY CONFIGS
// ============================================
export const docTypeConfig: Record<
  NoticeDocType,
  { label: string; color: string }
> = {
  file: { label: 'File', color: 'bg-secondary text-secondary-foreground' },
  photo: { label: 'Photo', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  link: { label: 'Link', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  note: { label: 'Note', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
}

export const docCategoryConfig: Record<NoticeDocCategory, { label: string }> = {
  circular: { label: 'Circular' },
  invoice: { label: 'Invoice' },
  receipt: { label: 'Receipt' },
  agreement: { label: 'Agreement' },
  id_proof: { label: 'ID Proof' },
  photo_gallery: { label: 'Photo Gallery' },
  announcement: { label: 'Announcement' },
  other: { label: 'Other' },
}

export const visibilityConfig: Record<
  NoticeVisibility,
  { label: string; description: string; color: string }
> = {
  private: {
    label: 'Private',
    description: 'Only logged-in portal members can see and open this notice. Cannot be shared externally.',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  public: {
    label: 'Public',
    description: 'Can be shared via link. Anyone with the link can view, even without an account.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
}
