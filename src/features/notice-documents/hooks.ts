import { useState, useEffect, useCallback } from 'react'
import { orpc } from '@/server/client'
import { useCurrentUser } from '@/hooks/auth'
import type {
  NoticeDocument,
  NoticeDocStats,
  NoticeDocumentFolder,
  NoticeShare,
  NoticeVisibility,
  PendingDocument,
} from './types'
import { detectDocType, getFileExtension } from './utils'

// ============================================
// NOTICE DOCUMENTS HOOKS
// Reusable data hooks over the oRPC procedures.
// Portal-side (authenticated) usage.
// ============================================

export function useNoticeDocuments(noticeId: number | null, options?: { includeInactive?: boolean }) {
  const [documents, setDocuments] = useState<NoticeDocument[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!noticeId) {
      setDocuments([])
      return
    }
    setLoading(true)
    try {
      const data = await orpc.noticeDocuments.list({ noticeId, includeInactive: options?.includeInactive })
      setDocuments(data || [])
    } catch (error) {
      console.error('Failed to load notice documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [noticeId, options?.includeInactive])

  useEffect(() => {
    load()
  }, [load])

  return { documents, loading, reload: load }
}

export function useNoticeDocStats(noticeId?: number) {
  const [stats, setStats] = useState<NoticeDocStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    orpc.noticeDocuments
      .stats({ noticeId })
      .then((data: NoticeDocStats) => {
        if (!cancelled) setStats(data)
      })
      .catch((error: unknown) => {
        console.error('Failed to load doc stats:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [noticeId])

  return { stats, loading }
}

export function useNoticeFolders(societyId = 1) {
  const [folders, setFolders] = useState<NoticeDocumentFolder[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await orpc.noticeDocumentFolders.list({ societyId })
      setFolders(data || [])
    } catch (error) {
      console.error('Failed to load folders:', error)
    } finally {
      setLoading(false)
    }
  }, [societyId])

  useEffect(() => {
    load()
  }, [load])

  return { folders, loading, reload: load }
}

export function useNoticeShares(noticeId: number | null) {
  const [shares, setShares] = useState<NoticeShare[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!noticeId) {
      setShares([])
      return
    }
    setLoading(true)
    try {
      const data = await orpc.noticeShares.list({ noticeId })
      setShares(data || [])
    } catch (error) {
      console.error('Failed to load shares:', error)
      setShares([])
    } finally {
      setLoading(false)
    }
  }, [noticeId])

  useEffect(() => {
    load()
  }, [load])

  return { shares, loading, reload: load }
}

// ============================================
// UPLOAD PIPELINE
// Converts Files -> PendingDocument (data URL local mode)
// ============================================
export async function fileToPendingDocument(
  file: File,
  uploadedBy: number
): Promise<PendingDocument> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
    reader.readAsDataURL(file)
  })

  // Generate a small thumbnail for images (keeps card lists light)
  let thumbnail: string | undefined
  if ((file.type || '').startsWith('image/') && file.type !== 'image/gif') {
    try {
      thumbnail = await generateThumbnail(data)
    } catch {
      // thumbnail is optional
    }
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    docType: detectDocType(file.type, file.name),
    data,
    thumbnail,
    storageType: 'local',
    uploadedBy,
  }
}

/** Downscale an image data URL to a ~320px JPEG thumbnail via canvas */
function generateThumbnail(dataUrl: string, maxSize = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('no canvas context'))
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = dataUrl
  })
}

// ============================================
// CREATE / DELETE / SHARE ACTIONS
// ============================================
export function useNoticeDocumentActions(noticeId: number | null) {
  const { data: currentUser } = useCurrentUser()

  const createDocuments = async (
    pending: PendingDocument[],
    folderId: number | null = null,
    /** Upload to a different notice than the hook's bound one (e.g. right after creating it) */
    targetNoticeId?: number,
    /** Documents inherit the notice visibility by default */
    visibility: NoticeVisibility = 'private'
  ) => {
    const effectiveNoticeId = targetNoticeId ?? noticeId
    if (!effectiveNoticeId || !currentUser) throw new Error('Missing notice or user context')
    for (const doc of pending) {
      await orpc.noticeDocuments.create({
        noticeId: effectiveNoticeId,
        societyId: 1,
        title: doc.name,
        fileName: doc.name,
        fileData: doc.storageType === 'local' ? doc.data : undefined,
        fileUrl: doc.storageType === 'cloudinary' ? doc.data : undefined,
        thumbnailData: doc.thumbnail,
        mimeType: doc.mimeType,
        fileExtension: getFileExtension(doc.name),
        fileSize: doc.size,
        storageType: doc.storageType,
        docType: doc.docType,
        visibility,
        folderId,
        uploadedBy: doc.uploadedBy || currentUser.id,
      })
    }
  }

  const deleteDocument = async (id: number) => {
    await orpc.noticeDocuments.delete({ id })
  }

  const toggleStar = async (id: number) => {
    await orpc.noticeDocuments.toggleStar({ id })
  }

  const setDocumentVisibility = async (id: number, visibility: NoticeVisibility) => {
    await orpc.noticeDocuments.update({ id, data: { visibility } })
  }

  return { createDocuments, deleteDocument, toggleStar, setDocumentVisibility }
}
