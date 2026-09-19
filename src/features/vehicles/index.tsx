import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  Car,
  Bike,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  X,
  Download,
  Fuel,
  Calendar,
  Shield,
  Grid3X3,
  List,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Upload,
  Trash,
  FileText,
  File,
  FileCheck,
  Eye,
  Paperclip,
  FileDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FlatPicker } from '@/components/flat-picker'
import { MemberPicker } from '@/components/member-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { ImageUploadZone, ImageGallery, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'

// ============================================
// TYPES
// ============================================
interface Vehicle {
  id: number
  memberId: number
  flatId: number
  vehicleNumber: string
  type: string
  brand?: string
  model?: string
  color?: string
  yearOfManufacture?: number
  fuelType?: string
  insuranceExpiry?: string
  rcExpiry?: string
  numberPlateImage?: string | null
  bodyImage?: string | null
  images?: string | null
  documents?: string | null
  parkingSpaceId?: number
  isPrimary: boolean
  isActive: boolean
  createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const typeConfig: Record<string, { color: string; icon: any }> = {
  car: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Car },
  bike: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: Bike },
  scooter: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Bike },
  bicycle: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Bike },
  other: { color: 'bg-muted text-muted-foreground', icon: Car },
}

const vehicleTypes = ['car', 'bike', 'scooter', 'bicycle', 'other']
const fuelTypes = ['petrol', 'diesel', 'electric', 'cng', 'hybrid']

interface VehicleDocument {
  name: string
  type: string
  data: string // base64 data URL
  size: number
  uploadedAt: string
}

const docTypeOptions = [
  { value: 'rc_copy', label: 'RC Copy', icon: FileCheck },
  { value: 'insurance_policy', label: 'Insurance Policy', icon: Shield },
  { value: 'puc_certificate', label: 'PUC Certificate', icon: FileCheck },
  { value: 'fitness_certificate', label: 'Fitness Certificate', icon: FileCheck },
  { value: 'tax_receipt', label: 'Tax Receipt', icon: FileText },
  { value: 'permit', label: 'Permit', icon: FileText },
  { value: 'loan_documents', label: 'Loan Documents', icon: FileText },
  { value: 'other', label: 'Other', icon: File },
]

// ============================================
// MAIN COMPONENT
// ============================================
export function VehiclesPage() {
  const navigate = useNavigate()
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  // Image/Document preview dialog
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewIsPdf, setPreviewIsPdf] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    type: 'car',
    brand: '',
    model: '',
    color: '',
    yearOfManufacture: '',
    fuelType: 'petrol',
    flatId: '1',
    memberId: '1',
    insuranceExpiry: '',
    rcExpiry: '',
    isPrimary: false,
  })

  // Image state
  const [numberPlateImage, setNumberPlateImage] = useState<string | null>(null)
  const [bodyImage, setBodyImage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [vehicleDocuments, setVehicleDocuments] = useState<UploadedDocument[]>([])

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const data = await orpc.vehicles.list({})
      setVehicles(data || [])
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || vehicle.type === typeFilter
    return matchesSearch && matchesType
  })

  // Stats
  const totalVehicles = vehicles.length
  const cars = vehicles.filter((v) => v.type === 'car').length
  const bikes = vehicles.filter((v) => v.type === 'bike' || v.type === 'scooter').length
  const electricVehicles = vehicles.filter((v) => v.fuelType === 'electric').length

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.vehicleNumber.trim()) errors.vehicleNumber = 'Vehicle number is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      vehicleNumber: '', type: 'car', brand: '', model: '', color: '',
      yearOfManufacture: '', fuelType: 'petrol', flatId: '1', memberId: '1',
      insuranceExpiry: '', rcExpiry: '', isPrimary: false,
    })
    setNumberPlateImage(null)
    setBodyImage(null)
    setGalleryImages([])
    setVehicleDocuments([])
    setFormErrors({})
  }

  // Open create dialog
  const handleCreate = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setFormData({
      vehicleNumber: vehicle.vehicleNumber || '',
      type: vehicle.type || 'car',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      color: vehicle.color || '',
      yearOfManufacture: vehicle.yearOfManufacture?.toString() || '',
      fuelType: vehicle.fuelType || 'petrol',
      flatId: vehicle.flatId?.toString() || '1',
      memberId: vehicle.memberId?.toString() || '1',
      insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '',
      rcExpiry: vehicle.rcExpiry ? vehicle.rcExpiry.split('T')[0] : '',
      isPrimary: vehicle.isPrimary || false,
    })
    setNumberPlateImage(vehicle.numberPlateImage || null)
    setBodyImage(vehicle.bodyImage || null)
    try {
      setGalleryImages(vehicle.images ? JSON.parse(vehicle.images) : [])
    } catch {
      setGalleryImages([])
    }
    try {
      setVehicleDocuments(vehicle.documents ? JSON.parse(vehicle.documents) : [])
    } catch {
      setVehicleDocuments([])
    }
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setDeleteDialogOpen(true)
  }

  // Preview image/document
  const handlePreview = (src: string, title: string) => {
    setPreviewSrc(src)
    setPreviewTitle(title)
    setPreviewIsPdf(src.startsWith('data:application/pdf'))
    setPreviewOpen(true)
  }

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.vehicles.create({
        memberId: Number(formData.memberId),
        flatId: Number(formData.flatId),
        vehicleNumber: formData.vehicleNumber,
        type: formData.type as any,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        yearOfManufacture: formData.yearOfManufacture ? Number(formData.yearOfManufacture) : undefined,
        fuelType: formData.fuelType || undefined,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        rcExpiry: formData.rcExpiry || undefined,
        numberPlateImage: numberPlateImage || undefined,
        bodyImage: bodyImage || undefined,
        images: galleryImages.length > 0 ? JSON.stringify(galleryImages) : undefined,
        documents: vehicleDocuments.length > 0 ? JSON.stringify(vehicleDocuments) : undefined,
        isPrimary: formData.isPrimary,
      })
      setCreateDialogOpen(false)
      fetchVehicles()
    } catch (error) {
      console.error('Failed to create vehicle:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedVehicle) return
    setSubmitting(true)
    try {
      await orpc.vehicles.update({
        id: selectedVehicle.id,
        data: {
          vehicleNumber: formData.vehicleNumber,
          type: formData.type,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          color: formData.color || undefined,
          yearOfManufacture: formData.yearOfManufacture ? Number(formData.yearOfManufacture) : undefined,
          fuelType: formData.fuelType || undefined,
          insuranceExpiry: formData.insuranceExpiry || undefined,
          rcExpiry: formData.rcExpiry || undefined,
          numberPlateImage: numberPlateImage || null,
          bodyImage: bodyImage || null,
          images: galleryImages.length > 0 ? JSON.stringify(galleryImages) : null,
          documents: vehicleDocuments.length > 0 ? JSON.stringify(vehicleDocuments) : null,
          isPrimary: formData.isPrimary,
        },
      })
      setEditDialogOpen(false)
      fetchVehicles()
    } catch (error) {
      console.error('Failed to update vehicle:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedVehicle) return
    setSubmitting(true)
    try {
      await orpc.vehicles.delete({ id: selectedVehicle.id })
      setDeleteDialogOpen(false)
      fetchVehicles()
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Table columns
  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'vehicleNumber',
      header: 'Vehicle',
      cell: ({ row }) => {
        const config = typeConfig[row.original.type] || typeConfig.other
        const Icon = config.icon
        const hasImage = row.original.numberPlateImage || row.original.bodyImage
        return (
          <div className="flex items-center gap-3">
            {hasImage ? (
              <div
                className="h-10 w-10 rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview(row.original.numberPlateImage || row.original.bodyImage || '', row.original.vehicleNumber)
                }}
              >
                <img
                  src={row.original.numberPlateImage || row.original.bodyImage || ''}
                  alt={row.original.vehicleNumber}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-medium font-mono">{row.original.vehicleNumber}</p>
              <p className="text-xs text-muted-foreground capitalize">{row.original.type}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'brand',
      header: 'Make & Model',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.brand || row.original.model
            ? `${row.original.brand || ''} ${row.original.model || ''}`.trim()
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.color || '-'}</span>
      ),
    },
    {
      accessorKey: 'yearOfManufacture',
      header: 'Year',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.yearOfManufacture || '-'}</span>
      ),
    },
    {
      accessorKey: 'fuelType',
      header: 'Fuel',
      cell: ({ row }) => (
        <Badge variant={row.original.fuelType === 'electric' ? 'default' : 'secondary'} className={row.original.fuelType === 'electric' ? 'bg-green-600' : ''}>
          {row.original.fuelType || '-'}
        </Badge>
      ),
    },
    {
      accessorKey: 'flatId',
      header: 'Flat',
      cell: ({ row }) => (
        <span className="text-sm">Flat {row.original.flatId}</span>
      ),
    },
    {
      id: 'docs',
      header: 'Docs',
      cell: ({ row }) => {
        let docCount = 0
        try { docCount = row.original.documents ? JSON.parse(row.original.documents).length : 0 } catch { /* ignore */ }
        return docCount > 0 ? (
          <Badge variant="secondary" className="text-xs">
            <Paperclip className="h-3 w-3 mr-1" />{docCount}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const vehicle = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(vehicle)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => handleDeleteClick(vehicle)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useTable({
    data: filteredVehicles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  // Parse vehicle docs helper
  const parseDocs = (v: Vehicle): VehicleDocument[] => {
    try { return v.documents ? JSON.parse(v.documents) : [] } catch { return [] }
  }

  // Shared form dialog content
  const renderFormDialog = () => (
    <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editDialogOpen ? 'Edit Vehicle' : 'Register Vehicle'}</DialogTitle>
        <DialogDescription>
          {editDialogOpen ? 'Update vehicle details, photos and documents.' : 'Fill in the details to register a new vehicle.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-5 py-2">
        {/* Vehicle Number */}
        <div className="space-y-2">
          <Label>Vehicle Number *</Label>
          <Input
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
            placeholder="e.g. MH12AB1234"
            className={`font-mono ${formErrors.vehicleNumber ? 'border-destructive' : ''}`}
          />
          {formErrors.vehicleNumber && (
            <p className="text-xs text-destructive">{formErrors.vehicleNumber}</p>
          )}
        </div>

        {/* Flat & Member */}
        <div className="grid grid-cols-2 gap-4">
          <FlatPicker
            label="Flat *"
            value={formData.flatId}
            onChange={(v) => setFormData({ ...formData, flatId: v })}
            required
          />
          <MemberPicker
            label="Member *"
            value={formData.memberId}
            onChange={(v) => setFormData({ ...formData, memberId: v })}
            required
          />
        </div>

        {/* Type & Fuel */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vehicle Type *</Label>
            <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fuel Type</Label>
            <Select value={formData.fuelType} onValueChange={(val) => setFormData({ ...formData, fuelType: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {fuelTypes.map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g. Maruti, Honda"
            />
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. Swift, City"
            />
          </div>
        </div>

        {/* Color & Year */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="e.g. White"
            />
          </div>
          <div className="space-y-2">
            <Label>Year of Manufacture</Label>
            <Input
              type="number"
              value={formData.yearOfManufacture}
              onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
              placeholder="e.g. 2022"
              min="1990"
              max="2030"
            />
          </div>
        </div>

        {/* Insurance & RC Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Insurance Expiry</Label>
            <Input
              type="date"
              value={formData.insuranceExpiry}
              onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>RC Expiry</Label>
            <Input
              type="date"
              value={formData.rcExpiry}
              onChange={(e) => setFormData({ ...formData, rcExpiry: e.target.value })}
            />
          </div>
        </div>

        {/* Primary vehicle toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPrimary"
            checked={formData.isPrimary}
            onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isPrimary" className="text-sm cursor-pointer">Primary vehicle</Label>
        </div>

        {/* ============================================ */}
        {/* VEHICLE IMAGES SECTION                       */}
        {/* ============================================ */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Vehicle Photos</h4>
          </div>

          {/* Number Plate & Body Image side by side */}
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadZone
              label="Number Plate"
              icon={FileText}
              image={numberPlateImage}
              onUpload={setNumberPlateImage}
              onRemove={() => setNumberPlateImage(null)}
              aspect="aspect-video"
              hint="Clear photo of number plate"
              folder="society_erp/vehicles/number-plates"
            />
            <ImageUploadZone
              label="Full Body"
              icon={Car}
              image={bodyImage}
              onUpload={setBodyImage}
              onRemove={() => setBodyImage(null)}
              aspect="aspect-video"
              hint="Front/side view of vehicle"
              folder="society_erp/vehicles/body"
            />
          </div>

          {/* Gallery */}
          <ImageGallery
            images={galleryImages}
            onAdd={(img) => setGalleryImages([...galleryImages, img])}
            onRemove={(idx) => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
            folder="society_erp/vehicles/gallery"
          />
        </div>

        {/* ============================================ */}
        {/* VEHICLE DOCUMENTS SECTION                    */}
        {/* ============================================ */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Owner Documents</h4>
            <Badge variant="secondary" className="text-[10px] ml-1">{vehicleDocuments.length}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            Upload RC copy, insurance, PUC certificate, and other vehicle documents provided by the owner.
          </p>
          <DocumentUploader
            documents={vehicleDocuments}
            onAdd={(doc: UploadedDocument) => setVehicleDocuments([...vehicleDocuments, doc])}
            onRemove={(idx: number) => setVehicleDocuments(vehicleDocuments.filter((_: UploadedDocument, i: number) => i !== idx))}
            onView={(doc: UploadedDocument) => handlePreview(doc.data, doc.name)}
            docTypes={docTypeOptions.map(d => ({ ...d, icon: d.icon }))}
            folder="society_erp/vehicles/documents"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
        }}>
          Cancel
        </Button>
        <Button onClick={editDialogOpen ? handleEditSubmit : handleCreateSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editDialogOpen ? 'Update Vehicle' : 'Register Vehicle'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage registered vehicles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}>
            {viewMode === 'card' ? <List className="mr-2 h-4 w-4" /> : <Grid3X3 className="mr-2 h-4 w-4" />}
            {viewMode === 'card' ? 'Table' : 'Cards'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Register Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVehicles}</p>
                <p className="text-xs text-muted-foreground">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <Car className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cars}</p>
                <p className="text-xs text-muted-foreground">Cars</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <Bike className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bikes}</p>
                <p className="text-xs text-muted-foreground">Bikes/Scooters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <Fuel className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{electricVehicles}</p>
                <p className="text-xs text-muted-foreground">Electric</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle number, brand, or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setSearch('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vehicleTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* VEHICLE CARD VIEW                           */}
      {/* ============================================ */}
      {viewMode === 'card' && !loading && (
        <>
          <h3 className="text-sm font-medium text-muted-foreground">Vehicles ({filteredVehicles.length})</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map(vehicle => {
              const config = typeConfig[vehicle.type] || typeConfig.other
              const Icon = config.icon
              const hasInsurance = !!vehicle.insuranceExpiry
              const insuranceExpired = hasInsurance && new Date(vehicle.insuranceExpiry!) < new Date()
              const insuranceExpiringSoon = hasInsurance && !insuranceExpired && new Date(vehicle.insuranceExpiry!).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
              const hasRc = !!vehicle.rcExpiry
              const rcExpired = hasRc && new Date(vehicle.rcExpiry!) < new Date()
              const hasImages = !!(vehicle.numberPlateImage || vehicle.bodyImage || vehicle.images)
              const docs = parseDocs(vehicle)
              return (
                <Card key={vehicle.id} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group" onClick={() => navigate({ to: `/vehicles/${vehicle.id}` })}>
                  <CardContent className="p-0">
                    {/* Vehicle Image Header */}
                    {hasImages ? (
                      <div className="relative h-36 overflow-hidden rounded-t-lg">
                        <img
                          src={vehicle.bodyImage || vehicle.numberPlateImage || ''}
                          alt={vehicle.vehicleNumber}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {/* Photo count badge */}
                        {(() => {
                          const photoCount = [
                            vehicle.numberPlateImage,
                            vehicle.bodyImage,
                            ...(vehicle.images ? (() => { try { return JSON.parse(vehicle.images) } catch { return [] } })() : []),
                          ].filter(Boolean).length
                          return photoCount > 1 ? (
                            <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
                              <Camera className="h-3 w-3 text-white" />
                              <span className="text-[10px] text-white font-medium">{photoCount}</span>
                            </div>
                          ) : null
                        })()}
                        {/* Doc count badge */}
                        {docs.length > 0 && (
                          <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <Paperclip className="h-3 w-3 text-white" />
                            <span className="text-[10px] text-white font-medium">{docs.length} docs</span>
                          </div>
                        )}
                        {/* Number plate overlay */}
                        {vehicle.numberPlateImage && (
                          <div
                            className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/80 rounded px-2 py-1 cursor-pointer hover:bg-white dark:hover:bg-black transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePreview(vehicle.numberPlateImage!, `${vehicle.vehicleNumber} — Number Plate`)
                            }}
                          >
                            <span className="text-xs font-bold font-mono">{vehicle.vehicleNumber}</span>
                          </div>
                        )}
                        {!vehicle.numberPlateImage && (
                          <div className="absolute bottom-2 left-2">
                            <span className="text-xs font-bold font-mono text-white drop-shadow">{vehicle.vehicleNumber}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.color}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold font-mono text-lg">{vehicle.vehicleNumber}</p>
                              <p className="text-sm text-muted-foreground capitalize">{vehicle.type}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 pt-3 space-y-3">
                      {/* Compact info when image shown */}
                      {hasImages && (
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold font-mono text-sm">{vehicle.vehicleNumber}</p>
                            <p className="text-xs text-muted-foreground capitalize">{vehicle.type}</p>
                          </div>
                          {vehicle.color && (
                            <div className="ml-auto flex items-center gap-1">
                              <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                              <span className="text-[10px] text-muted-foreground">{vehicle.color}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {!hasImages && vehicle.color && (
                        <div className="flex items-center gap-1">
                          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: vehicle.color.toLowerCase() }} title={vehicle.color} />
                          <span className="text-xs text-muted-foreground">{vehicle.color}</span>
                        </div>
                      )}

                      {(vehicle.brand || vehicle.model) && (
                        <p className="text-sm">{vehicle.brand || ''} {vehicle.model || ''}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {vehicle.yearOfManufacture && <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />{vehicle.yearOfManufacture}</Badge>}
                        {vehicle.fuelType && <Badge variant="secondary" className="text-xs"><Fuel className="h-3 w-3 mr-1" />{vehicle.fuelType}</Badge>}
                        {vehicle.isPrimary && <Badge className="text-xs bg-primary"><Shield className="h-3 w-3 mr-1" />Primary</Badge>}
                        {hasImages && (
                          <Badge variant="outline" className="text-xs">
                            <Camera className="h-3 w-3 mr-1" />
                            {[vehicle.numberPlateImage, vehicle.bodyImage, ...(vehicle.images ? (() => { try { return JSON.parse(vehicle.images) } catch { return [] } })() : [])].filter(Boolean).length} photos
                          </Badge>
                        )}
                        {docs.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {docs.length} doc{docs.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      {/* Expiry Alerts */}
                      <div className="space-y-1.5">
                        {insuranceExpired && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" /> Insurance expired
                          </div>
                        )}
                        {insuranceExpiringSoon && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" /> Insurance expiring soon
                          </div>
                        )}
                        {hasInsurance && !insuranceExpired && !insuranceExpiringSoon && (
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" /> Insurance valid
                          </div>
                        )}
                        {rcExpired && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" /> RC expired
                          </div>
                        )}
                      </div>

                      {/* Document thumbnails */}
                      {docs.length > 0 && (
                        <div className="flex gap-1.5 pt-1 flex-wrap">
                          {docs.slice(0, 5).map((doc, idx) => {
                            const isImg = doc.data.startsWith('data:image/')
                            return (
                              <div
                                key={idx}
                                className={`rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${isImg ? 'h-10 w-14' : 'h-10 w-10 flex items-center justify-center bg-red-50 dark:bg-red-950'}`}
                                onClick={(e) => { e.stopPropagation(); handlePreview(doc.data, doc.name) }}
                              >
                                {isImg ? (
                                  <img src={doc.data} alt={doc.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            )
                          })}
                          {docs.length > 5 && (
                            <div className="h-10 w-14 rounded border flex items-center justify-center bg-muted/50">
                              <span className="text-[10px] text-muted-foreground font-medium">+{docs.length - 5}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Image thumbnails preview */}
                      {hasImages && (
                        <div className="flex gap-1.5 pt-1">
                          {vehicle.numberPlateImage && (
                            <div
                              className="h-10 w-14 rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                              onClick={(e) => { e.stopPropagation(); handlePreview(vehicle.numberPlateImage!, 'Number Plate') }}
                            >
                              <img src={vehicle.numberPlateImage} alt="Plate" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {vehicle.bodyImage && (
                            <div
                              className="h-10 w-14 rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                              onClick={(e) => { e.stopPropagation(); handlePreview(vehicle.bodyImage!, 'Full Body') }}
                            >
                              <img src={vehicle.bodyImage} alt="Body" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {vehicle.images && (() => {
                            try {
                              const gallery = JSON.parse(vehicle.images) as string[]
                              return gallery.slice(0, 3).map((img, idx) => (
                                <div
                                  key={idx}
                                  className="h-10 w-14 rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                  onClick={(e) => { e.stopPropagation(); handlePreview(img, `Photo ${idx + 1}`) }}
                                >
                                  <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))
                            } catch { return null }
                          })()}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Flat {vehicle.flatId}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEdit(vehicle) }}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteClick(vehicle) }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Table */}
      {viewMode === 'table' && (
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate({ to: `/vehicles/${row.original.id}` })}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Car className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No vehicles found</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Register Vehicle
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    filteredVehicles.length
                  )}{' '}
                  of {filteredVehicles.length} vehicles
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}

      {/* ============================================
          CREATE/EDIT VEHICLE DIALOG
          ============================================ */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
        }
      }}>
        {renderFormDialog()}
      </Dialog>

      {/* ============================================
          DELETE VEHICLE DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete vehicle <strong>{selectedVehicle?.vehicleNumber}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          PREVIEW DIALOG (images + PDFs)
          ============================================ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] p-2">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-sm flex items-center gap-2">
              {previewIsPdf ? <FileText className="h-4 w-4" /> : null}
              {previewTitle}
            </DialogTitle>
          </DialogHeader>
          {previewSrc && previewIsPdf ? (
            <div className="w-full rounded-lg overflow-hidden border">
              <iframe
                src={previewSrc}
                className="w-full h-[60vh]"
                title={previewTitle}
              />
            </div>
          ) : previewSrc ? (
            <img
              src={previewSrc}
              alt={previewTitle}
              className="w-full rounded-lg max-h-[60vh] object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
