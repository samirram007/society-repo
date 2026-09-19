import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  FolderOpen,
  FolderPlus,
  FileText,
  Upload,
  Search,
  Loader2,
  Edit,
  Trash2,
  X,
  Star,
  StarOff,
  Download,
  Eye,
  Grid3X3,
  List,
  ChevronRight,
  ChevronDown,
  Home,
  Filter,
  Copy,
  FolderInput,
  Tag,
  Clock,
  HardDrive,
  ArrowUpDown,
  Plus,
  AlertCircle,
  CheckCircle2,
  Image,
  File,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  FileVideo,
  FileAudio,
  Link2,
  ExternalLink,
  Info,
  Pencil,
} from 'lucide-react'
import { useContextMenu } from '@/components/layout/doc-context-menu'
import { DocPropertiesDialog } from '@/components/layout/doc-properties-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { orpc } from '@/server/client'
import {
  uploadFile,
  uploadFiles,
  validateFile,
  getMaxFileSize,
  isCloudinaryConfigured,
  createGoogleDocEntry,
  detectGoogleType,
  getGoogleEmbedUrl,
  FILE_TYPE_CATEGORIES,
  DEFAULT_ALLOWED_CATEGORIES,
  getAllowedMimeTypes,
  getAllowedExtensions,
  isFileTypeAllowed,
  formatAllowedTypes,
  type FileTypeCategory,
  type StorageResult,
} from '@/lib/storage'

// ============================================
// TYPES
// ============================================
interface DocFolder {
  id: number; societyId: number; name: string; description?: string | null
  parentId?: number | null; color?: string | null; icon?: string | null
  sortOrder?: number | null; isActive: boolean; createdAt: string; updatedAt?: string | null
}

interface DocFile {
  id: number; societyId: number; title: string; description?: string | null
  category: string; folderId?: number | null; flatId?: number | null
  memberId?: number | null; fileUrl: string; fileName?: string | null
  mimeType?: string | null; fileSize?: number | null; fileData?: string | null
  thumbnailUrl?: string | null; tags?: string | null; version?: number | null
  uploadedBy: number; lastAccessedAt?: string | null; downloadCount?: number | null
  isStarred: boolean; isActive: boolean; createdAt: string; updatedAt?: string | null
}

interface DocStats {
  total: number; totalFolders: number; totalSize: number
  byCategory: Record<string, number>; starred: number; recentThisWeek: number
}

// ============================================
// CONSTANTS
// ============================================
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'society', label: 'Society' },
  { value: 'management', label: 'Management' },
  { value: 'financial', label: 'Financial' },
  { value: 'legal', label: 'Legal' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

const categoryColors: Record<string, string> = {
  society: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  management: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  financial: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  legal: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  personal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

const folderColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function getFileIcon(mimeType?: string | null, fileName?: string | null) {
  if (!mimeType && !fileName) return File
  const m = (mimeType || '').toLowerCase()
  const n = (fileName || '').toLowerCase()
  
  // Google Docs/Sheets/Slides
  if (m.includes('google-apps.document')) return FileText
  if (m.includes('google-apps.spreadsheet')) return FileSpreadsheet
  if (m.includes('google-apps.presentation')) return FileCode
  
  if (m.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i.test(n)) return Image
  if (m.includes('pdf') || /\.pdf$/i.test(n)) return FileText
  if (m.includes('spreadsheet') || m.includes('excel') || /\.(xlsx?|csv)$/i.test(n)) return FileSpreadsheet
  if (m.includes('word') || m.includes('document') || /\.(docx?|odt|rtf)$/i.test(n)) return FileCode
  if (m.includes('zip') || m.includes('rar') || m.includes('tar') || /\.(zip|rar|7z|tar|gz)$/i.test(n)) return FileArchive
  if (m.startsWith('video/') || /\.(mp4|avi|mov|mkv|webm)$/i.test(n)) return FileVideo
  if (m.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac)$/i.test(n)) return FileAudio
  return File
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(d?: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ============================================
// MAIN COMPONENT
// ============================================
export function DocumentsPage() {
  // State
  const [documents, setDocuments] = useState<DocFile[]>([])
  const [allDocsForCounts, setAllDocsForCounts] = useState<DocFile[]>([]) // ALL docs for accurate folder counts
  const [folders, setFolders] = useState<DocFolder[]>([])
  const [stats, setStats] = useState<DocStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [folderPath, setFolderPath] = useState<DocFolder[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'fileSize'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showStarredOnly, setShowStarredOnly] = useState(false)

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [editFolderOpen, setEditFolderOpen] = useState(false)
  const [editDocOpen, setEditDocOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<DocFolder | null>(null)

  // Form state
  const [folderForm, setFolderForm] = useState({ name: '', description: '', color: '#3b82f6', parentId: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [docForm, setDocForm] = useState({ title: '', description: '', category: 'society', tags: '' })
  const [linkForm, setLinkForm] = useState({ url: '', title: '', category: 'society', tags: '' })
  const [moveTargetFolder, setMoveTargetFolder] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ total: number; current: number; status: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  // Context menu
  const { show: showContextMenu, MenuComponent } = useContextMenu()
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [propertiesTarget, setPropertiesTarget] = useState<DocFile | DocFolder | null>(null)
  const [propertiesType, setPropertiesType] = useState<'file' | 'folder'>('file')

  // Drag & drop for moving files/folders
  const [draggedItem, setDraggedItem] = useState<{ type: 'file' | 'folder'; id: number } | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null)
  const [isDesktopDrag, setIsDesktopDrag] = useState(false) // true when dragging files from desktop
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ type: 'file' | 'folder'; id: number; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Cloud storage status
  const cloudEnabled = isCloudinaryConfigured()
  const maxFileSize = getMaxFileSize()
  
  // File type restrictions
  const [allowedFileTypes, setAllowedFileTypes] = useState<FileTypeCategory[]>(DEFAULT_ALLOWED_CATEGORIES)
  const allowedMimeTypes = getAllowedMimeTypes(allowedFileTypes)
  const allowedExtensions = getAllowedExtensions(allowedFileTypes)

  // Fetch data
  const fetchAll = useCallback(async () => {
    try {
      const [docsRes, allDocsRes, foldersRes, statsRes] = await Promise.all([
        orpc.documents.list({
          folderId: currentFolderId,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          search: search || undefined,
          starred: showStarredOnly || undefined,
          sortBy,
          sortOrder,
        }),
        orpc.documents.list({}), // all docs (unfiltered) for accurate folder counts
        orpc.documentFolders.list({}),
        orpc.documents.stats({}),
      ])
      setDocuments((docsRes as any) || [])
      setAllDocsForCounts((allDocsRes as any) || [])
      setFolders((foldersRes as any) || [])
      setStats((statsRes as any) || null)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }, [currentFolderId, categoryFilter, search, showStarredOnly, sortBy, sortOrder])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Build folder path breadcrumb
  useEffect(() => {
    if (currentFolderId === null) { setFolderPath([]); return }
    const path: DocFolder[] = []
    let current = folders.find(f => f.id === currentFolderId)
    while (current) {
      path.unshift(current)
      current = current.parentId ? folders.find(f => f.id === current!.parentId) || undefined : undefined
    }
    setFolderPath(path)
  }, [currentFolderId, folders])

  // Sub-folders in current view
  const currentFolders = useMemo(() => {
    return folders.filter(f => {
      if (currentFolderId === null) return !f.parentId
      return f.parentId === currentFolderId
    })
  }, [folders, currentFolderId])

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let docs = documents
    if (search) {
      const q = search.toLowerCase()
      docs = docs.filter(d => d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.tags?.toLowerCase().includes(q))
    }
    return docs
  }, [documents, search])

  // Handle file upload with cloud storage
  const handleFileUpload = async () => {
    if (pendingFiles.length === 0) return
    
    // Validate files
    const errors: string[] = []
    const validFiles: File[] = []
    
    for (const file of pendingFiles) {
      const result = validateFile(file, allowedFileTypes)
      if (result.valid) {
        validFiles.push(file)
      } else if (result.error) {
        errors.push(result.error)
      }
    }
    
    if (errors.length > 0) {
      alert(errors.join('\n'))
      if (validFiles.length === 0) return
    }
    
    setSubmitting(true)
    setUploadProgress({ total: validFiles.length, current: 0, status: cloudEnabled ? 'Uploading to cloud...' : 'Uploading...' })
    
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        setUploadProgress({ total: validFiles.length, current: i + 1, status: `Uploading ${file.name}...` })
        
        // Upload using storage abstraction (cloud or local)
        const storageResult = await uploadFile(file, {
          folder: currentFolderId ? `folder_${currentFolderId}` : 'root',
          tags: docForm.tags ? docForm.tags.split(',').map(t => t.trim()) : undefined,
        })
        
        // Save to database
        // For local uploads, store base64 separately to avoid massive RPC payload
        const isLocal = storageResult.storageType === 'local'
        const base64Data = isLocal ? storageResult.publicId : undefined
        
        const docResult = await orpc.documents.create({
          societyId: 1,
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          category: (docForm.category as any) || 'other',
          folderId: currentFolderId,
          fileUrl: storageResult.url,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          fileData: isLocal ? '[pending]' : undefined,
          tags: docForm.tags || undefined,
          uploadedBy: 1,
        })
        
        // Store the base64 data separately via update if local
        if (isLocal && base64Data && docResult.id) {
          await orpc.documents.update({ id: docResult.id, data: { fileData: base64Data } })
        }
      }
      
      setUploadDialogOpen(false)
      setPendingFiles([])
      setDocForm({ title: '', description: '', category: 'society', tags: '' })
      setUploadProgress(null)
      fetchAll()
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadProgress(null)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Google Docs/Photos link
  const handleLinkSubmit = async () => {
    if (!linkForm.url.trim()) return
    
    // Validate Google URL
    const googleEntry = createGoogleDocEntry(linkForm.url, linkForm.title)
    
    setSubmitting(true)
    try {
      await orpc.documents.create({
        societyId: 1,
        title: linkForm.title || googleEntry?.fileName || 'Google Link',
        description: '',
        category: (linkForm.category as any) || 'other',
        folderId: currentFolderId,
        fileUrl: linkForm.url,
        fileName: googleEntry?.fileName || linkForm.url,
        mimeType: googleEntry?.mimeType || 'text/uri-list',
        fileSize: 0,
        fileData: undefined,
        tags: linkForm.tags || undefined,
        uploadedBy: 1,
      })
      
      setLinkDialogOpen(false)
      setLinkForm({ url: '', title: '', category: 'society', tags: '' })
      fetchAll()
    } catch (error) {
      console.error('Failed to add link:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle drag & drop on page
  const handlePageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    setIsDesktopDrag(false)
    // If dropping a doc item onto root area, move it there
    const itemData = e.dataTransfer.getData('application/x-doc-item')
    if (itemData) {
      handleRootDrop(e)
      return
    }
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const errors: string[] = []
      const validFiles: File[] = []
      
      for (const file of files) {
        const result = validateFile(file, allowedFileTypes)
        if (result.valid) {
          validFiles.push(file)
        } else if (result.error) {
          errors.push(result.error)
        }
      }
      
      if (errors.length > 0) alert(errors.join('\n'))
      if (validFiles.length > 0) {
        setPendingFiles(validFiles)
        setUploadDialogOpen(true)
      }
    }
  }

  // Handle drag & drop in upload dialog
  const handleDialogDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDesktopDrag(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const errors: string[] = []
      const validFiles: File[] = []
      
      for (const file of files) {
        const result = validateFile(file, allowedFileTypes)
        if (result.valid) {
          validFiles.push(file)
        } else if (result.error) {
          errors.push(result.error)
        }
      }
      
      if (errors.length > 0) alert(errors.join('\n'))
      if (validFiles.length > 0) {
        setPendingFiles(prev => [...prev, ...validFiles])
      }
    }
  }

  // Create folder
  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) return
    setFormError(null)
    setSubmitting(true)
    try {
      await orpc.documentFolders.create({
        societyId: 1,
        name: folderForm.name,
        description: folderForm.description || undefined,
        color: folderForm.color,
        parentId: folderForm.parentId ? Number(folderForm.parentId) : currentFolderId ?? undefined,
      })
      setCreateFolderOpen(false)
      setFolderForm({ name: '', description: '', color: '#3b82f6', parentId: '' })
      setFormError(null)
      fetchAll()
    } catch (error: any) {
      console.error('Failed to create folder:', error)
      setFormError(error?.message || error?.data?.message || 'Failed to create folder. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete document
  const handleDeleteDoc = async () => {
    if (!selectedDoc) return
    setSubmitting(true)
    try {
      await orpc.documents.delete({ id: selectedDoc.id })
      setDeleteDialogOpen(false)
      setSelectedDoc(null)
      fetchAll()
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete folder
  const handleDeleteFolder = async () => {
    if (!selectedFolder) return
    setSubmitting(true)
    try {
      await orpc.documentFolders.delete({ id: selectedFolder.id })
      if (currentFolderId === selectedFolder.id) setCurrentFolderId(null)
      setDeleteDialogOpen(false)
      setSelectedFolder(null)
      fetchAll()
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle star
  const handleToggleStar = async (doc: DocFile) => {
    try {
      await orpc.documents.toggleStar({ id: doc.id })
      fetchAll()
    } catch (error) {
      console.error('Toggle star failed:', error)
    }
  }

  // Move document
  const handleMoveDoc = async () => {
    if (!selectedDoc) return
    setSubmitting(true)
    try {
      await orpc.documents.moveToFolder({ id: selectedDoc.id, folderId: moveTargetFolder ? Number(moveTargetFolder) : null })
      setMoveDialogOpen(false)
      setSelectedDoc(null)
      setMoveTargetFolder('')
      fetchAll()
    } catch (error) {
      console.error('Move failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Copy document
  const handleCopyDoc = async (doc: DocFile) => {
    try {
      await orpc.documents.copy({ id: doc.id, folderId: currentFolderId })
      fetchAll()
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // Preview
  const handlePreview = (doc: DocFile) => {
    setSelectedDoc(doc)
    setPreviewOpen(true)
  }

  // Download (trigger via data URL or open external link)
  const handleDownload = (doc: DocFile) => {
    // For Google Docs/Photos, open in new tab
    if (doc.mimeType?.includes('google-apps') || doc.mimeType === 'text/uri-list') {
      window.open(doc.fileUrl, '_blank')
      return
    }
    
    // For regular files
    if (doc.fileData || doc.fileUrl) {
      const link = window.document.createElement('a')
      link.href = doc.fileData || doc.fileUrl
      link.download = doc.fileName || doc.title
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    }
  }

  // Open edit doc dialog
  const openEditDoc = (doc: DocFile) => {
    setSelectedDoc(doc)
    setDocForm({ title: doc.title, description: doc.description || '', category: doc.category, tags: doc.tags || '' })
    setEditDocOpen(true)
  }

  const handleUpdateDoc = async () => {
    if (!selectedDoc) return
    setSubmitting(true)
    try {
      await orpc.documents.update({ id: selectedDoc.id, data: { title: docForm.title, description: docForm.description, category: docForm.category, tags: docForm.tags } })
      setEditDocOpen(false)
      fetchAll()
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Check if document is a Google link
  const isGoogleDoc = (doc: DocFile) => {
    return doc.mimeType?.includes('google-apps') || doc.mimeType === 'text/uri-list'
  }

  // Show file context menu
  const handleFileContextMenu = (e: React.MouseEvent, doc: DocFile) => {
    const isGoogle = isGoogleDoc(doc)
    showContextMenu(e, [
      { label: 'Preview', icon: Eye, onClick: () => handlePreview(doc) },
      { label: isGoogle ? 'Open Link' : 'Download', icon: isGoogle ? ExternalLink : Download, onClick: () => handleDownload(doc) },
      { label: 'Edit', icon: Pencil, onClick: () => openEditDoc(doc) },
      { label: doc.isStarred ? 'Unstar' : 'Star', icon: doc.isStarred ? StarOff : Star, onClick: () => handleToggleStar(doc) },
      { label: 'Copy', icon: Copy, onClick: () => handleCopyDoc(doc), dividerAfter: true },
      { label: 'Move to Folder…', icon: FolderInput, onClick: () => { setSelectedDoc(doc); setMoveDialogOpen(true); setMoveTargetFolder(doc.folderId?.toString() || '') } },
      { label: 'Rename', icon: Pencil, onClick: () => { setRenameTarget({ type: 'file', id: doc.id, name: doc.title }); setRenameValue(doc.title); setRenameDialogOpen(true) } },
      { label: 'Properties', icon: Info, onClick: () => { setPropertiesTarget(doc); setPropertiesType('file'); setPropertiesOpen(true) }, dividerAfter: true },
      { label: 'Delete', icon: Trash2, onClick: () => { setSelectedDoc(doc); setDeleteDialogOpen(true) }, variant: 'destructive' },
    ])
  }

  // Recursive doc count for a folder (includes all descendant subfolders)
  const getRecursiveDocCount = (folderId: number): number => {
    const visited = new Set<number>()
    const countDocs = (id: number): number => {
      if (visited.has(id)) return 0
      visited.add(id)
      let count = allDocsForCounts.filter(d => d.folderId === id).length
      const children = folders.filter(f => f.parentId === id)
      for (const child of children) {
        count += countDocs(child.id)
      }
      return count
    }
    return countDocs(folderId)
  }

  // Recursive folder size (sum of file sizes in folder + all descendant subfolders)
  const getRecursiveFolderSize = (folderId: number): number => {
    const visited = new Set<number>()
    const sumSize = (id: number): number => {
      if (visited.has(id)) return 0
      visited.add(id)
      let size = allDocsForCounts
        .filter(d => d.folderId === id)
        .reduce((sum, d) => sum + (d.fileSize || 0), 0)
      const children = folders.filter(f => f.parentId === id)
      for (const child of children) {
        size += sumSize(child.id)
      }
      return size
    }
    return sumSize(folderId)
  }

  // Show folder context menu
  const handleFolderContextMenu = (e: React.MouseEvent, folder: DocFolder) => {
    const docCount = getRecursiveDocCount(folder.id)
    const folderSize = getRecursiveFolderSize(folder.id)
    const childCount = folders.filter(f => f.parentId === folder.id).length
    showContextMenu(e, [
      { label: 'Open', icon: FolderOpen, onClick: () => setCurrentFolderId(folder.id) },
      { label: 'Edit', icon: Pencil, onClick: () => { setSelectedFolder(folder); setEditFolderOpen(true); setFolderForm({ name: folder.name, description: folder.description || '', color: folder.color || '#3b82f6', parentId: folder.parentId?.toString() || '' }) } },
      { label: 'Rename', icon: Pencil, onClick: () => { setRenameTarget({ type: 'folder', id: folder.id, name: folder.name }); setRenameValue(folder.name); setRenameDialogOpen(true) } },
      { label: 'Properties', icon: Info, onClick: () => { setPropertiesTarget({ ...folder, type: 'folder', docCount, folderSize, children: childCount } as any); setPropertiesType('folder'); setPropertiesOpen(true) }, dividerAfter: true },
      { label: 'Delete', icon: Trash2, onClick: () => { setSelectedFolder(folder); setDeleteDialogOpen(true) }, variant: 'destructive' },
    ])
  }

  // Check if draggedFolderId is an ancestor of targetFolderId (circular ref prevention)
  const isDescendantFolder = (ancestorId: number, targetId: number): boolean => {
    const visited = new Set<number>()
    let current = folders.find(f => f.id === targetId)
    while (current) {
      if (current.id === ancestorId) return true
      if (visited.has(current.id)) break // prevent infinite loop
      visited.add(current.id)
      current = current.parentId ? folders.find(f => f.id === current!.parentId) || undefined : undefined
    }
    return false
  }

  // Drag start (files and folders)
  const handleDragStart = (e: React.DragEvent, type: 'file' | 'folder', id: number) => {
    e.dataTransfer.setData('application/x-doc-item', JSON.stringify({ type, id }))
    e.dataTransfer.effectAllowed = 'move'
    setDraggedItem({ type, id })
    setIsDesktopDrag(false)
  }

  // Drag over folder - handles both internal items AND desktop files
  const handleFolderDragOver = (e: React.DragEvent, folderId: number) => {
    e.preventDefault()
    e.stopPropagation()
    // Check if this is a desktop file drag (has 'Files' type but no custom data yet)
    const isFilesDrag = e.dataTransfer.types.includes('Files') && !e.dataTransfer.types.includes('application/x-doc-item')
    if (isFilesDrag) {
      e.dataTransfer.dropEffect = 'copy'
      setIsDesktopDrag(true)
    } else {
      e.dataTransfer.dropEffect = 'move'
    }
    setDragOverFolderId(folderId)
  }

  const handleFolderDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the folder element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) return
    setDragOverFolderId(null)
  }

  // Drop on folder - handles both internal items AND desktop files
  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolderId(null)
    setDraggedItem(null)
    setIsDesktopDrag(false)
    
    // Check for internal doc items first
    const itemData = e.dataTransfer.getData('application/x-doc-item')
    if (itemData) {
      try {
        const { type, id } = JSON.parse(itemData)
        if (type === 'file') {
          await orpc.documents.moveToFolder({ id, folderId: targetFolderId })
          fetchAll()
        } else if (type === 'folder' && id !== targetFolderId) {
          // Circular reference prevention
          if (isDescendantFolder(id, targetFolderId)) {
            console.warn('Cannot move folder into its own descendant')
            return
          }
          await orpc.documentFolders.update({ id, data: { parentId: targetFolderId } })
          fetchAll()
        }
      } catch (error) {
        console.error('Drop failed:', error)
      }
      return
    }
    
    // Handle desktop file drops - upload directly to this folder
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const errors: string[] = []
      const validFiles: File[] = []
      for (const file of files) {
        const result = validateFile(file, allowedFileTypes)
        if (result.valid) validFiles.push(file)
        else if (result.error) errors.push(result.error)
      }
      if (errors.length > 0) alert(errors.join('\n'))
      if (validFiles.length > 0) {
        // Upload directly to this folder
        await uploadFilesToFolder(validFiles, targetFolderId)
      }
    }
  }

  // Upload files directly to a specific folder (for drag-to-folder)
  const uploadFilesToFolder = async (files: File[], targetFolderId: number) => {
    setSubmitting(true)
    setUploadProgress({ total: files.length, current: 0, status: cloudEnabled ? 'Uploading to cloud...' : 'Uploading...' })
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress({ total: files.length, current: i + 1, status: `Uploading ${file.name}...` })
        const storageResult = await uploadFile(file, {
          folder: `folder_${targetFolderId}`,
        })
        const isLocal = storageResult.storageType === 'local'
        const base64Data = isLocal ? storageResult.publicId : undefined
        const docResult = await orpc.documents.create({
          societyId: 1,
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          category: 'other' as any,
          folderId: targetFolderId,
          fileUrl: storageResult.url,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          fileData: isLocal ? '[pending]' : undefined,
          tags: undefined,
          uploadedBy: 1,
        })
        if (isLocal && base64Data && docResult.id) {
          await orpc.documents.update({ id: docResult.id, data: { fileData: base64Data } })
        }
      }
      setUploadProgress(null)
      fetchAll()
    } catch (error) {
      console.error('Bulk upload to folder failed:', error)
      setUploadProgress(null)
    } finally {
      setSubmitting(false)
    }
  }

  // Drop on root (move out of folder)
  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverFolderId(null)
    setDraggedItem(null)
    setIsDesktopDrag(false)
    try {
      const data = e.dataTransfer.getData('application/x-doc-item')
      if (!data) return
      const { type, id } = JSON.parse(data)
      if (type === 'file') {
        await orpc.documents.moveToFolder({ id, folderId: null })
        fetchAll()
      } else if (type === 'folder') {
        await orpc.documentFolders.update({ id, data: { parentId: null } })
        fetchAll()
      }
    } catch (error) {
      console.error('Drop failed:', error)
    }
  }

  // Rename handler
  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return
    setSubmitting(true)
    try {
      if (renameTarget.type === 'file') {
        await orpc.documents.update({ id: renameTarget.id, data: { title: renameValue.trim() } })
      } else {
        await orpc.documentFolders.update({ id: renameTarget.id, data: { name: renameValue.trim() } })
      }
      setRenameDialogOpen(false)
      setRenameTarget(null)
      fetchAll()
    } catch (error) {
      console.error('Rename failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      className="space-y-6"
      onDragOver={(e) => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) { setDragOver(true); setIsDesktopDrag(true) } }}
      onDragLeave={() => { setDragOver(false); setIsDesktopDrag(false) }}
      onDrop={handlePageDrop}
    >
      {/* Drop overlay */}
      {dragOver && !dragOverFolderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-primary/5 p-16 text-center">
            <Upload className="mx-auto h-16 w-16 text-primary mb-4" />
            <p className="text-xl font-bold">Drop files here to upload</p>
            <p className="text-muted-foreground">Files will be added to the current folder</p>
            <p className="text-xs text-muted-foreground mt-2">You can also drop files directly onto a folder</p>
            <p className="text-xs text-muted-foreground">Max file size: {formatFileSize(maxFileSize)}</p>
          </div>
        </div>
      )}

      {/* Upload progress indicator (for drag-to-folder uploads) */}
      {uploadProgress && !uploadDialogOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="shadow-xl border-primary/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">{uploadProgress.status}</span>
              </div>
              <div className="h-2 w-48 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress.current} of {uploadProgress.total} files</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage society documents, files, and records
            {cloudEnabled && <Badge variant="secondary" className="ml-2 text-xs">☁️ Cloud Storage</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLinkDialogOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            Add Link
          </Button>
          <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><FileText className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Documents</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950"><FolderOpen className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.totalFolders}</p><p className="text-xs text-muted-foreground">Folders</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950"><HardDrive className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p><p className="text-xs text-muted-foreground">Storage Used</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950"><Star className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{stats.starred}</p><p className="text-xs text-muted-foreground">Starred</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950"><Clock className="h-5 w-5 text-cyan-600" /></div>
            <div><p className="text-2xl font-bold">{stats.recentThisWeek}</p><p className="text-xs text-muted-foreground">This Week</p></div>
          </div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950"><Tag className="h-5 w-5 text-rose-600" /></div>
            <div><p className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</p><p className="text-xs text-muted-foreground">Categories</p></div>
          </div></CardContent></Card>
        </div>
      )}

      {/* Breadcrumb + Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm flex-wrap">
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors ${currentFolderId === null ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setCurrentFolderId(null)}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = e.dataTransfer.types.includes('Files') ? 'copy' : 'move'; if (e.dataTransfer.types.includes('Files')) setIsDesktopDrag(true) }}
              onDrop={(e) => { e.preventDefault(); handleRootDrop(e) }}
            >
              <Home className="h-4 w-4" /> All Documents
            </button>
            {folderPath.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <button
                  className={`px-2 py-1 rounded hover:bg-muted transition-colors ${folder.id === currentFolderId ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverFolderId(folder.id) }}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          <Separator />

          {/* Search + Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              {search && (
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setSearch('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="title">Name</SelectItem>
                <SelectItem value="fileSize">Size</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant={showStarredOnly ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => setShowStarredOnly(!showStarredOnly)} title="Starred">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')} title="Grid view">
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')} title="List view">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} title="Sort order">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {currentFolders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Folders ({currentFolders.length})</h3>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => setCreateFolderOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" /> Add Folder
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {currentFolders.map((folder) => {                   const docCount = getRecursiveDocCount(folder.id)
                    const folderSize = getRecursiveFolderSize(folder.id)
                  return (
                    <div
                      key={folder.id}
                      className={`group relative rounded-xl border bg-card p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all ${
                        dragOverFolderId === folder.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02]' : ''
                      } ${
                        dragOverFolderId === folder.id && isDesktopDrag ? 'border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-400/30' : ''
                      } ${
                        draggedItem?.type === 'folder' && draggedItem.id === folder.id ? 'opacity-50 scale-95' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
                      onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                      onDragLeave={handleFolderDragLeave}
                      onDrop={(e) => handleFolderDrop(e, folder.id)}
                      onDoubleClick={() => setCurrentFolderId(folder.id)}
                      onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                    >
                      {/* Desktop drag drop indicator */}
                      {dragOverFolderId === folder.id && isDesktopDrag && (
                        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-green-500 bg-green-500/5 flex items-center justify-center z-10 pointer-events-none">
                          <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                            <Upload className="h-3 w-3" /> Drop to upload here
                          </div>
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onDoubleClick={() => setCurrentFolderId(folder.id)}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${folder.color}15` }}>
                            <FolderOpen className="h-5 w-5" style={{ color: folder.color || '#3b82f6' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate text-sm">{folder.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {docCount} files{folderSize > 0 && ` · ${formatFileSize(folderSize)}`}
                            </p>
                          </div>
                        </div>
                        {/* Actions - visible on mobile, hover on desktop */}
                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSelectedFolder(folder); setEditFolderOpen(true); setFolderForm({ name: folder.name, description: folder.description || '', color: folder.color || '#3b82f6', parentId: folder.parentId?.toString() || '' }) }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedFolder(folder); setDeleteDialogOpen(true) }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Single-click to open (via transparent overlay) */}
                      <div className="absolute inset-0 cursor-pointer" onClick={() => setCurrentFolderId(folder.id)} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          {filteredDocs.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Documents ({filteredDocs.length})</h3>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredDocs.map((doc) => {
                    const FileIcon = getFileIcon(doc.mimeType, doc.fileName)
                    const isImage = doc.mimeType?.startsWith('image/')
                    const isGoogle = isGoogleDoc(doc)
                    return (
                      <div key={doc.id} className={`group relative rounded-xl border bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all ${
                        draggedItem?.type === 'file' && draggedItem.id === doc.id ? 'opacity-50 scale-95' : ''
                      }`} draggable onDragStart={(e) => handleDragStart(e, 'file', doc.id)} onContextMenu={(e) => handleFileContextMenu(e, doc)}>
                        {/* Preview area */}
                        <div className="relative h-36 bg-muted/50 flex items-center justify-center cursor-pointer" onClick={() => handlePreview(doc)}>
                          {isGoogle ? (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <FileIcon className="h-12 w-12 text-blue-500" />
                              <Badge variant="secondary" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Google Link
                              </Badge>
                            </div>
                          ) : isImage && doc.fileData ? (
                            <img src={doc.fileData} alt={doc.title} className="h-full w-full object-cover" />
                          ) : (
                            <FileIcon className="h-12 w-12 text-muted-foreground/50" />
                          )}
                          {/* Star button */}
                          <Button
                            variant="ghost" size="icon"
                            className="absolute top-2 right-2 h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur"
                            onClick={(e) => { e.stopPropagation(); handleToggleStar(doc) }}
                          >
                            {doc.isStarred ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <StarOff className="h-4 w-4" />}
                          </Button>
                        </div>
                        {/* Info */}
                        <div className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm truncate flex-1" title={doc.title}>{doc.title}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge className={`${categoryColors[doc.category] || categoryColors.other} border-0 text-[10px] px-1.5 py-0`}>{doc.category}</Badge>
                            {doc.fileSize ? <span>{formatFileSize(doc.fileSize)}</span> : <span>Link</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                          {doc.tags && (
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.split(',').map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{tag.trim()}</Badge>
                              ))}
                            </div>
                          )}
                          {/* Actions - always visible on mobile */}
                          <div className="flex items-center gap-1 pt-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)} title={isGoogle ? 'Open Link' : 'Download'}>
                              {isGoogle ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDoc(doc)} title="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyDoc(doc)} title="Copy"><Copy className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedDoc(doc); setMoveDialogOpen(true); setMoveTargetFolder(doc.folderId?.toString() || '') }} title="Move"><FolderInput className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setSelectedDoc(doc); setDeleteDialogOpen(true) }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* List View */
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredDocs.map((doc) => {
                        const FileIcon = getFileIcon(doc.mimeType, doc.fileName)
                        const isGoogle = isGoogleDoc(doc)
                        return (
                          <div key={doc.id} className={`flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer group ${
                            draggedItem?.type === 'file' && draggedItem.id === doc.id ? 'opacity-50' : ''
                          }`} onClick={() => handlePreview(doc)} draggable onDragStart={(e) => handleDragStart(e, 'file', doc.id)} onContextMenu={(e) => handleFileContextMenu(e, doc)}>
                            <FileIcon className={`h-8 w-8 shrink-0 ${isGoogle ? 'text-blue-500' : 'text-muted-foreground'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {isGoogle ? 'Google Link' : (doc.fileName || doc.mimeType || 'Unknown type')}
                                {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                              </p>
                            </div>
                            <Badge className={`${categoryColors[doc.category] || categoryColors.other} border-0 hidden sm:inline-flex`}>{doc.category}</Badge>
                            {doc.tags && <span className="text-xs text-muted-foreground hidden lg:block max-w-[120px] truncate">{doc.tags}</span>}
                            <span className="text-xs text-muted-foreground hidden md:block">{formatDate(doc.createdAt)}</span>
                            {/* Actions - always visible on mobile */}
                            <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleToggleStar(doc) }}>
                                {doc.isStarred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDownload(doc) }}>
                                {isGoogle ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditDoc(doc) }}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopyDoc(doc) }} title="Copy"><Copy className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setMoveDialogOpen(true); setMoveTargetFolder(doc.folderId?.toString() || '') }} title="Move"><FolderInput className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            currentFolders.length === 0 && (
              <div className="text-center py-24">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
                <p className="text-muted-foreground mb-4">Upload files, add links, or create folders to get started</p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setCreateFolderOpen(true)}><FolderPlus className="mr-2 h-4 w-4" /> New Folder</Button>
                  <Button variant="outline" onClick={() => setLinkDialogOpen(true)}><Link2 className="mr-2 h-4 w-4" /> Add Link</Button>
                  <Button onClick={() => setUploadDialogOpen(true)}><Upload className="mr-2 h-4 w-4" /> Upload Files</Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ============================================
          ADD LINK DIALOG (Google Docs/Photos)
          ============================================ */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Google Link</DialogTitle>
            <DialogDescription>
              Paste a link to a Google Doc, Sheet, Slide, or Photo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Google URL *</Label>
              <Input
                placeholder="https://docs.google.com/document/d/..."
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
              />
              {linkForm.url && detectGoogleType(linkForm.url) && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid Google {detectGoogleType(linkForm.url)?.replace('google_', '').replace('_', ' ')} link detected
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                placeholder="Document title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={linkForm.category} onValueChange={(v) => setLinkForm({ ...linkForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.value !== 'all').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input placeholder="e.g. policy, 2024" value={linkForm.tags} onChange={(e) => setLinkForm({ ...linkForm, tags: e.target.value })} />
            </div>
            
            {/* Supported formats */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="space-y-1">
                <li>• Google Docs: <code>docs.google.com/document/d/.../</code></li>
                <li>• Google Sheets: <code>docs.google.com/spreadsheets/d/.../</code></li>
                <li>• Google Slides: <code>docs.google.com/presentation/d/.../</code></li>
                <li>• Google Photos: <code>photos.google.com/photo/...</code></li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkDialogOpen(false); setLinkForm({ url: '', title: '', category: 'society', tags: '' }) }}>Cancel</Button>
            <Button onClick={handleLinkSubmit} disabled={submitting || !linkForm.url.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          UPLOAD DIALOG - With Cloud Storage
          ============================================ */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { if (!open) { setUploadDialogOpen(false); setPendingFiles([]); setUploadProgress(null) } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              {currentFolderId ? `Upload to current folder` : 'Select or drag files to upload'}
              <span className="block text-xs text-muted-foreground mt-1">
                Max file size: {formatFileSize(maxFileSize)}
                {cloudEnabled && ' (Cloud Storage enabled)'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Storage & File Type Info */}
            <div className="flex flex-wrap gap-2">
              {cloudEnabled && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 px-3 py-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-blue-700 dark:text-blue-300">Cloud Storage</span>
                </div>
              )}
              <div className="rounded-lg bg-muted px-3 py-2">
                <span className="text-xs text-muted-foreground">Allowed: {formatAllowedTypes(allowedFileTypes)}</span>
              </div>
            </div>
            
            {/* File Type Selector */}
            <div className="space-y-2">
              <Label>File Types</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FILE_TYPE_CATEGORIES).map(([key, category]) => {
                  if (key === 'all') return null
                  const isSelected = allowedFileTypes.includes(key as FileTypeCategory)
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setAllowedFileTypes(prev => prev.filter(t => t !== key))
                        } else {
                          setAllowedFileTypes(prev => [...prev, key as FileTypeCategory])
                        }
                      }}
                    >
                      {category.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {allowedFileTypes.length === 0 
                  ? 'No file types selected - all types will be blocked' 
                  : `${allowedFileTypes.length} type(s) selected`
                }
              </p>
            </div>
            
            {/* Drop zone */}
            <div
              className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={handleDialogDrop}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Click to browse or drag files here</p>
              <p className="text-xs text-muted-foreground mt-1">{formatAllowedTypes(allowedFileTypes)}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { 
                if (e.target.files) {
                  const errors: string[] = []
                  const validFiles: File[] = []
                  
                  for (const file of Array.from(e.target.files)) {
                    const result = validateFile(file, allowedFileTypes)
                    if (result.valid) {
                      validFiles.push(file)
                    } else if (result.error) {
                      errors.push(result.error)
                    }
                  }
                  
                  if (errors.length > 0) alert(errors.join('\n'))
                  if (validFiles.length > 0) setPendingFiles(prev => [...prev, ...validFiles])
                }
              }}
            />

            {/* Selected files */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Selected Files ({pendingFiles.length})</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setPendingFiles([])}>
                    Clear All
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {(() => { const I = getFileIcon(file.type, file.name); return <I className="h-4 w-4 shrink-0 text-muted-foreground" /> })()}
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload progress */}
            {uploadProgress && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">{uploadProgress.status}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{uploadProgress.current} of {uploadProgress.total} files</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={docForm.category} onValueChange={(v) => setDocForm({ ...docForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.value !== 'all').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input placeholder="e.g. invoice, 2024, maintenance" value={docForm.tags} onChange={(e) => setDocForm({ ...docForm, tags: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setPendingFiles([]); setUploadProgress(null) }}>Cancel</Button>
            <Button onClick={handleFileUpload} disabled={submitting || pendingFiles.length === 0}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload {pendingFiles.length > 0 ? `${pendingFiles.length} Files` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          CREATE FOLDER DIALOG
          ============================================ */}
      <Dialog open={createFolderOpen} onOpenChange={(open) => { if (!open) { setCreateFolderOpen(false); setFormError(null) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Folder Name *</Label>
              <Input placeholder="e.g. Financial Reports 2024" value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Optional description" value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {folderColors.map(c => (
                  <button key={c} className={`h-7 w-7 rounded-full border-2 transition-all ${folderForm.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setFolderForm({ ...folderForm, color: c })} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={submitting || !folderForm.name.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          EDIT FOLDER DIALOG
          ============================================ */}
      <Dialog open={editFolderOpen} onOpenChange={(open) => { if (!open) setEditFolderOpen(false) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Folder Name *</Label>
              <Input value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {folderColors.map(c => (
                  <button key={c} className={`h-7 w-7 rounded-full border-2 transition-all ${folderForm.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setFolderForm({ ...folderForm, color: c })} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFolderOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!selectedFolder) return
              setSubmitting(true)
              try {
                await orpc.documentFolders.update({ id: selectedFolder.id, data: { name: folderForm.name, description: folderForm.description, color: folderForm.color } })
                setEditFolderOpen(false)
                fetchAll()
              } catch (e) { console.error(e) } finally { setSubmitting(false) }
            }} disabled={submitting || !folderForm.name.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          EDIT DOCUMENT DIALOG
          ============================================ */}
      <Dialog open={editDocOpen} onOpenChange={(open) => { if (!open) setEditDocOpen(false) }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={docForm.description} onChange={(e) => setDocForm({ ...docForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={docForm.category} onValueChange={(v) => setDocForm({ ...docForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.value !== 'all').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input placeholder="comma separated tags" value={docForm.tags} onChange={(e) => setDocForm({ ...docForm, tags: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDocOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateDoc} disabled={submitting || !docForm.title.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE CONFIRMATION DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedDoc ? 'Document' : 'Folder'}</DialogTitle>
            <DialogDescription>
              {selectedDoc ? (
                <>Are you sure you want to delete <strong>{selectedDoc.title}</strong>? This action cannot be undone.</>
              ) : selectedFolder ? (
                <>Are you sure you want to delete folder <strong>{selectedFolder.name}</strong>? Documents inside will be moved to the root.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedDoc(null); setSelectedFolder(null) }}>Cancel</Button>
            <Button variant="destructive" onClick={selectedDoc ? handleDeleteDoc : handleDeleteFolder} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          MOVE DOCUMENT DIALOG
          ============================================ */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Move Document</DialogTitle>
            <DialogDescription>Select a folder to move <strong>{selectedDoc?.title}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={moveTargetFolder} onValueChange={setMoveTargetFolder}>
              <SelectTrigger><SelectValue placeholder="Root (no folder)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">📂 Root (no folder)</SelectItem>
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id.toString()}>📁 {f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMoveDoc} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Context Menu */}
      {MenuComponent}

      {/* ============================================
          RENAME DIALOG
          ============================================ */}
      <Dialog open={renameDialogOpen} onOpenChange={(open) => { if (!open) { setRenameDialogOpen(false); setRenameTarget(null) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type === 'file' ? 'Document' : 'Folder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRenameDialogOpen(false); setRenameTarget(null) }}>Cancel</Button>
            <Button onClick={handleRename} disabled={submitting || !renameValue.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          PROPERTIES DIALOG
          ============================================ */}
      <DocPropertiesDialog
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
        properties={propertiesTarget ? (
          propertiesType === 'file'
            ? (() => { const d = propertiesTarget as DocFile; return { id: d.id, name: d.title, type: 'file' as const, description: d.description, category: d.category, mimeType: d.mimeType, fileName: d.fileName, fileSize: d.fileSize, tags: d.tags, version: d.version, downloadCount: d.downloadCount, isStarred: d.isStarred, createdAt: d.createdAt, updatedAt: d.updatedAt, fileUrl: d.fileUrl } })()
            : (() => { const f = propertiesTarget as any; return { id: f.id, name: f.name, type: 'folder' as const, description: f.description, color: f.color, createdAt: f.createdAt, updatedAt: f.updatedAt, docCount: f.docCount, children: f.children } })()
        ) : null}
      />

      {/* ============================================
          PREVIEW DIALOG
          ============================================ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const I = getFileIcon(selectedDoc.mimeType, selectedDoc.fileName); return <I className="h-5 w-5" /> })()}
                  {selectedDoc.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Preview */}
                {isGoogleDoc(selectedDoc) ? (
                  <div className="rounded-lg border bg-muted/50 p-8 text-center">
                    <ExternalLink className="mx-auto h-16 w-16 text-blue-500 mb-3" />
                    <p className="text-sm font-medium mb-2">Google Document</p>
                    <p className="text-xs text-muted-foreground mb-4">{selectedDoc.fileName}</p>
                    <Button onClick={() => window.open(selectedDoc.fileUrl, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" /> Open in Google
                    </Button>
                  </div>
                ) : selectedDoc.mimeType?.startsWith('image/') && selectedDoc.fileData ? (
                  <div className="rounded-lg border overflow-hidden bg-muted/50">
                    <img src={selectedDoc.fileData} alt={selectedDoc.title} className="w-full" />
                  </div>
                ) : selectedDoc.fileData?.startsWith('data:text') ? (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <pre className="text-sm whitespace-pre-wrap overflow-x-auto max-h-96">{atob(selectedDoc.fileData.split(',')[1])}</pre>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/50 p-8 text-center">
                    {(() => { const I = getFileIcon(selectedDoc.mimeType, selectedDoc.fileName); return <I className="mx-auto h-16 w-16 text-muted-foreground/50 mb-3" /> })()}
                    <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">File Name:</span> <span className="font-medium">{selectedDoc.fileName || '-'}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selectedDoc.mimeType || '-'}</span></div>
                  <div><span className="text-muted-foreground">Size:</span> <span className="font-medium">{selectedDoc.fileSize ? formatFileSize(selectedDoc.fileSize) : 'Link'}</span></div>
                  <div><span className="text-muted-foreground">Category:</span> <Badge className={`${categoryColors[selectedDoc.category] || categoryColors.other} border-0 ml-1`}>{selectedDoc.category}</Badge></div>
                  <div><span className="text-muted-foreground">Version:</span> <span className="font-medium">v{selectedDoc.version || 1}</span></div>
                  <div><span className="text-muted-foreground">Downloads:</span> <span className="font-medium">{selectedDoc.downloadCount || 0}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{formatDate(selectedDoc.createdAt)}</span></div>
                  <div><span className="text-muted-foreground">Updated:</span> <span className="font-medium">{formatDate(selectedDoc.updatedAt)}</span></div>
                </div>
                {selectedDoc.description && (
                  <div><span className="text-muted-foreground text-sm">Description:</span><p className="text-sm mt-1">{selectedDoc.description}</p></div>
                )}
                {selectedDoc.tags && (
                  <div className="flex flex-wrap gap-1">
                    {selectedDoc.tags.split(',').map((tag, i) => <Badge key={i} variant="secondary">{tag.trim()}</Badge>)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { handleDownload(selectedDoc); setPreviewOpen(false) }}>
                    {isGoogleDoc(selectedDoc) ? (
                      <><ExternalLink className="mr-2 h-4 w-4" /> Open Link</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> Download</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => { setPreviewOpen(false); openEditDoc(selectedDoc) }}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                  <Button variant="outline" onClick={() => handleToggleStar(selectedDoc)}>
                    {selectedDoc.isStarred ? <StarOff className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
                    {selectedDoc.isStarred ? 'Unstar' : 'Star'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
