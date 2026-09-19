import { useState, useEffect, useRef } from 'react'
import {
  Building2, Home, Users, Car, DoorOpen, Eye, X,
  Loader2, ChevronRight, ChevronDown, MapPin,
  Maximize2, Minimize2, BarChart3, IndianRupee,
  CreditCard, AlertCircle, TrendingUp, Filter,
  Plus, CheckCircle2, Shield, Camera, Flame,
  Pencil, Trash2, Info, Image as ImageIcon, Upload,
  ChevronLeft, ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { orpc } from '@/server/client'
import { ImageUploadZone, ImageGallery, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'

// ============================================
// TYPES
// ============================================
interface Flat {
  id: number; flatNumber: string; wing?: string; floor: number; type: string
  area?: number; ownerName?: string; tenantName?: string; isOccupied: boolean
  hasBalcony?: boolean; hasTerrace?: boolean; maintenanceAmount?: number
  facing?: string; towerId?: number
  totalInvoiced?: number; totalPaid?: number; hasOverdue?: boolean
}
interface Floor { floorNumber: number; flats: Flat[] }
interface Tower {
  id: number; name: string; description?: string; totalFloors?: number; flatsPerFloor?: number
  totalFlats?: number; hasLift?: boolean; hasCctv?: boolean; hasFireAlarm?: boolean
  profileImage?: string; images?: string; documents?: string
  floors: Floor[]; totalOccupied: number; totalVacant: number; occupancyRate: number
  totalMaintenance?: number; collectedAmount?: number; pendingAmount?: number
}
interface Gate { id: number; name: string; type: string; hasBoomBarrier?: boolean; hasCctv?: boolean; location?: string }
interface Member { id: number; firstName: string; lastName?: string; phone?: string; role?: string; residentType?: string }
interface SocietyLayout {
  society: { id: number; name: string; totalTowers: number; totalFlats: number; totalMembers: number }
  towers: Tower[]
  gates: Gate[]
  summary: {
    totalFlats: number; occupiedFlats: number; vacantFlats: number; occupancyRate: number
    byType: { type: string; total: number; occupied: number }[]
    totalParking: number; occupiedParking: number
    totalMaintenance?: number; collectedAmount?: number; pendingAmount?: number
  }
}

// Parse helper
function parseJsonArray(val?: string | null): string[] {
  if (!val) return []
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [] } catch { return [] }
}

// ============================================
// FLAT STATUS COLORS
// ============================================
function flatColor(f: Flat) {
  if (!f.isOccupied) return { bg: 'bg-red-100 dark:bg-red-950', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-300', label: 'Vacant' }
  if (f.tenantName) return { bg: 'bg-amber-100 dark:bg-amber-950', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', label: 'Tenant' }
  return { bg: 'bg-green-100 dark:bg-green-950', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300', label: 'Owner' }
}

// ============================================
// FINANCIAL STATUS INDICATOR
// ============================================
function FinancialIndicator({ flat }: { flat: Flat }) {
  if (flat.hasOverdue) {
    return (
      <div className="absolute bottom-2 right-2">
        <div className="flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900 px-1.5 py-0.5">
          <AlertCircle className="h-2.5 w-2.5 text-red-600" />
          <span className="text-[9px] font-medium text-red-600">DUE</span>
        </div>
      </div>
    )
  }
  if (flat.totalPaid && flat.totalPaid > 0) {
    return (
      <div className="absolute bottom-2 right-2">
        <div className="flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900 px-1.5 py-0.5">
          <CreditCard className="h-2.5 w-2.5 text-green-600" />
          <span className="text-[9px] font-medium text-green-600">PAID</span>
        </div>
      </div>
    )
  }
  return null
}

// ============================================
// TOWER IMAGE GALLERY LIGHTBOX
// ============================================
function TowerGalleryLightbox({
  images, initialIndex, onClose
}: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(initialIndex)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && current > 0) setCurrent(c => c - 1)
      if (e.key === 'ArrowRight' && current < images.length - 1) setCurrent(c => c + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, images.length, onClose])

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 bg-black border-0 overflow-hidden">
        <div className="relative">
          <img src={images[current]} alt="" className="w-full max-h-[75vh] object-contain" />
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <div className="absolute top-2 left-2 bg-black/60 text-white text-sm px-2 py-1 rounded">
            {current + 1} / {images.length}
          </div>
          {current > 0 && (
            <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={() => setCurrent(c => c - 1)}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {current < images.length - 1 && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={() => setCurrent(c => c + 1)}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-1 p-2 bg-black/80 overflow-x-auto justify-center">
            {images.map((img, i) => (
              <img key={i} src={img} alt="" className={`h-12 w-12 object-cover rounded cursor-pointer border-2 transition-all ${i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`} onClick={() => setCurrent(i)} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function SocietyMapPage() {
  const [data, setData] = useState<SocietyLayout | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null)
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null)
  const [flatDetail, setFlatDetail] = useState<{ flat: Flat; member?: Member | null } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set())
  const [hoveredFlat, setHoveredFlat] = useState<Flat | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFinancial, setShowFinancial] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  // Create tower
  const [createTowerOpen, setCreateTowerOpen] = useState(false)
  const [towerForm, setTowerForm] = useState({
    name: '', description: '', totalFloors: 5, flatsPerFloor: 4,
    hasLift: false, hasCctv: false, hasFireAlarm: false,
    profileImage: '', images: [] as string[],
    flatType: '2BHK' as string, flatArea: '', maintenanceAmount: '5000',
  })
  const [towerSubmitting, setTowerSubmitting] = useState(false)
  const [towerSuccess, setTowerSuccess] = useState('')

  // Edit tower
  const [editTowerOpen, setEditTowerOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', description: '', hasLift: false, hasCctv: false, hasFireAlarm: false,
    profileImage: '', images: [] as string[], documents: [] as UploadedDocument[],
  })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editTarget, setEditTarget] = useState<Tower | null>(null)

  // Tower detail view
  const [towerDetailTarget, setTowerDetailTarget] = useState<Tower | null>(null)

  // Tower delete
  const [deleteTowerOpen, setDeleteTowerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tower | null>(null)

  // Tower image gallery lightbox
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryIndex, setGalleryIndex] = useState(0)

  // Document preview
  const [docPreview, setDocPreview] = useState<{ url: string; name: string } | null>(null)

  // Create society
  const [societyForm, setSocietyForm] = useState({
    name: '', registrationNumber: '', address: '', city: '', state: '', pincode: '',
    contactEmail: '', contactPhone: '',
  })
  const [societySubmitting, setSocietySubmitting] = useState(false)
  const [societyError, setSocietyError] = useState('')

  const refreshData = () => {
    orpc.societyLayout.getLayout({}).then((d: SocietyLayout | null) => setData(d)).catch(() => {})
  }

  const handleCreateTower = async () => {
    if (!towerForm.name.trim()) return
    setTowerSubmitting(true)
    try {
      const result = await orpc.societyLayout.createTower({
        societyId: 1,
        name: towerForm.name.trim(),
        description: towerForm.description || undefined,
        totalFloors: towerForm.totalFloors,
        flatsPerFloor: towerForm.flatsPerFloor,
        hasLift: towerForm.hasLift,
        hasCctv: towerForm.hasCctv,
        hasFireAlarm: towerForm.hasFireAlarm,
        profileImage: towerForm.profileImage || undefined,
        images: towerForm.images.length > 0 ? towerForm.images : undefined,
        flatType: towerForm.flatType as any,
        flatArea: towerForm.flatArea ? Number(towerForm.flatArea) : undefined,
        maintenanceAmount: Number(towerForm.maintenanceAmount) || 5000,
      }) as any
      setCreateTowerOpen(false)
      setTowerSuccess(`Tower "${result.name}" created with ${result.flatsCreated} flats!`)
      setTimeout(() => setTowerSuccess(''), 5000)
      refreshData()
      setTowerForm({
        name: '', description: '', totalFloors: 5, flatsPerFloor: 4,
        hasLift: false, hasCctv: false, hasFireAlarm: false,
        profileImage: '', images: [],
        flatType: '2BHK', flatArea: '', maintenanceAmount: '5000',
      })
    } catch (error: any) {
      console.error('Failed to create tower:', error)
    } finally {
      setTowerSubmitting(false)
    }
  }

  const handleEditTower = async () => {
    if (!editTarget || !editForm.name.trim()) return
    setEditSubmitting(true)
    try {
      await orpc.societyLayout.updateTower({
        id: editTarget.id,
        data: {
          name: editForm.name.trim(),
          description: editForm.description || null,
          hasLift: editForm.hasLift,
          hasCctv: editForm.hasCctv,
          hasFireAlarm: editForm.hasFireAlarm,
          profileImage: editForm.profileImage || null,
          images: editForm.images.length > 0 ? JSON.stringify(editForm.images) : null,
          documents: editForm.documents.length > 0 ? JSON.stringify(editForm.documents) : null,
        },
      })
      setEditTowerOpen(false)
      refreshData()
      if (selectedTower?.id === editTarget.id) {
        setSelectedTower(prev => prev ? { ...prev, name: editForm.name, description: editForm.description, hasLift: editForm.hasLift, hasCctv: editForm.hasCctv, hasFireAlarm: editForm.hasFireAlarm, profileImage: editForm.profileImage, images: JSON.stringify(editForm.images) } : prev)
      }
    } catch (error) {
      console.error('Failed to update tower:', error)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteTower = async () => {
    if (!deleteTarget) return
    try {
      await orpc.societyLayout.deleteTower({ id: deleteTarget.id })
      setDeleteTowerOpen(false)
      setDeleteTarget(null)
      if (selectedTower?.id === deleteTarget.id) setSelectedTower(null)
      refreshData()
    } catch (error) {
      console.error('Failed to delete tower:', error)
    }
  }

  const openEditDialog = (tower: Tower) => {
    setEditTarget(tower)
    setEditForm({
      name: tower.name,
      description: tower.description || '',
      hasLift: tower.hasLift || false,
      hasCctv: tower.hasCctv || false,
      hasFireAlarm: tower.hasFireAlarm || false,
      profileImage: tower.profileImage || '',
      images: parseJsonArray(tower.images),
      documents: (() => { try { return JSON.parse(tower.documents || '[]') } catch { return [] } })(),
    })
    setEditTowerOpen(true)
  }

  useEffect(() => {
    orpc.societyLayout.getLayout({}).then((d: SocietyLayout | null) => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const toggleFloor = (n: number) => {
    setExpandedFloors(prev => { const next = new Set(prev); next.has(n) ? next.delete(n) : next.add(n); return next })
  }

  const expandAll = () => {
    if (selectedTower) setExpandedFloors(new Set(selectedTower.floors.map(f => f.floorNumber)))
  }

  const collapseAll = () => setExpandedFloors(new Set())

  const viewFlatDetail = async (flat: Flat) => {
    setSelectedFlat(flat); setDetailLoading(true)
    try {
      const d = await orpc.societyLayout.getFlatDetail({ flatId: flat.id })
      setFlatDetail(d)
    } catch { setFlatDetail({ flat }) } finally { setDetailLoading(false) }
  }

  const handleFlatHover = (flat: Flat, e: React.MouseEvent) => {
    setHoveredFlat(flat)
    setHoverPos({ x: e.clientX, y: e.clientY })
  }

  const filterFlats = (flats: Flat[]) => {
    if (filterType === 'all') return flats
    if (filterType === 'occupied') return flats.filter(f => f.isOccupied)
    if (filterType === 'vacant') return flats.filter(f => !f.isOccupied)
    if (filterType === 'owner') return flats.filter(f => f.isOccupied && !f.tenantName)
    if (filterType === 'tenant') return flats.filter(f => f.isOccupied && f.tenantName)
    return flats
  }

  const handleCreateSociety = async () => {
    if (!societyForm.name.trim()) { setSocietyError('Society name is required'); return }
    setSocietySubmitting(true)
    setSocietyError('')
    try {
      await orpc.societies.create({
        name: societyForm.name.trim(),
        registrationNumber: societyForm.registrationNumber || undefined,
        address: societyForm.address || undefined,
        city: societyForm.city || undefined,
        state: societyForm.state || undefined,
        pincode: societyForm.pincode || undefined,
        contactEmail: societyForm.contactEmail || undefined,
        contactPhone: societyForm.contactPhone || undefined,
      })
      refreshData()
    } catch (e: any) {
      setSocietyError(e.message || 'Failed to create society')
    } finally {
      setSocietySubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>
  if (!data) return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
            Society Map
          </h1>
          <p className="text-muted-foreground mt-1">Set up your society to get started with the visual layout</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Create Your Society
          </CardTitle>
          <p className="text-sm text-muted-foreground">Enter your society details to set up the map and occupancy tracker.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {societyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {societyError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="soc-name">Society Name <span className="text-red-500">*</span></Label>
            <Input id="soc-name" placeholder="e.g. Green Valley Society" value={societyForm.name} onChange={e => setSocietyForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="soc-reg">Registration Number</Label>
              <Input id="soc-reg" placeholder="e.g. SOC/2020/12345" value={societyForm.registrationNumber} onChange={e => setSocietyForm(f => ({ ...f, registrationNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soc-phone">Contact Phone</Label>
              <Input id="soc-phone" placeholder="e.g. +91 22 2678 9012" value={societyForm.contactPhone} onChange={e => setSocietyForm(f => ({ ...f, contactPhone: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="soc-email">Contact Email</Label>
            <Input id="soc-email" type="email" placeholder="e.g. admin@yoursociety.com" value={societyForm.contactEmail} onChange={e => setSocietyForm(f => ({ ...f, contactEmail: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="soc-address">Address</Label>
            <Textarea id="soc-address" placeholder="Full address of the society" value={societyForm.address} onChange={e => setSocietyForm(f => ({ ...f, address: e.target.value }))} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="soc-city">City</Label>
              <Input id="soc-city" placeholder="e.g. Mumbai" value={societyForm.city} onChange={e => setSocietyForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soc-state">State</Label>
              <Input id="soc-state" placeholder="e.g. Maharashtra" value={societyForm.state} onChange={e => setSocietyForm(f => ({ ...f, state: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soc-pincode">Pincode</Label>
              <Input id="soc-pincode" placeholder="e.g. 400058" value={societyForm.pincode} onChange={e => setSocietyForm(f => ({ ...f, pincode: e.target.value }))} />
            </div>
          </div>

          <Separator />

          <Button onClick={handleCreateSociety} disabled={societySubmitting || !societyForm.name.trim()} className="w-full">
            {societySubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Society</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const { society, towers, gates, summary } = data

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {towerSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {towerSuccess}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
            {society.name}
          </h1>
          <p className="text-muted-foreground mt-1">Visual society layout and occupancy overview</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreateTowerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Tower
          </Button>
          <Button variant={showFinancial ? 'default' : 'outline'} size="sm" onClick={() => setShowFinancial(!showFinancial)}>
            <IndianRupee className="mr-2 h-4 w-4" /> {showFinancial ? 'Hide' : 'Show'} Financial
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? '📋 List View' : '📊 Grid View'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><Building2 className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold">{summary.totalFlats}</p><p className="text-xs text-muted-foreground">Total Flats</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950"><Home className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold">{summary.occupiedFlats}</p><p className="text-xs text-muted-foreground">Occupied</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950"><DoorOpen className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-2xl font-bold">{summary.vacantFlats}</p><p className="text-xs text-muted-foreground">Vacant</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950"><Users className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-2xl font-bold">{summary.occupancyRate}%</p><p className="text-xs text-muted-foreground">Occupancy</p></div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950"><Car className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold">{summary.occupiedParking}/{summary.totalParking}</p><p className="text-xs text-muted-foreground">Parking</p></div>
        </div></CardContent></Card>
      </div>

      {/* Financial Summary */}
      {showFinancial && summary.totalMaintenance !== undefined && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><IndianRupee className="h-4 w-4 text-green-600" /> Society Financial Overview</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-xs text-muted-foreground">Total Monthly</p>
                <p className="text-xl font-bold text-green-600">₹{(summary.totalMaintenance || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-xl font-bold text-blue-600">₹{(summary.collectedAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-amber-600">₹{(summary.pendingAmount || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Occupancy by Type */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Occupancy by Flat Type</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summary.byType.map(t => (
              <div key={t.type} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between"><Badge variant="outline" className="text-xs">{t.type}</Badge><span className="text-xs text-muted-foreground">{t.total}</span></div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${t.total > 0 ? (t.occupied / t.total) * 100 : 0}%` }} />
                </div>
                <div className="flex justify-between text-xs"><span className="text-green-600">{t.occupied} occupied</span><span className="text-red-600">{t.total - t.occupied} vacant</span></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      {!selectedTower && !towerDetailTarget && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
              {[
                { value: 'all', label: 'All' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'vacant', label: 'Vacant' },
                { value: 'owner', label: 'Owner' },
                { value: 'tenant', label: 'Tenant' },
              ].map(f => (
                <Button key={f.value} variant={filterType === f.value ? 'default' : 'outline'} size="sm" className="h-7" onClick={() => setFilterType(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* TOWER DETAIL VIEW                           */}
      {/* ============================================ */}
      {towerDetailTarget && !selectedTower && (() => {
        const tower = towerDetailTarget
        const towerImages = parseJsonArray(tower.images)
        const towerDocs = (() => { try { return JSON.parse(tower.documents || '[]') } catch { return [] } })()
        const allImages = [tower.profileImage, ...towerImages].filter(Boolean) as string[]
        return (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setTowerDetailTarget(null)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Towers
            </Button>

            {/* Hero Image */}
            {allImages.length > 0 && (
              <Card className="overflow-hidden">
                <div className="relative h-64 sm:h-80 bg-muted">
                  <img src={allImages[0]} alt={tower.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-2xl font-bold text-white mb-1">{tower.name}</h2>
                    {tower.description && <p className="text-white/80 text-sm mb-2">{tower.description}</p>}
                    <div className="flex gap-2 flex-wrap">
                      {tower.hasLift && <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30"><TrendingUp className="mr-1 h-3 w-3" />Lift</Badge>}
                      {tower.hasCctv && <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30"><Camera className="mr-1 h-3 w-3" />CCTV</Badge>}
                      {tower.hasFireAlarm && <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30"><Flame className="mr-1 h-3 w-3" />Fire Alarm</Badge>}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button variant="secondary" size="sm" className="bg-black/40 text-white border-white/20 hover:bg-black/60" onClick={() => openEditDialog(tower)}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* If no hero image, show header */}
            {allImages.length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" /> {tower.name}
                      </h2>
                      {tower.description && <p className="text-muted-foreground mt-1">{tower.description}</p>}
                      <div className="flex gap-2 mt-2">
                        {tower.hasLift && <Badge variant="secondary"><TrendingUp className="mr-1 h-3 w-3" />Lift</Badge>}
                        {tower.hasCctv && <Badge variant="secondary"><Camera className="mr-1 h-3 w-3" />CCTV</Badge>}
                        {tower.hasFireAlarm && <Badge variant="secondary"><Flame className="mr-1 h-3 w-3" />Fire Alarm</Badge>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(tower)}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit Tower
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{tower.totalFlats || 0}</p>
                <p className="text-xs text-muted-foreground">Total Flats</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{tower.totalOccupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{tower.totalVacant}</p>
                <p className="text-xs text-muted-foreground">Vacant</p>
              </CardContent></Card>
            </div>

            {/* Photo Gallery */}
            {allImages.length > 1 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Tower Photos ({allImages.length})</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {allImages.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden cursor-pointer border hover:shadow-md transition-all" onClick={() => { setGalleryImages(allImages); setGalleryIndex(i); setGalleryOpen(true) }}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <span className="text-[10px] text-white font-medium">{i === 0 ? 'Hero' : i === 1 ? 'Cover' : `Photo ${i}`}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {towerDocs.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">📎 Tower Documents ({towerDocs.length})</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {towerDocs.map((doc: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setDocPreview({ url: doc.data, name: doc.name })}>
                        {doc.data && doc.data.startsWith('http') || doc.data.startsWith('data:image') ? (
                          <img src={doc.data} alt="" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100 dark:bg-red-900 text-red-600 text-xs font-bold">PDF</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.docType || 'Document'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Floors + Flats */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Floors & Flats</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedTower(tower); setTowerDetailTarget(null); expandAll() }}>
                  <Maximize2 className="mr-1 h-3 w-3" /> Floor View
                </Button>
              </div>
            </div>

            {/* Mini floor grid */}
            {tower.floors?.map(floor => (
              <Card key={floor.floorNumber} className="overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">F{floor.floorNumber}</div>
                  <span className="text-sm font-medium">Floor {floor.floorNumber}</span>
                  <span className="text-xs text-muted-foreground">· {floor.flats.length} flats</span>
                  <div className="flex-1" />
                  <span className="text-xs text-green-600">{floor.flats.filter(f => f.isOccupied).length} occupied</span>
                </div>
                <div className="p-3">
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(100px, 1fr))` }}>
                    {floor.flats.map(flat => {
                      const fc = flatColor(flat)
                      return (
                        <div key={flat.id} className={`rounded border ${fc.border} ${fc.bg} p-2 text-center cursor-pointer hover:shadow-sm transition-all`}
                          onClick={() => viewFlatDetail(flat)}>
                          <p className={`text-xs font-bold ${fc.text}`}>{flat.flatNumber}</p>
                          <p className="text-[10px] text-muted-foreground">{flat.type}</p>
                          {flat.ownerName && <p className="text-[10px] text-muted-foreground truncate" title={flat.ownerName}>👤 {flat.ownerName}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      })()}

      {/* ============================================ */}
      {/* TOWER GRID                                  */}
      {/* ============================================ */}
      {!selectedTower && !towerDetailTarget && (
        <>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" /> Towers ({towers.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {towers.map(tower => {
              const towerProfileImage = tower.profileImage
              return (
                <Card key={tower.id} className="group relative">
                  <CardContent className="p-0">
                    {/* Tower Visual Header */}
                    <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-b from-primary/10 to-primary/5 p-6 cursor-pointer"
                      onClick={() => { setTowerDetailTarget(tower) }}>
                      {/* Profile image or building illustration */}
                      {towerProfileImage ? (
                        <div className="relative mb-4 rounded-lg overflow-hidden aspect-[2/1]">
                          <img src={towerProfileImage} alt={tower.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                      ) : (
                        <div className="flex justify-center mb-4">
                          <div className="relative">
                            <div className="flex flex-col-reverse items-center gap-0.5">
                              {Array.from({ length: Math.min(tower.totalFloors || 5, 10) }, (_, i) => (
                                <div key={i} className="flex gap-0.5">
                                  {Array.from({ length: Math.min(tower.flatsPerFloor || 4, 6) }, (_, j) => {
                                    const floorNum = i + 1
                                    const floorFlats = tower.floors?.find(f => f.floorNumber === floorNum)?.flats || []
                                    const flat = floorFlats[j]
                                    const occupied = flat?.isOccupied
                                    return (
                                      <div key={j} className={'w-3 h-2.5 rounded-sm transition-colors ' + (occupied ? 'bg-green-500' : 'bg-red-300 dark:bg-red-800')} />
                                    )
                                  })}
                                </div>
                              ))}
                            </div>
                            {tower.hasLift && <div className="absolute -right-3 top-0 bottom-0 w-1.5 bg-primary/40 rounded-full" />}
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="text-lg font-bold">{tower.name}</h3>
                        <p className="text-sm text-muted-foreground">{tower.totalFloors || 0} floors · {tower.totalFlats || 0} flats</p>
                      </div>
                      {/* Feature badges */}
                      <div className="flex justify-center gap-1 mt-2">
                        {tower.hasCctv && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">CCTV</Badge>}
                        {tower.hasFireAlarm && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Fire</Badge>}
                        {tower.hasLift && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Lift</Badge>}
                      </div>
                    </div>

                    {/* Occupancy Bar */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Occupancy</span>
                        <span className="font-bold">{tower.occupancyRate}%</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${tower.occupancyRate}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="text-green-600 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> {tower.totalOccupied} occupied</span>
                        <span className="text-red-600 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> {tower.totalVacant} vacant</span>
                      </div>

                      {showFinancial && tower.totalMaintenance !== undefined && (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Monthly: ₹{(tower.totalMaintenance || 0).toLocaleString('en-IN')}</span>
                            <span className="text-green-600">Collected: ₹{(tower.collectedAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          onClick={() => setTowerDetailTarget(tower)}>
                          View Details <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openEditDialog(tower) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(tower); setDeleteTowerOpen(true) }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Gates */}
          {gates.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Gates & Entry Points</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {gates.map(gate => (
                    <div key={gate.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><MapPin className="h-5 w-5 text-slate-600" /></div>
                      <div>
                        <p className="font-medium text-sm">{gate.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{gate.type} Gate {gate.location ? `· ${gate.location}` : ''}</p>
                        <div className="flex gap-1 mt-1">
                          {gate.hasBoomBarrier && <Badge variant="secondary" className="text-[10px] px-1 py-0">Boom</Badge>}
                          {gate.hasCctv && <Badge variant="secondary" className="text-[10px] px-1 py-0">CCTV</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* TOWER DETAIL: FLOORS & FLATS                */}
      {/* ============================================ */}
      {selectedTower && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedTower(null); setExpandedFloors(new Set()) }}>
              ← Back to Towers
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" /> {selectedTower.name}
                <Badge variant="outline">{selectedTower.totalFloors} floors · {selectedTower.totalFlats} flats</Badge>
              </h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedTower)}>
                <Pencil className="mr-1 h-3 w-3" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={expandAll}><Maximize2 className="mr-1 h-3 w-3" /> Expand All</Button>
              <Button variant="outline" size="sm" onClick={collapseAll}><Minimize2 className="mr-1 h-3 w-3" /> Collapse All</Button>
            </div>
          </div>

          {/* Tower occupancy bar */}
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Overall Occupancy</span>
                  <span className="font-bold">{selectedTower.occupancyRate}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${selectedTower.occupancyRate}%` }} />
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">{selectedTower.totalOccupied} occupied</span>
                <span className="text-red-600">{selectedTower.totalVacant} vacant</span>
              </div>
            </div>
          </CardContent></Card>

          {/* Floors */}
          {selectedTower.floors.map(floor => {
            const isExpanded = expandedFloors.has(floor.floorNumber)
            const floorFlats = filterFlats(floor.flats)
            const floorOccupied = floorFlats.filter(f => f.isOccupied).length
            const floorTotal = floorFlats.length
            return (
              <Card key={floor.floorNumber} className="overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleFloor(floor.floorNumber)}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                    F{floor.floorNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Floor {floor.floorNumber}</span>
                      <span className="text-xs text-muted-foreground">· {floorTotal} flats</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
                      {floorFlats.map(f => (
                        <div key={f.id} className={`h-full ${f.isOccupied ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${100 / floorTotal}%` }} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{floorOccupied}/{floorTotal}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 bg-muted/20">
                    {viewMode === 'grid' ? (
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))` }}>
                        {floorFlats.map(flat => {
                          const fc = flatColor(flat)
                          return (
                            <div
                              key={flat.id}
                              className={`relative rounded-lg border-2 ${fc.bg} ${fc.border} p-3 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
                              onClick={() => viewFlatDetail(flat)}
                              onMouseEnter={(e) => handleFlatHover(flat, e)}
                              onMouseMove={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setHoveredFlat(null)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-bold text-sm ${fc.text}`}>{flat.flatNumber}</span>
                                {flat.wing && <Badge variant="secondary" className="text-[10px] px-1 py-0">{flat.wing}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">{flat.type}</p>
                              {flat.ownerName && <p className="text-xs text-muted-foreground truncate mt-1" title={flat.ownerName}>👤 {flat.ownerName}</p>}
                              {flat.tenantName && <p className="text-xs text-muted-foreground truncate" title={flat.tenantName}>🏠 {flat.tenantName}</p>}
                              {flat.area && <p className="text-[10px] text-muted-foreground mt-1">{flat.area} sqft</p>}
                              {showFinancial && <FinancialIndicator flat={flat} />}
                              <div className="absolute top-2 right-2">
                                <span className={`h-2 w-2 rounded-full inline-block ${flat.isOccupied ? 'bg-green-500' : 'bg-red-400'}`} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {floorFlats.map(flat => {
                          const fc = flatColor(flat)
                          return (
                            <div
                              key={flat.id}
                              className={`flex items-center justify-between rounded-lg border ${fc.border} bg-background p-3 cursor-pointer hover:shadow-sm transition-all`}
                              onClick={() => viewFlatDetail(flat)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${fc.bg} text-sm font-bold ${fc.text}`}>
                                  {flat.flatNumber}
                                </div>
                                <div>
                                  <p className="font-medium">Flat {flat.flatNumber}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {flat.type} · Floor {flat.floor}{flat.wing ? ` · Wing ${flat.wing}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {flat.ownerName && <span className="text-sm hidden sm:inline">👤 {flat.ownerName}</span>}
                                {showFinancial && flat.maintenanceAmount && (
                                  <span className="text-sm font-medium">₹{flat.maintenanceAmount.toLocaleString('en-IN')}/mo</span>
                                )}
                                <Badge variant={flat.isOccupied ? 'default' : 'secondary'} className="text-xs">
                                  {flat.isOccupied ? 'Occupied' : 'Vacant'}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}

          {/* Floor Legend */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground py-2">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-100 border border-green-300 dark:bg-green-950 dark:border-green-700 inline-block" /> Owner Occupied</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-100 border border-amber-300 dark:bg-amber-950 dark:border-amber-700 inline-block" /> Tenant Occupied</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-100 border border-red-300 dark:bg-red-950 dark:border-red-700 inline-block" /> Vacant</span>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* FLAT DETAIL DIALOG                          */}
      {/* ============================================ */}
      <Dialog open={!!selectedFlat} onOpenChange={o => { if (!o) { setSelectedFlat(null); setFlatDetail(null) } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" /> Flat {selectedFlat?.flatNumber}
              {selectedFlat && <Badge className={flatColor(selectedFlat).bg + ' ' + flatColor(selectedFlat).text + ' border-0'}>{flatColor(selectedFlat).label}</Badge>}
            </DialogTitle>
            {selectedFlat && <DialogDescription>{selectedFlat.type} · Floor {selectedFlat.floor}{selectedFlat.wing ? ` · Wing ${selectedFlat.wing}` : ''}</DialogDescription>}
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : flatDetail ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Flat Type</p><p className="font-medium">{flatDetail.flat.type}</p></div>
                <div><p className="text-muted-foreground">Floor</p><p className="font-medium">{flatDetail.flat.floor}</p></div>
                {flatDetail.flat.area && <div><p className="text-muted-foreground">Area</p><p className="font-medium">{flatDetail.flat.area} sqft</p></div>}
                {flatDetail.flat.facing && <div><p className="text-muted-foreground">Facing</p><p className="font-medium">{flatDetail.flat.facing}</p></div>}
                {flatDetail.flat.maintenanceAmount && <div><p className="text-muted-foreground">Maintenance</p><p className="font-medium">₹{Number(flatDetail.flat.maintenanceAmount).toLocaleString('en-IN')}/mo</p></div>}
                {flatDetail.flat.wing && <div><p className="text-muted-foreground">Wing</p><p className="font-medium">{flatDetail.flat.wing}</p></div>}
              </div>
              {(flatDetail.flat.ownerName || flatDetail.flat.tenantName) && (<><Separator /><div className="space-y-2 text-sm">
                {flatDetail.flat.ownerName && <div><p className="text-muted-foreground">Owner</p><p className="font-medium">{flatDetail.flat.ownerName}</p></div>}
                {flatDetail.flat.tenantName && <div><p className="text-muted-foreground">Tenant</p><p className="font-medium">{flatDetail.flat.tenantName}</p></div>}
              </div></>)}
              {flatDetail.member && (<><Separator /><div className="space-y-2 text-sm">
                <h4 className="font-medium">Registered Member</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-muted-foreground">Name</p><p className="font-medium">{flatDetail.member.firstName} {flatDetail.member.lastName || ''}</p></div>
                  <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{flatDetail.member.phone || '-'}</p></div>
                  <div><p className="text-muted-foreground">Role</p><p className="font-medium capitalize">{flatDetail.member.role || '-'}</p></div>
                  <div><p className="text-muted-foreground">Type</p><p className="font-medium capitalize">{flatDetail.member.residentType || '-'}</p></div>
                </div>
              </div></>)}
              {(flatDetail.flat.hasBalcony || flatDetail.flat.hasTerrace) && (
                <div className="flex gap-2">
                  {flatDetail.flat.hasBalcony && <Badge variant="secondary">Balcony</Badge>}
                  {flatDetail.flat.hasTerrace && <Badge variant="secondary">Terrace</Badge>}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* HOVER TOOLTIP                               */}
      {/* ============================================ */}
      {hoveredFlat && (
        <div
          className="fixed z-50 rounded-lg border bg-popover p-3 shadow-xl pointer-events-none text-sm max-w-[220px]"
          style={{ left: hoverPos.x + 15, top: hoverPos.y - 10 }}
        >
          <p className="font-bold">{hoveredFlat.flatNumber} <span className="font-normal text-muted-foreground">({hoveredFlat.type})</span></p>
          <p className="text-muted-foreground text-xs">Floor {hoveredFlat.floor}{hoveredFlat.wing ? ` · Wing ${hoveredFlat.wing}` : ''}</p>
          {hoveredFlat.ownerName && <p className="text-xs mt-1">👤 {hoveredFlat.ownerName}</p>}
          {hoveredFlat.tenantName && <p className="text-xs">🏠 {hoveredFlat.tenantName}</p>}
          {hoveredFlat.area && <p className="text-xs">{hoveredFlat.area} sqft</p>}
          {showFinancial && hoveredFlat.maintenanceAmount && (
            <p className="text-xs mt-1 font-medium">₹{hoveredFlat.maintenanceAmount.toLocaleString('en-IN')}/mo</p>
          )}
          <p className={`text-xs font-medium mt-1 ${hoveredFlat.isOccupied ? 'text-green-600' : 'text-red-600'}`}>{hoveredFlat.isOccupied ? '● Occupied' : '● Vacant'}</p>
        </div>
      )}

      {/* ============================================ */}
      {/* CREATE TOWER DIALOG                         */}
      {/* ============================================ */}
      <Dialog open={createTowerOpen} onOpenChange={setCreateTowerOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Create New Tower
            </DialogTitle>
            <DialogDescription>Add a new tower to your society. Flats will be auto-generated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Tower Photo */}
            <div className="space-y-2">
              <Label>Tower Photo</Label>
              <ImageUploadZone
                label="Tower Photo"
                icon={Building2}
                image={towerForm.profileImage || null}
                onUpload={(dataUrl) => setTowerForm({ ...towerForm, profileImage: dataUrl })}
                onRemove={() => setTowerForm({ ...towerForm, profileImage: '' })}
                folder="society_erp/towers/profile"
              />
            </div>

            {/* Tower Name */}
            <div className="space-y-2">
              <Label>Tower Name *</Label>
              <Input placeholder="e.g. Tower A, Sunrise Wing" value={towerForm.name} onChange={(e) => setTowerForm({ ...towerForm, name: e.target.value })} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the tower..." value={towerForm.description} onChange={(e) => setTowerForm({ ...towerForm, description: e.target.value })} rows={2} />
            </div>

            {/* Floors & Flats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Floors *</Label>
                <Input type="number" min={1} max={100} value={towerForm.totalFloors} onChange={(e) => setTowerForm({ ...towerForm, totalFloors: Number(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Flats Per Floor *</Label>
                <Input type="number" min={1} max={20} value={towerForm.flatsPerFloor} onChange={(e) => setTowerForm({ ...towerForm, flatsPerFloor: Number(e.target.value) || 1 })} />
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{towerForm.totalFloors * towerForm.flatsPerFloor} flats will be created</span>
              </div>
              <span className="text-xs text-muted-foreground">Floors 1–{towerForm.totalFloors}</span>
            </div>

            {/* Gallery Images */}
            <div className="space-y-2">
              <Label>Tower Gallery Photos</Label>
              <ImageGallery
                images={towerForm.images}
                onAdd={(url) => setTowerForm({ ...towerForm, images: [...towerForm.images, url] })}
                onRemove={(idx) => setTowerForm({ ...towerForm, images: towerForm.images.filter((_, i) => i !== idx) })}
                folder="society_erp/towers/gallery"
              />
            </div>

            {/* Flat Configuration */}
            <div className="space-y-3">
              <Label>Flat Configuration</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Flat Type</Label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={towerForm.flatType} onChange={(e) => setTowerForm({ ...towerForm, flatType: e.target.value })}>
                    {['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'villa', 'shop', 'office'].map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Area (sqft)</Label>
                  <Input type="number" placeholder="e.g. 1200" value={towerForm.flatArea} onChange={(e) => setTowerForm({ ...towerForm, flatArea: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Monthly Maintenance (₹)</Label>
                <Input type="number" placeholder="5000" value={towerForm.maintenanceAmount} onChange={(e) => setTowerForm({ ...towerForm, maintenanceAmount: e.target.value })} />
              </div>
            </div>

            {/* Tower Features */}
            <div className="space-y-3">
              <Label>Tower Features</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'hasLift', label: 'Elevator/Lift', icon: TrendingUp },
                  { key: 'hasCctv', label: 'CCTV', icon: Camera },
                  { key: 'hasFireAlarm', label: 'Fire Alarm', icon: Flame },
                ].map(f => (
                  <button key={f.key} type="button"
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${(towerForm as any)[f.key] ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:border-primary/50'}`}
                    onClick={() => setTowerForm({ ...towerForm, [f.key]: !(towerForm as any)[f.key] })}>
                    <f.icon className="h-4 w-4" /> {f.label}
                    {(towerForm as any)[f.key] && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTowerOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTower} disabled={towerSubmitting || !towerForm.name.trim()}>
              {towerSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" /> Create Tower
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* EDIT TOWER DIALOG                           */}
      {/* ============================================ */}
      <Dialog open={editTowerOpen} onOpenChange={setEditTowerOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Edit Tower — {editTarget?.name}
            </DialogTitle>
            <DialogDescription>Update tower details, photos, and features.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Tower Photo */}
            <div className="space-y-2">
              <Label>Tower Photo</Label>
              <ImageUploadZone
                label="Tower Photo"
                icon={Building2}
                image={editForm.profileImage || null}
                onUpload={(dataUrl) => setEditForm({ ...editForm, profileImage: dataUrl })}
                onRemove={() => setEditForm({ ...editForm, profileImage: '' })}
                folder="society_erp/towers/profile"
              />
            </div>

            {/* Tower Name */}
            <div className="space-y-2">
              <Label>Tower Name *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} placeholder="Brief description..." />
            </div>

            {/* Gallery Images */}
            <div className="space-y-2">
              <Label>Tower Gallery Photos</Label>
              <ImageGallery
                images={editForm.images}
                onAdd={(url) => setEditForm({ ...editForm, images: [...editForm.images, url] })}
                onRemove={(idx) => setEditForm({ ...editForm, images: editForm.images.filter((_, i) => i !== idx) })}
                folder="society_erp/towers/gallery"
              />
            </div>

            {/* Tower Features */}
            <div className="space-y-3">
              <Label>Tower Features</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'hasLift', label: 'Elevator/Lift', icon: TrendingUp },
                  { key: 'hasCctv', label: 'CCTV', icon: Camera },
                  { key: 'hasFireAlarm', label: 'Fire Alarm', icon: Flame },
                ].map(f => (
                  <button key={f.key} type="button"
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${(editForm as any)[f.key] ? 'border-primary bg-primary/10 text-primary' : 'border-muted hover:border-primary/50'}`}
                    onClick={() => setEditForm({ ...editForm, [f.key]: !(editForm as any)[f.key] })}>
                    <f.icon className="h-4 w-4" /> {f.label}
                    {(editForm as any)[f.key] && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <Label>Tower Documents</Label>
              <DocumentUploader
                documents={editForm.documents}
                onAdd={(doc) => setEditForm({ ...editForm, documents: [...editForm.documents, doc] })}
                onRemove={(idx) => setEditForm({ ...editForm, documents: editForm.documents.filter((_, i) => i !== idx) })}
                onView={(doc) => setDocPreview({ url: doc.data, name: doc.name })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTowerOpen(false)}>Cancel</Button>
            <Button onClick={handleEditTower} disabled={editSubmitting || !editForm.name.trim()}>
              {editSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DELETE TOWER CONFIRMATION                   */}
      {/* ============================================ */}
      <Dialog open={deleteTowerOpen} onOpenChange={setDeleteTowerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Tower
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? All flats in this tower will be moved to the root level (no tower assignment).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTowerOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTower}>Delete Tower</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Lightbox */}
      {galleryOpen && (
        <TowerGalleryLightbox
          images={galleryImages}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Document Preview */}
      {docPreview && (
        <DocumentPreviewDialog
          src={docPreview.url}
          title={docPreview.name}
          open={!!docPreview}
          onOpenChange={() => setDocPreview(null)}
        />
      )}
    </div>
  )
}
