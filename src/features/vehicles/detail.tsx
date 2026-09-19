import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  Car,
  Bike,
  ArrowLeft,
  Edit,
  Trash2,
  Camera,
  Image as ImageIcon,
  Fuel,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Hash,
  Palette,
  Tag,
  Star,
  Download,
  Maximize2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { orpc } from '@/server/client'
import { DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'

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
const typeConfig: Record<string, { color: string; bg: string; icon: any }> = {
  car: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', icon: Car },
  bike: { color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', icon: Bike },
  scooter: { color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950', icon: Bike },
  bicycle: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', icon: Bike },
  other: { color: 'text-muted-foreground', bg: 'bg-muted', icon: Car },
}

const docTypeLabels: Record<string, string> = {
  rc_copy: 'RC Copy',
  insurance_policy: 'Insurance Policy',
  puc_certificate: 'PUC Certificate',
  fitness_certificate: 'Fitness Certificate',
  tax_receipt: 'Tax Receipt',
  permit: 'Permit',
  loan_documents: 'Loan Documents',
  other: 'Document',
}

// ============================================
// MAIN COMPONENT
// ============================================
export function VehicleDetailPage() {
  const { vehicleId } = useParams({ from: '/_protected/vehicles/$vehicleId' })
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  // Gallery state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  // Fetch vehicle
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const data = await orpc.vehicles.getById({ id: Number(vehicleId) })
        setVehicle(data)
      } catch (error) {
        console.error('Failed to fetch vehicle:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVehicle()
  }, [vehicleId])

  // Parse helpers
  const parseGallery = (v: Vehicle): string[] => {
    try { return v.images ? JSON.parse(v.images) : [] } catch { return [] }
  }
  const parseDocs = (v: Vehicle): UploadedDocument[] => {
    try { return v.documents ? JSON.parse(v.documents) : [] } catch { return [] }
  }

  // All images for gallery (number plate, body, gallery)
  const getAllImages = useCallback((v: Vehicle): string[] => {
    const imgs: string[] = []
    if (v.numberPlateImage) imgs.push(v.numberPlateImage)
    if (v.bodyImage) imgs.push(v.bodyImage)
    imgs.push(...parseGallery(v))
    return imgs
  }, [])

  // Expiry calculations
  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Expired', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', icon: AlertTriangle, days: Math.abs(days) }
    if (days < 30) return { label: `${days} days left`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', icon: Clock, days }
    return { label: `${days} days left`, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', icon: CheckCircle2, days }
  }

  // Lightbox navigation
  const allImages = vehicle ? getAllImages(vehicle) : []
  const docs = vehicle ? parseDocs(vehicle) : []

  const goToPrev = useCallback(() => {
    setLightboxIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))
  }, [allImages.length])

  const goToNext = useCallback(() => {
    setLightboxIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))
  }, [allImages.length])

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, goToPrev, goToNext])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
            <Car className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading vehicle details...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Car className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
          <p className="text-muted-foreground mb-4">The vehicle you're looking for doesn't exist.</p>
          <Button onClick={() => navigate({ to: '/vehicles' })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vehicles
          </Button>
        </div>
      </div>
    )
  }

  const config = typeConfig[vehicle.type] || typeConfig.other
  const TypeIcon = config.icon
  const insuranceStatus = getExpiryStatus(vehicle.insuranceExpiry)
  const rcStatus = getExpiryStatus(vehicle.rcExpiry)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/vehicles' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <TypeIcon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">{vehicle.vehicleNumber}</h1>
            <p className="text-muted-foreground capitalize">{vehicle.type} · Flat {vehicle.flatId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {vehicle.isPrimary && <Badge className="bg-primary"><Shield className="h-3 w-3 mr-1" />Primary</Badge>}
          <Badge variant={vehicle.isActive ? 'default' : 'secondary'} className={vehicle.isActive ? 'bg-green-600' : ''}>
            {vehicle.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* ============================================ */}
      {/* HERO IMAGE SECTION                          */}
      {/* ============================================ */}
      {allImages.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Main hero image */}
            <div
              className="relative h-72 sm:h-96 cursor-pointer group"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
            >
              <img
                src={allImages[0]}
                alt={vehicle.vehicleNumber}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Vehicle number overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white font-mono drop-shadow-lg">{vehicle.vehicleNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {vehicle.type?.toUpperCase()}
                      </Badge>
                      {vehicle.brand && (
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          {vehicle.brand} {vehicle.model || ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(0); setLightboxOpen(true) }}
                  >
                    <Maximize2 className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </div>

              {/* Photo count */}
              {allImages.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-white" />
                  <span className="text-sm text-white font-medium">{allImages.length} photos</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="p-3 bg-muted/30">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      className="relative shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all group/thumb"
                      onClick={() => { setLightboxIndex(idx); setLightboxOpen(true) }}
                    >
                      <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors" />
                      {idx === 0 && (
                        <div className="absolute top-0.5 left-0.5 bg-primary/80 rounded px-1 py-0.5">
                          <span className="text-[8px] text-white font-bold">PLATE</span>
                        </div>
                      )}
                      {idx === 1 && vehicle.numberPlateImage && (
                        <div className="absolute top-0.5 left-0.5 bg-blue-500/80 rounded px-1 py-0.5">
                          <span className="text-[8px] text-white font-bold">BODY</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No images placeholder */}
      {allImages.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                <Camera className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No Photos Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload photos of this vehicle to see them here.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ============================================ */}
        {/* LEFT COLUMN: Vehicle Info                   */}
        {/* ============================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4" /> Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoItem icon={Hash} label="Vehicle Number" value={vehicle.vehicleNumber} className="font-mono font-bold" />
                <InfoItem icon={Tag} label="Type" value={vehicle.type} className="capitalize" />
                <InfoItem icon={Palette} label="Color" value={vehicle.color} />
                <InfoItem icon={Car} label="Brand" value={vehicle.brand} />
                <InfoItem icon={Car} label="Model" value={vehicle.model} />
                <InfoItem icon={Calendar} label="Year" value={vehicle.yearOfManufacture?.toString()} />
                <InfoItem icon={Fuel} label="Fuel Type" value={vehicle.fuelType} className="capitalize" />
                <InfoItem icon={MapPin} label="Flat" value={`Flat ${vehicle.flatId}`} />
                <InfoItem icon={Calendar} label="Registered" value={vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} />
              </div>
            </CardContent>
          </Card>

          {/* Gallery Grid */}
          {allImages.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Photo Gallery ({allImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allImages.map((img, idx) => {
                    let label = `Photo ${idx + 1}`
                    if (idx === 0 && vehicle.numberPlateImage) label = 'Number Plate'
                    else if ((idx === 1 || (idx === 0 && !vehicle.numberPlateImage)) && vehicle.bodyImage) label = 'Full Body'
                    else if (vehicle.numberPlateImage && vehicle.bodyImage && idx >= 2) label = `Gallery ${idx - 1}`
                    else if ((vehicle.numberPlateImage || vehicle.bodyImage) && idx >= 1) label = `Gallery ${idx}`

                    return (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
                        onClick={() => { setLightboxIndex(idx); setLightboxOpen(true) }}
                      >
                        <img src={img} alt={label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="text-xs text-white font-medium">{label}</p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 rounded-full p-1.5">
                            <Eye className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ============================================ */}
        {/* RIGHT COLUMN: Expiry & Documents            */}
        {/* ============================================ */}
        <div className="space-y-6">
          {/* Expiry Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" /> Expiry Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Insurance */}
              <div className={`p-3 rounded-lg ${insuranceStatus?.bg || 'bg-muted/50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Insurance</span>
                  {insuranceStatus ? (
                    <div className={`flex items-center gap-1 ${insuranceStatus.color}`}>
                      <insuranceStatus.icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{insuranceStatus.label}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Not set</Badge>
                  )}
                </div>
                {vehicle.insuranceExpiry && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(vehicle.insuranceExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* RC */}
              <div className={`p-3 rounded-lg ${rcStatus?.bg || 'bg-muted/50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">RC (Registration)</span>
                  {rcStatus ? (
                    <div className={`flex items-center gap-1 ${rcStatus.color}`}>
                      <rcStatus.icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{rcStatus.label}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Not set</Badge>
                  )}
                </div>
                {vehicle.rcExpiry && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(vehicle.rcExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Documents
                {docs.length > 0 && <Badge variant="secondary" className="text-[10px] ml-auto">{docs.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc, idx) => {
                    const isImg = doc.data.startsWith('data:image/') || doc.data.includes('cloudinary.com') || doc.data.startsWith('http')
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }}
                      >
                        {isImg ? (
                          <div className="h-12 w-16 rounded-lg overflow-hidden border shrink-0">
                            <img src={doc.data} alt={doc.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-red-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {docTypeLabels[doc.type] || doc.type}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" /> Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={vehicle.isActive ? 'default' : 'secondary'} className={vehicle.isActive ? 'bg-green-600' : ''}>
                  {vehicle.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Vehicle</span>
                <span className="font-medium">{vehicle.isPrimary ? 'Yes' : 'No'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photos</span>
                <span className="font-medium">{allImages.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-medium">{docs.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* LIGHTBOX                                    */}
      {/* ============================================ */}
      {lightboxOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/10 z-50"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Counter */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 z-50">
            <span className="text-sm text-white font-medium">{lightboxIndex + 1} / {allImages.length}</span>
          </div>

          {/* Navigation arrows */}
          {allImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 h-12 w-12 text-white hover:bg-white/10 z-50"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 h-12 w-12 text-white hover:bg-white/10 z-50"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <img
            src={allImages[lightboxIndex]}
            alt={`${vehicle.vehicleNumber} - Photo ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />

          {/* Thumbnail strip at bottom */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-sm rounded-xl p-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`w-12 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === lightboxIndex ? 'border-primary scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Preview Dialog */}
      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />
    </div>
  )
}

// ============================================
// INFO ITEM COMPONENT
// ============================================
function InfoItem({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: any
  label: string
  value?: string
  className?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-sm ${className || ''}`}>{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  )
}
