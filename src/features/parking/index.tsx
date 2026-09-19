import { useState, useEffect } from 'react'
import {
  Car, Bike, Plus, Search, Loader2, Edit, Trash2, X, Download,
  MapPin, CheckCircle2, Circle, Home, Grid3X3, List, AlertTriangle,
  Layers, IndianRupee, Clock, LogIn, LogOut, Camera, Eye, FileText,
  Shield, Zap, Cctv, Users, ClipboardList, ArrowUpRight, ArrowDownRight,
  Timer, UserCheck, Phone, Hash,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { FlatPicker } from '@/components/flat-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { orpc } from '@/server/client'
import { ImageUploadZone, DocumentPreviewDialog } from '@/components/document-uploader'

// ============================================
// TYPES
// ============================================
interface ParkingSpace {
  id: number; societyId: number; flatId?: number; allocatedVehicleId?: number
  slotNumber: string; floor?: string; section?: string; type: string
  vehicleType?: string; isVisitorParking: boolean; isOccupied: boolean
  monthlyCharges?: number; dimensions?: string; hasCctv?: boolean
  hasCharging?: boolean; notes?: string; isActive: boolean; createdAt: string
}

interface VisitorParking {
  id: number; visitorId: number; visitorName?: string; visitorPhone?: string
  parkingSpaceId?: number; flatId?: number; vehicleNumber?: string
  vehicleType?: string; vehicleColor?: string; purpose?: string
  visitingMemberName?: string; idProofImage?: string; entryTime: string
  exitTime?: string; expectedDuration?: string; status: string
  charges?: number; notes?: string; createdAt: string
}

interface VehicleMovement {
  id: number; vehicleId?: number; vehicleNumber: string; gateId?: number
  type: string; direction: string; guardId?: number; purpose?: string
  photoUrl?: string; timestamp: string; createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const typeColors: Record<string, string> = {
  covered: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  open: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  basement: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}
const parkingTypes = ['covered', 'open', 'basement']
const vehicleTypesOpts = ['car', 'bike', 'both']
const visitorStatusColors: Record<string, string> = {
  parked: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  exited: 'bg-muted text-muted-foreground',
  overstay: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}
const movementTypeColors: Record<string, string> = {
  resident: 'bg-blue-100 text-blue-700', visitor: 'bg-amber-100 text-amber-700',
  delivery: 'bg-purple-100 text-purple-700', utility: 'bg-gray-100 text-gray-700',
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ParkingPage() {
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([])
  const [visitorParkings, setVisitorParkings] = useState<VisitorParking[]>([])
  const [movements, setMovements] = useState<VehicleMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('slots')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // Visitor parking dialogs
  const [vpCreateOpen, setVpCreateOpen] = useState(false)
  const [vpCheckoutOpen, setVpCheckoutOpen] = useState(false)
  const [selectedVP, setSelectedVP] = useState<VisitorParking | null>(null)

  // Movement dialogs
  const [mvCreateOpen, setMvCreateOpen] = useState(false)

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  // Parking form
  const [formData, setFormData] = useState({
    slotNumber: '', floor: '', section: '', type: 'open', vehicleType: 'car',
    flatId: '', isVisitorParking: false, monthlyCharges: '0',
    dimensions: '', hasCctv: false, hasCharging: false, notes: '',
  })
  const [bulkForm, setBulkForm] = useState({
    prefix: 'P', startNumber: 1, count: 10, floor: '', section: '',
    type: 'open', vehicleType: 'car', monthlyCharges: '0',
  })

  // Visitor parking form
  const [vpForm, setVpForm] = useState<Record<string, string>>({
    visitorName: '', visitorPhone: '', vehicleNumber: '', vehicleType: 'car',
    vehicleColor: '', purpose: '', visitingMemberName: '', flatId: '',
    parkingSpaceId: '', expectedDuration: '2 hours', notes: '',
  })
  const [vpIdProof, setVpIdProof] = useState<string | null>(null)

  // Movement form
  const [mvForm, setMvForm] = useState({
    vehicleNumber: '', type: 'resident', direction: 'entry', purpose: '',
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // ============================================
  // FETCH
  // ============================================
  const fetchAll = async () => {
    try {
      const [p, v, m] = await Promise.all([
        orpc.parking.list({}), orpc.visitorParking.list(), orpc.vehicleMovements.list({}),
      ])
      setParkingSpaces(p || []); setVisitorParkings(v || []); setMovements(m || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  // ============================================
  // FILTERS
  // ============================================
  const filteredSpaces = parkingSpaces.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.slotNumber?.toLowerCase().includes(q) || s.floor?.toLowerCase().includes(q) || s.section?.toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || s.type === typeFilter
    const matchStatus = statusFilter === 'all' || (statusFilter === 'occupied' && s.isOccupied) || (statusFilter === 'vacant' && !s.isOccupied)
    return matchSearch && matchType && matchStatus
  })

  const filteredVP = visitorParkings.filter(v => {
    const q = search.toLowerCase()
    return v.visitorName?.toLowerCase().includes(q) || v.vehicleNumber?.toLowerCase().includes(q)
  })

  const filteredMovements = movements.filter(m => {
    const q = search.toLowerCase()
    return m.vehicleNumber?.toLowerCase().includes(q) || m.purpose?.toLowerCase().includes(q)
  })

  // Stats
  const totalSpaces = parkingSpaces.length
  const occupiedSpaces = parkingSpaces.filter(s => s.isOccupied).length
  const vacantSpaces = totalSpaces - occupiedSpaces
  const visitorSpaces = parkingSpaces.filter(s => s.isVisitorParking).length
  const coveredSpaces = parkingSpaces.filter(s => s.type === 'covered').length
  const currentVisitors = visitorParkings.filter(v => v.status === 'parked').length
  const todayMovements = movements.length
  const entries = movements.filter(m => m.direction === 'entry').length
  const exits = movements.filter(m => m.direction === 'exit').length

  // ============================================
  // PARKING CRUD
  // ============================================
  const resetForm = () => {
    setFormData({ slotNumber: '', floor: '', section: '', type: 'open', vehicleType: 'car', flatId: '', isVisitorParking: false, monthlyCharges: '0', dimensions: '', hasCctv: false, hasCharging: false, notes: '' })
    setFormErrors({})
  }

  const handleCreateSubmit = async () => {
    if (!formData.slotNumber.trim()) { setFormErrors({ slotNumber: 'Required' }); return }
    setSubmitting(true)
    try {
      await orpc.parking.create({
        societyId: 1, slotNumber: formData.slotNumber, floor: formData.floor || undefined,
        section: formData.section || undefined, type: formData.type as any,
        vehicleType: formData.vehicleType || undefined,
        flatId: formData.flatId ? Number(formData.flatId) : undefined,
        isVisitorParking: formData.isVisitorParking,
        monthlyCharges: Number(formData.monthlyCharges),
        dimensions: formData.dimensions || undefined,
        hasCctv: formData.hasCctv, hasCharging: formData.hasCharging,
        notes: formData.notes || undefined,
      })
      setCreateOpen(false); resetForm(); fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleEditSubmit = async () => {
    if (!formData.slotNumber.trim() || !selectedSpace) return
    setSubmitting(true)
    try {
      await orpc.parking.update({
        id: selectedSpace.id, data: {
          slotNumber: formData.slotNumber, floor: formData.floor || null,
          section: formData.section || null, type: formData.type,
          vehicleType: formData.vehicleType, flatId: formData.flatId ? Number(formData.flatId) : null,
          isVisitorParking: formData.isVisitorParking, monthlyCharges: Number(formData.monthlyCharges),
          dimensions: formData.dimensions || null, hasCctv: formData.hasCctv,
          hasCharging: formData.hasCharging, notes: formData.notes || null,
          isOccupied: !!formData.flatId,
        },
      })
      setEditOpen(false); fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedSpace) return
    setSubmitting(true)
    try { await orpc.parking.delete({ id: selectedSpace.id }); setDeleteOpen(false); fetchAll() }
    catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleBulkCreate = async () => {
    if (bulkForm.count < 1 || bulkForm.count > 100) return
    setSubmitting(true)
    try {
      for (let i = 0; i < bulkForm.count; i++) {
        await orpc.parking.create({
          societyId: 1, slotNumber: `${bulkForm.prefix}${String(bulkForm.startNumber + i).padStart(3, '0')}`,
          floor: bulkForm.floor || undefined, section: bulkForm.section || undefined,
          type: bulkForm.type as any, vehicleType: bulkForm.vehicleType,
          isVisitorParking: false, monthlyCharges: Number(bulkForm.monthlyCharges),
        })
      }
      setBulkOpen(false); fetchAll()
      setBulkForm({ prefix: 'P', startNumber: 1, count: 10, floor: '', section: '', type: 'open', vehicleType: 'car', monthlyCharges: '0' })
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ============================================
  // VISITOR PARKING
  // ============================================
  const handleVPCreate = async () => {
    if (!vpForm.visitorName.trim()) return
    setSubmitting(true)
    try {
      await orpc.visitorParking.create({
        visitorId: Date.now(), visitorName: vpForm.visitorName, visitorPhone: vpForm.visitorPhone || undefined,
        parkingSpaceId: vpForm.parkingSpaceId ? Number(vpForm.parkingSpaceId) : undefined,
        flatId: vpForm.flatId ? Number(vpForm.flatId) : undefined,
        vehicleNumber: vpForm.vehicleNumber || undefined, vehicleType: vpForm.vehicleType || undefined,
        vehicleColor: vpForm.vehicleColor || undefined, purpose: vpForm.purpose || undefined,
        visitingMemberName: vpForm.visitingMemberName || undefined,
        idProofImage: vpIdProof || undefined,
        expectedDuration: vpForm.expectedDuration || undefined,
        notes: vpForm.notes || undefined,
      })
      setVpCreateOpen(false); fetchAll()
      setVpForm({ visitorName: '', visitorPhone: '', vehicleNumber: '', vehicleType: 'car', vehicleColor: '', purpose: '', visitingMemberName: '', flatId: '', parkingSpaceId: '', expectedDuration: '2 hours', notes: '' })
      setVpIdProof(null)
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleVPCheckout = async () => {
    if (!selectedVP) return
    setSubmitting(true)
    try { await orpc.visitorParking.checkOut({ id: selectedVP.id }); setVpCheckoutOpen(false); fetchAll() }
    catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ============================================
  // MOVEMENTS
  // ============================================
  const handleMVCreate = async () => {
    if (!mvForm.vehicleNumber.trim()) return
    setSubmitting(true)
    try {
      await orpc.vehicleMovements.create({
        vehicleNumber: mvForm.vehicleNumber, type: mvForm.type as any,
        direction: mvForm.direction as any, purpose: mvForm.purpose || undefined,
      })
      setMvCreateOpen(false); fetchAll()
      setMvForm({ vehicleNumber: '', type: 'resident', direction: 'entry', purpose: '' })
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ============================================
  // RENDER: Parking Form
  // ============================================
  const renderParkingForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Slot Number *</Label><Input value={formData.slotNumber} onChange={e => setFormData({ ...formData, slotNumber: e.target.value.toUpperCase() })} placeholder="e.g. A-001" className={`font-mono ${formErrors.slotNumber ? 'border-destructive' : ''}`} /></div>
        <div className="space-y-2"><Label>Dimensions</Label><Input value={formData.dimensions} onChange={e => setFormData({ ...formData, dimensions: e.target.value })} placeholder="e.g. 5m x 2.5m" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Floor</Label><Input value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} placeholder="e.g. B1, G" /></div>
        <div className="space-y-2"><Label>Section</Label><Input value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} placeholder="e.g. A, B" /></div>
        <div className="space-y-2"><Label>Type</Label><Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{parkingTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Vehicle Type</Label><Select value={formData.vehicleType} onValueChange={v => setFormData({ ...formData, vehicleType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{vehicleTypesOpts.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Monthly Charges (₹)</Label><Input type="number" value={formData.monthlyCharges} onChange={e => setFormData({ ...formData, monthlyCharges: e.target.value })} min="0" /></div>
      </div>
      {!formData.isVisitorParking && (
        <FlatPicker label="Allocate to Flat" value={formData.flatId} onChange={v => setFormData({ ...formData, flatId: v })} />
      )}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2"><input type="checkbox" id="isVisitor" checked={formData.isVisitorParking} onChange={e => setFormData({ ...formData, isVisitorParking: e.target.checked, flatId: e.target.checked ? '' : formData.flatId })} className="h-4 w-4 rounded" /><Label htmlFor="isVisitor" className="text-sm cursor-pointer">Visitor Parking</Label></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="hasCctv" checked={formData.hasCctv} onChange={e => setFormData({ ...formData, hasCctv: e.target.checked })} className="h-4 w-4 rounded" /><Label htmlFor="hasCctv" className="text-sm cursor-pointer flex items-center gap-1"><Cctv className="h-3 w-3" /> CCTV</Label></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="hasCharging" checked={formData.hasCharging} onChange={e => setFormData({ ...formData, hasCharging: e.target.checked })} className="h-4 w-4 rounded" /><Label htmlFor="hasCharging" className="text-sm cursor-pointer flex items-center gap-1"><Zap className="h-3 w-3" /> EV Charging</Label></div>
      </div>
      <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" className="min-h-[60px]" /></div>
    </div>
  )

  // ============================================
  // RENDER: Slot Card
  // ============================================
  const renderSlotCard = (space: ParkingSpace) => {
    const isVisitor = space.isVisitorParking
    const isOccupied = space.isOccupied
    return (
      <div
        key={space.id}
        className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
          isVisitor ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30'
          : isOccupied ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30'
          : 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20'
        }`}
        onClick={() => { setSelectedSpace(space); setDetailOpen(true) }}
      >
        {/* Top badges */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={`text-[10px] ${isVisitor ? 'bg-amber-500 text-white' : isOccupied ? 'bg-green-600 text-white' : 'bg-red-400 text-white'}`}>
            {isVisitor ? 'VISITOR' : isOccupied ? 'OCCUPIED' : 'VACANT'}
          </Badge>
          <div className="flex gap-1">
            {space.hasCctv && <Cctv className="h-3 w-3 text-blue-500" />}
            {space.hasCharging && <Zap className="h-3 w-3 text-green-500" />}
          </div>
        </div>
        {/* Slot number */}
        <p className="font-mono font-bold text-lg text-center">{space.slotNumber}</p>
        {/* Details */}
        <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
          <div className="flex justify-between"><span className="capitalize">{space.type}</span><span>{space.vehicleType || 'car'}</span></div>
          {space.floor && <div className="flex justify-between"><span>Floor {space.floor}</span>{space.section && <span>Sec {space.section}</span>}</div>}
          {space.monthlyCharges && space.monthlyCharges > 0 && <div className="flex justify-between font-medium text-foreground"><span>₹{space.monthlyCharges}/mo</span></div>}
        </div>
        {/* Edit/Delete buttons */}
        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); setSelectedSpace(space); setFormData({ slotNumber: space.slotNumber, floor: space.floor || '', section: space.section || '', type: space.type, vehicleType: space.vehicleType || 'car', flatId: space.flatId?.toString() || '', isVisitorParking: space.isVisitorParking, monthlyCharges: space.monthlyCharges?.toString() || '0', dimensions: space.dimensions || '', hasCctv: space.hasCctv || false, hasCharging: space.hasCharging || false, notes: space.notes || '' }); setEditOpen(true) }}><Edit className="h-3 w-3" /></Button>
        </div>
      </div>
    )
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parking Management</h1>
          <p className="text-muted-foreground">Manage parking slots, visitor parking, and vehicle movements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
          {tab === 'slots' && <>
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
              {viewMode === 'grid' ? <List className="mr-2 h-4 w-4" /> : <Grid3X3 className="mr-2 h-4 w-4" />}
              {viewMode === 'grid' ? 'Table' : 'Grid'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}><Layers className="mr-2 h-4 w-4" /> Bulk Add</Button>
            <Button onClick={() => { resetForm(); setCreateOpen(true) }}><Plus className="mr-2 h-4 w-4" /> Add Slot</Button>
          </>}
          {tab === 'visitors' && <Button onClick={() => setVpCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Check-in Vehicle</Button>}
          {tab === 'movements' && <Button onClick={() => setMvCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Log Movement</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><Car className="h-4 w-4 text-blue-600" /></div><div><p className="text-lg font-bold">{totalSpaces}</p><p className="text-[10px] text-muted-foreground">Total Slots</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950"><CheckCircle2 className="h-4 w-4 text-green-600" /></div><div><p className="text-lg font-bold">{occupiedSpaces}</p><p className="text-[10px] text-muted-foreground">Occupied</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950"><Circle className="h-4 w-4 text-red-600" /></div><div><p className="text-lg font-bold">{vacantSpaces}</p><p className="text-[10px] text-muted-foreground">Vacant</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950"><Users className="h-4 w-4 text-amber-600" /></div><div><p className="text-lg font-bold">{currentVisitors}</p><p className="text-[10px] text-muted-foreground">Visitors Parked</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950"><ArrowUpRight className="h-4 w-4 text-purple-600" /></div><div><p className="text-lg font-bold">{entries}</p><p className="text-[10px] text-muted-foreground">Entries</p></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950"><ArrowDownRight className="h-4 w-4 text-emerald-600" /></div><div><p className="text-lg font-bold">{exits}</p><p className="text-[10px] text-muted-foreground">Exits</p></div></div></CardContent></Card>
      </div>

      {/* Search */}
      <Card><CardContent className="p-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search slots, vehicles, visitors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          {search && <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setSearch('')}><X className="h-4 w-4" /></Button>}
        </div>
      </CardContent></Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="slots"><Car className="mr-1.5 h-4 w-4" />Parking Slots ({parkingSpaces.length})</TabsTrigger>
          <TabsTrigger value="visitors"><Users className="mr-1.5 h-4 w-4" />Visitor Parking ({visitorParkings.length})</TabsTrigger>
          <TabsTrigger value="movements"><ClipboardList className="mr-1.5 h-4 w-4" />Movement Log ({movements.length})</TabsTrigger>
        </TabsList>

        {/* ===================== SLOTS TAB ===================== */}
        <TabsContent value="slots" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[130px]"><SelectValue placeholder="All Types" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{parkingTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[130px]"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="occupied">Occupied</SelectItem><SelectItem value="vacant">Vacant</SelectItem></SelectContent></Select>
          </div>

          {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          : viewMode === 'grid' ? (
            <div className="space-y-4">
              {/* Group by floor */}
              {(() => {
                const groups = new Map<string, ParkingSpace[]>()
                filteredSpaces.forEach(s => { const key = s.floor || 'Ground'; if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(s) })
                return Array.from(groups.entries()).map(([floor, spaces]) => (
                  <div key={floor}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">{floor === 'Ground' ? 'G' : floor}</div>
                      <span className="text-xs font-medium text-muted-foreground">Floor {floor} ({spaces.length} slots)</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                      {spaces.sort((a, b) => a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true })).map(renderSlotCard)}
                    </div>
                  </div>
                ))
              })()}
            </div>
          ) : (
            <Card><CardContent className="p-0">
              <table className="w-full"><thead><tr className="border-b"><th className="p-3 text-left text-xs font-medium text-muted-foreground">Slot</th><th className="p-3 text-left text-xs font-medium text-muted-foreground">Floor</th><th className="p-3 text-left text-xs font-medium text-muted-foreground">Type</th><th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th><th className="p-3 text-left text-xs font-medium text-muted-foreground">Charges</th><th className="p-3 text-right text-xs font-medium text-muted-foreground">Actions</th></tr></thead>
              <tbody>{filteredSpaces.map(s => (
                <tr key={s.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedSpace(s); setDetailOpen(true) }}>
                  <td className="p-3 font-mono font-medium text-sm">{s.slotNumber}</td>
                  <td className="p-3 text-sm">{s.floor || '-'}</td>
                  <td className="p-3"><Badge className={`text-[10px] ${typeColors[s.type] || ''}`}>{s.type}</Badge></td>
                  <td className="p-3"><Badge className={`text-[10px] ${s.isVisitorParking ? 'bg-amber-500 text-white' : s.isOccupied ? 'bg-green-600 text-white' : 'bg-red-400 text-white'}`}>{s.isVisitorParking ? 'Visitor' : s.isOccupied ? 'Occupied' : 'Vacant'}</Badge></td>
                  <td className="p-3 text-sm">₹{s.monthlyCharges || 0}/mo</td>
                  <td className="p-3 text-right"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setSelectedSpace(s); setFormData({ slotNumber: s.slotNumber, floor: s.floor || '', section: s.section || '', type: s.type, vehicleType: s.vehicleType || 'car', flatId: s.flatId?.toString() || '', isVisitorParking: s.isVisitorParking, monthlyCharges: s.monthlyCharges?.toString() || '0', dimensions: s.dimensions || '', hasCctv: s.hasCctv || false, hasCharging: s.hasCharging || false, notes: s.notes || '' }); setEditOpen(true) }}><Edit className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}</tbody></table>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ===================== VISITOR PARKING TAB ===================== */}
        <TabsContent value="visitors" className="space-y-4">
          {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          : filteredVP.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Users className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No visitor parking records</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredVP.map(vp => (
                <Card key={vp.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${vp.status === 'parked' ? 'bg-green-50 dark:bg-green-950' : 'bg-muted'}`}>
                        <Car className={`h-6 w-6 ${vp.status === 'parked' ? 'text-green-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{vp.visitorName || 'Visitor'}</p>
                          <Badge className={`text-[10px] ${visitorStatusColors[vp.status] || ''}`}>{vp.status}</Badge>
                          {vp.vehicleNumber && <Badge variant="outline" className="text-[10px] font-mono">{vp.vehicleNumber}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {vp.purpose && <span>{vp.purpose}</span>}
                          {vp.visitingMemberName && <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" />{vp.visitingMemberName}</span>}
                          {vp.vehicleType && <span className="capitalize">{vp.vehicleType}</span>}
                          {vp.vehicleColor && <span>{vp.vehicleColor}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><LogIn className="h-3 w-3" />{new Date(vp.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        {vp.exitTime && <p className="text-xs text-muted-foreground flex items-center gap-1"><LogOut className="h-3 w-3" />{new Date(vp.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                        {vp.expectedDuration && <p className="text-[10px] text-muted-foreground mt-0.5">Est: {vp.expectedDuration}</p>}
                      </div>
                      {vp.status === 'parked' && (
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => { setSelectedVP(vp); setVpCheckoutOpen(true) }}>
                          <LogOut className="mr-1 h-3 w-3" /> Checkout
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===================== MOVEMENTS TAB ===================== */}
        <TabsContent value="movements" className="space-y-4">
          {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          : filteredMovements.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No vehicle movements logged</p></CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <table className="w-full"><thead><tr className="border-b">
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">Vehicle</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">Direction</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">Purpose</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground">Time</th>
              </tr></thead>
              <tbody>{filteredMovements.map(m => (
                <tr key={m.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-mono font-medium text-sm">{m.vehicleNumber}</td>
                  <td className="p-3"><Badge className={`text-[10px] ${movementTypeColors[m.type] || ''}`}>{m.type}</Badge></td>
                  <td className="p-3">
                    <Badge className={`text-[10px] ${m.direction === 'entry' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {m.direction === 'entry' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {m.direction}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{m.purpose || '-'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(m.timestamp).toLocaleString('en-IN')}</td>
                </tr>
              ))}</tbody></table>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ===================== DIALOGS ===================== */}

      {/* Create Parking Slot */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Parking Slot</DialogTitle><DialogDescription>Register a new parking slot</DialogDescription></DialogHeader>
          {renderParkingForm()}
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreateSubmit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Slot</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Parking Slot */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Parking Slot</DialogTitle><DialogDescription>Update slot details</DialogDescription></DialogHeader>
          {renderParkingForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setEditOpen(false); setDeleteOpen(true) }} className="mr-auto">Delete</Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot Detail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Slot Details</DialogTitle></DialogHeader>
          {selectedSpace && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className={`inline-flex h-20 w-20 items-center justify-center rounded-2xl ${selectedSpace.isVisitorParking ? 'bg-amber-100 dark:bg-amber-900' : selectedSpace.isOccupied ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  <Car className={`h-10 w-10 ${selectedSpace.isVisitorParking ? 'text-amber-600' : selectedSpace.isOccupied ? 'text-green-600' : 'text-red-500'}`} />
                </div>
                <p className="font-mono font-bold text-2xl mt-2">{selectedSpace.slotNumber}</p>
                <Badge className={`mt-1 ${selectedSpace.isVisitorParking ? 'bg-amber-500 text-white' : selectedSpace.isOccupied ? 'bg-green-600 text-white' : 'bg-red-400 text-white'}`}>
                  {selectedSpace.isVisitorParking ? 'Visitor Parking' : selectedSpace.isOccupied ? 'Occupied' : 'Vacant'}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium capitalize">{selectedSpace.type}</p></div>
                <div><p className="text-muted-foreground text-xs">Vehicle Type</p><p className="font-medium capitalize">{selectedSpace.vehicleType || 'Car'}</p></div>
                <div><p className="text-muted-foreground text-xs">Floor</p><p className="font-medium">{selectedSpace.floor || 'Ground'}</p></div>
                <div><p className="text-muted-foreground text-xs">Section</p><p className="font-medium">{selectedSpace.section || '-'}</p></div>
                <div><p className="text-muted-foreground text-xs">Dimensions</p><p className="font-medium">{selectedSpace.dimensions || '-'}</p></div>
                <div><p className="text-muted-foreground text-xs">Monthly Charges</p><p className="font-medium">₹{selectedSpace.monthlyCharges || 0}</p></div>
              </div>
              <div className="flex gap-3">
                {selectedSpace.hasCctv && <Badge variant="outline" className="flex items-center gap-1"><Cctv className="h-3 w-3" /> CCTV</Badge>}
                {selectedSpace.hasCharging && <Badge variant="outline" className="flex items-center gap-1"><Zap className="h-3 w-3" /> EV Charging</Badge>}
              </div>
              {selectedSpace.notes && <div><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{selectedSpace.notes}</p></div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Slot */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Slot</DialogTitle><DialogDescription>Delete slot <strong>{selectedSpace?.slotNumber}</strong>?</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteSubmit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Bulk Add Slots</DialogTitle><DialogDescription>Create multiple parking slots at once</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Prefix</Label><Input value={bulkForm.prefix} onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value })} placeholder="P" /></div>
              <div className="space-y-2"><Label>Start #</Label><Input type="number" value={bulkForm.startNumber} onChange={e => setBulkForm({ ...bulkForm, startNumber: Number(e.target.value) || 1 })} /></div>
              <div className="space-y-2"><Label>Count *</Label><Input type="number" min={1} max={100} value={bulkForm.count} onChange={e => setBulkForm({ ...bulkForm, count: Number(e.target.value) || 1 })} /></div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: Math.min(bulkForm.count, 8) }, (_, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-mono">{bulkForm.prefix}{String(bulkForm.startNumber + i).padStart(3, '0')}</Badge>
                ))}
                {bulkForm.count > 8 && <Badge variant="secondary" className="text-[10px]">+{bulkForm.count - 8} more</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Floor</Label><Input value={bulkForm.floor} onChange={e => setBulkForm({ ...bulkForm, floor: e.target.value })} placeholder="B1" /></div>
              <div className="space-y-2"><Label>Section</Label><Input value={bulkForm.section} onChange={e => setBulkForm({ ...bulkForm, section: e.target.value })} placeholder="A" /></div>
              <div className="space-y-2"><Label>Type</Label><Select value={bulkForm.type} onValueChange={v => setBulkForm({ ...bulkForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{parkingTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Vehicle Type</Label><Select value={bulkForm.vehicleType} onValueChange={v => setBulkForm({ ...bulkForm, vehicleType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{vehicleTypesOpts.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Charges ₹/mo</Label><Input type="number" value={bulkForm.monthlyCharges} onChange={e => setBulkForm({ ...bulkForm, monthlyCharges: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button><Button onClick={handleBulkCreate} disabled={submitting}><Layers className="mr-2 h-4 w-4" /> Create {bulkForm.count} Slots</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visitor Check-in */}
      <Dialog open={vpCreateOpen} onOpenChange={setVpCreateOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Visitor Vehicle Check-in</DialogTitle><DialogDescription>Register a visitor's vehicle for parking</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Visitor Name *</Label><Input value={vpForm.visitorName} onChange={e => setVpForm({ ...vpForm, visitorName: e.target.value })} placeholder="Full name" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={vpForm.visitorPhone} onChange={e => setVpForm({ ...vpForm, visitorPhone: e.target.value })} placeholder="+91 98765 43210" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Vehicle Number</Label><Input value={vpForm.vehicleNumber} onChange={e => setVpForm({ ...vpForm, vehicleNumber: e.target.value.toUpperCase() })} placeholder="MH12AB1234" className="font-mono" /></div>
              <div className="space-y-2"><Label>Vehicle Type</Label><Select value={vpForm.vehicleType} onValueChange={v => setVpForm({ ...vpForm, vehicleType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['car', 'bike', 'auto', 'other'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Color</Label><Input value={vpForm.vehicleColor} onChange={e => setVpForm({ ...vpForm, vehicleColor: e.target.value })} placeholder="White" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Purpose</Label><Input value={vpForm.purpose} onChange={e => setVpForm({ ...vpForm, purpose: e.target.value })} placeholder="e.g. Delivery, Guest" /></div>
              <div className="space-y-2"><Label>Visiting Member</Label><Input value={vpForm.visitingMemberName} onChange={e => setVpForm({ ...vpForm, visitingMemberName: e.target.value })} placeholder="Member name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Expected Duration</Label><Select value={vpForm.expectedDuration} onValueChange={v => setVpForm({ ...vpForm, expectedDuration: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['30 min', '1 hour', '2 hours', '4 hours', '8 hours', 'Full day', 'Overnight'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <FlatPicker label="Visiting Flat" value={vpForm.flatId} onChange={v => setVpForm({ ...vpForm, flatId: v })} />
            </div>
            <div className="space-y-2">
              <Label>Assign Parking Slot</Label>
              <Select value={vpForm.parkingSpaceId} onValueChange={v => setVpForm({ ...vpForm, parkingSpaceId: v })}>
                <SelectTrigger><SelectValue placeholder="Select slot (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-assign</SelectItem>
                  {parkingSpaces.filter(s => s.isVisitorParking && !s.isOccupied).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.slotNumber} ({s.floor || 'Ground'})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ImageUploadZone label="ID Proof" icon={FileText} image={vpIdProof} onUpload={setVpIdProof} onRemove={() => setVpIdProof(null)} aspect="aspect-video" hint="Aadhaar, PAN, etc." folder="society_erp/parking/visitor-id" />
            <div className="space-y-2"><Label>Notes</Label><Textarea value={vpForm.notes} onChange={e => setVpForm({ ...vpForm, notes: e.target.value })} placeholder="Any additional notes" className="min-h-[60px]" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVpCreateOpen(false)}>Cancel</Button><Button onClick={handleVPCreate} disabled={submitting || !vpForm.visitorName.trim()}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} Check In</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visitor Checkout */}
      <Dialog open={vpCheckoutOpen} onOpenChange={setVpCheckoutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Checkout Visitor</DialogTitle><DialogDescription>Check out <strong>{selectedVP?.visitorName}</strong> ({selectedVP?.vehicleNumber})?</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setVpCheckoutOpen(false)}>Cancel</Button><Button onClick={handleVPCheckout} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<LogOut className="mr-2 h-4 w-4" /> Checkout</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Movement */}
      <Dialog open={mvCreateOpen} onOpenChange={setMvCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Log Vehicle Movement</DialogTitle><DialogDescription>Record a vehicle entry or exit at the gate</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Vehicle Number *</Label><Input value={mvForm.vehicleNumber} onChange={e => setMvForm({ ...mvForm, vehicleNumber: e.target.value.toUpperCase() })} placeholder="MH12AB1234" className="font-mono" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Vehicle Type</Label><Select value={mvForm.type} onValueChange={v => setMvForm({ ...mvForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['resident', 'visitor', 'delivery', 'utility'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Direction</Label><Select value={mvForm.direction} onValueChange={v => setMvForm({ ...mvForm, direction: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entry">Entry</SelectItem><SelectItem value="exit">Exit</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Purpose</Label><Input value={mvForm.purpose} onChange={e => setMvForm({ ...mvForm, purpose: e.target.value })} placeholder="e.g. Daily commute, Delivery" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMvCreateOpen(false)}>Cancel</Button><Button onClick={handleMVCreate} disabled={submitting || !mvForm.vehicleNumber.trim()}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Log Movement</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />
    </div>
  )
}
