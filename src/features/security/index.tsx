import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Cctv, Shield, Camera, Eye, EyeOff, Settings, Plus, Search,
  Loader2, X, CheckCircle2, XCircle, AlertTriangle, Wrench,
  HardDrive, Database, Zap, Wifi, WifiOff, MapPin, Building2,
  Grid3X3, List, BarChart3, Clock, Calendar, DollarSign,
  ChevronDown, ChevronRight, Trash2, Pencil, Info, Maximize2,
  Minimize2, Download, RefreshCw, Server, Monitor, Play,
  Lock, Unlock, ScanLine, Activity, CircleDot, Disc,
  Gauge, Thermometer, Milestone, Cloud, CloudOff,
  Image as ImageIcon, FileText, Edit, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { orpc } from '@/server/client'
import { ImageUploadZone, ImageGallery, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'

// ============================================
// TYPES
// ============================================
interface Camera {
  id: number; societyId: number; cameraName: string; cameraCode?: string; zone?: string
  location?: string; locationDetail?: string; towerId?: number; gateId?: number; floor?: string
  brand?: string; model?: string; type?: string; resolution?: string; fieldOfView?: number
  nightVision?: boolean; hasAudio?: boolean; hasStorage?: boolean
  nvrName?: string; nvrChannel?: number; storageDays?: number; storageSizeGb?: number; bitrate?: number
  ipAddress?: string; macAddress?: string; streamUrl?: string
  coverageArea?: string; coverageRadius?: number; installationHeight?: string
  status?: string; lastMaintenance?: string; nextMaintenance?: string; warrantyExpiry?: string; installDate?: string
  purchaseCost?: number; monthlyAmc?: number
  profileImage?: string; installationImage?: string; images?: string; documents?: string; notes?: string
  isActive?: boolean; createdAt?: string
}

interface CameraZone {
  id: number; societyId: number; name: string; description?: string; color?: string
  totalCameras?: number; onlineCameras?: number; totalStorageDays?: number
  mapPoints?: string; mapCenterLat?: string; mapCenterLng?: string; mapZoom?: number
  isActive?: boolean; createdAt?: string
}

interface NvrServer {
  id: number; societyId: number; name: string; brand?: string; model?: string; type?: string
  totalChannels?: number; usedChannels?: number; totalStorageGb?: number; usedStorageGb?: number
  raidConfig?: string; estimatedDays?: number
  ipAddress?: string; port?: number; username?: string; accessUrl?: string
  status?: string; lastBackup?: string; firmwareVersion?: string
  purchaseCost?: string; purchaseDate?: string; warrantyExpiry?: string
  images?: string; documents?: string; notes?: string
  isActive?: boolean; createdAt?: string
}

interface Summary {
  total: number; online: number; offline: number; faulty: number; maintenance: number
  avgStorageDays: number; zones: number; totalMonthlyAmc: number; totalPurchaseCost: number; expiringWarranty: number
}

// ============================================
// CONSTANTS
// ============================================
const cameraTypes = [
  { value: 'dome', label: 'Dome', icon: Camera },
  { value: 'bullet', label: 'Bullet', icon: Camera },
  { value: 'ptz', label: 'PTZ', icon: ScanLine },
  { value: 'cctv', label: 'CCTV', icon: Cctv },
  { value: 'ip', label: 'IP Camera', icon: Wifi },
  { value: 'wireless', label: 'Wireless', icon: Cloud },
  { value: 'thermal', label: 'Thermal', icon: Thermometer },
  { value: 'panoramic', label: 'Panoramic', icon: Maximize2 },
]

const resolutions = ['480p', '720p', '1080p', '2K', '3MP', '5MP', '4K', '8MP']

const statusColors: Record<string, string> = {
  online: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  offline: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  faulty: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
}

const zoneColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// ============================================
// STORAGE CALCULATOR
// ============================================
function StorageCalculator({ cameraCount }: { cameraCount: number }) {
  const [resolution, setResolution] = useState('1080p')
  const [bitrate, setBitrate] = useState('8')
  const [totalStorage, setTotalStorage] = useState(4000)
  const [hoursPerDay, setHoursPerDay] = useState(24)

  const result = useMemo(() => {
    const bitrateMbps = Number(bitrate)
    const mbPerSec = bitrateMbps / 8
    const mbPerCamDay = mbPerSec * 3600 * hoursPerDay
    const gbPerDayTotal = (mbPerCamDay * cameraCount) / 1024
    const days = gbPerDayTotal > 0 ? Math.floor(totalStorage / gbPerDayTotal) : 999
    return {
      mbPerCamDay: Math.round(mbPerCamDay),
      gbPerDay: Math.round(gbPerDayTotal * 10) / 10,
      days: Math.min(days, 365),
      tbPerMonth: Math.round((gbPerDayTotal * 30) / 1024 * 10) / 10,
    }
  }, [resolution, bitrate, totalStorage, hoursPerDay, cameraCount])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage Capacity Calculator</CardTitle>
        <CardDescription>Estimate recording duration based on camera configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Resolution</Label>
            <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={resolution} onChange={(e) => { setResolution(e.target.value); setBitrate(String({ '480p': 2, '720p': 4, '1080p': 8, '2K': 12, '3MP': 6, '5MP': 10, '4K': 20, '8MP': 16 }[e.target.value] || 8)) }}>
              {resolutions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Bitrate (Mbps)</Label>
            <Input type="number" value={bitrate} onChange={(e) => setBitrate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Total Storage (GB)</Label>
            <Input type="number" value={totalStorage} onChange={(e) => setTotalStorage(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Recording Hours/Day</Label>
            <Input type="number" min={1} max={24} value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} />
          </div>
        </div>

        {/* Results */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{result.days}</p>
              <p className="text-xs text-muted-foreground">Days of Recording</p>
              <div className={`mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${result.days >= 30 ? 'bg-green-100 text-green-700' : result.days >= 14 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {result.days >= 30 ? '✓ Good' : result.days >= 14 ? '⚠ Low' : '✗ Critical'}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold">{result.gbPerDay}</p>
              <p className="text-xs text-muted-foreground">GB per Day</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{cameraCount}</p>
              <p className="text-xs text-muted-foreground">Cameras</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{result.tbPerMonth}</p>
              <p className="text-xs text-muted-foreground">TB per Month</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Per camera: {(result.mbPerCamDay / 1024).toFixed(1)} GB/day</span>
            <span>•</span>
            <span>{resolution} @ {bitrate} Mbps</span>
            <span>•</span>
            <span>{hoursPerDay}h recording/day</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('live')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Data
  const [cameras, setCameras] = useState<Camera[]>([])
  const [zones, setZones] = useState<CameraZone[]>([])
  const [nvrServers, setNvrServers] = useState<NvrServer[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialogs
  const [createCameraOpen, setCreateCameraOpen] = useState(false)
  const [editCameraTarget, setEditCameraTarget] = useState<Camera | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Camera | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [createZoneOpen, setCreateZoneOpen] = useState(false)
  const [createNvrOpen, setCreateNvrOpen] = useState(false)
  const [editNvrTarget, setEditNvrTarget] = useState<NvrServer | null>(null)
  const [docPreview, setDocPreview] = useState<{ url: string; name: string } | null>(null)
  const [cameraDetail, setCameraDetail] = useState<Camera | null>(null)
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null)
  const [liveGridLayout, setLiveGridLayout] = useState<1 | 2 | 3 | 4>(2)
  const [liveZoneFilter, setLiveZoneFilter] = useState('all')

  // Forms
  const [cameraForm, setCameraForm] = useState<Partial<Camera>>({
    cameraName: '', cameraCode: '', zone: '', location: '', locationDetail: '',
    brand: '', model: '', type: 'dome', resolution: '1080p',
    fieldOfView: 90, nightVision: false, hasAudio: false,
    nvrName: '', nvrChannel: 0, storageDays: 30, storageSizeGb: 1000,
    ipAddress: '', streamUrl: '', coverageArea: '', coverageRadius: 10,
    installationHeight: '3m', status: 'online', purchaseCost: 0, monthlyAmc: 0,
    notes: '',
  })
  const [nvrForm, setNvrForm] = useState({
    name: '', brand: '', model: '', type: 'nvr', totalChannels: 16, usedChannels: 0,
    totalStorageGb: 4000, usedStorageGb: 0, raidConfig: '', estimatedDays: 30,
    ipAddress: '', port: 80, username: '', accessUrl: '', status: 'online',
    firmwareVersion: '', notes: '',
  })
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', color: '#3b82f6' })

  const [submitting, setSubmitting] = useState(false)

  const refreshAll = useCallback(async () => {
    try {
      const [camData, zoneData, nvrData, sumData] = await Promise.all([
        orpc.securityCameras.list({ societyId: 1 }),
        orpc.cameraZones.list({ societyId: 1 }),
        orpc.nvrServers.list({ societyId: 1 }),
        orpc.securityCameras.summary({ societyId: 1 }),
      ])
      setCameras(camData as Camera[])
      setZones(zoneData as CameraZone[])
      setNvrServers(nvrData as NvrServer[])
      setSummary(sumData as Summary)
    } catch (error) {
      console.error('Failed to fetch security data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshAll() }, [refreshAll])

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter(c => {
      const matchesSearch = !search || c.cameraName.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase()) || c.cameraCode?.toLowerCase().includes(search.toLowerCase())
      const matchesZone = zoneFilter === 'all' || c.zone === zoneFilter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesZone && matchesStatus
    })
  }, [cameras, search, zoneFilter, statusFilter])

  // Create camera
  const handleCreateCamera = async () => {
    if (!cameraForm.cameraName) return
    setSubmitting(true)
    try {
      await orpc.securityCameras.create({ societyId: 1, ...cameraForm } as any)
      setCreateCameraOpen(false)
      refreshAll()
    } catch (error) {
      console.error('Failed to create camera:', error)
    } finally { setSubmitting(false) }
  }

  // Update camera
  const handleUpdateCamera = async () => {
    if (!editCameraTarget) return
    setSubmitting(true)
    try {
      await orpc.securityCameras.update({ id: editCameraTarget.id, data: cameraForm as any })
      setEditCameraTarget(null)
      refreshAll()
    } catch (error) {
      console.error('Failed to update camera:', error)
    } finally { setSubmitting(false) }
  }

  // Delete camera
  const handleDeleteCamera = async () => {
    if (!deleteTarget) return
    try {
      await orpc.securityCameras.delete({ id: deleteTarget.id })
      setDeleteOpen(false)
      setDeleteTarget(null)
      refreshAll()
    } catch (error) {
      console.error('Failed to delete camera:', error)
    }
  }

  // Create NVR
  const handleCreateNvr = async () => {
    if (!nvrForm.name) return
    setSubmitting(true)
    try {
      await orpc.nvrServers.create({ societyId: 1, ...nvrForm })
      setCreateNvrOpen(false)
      refreshAll()
    } catch (error) {
      console.error('Failed to create NVR:', error)
    } finally { setSubmitting(false) }
  }

  // Create zone
  const handleCreateZone = async () => {
    if (!zoneForm.name) return
    setSubmitting(true)
    try {
      await orpc.cameraZones.create({ societyId: 1, ...zoneForm })
      setCreateZoneOpen(false)
      setZoneForm({ name: '', description: '', color: '#3b82f6' })
      refreshAll()
    } catch (error) {
      console.error('Failed to create zone:', error)
    } finally { setSubmitting(false) }
  }

  const resetCameraForm = () => setCameraForm({
    cameraName: '', cameraCode: '', zone: '', location: '', locationDetail: '',
    brand: '', model: '', type: 'dome', resolution: '1080p',
    fieldOfView: 90, nightVision: false, hasAudio: false,
    nvrName: '', nvrChannel: 0, storageDays: 30, storageSizeGb: 1000,
    ipAddress: '', streamUrl: '', coverageArea: '', coverageRadius: 10,
    installationHeight: '3m', status: 'online', purchaseCost: 0, monthlyAmc: 0,
    notes: '',
  })

  const openEditCamera = (cam: Camera) => {
    setCameraForm({
      cameraName: cam.cameraName, cameraCode: cam.cameraCode || '', zone: cam.zone || '',
      location: cam.location || '', locationDetail: cam.locationDetail || '',
      brand: cam.brand || '', model: cam.model || '', type: cam.type || 'dome',
      resolution: cam.resolution || '1080p', fieldOfView: cam.fieldOfView || 90,
      nightVision: cam.nightVision || false, hasAudio: cam.hasAudio || false,
      nvrName: cam.nvrName || '', nvrChannel: cam.nvrChannel || 0,
      storageDays: cam.storageDays || 30, storageSizeGb: cam.storageSizeGb || 1000,
      ipAddress: cam.ipAddress || '', streamUrl: cam.streamUrl || '',
      coverageArea: cam.coverageArea || '', coverageRadius: cam.coverageRadius || 10,
      installationHeight: cam.installationHeight || '3m', status: cam.status || 'online',
      purchaseCost: Number(cam.purchaseCost) || 0, monthlyAmc: Number(cam.monthlyAmc) || 0,
      notes: cam.notes || '',
    })
    setEditCameraTarget(cam)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>

  const uniqueZones = [...new Set(cameras.map(c => c.zone).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Cctv className="h-5 w-5 text-primary" /></div>
            Security & CCTV Management
          </h1>
          <p className="text-muted-foreground">Camera installations, coverage zones, NVR storage & monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
            {viewMode === 'grid' ? <List className="mr-1 h-3 w-3" /> : <Grid3X3 className="mr-1 h-3 w-3" />}
            {viewMode === 'grid' ? 'Table' : 'Grid'}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
          <Button size="sm" onClick={() => { resetCameraForm(); setCreateCameraOpen(true) }}>
            <Plus className="mr-1 h-3 w-3" /> Add Camera
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><Cctv className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground">Total Cameras</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold text-green-600">{summary.online}</p><p className="text-xs text-muted-foreground">Online</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950"><XCircle className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-2xl font-bold text-red-600">{summary.offline + summary.faulty}</p><p className="text-xs text-muted-foreground">Offline/Faulty</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950"><HardDrive className="h-5 w-5 text-purple-600" /></div>
                <div><p className="text-2xl font-bold">{summary.avgStorageDays}d</p><p className="text-xs text-muted-foreground">Avg Storage</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950"><DollarSign className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-2xl font-bold">₹{summary.totalMonthlyAmc.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Monthly AMC</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="live">🔴 Live View</TabsTrigger>
          <TabsTrigger value="cameras">Cameras ({cameras.length})</TabsTrigger>
          <TabsTrigger value="zones">Zones ({zones.length})</TabsTrigger>
          <TabsTrigger value="nvr">NVR ({nvrServers.length})</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* ================================ */}
        {/* LIVE VIEW TAB                   */}
        {/* ================================ */}
        <TabsContent value="live" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Layout:</span>
                {([1, 2, 3, 4] as const).map(n => (
                  <Button key={n} variant={liveGridLayout === n ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setLiveGridLayout(n)}>
                    {n}×{n}
                  </Button>
                ))}
                <Separator orientation="vertical" className="h-6 mx-1" />
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={liveZoneFilter} onChange={(e) => setLiveZoneFilter(e.target.value)}>
                  <option value="all">All Zones</option>
                  {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> {cameras.filter(c => c.status === 'online').length} online</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {cameras.filter(c => c.status === 'offline' || c.status === 'faulty').length} offline</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camera Grid */}
          {(() => {
            const liveCameras = cameras.filter(c => {
              const matchesZone = liveZoneFilter === 'all' || c.zone === liveZoneFilter
              return matchesZone && c.status !== 'faulty'
            })

            if (liveCameras.length === 0) {
              return (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Cctv className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No cameras available for live view</p>
                    <p className="text-xs text-muted-foreground mt-1">Add cameras with stream URLs to see live feeds</p>
                  </CardContent>
                </Card>
              )
            }

            return (
              <div className={`grid gap-3 ${
                liveGridLayout === 1 ? 'grid-cols-1' :
                liveGridLayout === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                liveGridLayout === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {liveCameras.map(cam => (
                  <div key={cam.id} className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all">
                    {/* Stream Area */}
                    <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-950">
                      {cam.streamUrl ? (
                        cam.streamUrl.match(/\.m3u8|\.mp4|\.webm/) ? (
                          <video
                            src={cam.streamUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : cam.streamUrl.match(/^https?:\/\//) ? (
                          <iframe
                            src={cam.streamUrl}
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media"
                            sandbox="allow-scripts allow-same-origin"
                            title={cam.cameraName}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Cctv className="h-12 w-12 text-slate-600/40 mx-auto mb-2" />
                              <p className="text-xs text-slate-500 font-mono">{cam.streamUrl}</p>
                              <p className="text-[10px] text-slate-600 mt-1">RTSP stream — use VLC or NVR client</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Cctv className="h-12 w-12 text-slate-600/40 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">No stream configured</p>
                          </div>
                        </div>
                      )}

                      {/* Overlay: Camera Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm font-semibold">{cam.cameraName}</p>
                              <p className="text-white/70 text-[10px] flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {cam.location || cam.zone || 'Unknown'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-white hover:bg-white/20" onClick={() => setFullscreenCamera(cam)} title="Fullscreen">
                                <Maximize2 className="h-3.5 w-3.5" />
                              </Button>
                              {cam.streamUrl && (
                                <a href={cam.streamUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-white hover:bg-white/20" title="Open stream">
                                    <Play className="h-3.5 w-3.5" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`${statusColors[cam.status || 'online']} text-[10px] gap-1 border-0`}> 
                          <span className={`h-1.5 w-1.5 rounded-full ${cam.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                          {cam.status}
                        </Badge>
                      </div>

                      {/* Camera code */}
                      {cam.cameraCode && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          {cam.cameraCode}
                        </div>
                      )}

                      {/* Resolution */}
                      {cam.resolution && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{cam.resolution}</span>
                        </div>
                      )}
                    </div>

                    {/* Info Bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-t">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-mono">{cam.ipAddress || 'N/A'}</span>
                        {cam.nvrName && <span>· {cam.nvrName}/{cam.nvrChannel}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {cam.nightVision && <span title="Night Vision"><Eye className="h-3 w-3 text-green-500" /></span>}
                        {cam.hasAudio && <span title="Audio"><Zap className="h-3 w-3 text-blue-500" /></span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Fullscreen Dialog */}
          <Dialog open={!!fullscreenCamera} onOpenChange={(open) => !open && setFullscreenCamera(null)}>
            <DialogContent className="max-w-5xl p-0 bg-black border-0">
              {fullscreenCamera && (
                <>
                  <div className="relative aspect-video bg-black">
                    {fullscreenCamera.streamUrl ? (
                      fullscreenCamera.streamUrl.match(/\.m3u8|\.mp4|\.webm/) ? (
                        <video src={fullscreenCamera.streamUrl} className="w-full h-full object-contain" autoPlay muted loop playsInline />
                      ) : fullscreenCamera.streamUrl.match(/^https?:\/\//) ? (
                        <iframe src={fullscreenCamera.streamUrl} className="w-full h-full border-0" allow="autoplay" sandbox="allow-scripts allow-same-origin" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Cctv className="h-20 w-20 text-slate-600/40 mx-auto mb-3" />
                            <p className="text-white/60 font-mono text-sm">{fullscreenCamera.streamUrl}</p>
                            <p className="text-white/40 text-xs mt-2">Copy this URL to VLC or your NVR client</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Cctv className="h-20 w-20 text-slate-600/40" />
                      </div>
                    )}
                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{fullscreenCamera.cameraName}</p>
                          <p className="text-white/60 text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> {fullscreenCamera.location || fullscreenCamera.zone}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span className="font-mono">{fullscreenCamera.ipAddress}</span>
                          <Badge className={`${statusColors[fullscreenCamera.status || 'online']} text-[10px] border-0`}>{fullscreenCamera.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ================================ */}
        {/* CAMERAS TAB                     */}
        {/* ================================ */}
        <TabsContent value="cameras" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search cameras..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
                  <option value="all">All Zones</option>
                  {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="faulty">Faulty</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Camera Grid */}
          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCameras.map(cam => {
                const typeConfig = cameraTypes.find(t => t.value === cam.type)
                const TypeIcon = typeConfig?.icon || Camera
                return (
                  <Card key={cam.id} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => setCameraDetail(cam)}>
                    {/* Camera Image Header */}
                    <div className="relative h-36 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                      {cam.installationImage ? (
                        <img src={cam.installationImage} alt="" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Cctv className="h-16 w-16 text-slate-600/30" />
                        </div>
                      )}
                      {/* Status indicator */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`${statusColors[cam.status || 'online']} text-[10px] gap-1`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cam.status === 'online' ? 'bg-green-500 animate-pulse' : cam.status === 'offline' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {cam.status || 'unknown'}
                        </Badge>
                      </div>
                      {/* Camera code */}
                      {cam.cameraCode && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          {cam.cameraCode}
                        </div>
                      )}
                      {/* Type badge */}
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                          <TypeIcon className="h-3 w-3 mr-1" />{typeConfig?.label || cam.type}
                        </Badge>
                      </div>
                      {/* Resolution */}
                      {cam.resolution && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {cam.resolution}
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Name + Zone */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{cam.cameraName}</p>
                          {cam.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{cam.location}</p>}
                        </div>
                        {cam.zone && <Badge variant="outline" className="text-[10px]">{cam.zone}</Badge>}
                      </div>

                      {/* Specs Row */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                        {cam.brand && <Badge variant="secondary" className="text-[10px]">{cam.brand}</Badge>}
                        {cam.model && <Badge variant="secondary" className="text-[10px]">{cam.model}</Badge>}
                        {cam.nightVision && <Badge variant="secondary" className="text-[10px] text-green-600"><Eye className="h-2.5 w-2.5 mr-0.5" />Night</Badge>}
                        {cam.hasAudio && <Badge variant="secondary" className="text-[10px]"><Zap className="h-2.5 w-2.5 mr-0.5" />Audio</Badge>}
                      </div>

                      {/* Storage + IP */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <HardDrive className="h-3 w-3" />
                          <span>{cam.storageDays || 0}d · {cam.storageSizeGb || 0}GB</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Wifi className="h-3 w-3" />
                          <span className="font-mono text-[10px]">{cam.ipAddress || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Coverage + FOV */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>FOV: {cam.fieldOfView || 0}°</span>
                        <span>R: {cam.coverageRadius || 0}m</span>
                        <span>H: {cam.installationHeight || '-'}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 pt-1 border-t">
                        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={(e) => { e.stopPropagation(); openEditCamera(cam) }}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        {cam.streamUrl && (
                          <a href={cam.streamUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs"><Play className="h-3 w-3 mr-1" />Live</Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(cam); setDeleteOpen(true) }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            /* Table View */
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Camera</th>
                        <th className="px-3 py-2 text-left font-medium">Zone</th>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-left font-medium">Resolution</th>
                        <th className="px-3 py-2 text-left font-medium">Storage</th>
                        <th className="px-3 py-2 text-left font-medium">NVR/Ch</th>
                        <th className="px-3 py-2 text-left font-medium">IP</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCameras.map(cam => (
                        <tr key={cam.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setCameraDetail(cam)}>
                          <td className="px-3 py-2">
                            <div className="font-medium">{cam.cameraName}</div>
                            {cam.cameraCode && <div className="text-xs text-muted-foreground font-mono">{cam.cameraCode}</div>}
                          </td>
                          <td className="px-3 py-2 text-xs">{cam.zone || '-'}</td>
                          <td className="px-3 py-2 text-xs capitalize">{cam.type || 'dome'}</td>
                          <td className="px-3 py-2 text-xs">{cam.resolution || '-'}</td>
                          <td className="px-3 py-2 text-xs">{cam.storageDays || 0}d / {cam.storageSizeGb || 0}GB</td>
                          <td className="px-3 py-2 text-xs">{cam.nvrName || '-'} {cam.nvrChannel ? `/ ${cam.nvrChannel}` : ''}</td>
                          <td className="px-3 py-2 text-xs font-mono">{cam.ipAddress || '-'}</td>
                          <td className="px-3 py-2"><Badge className={`${statusColors[cam.status || 'online']} text-[10px]`}>{cam.status}</Badge></td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEditCamera(cam) }}><Edit className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(cam); setDeleteOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ================================ */}
        {/* ZONES TAB                       */}
        {/* ================================ */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Coverage Zones</h3>
            <Button size="sm" onClick={() => { setZoneForm({ name: '', description: '', color: '#3b82f6' }); setCreateZoneOpen(true) }}>
              <Plus className="mr-1 h-3 w-3" /> Add Zone
            </Button>
          </div>

          {zones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No coverage zones defined yet</p>
                <p className="text-xs text-muted-foreground">Zones help organize cameras by area (e.g., Tower A, Parking, Gate)</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {zones.map(zone => {
                const zoneCameras = cameras.filter(c => c.zone === zone.name)
                const onlineCount = zoneCameras.filter(c => c.status === 'online').length
                const avgStorage = zoneCameras.reduce((s, c) => s + (c.storageDays || 0), 0) / (zoneCameras.length || 1)
                return (
                  <Card key={zone.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-1 rounded-full shrink-0" style={{ backgroundColor: zone.color || '#3b82f6' }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{zone.name}</h4>
                            <Badge variant="outline" className="text-[10px]">{zoneCameras.length} cameras</Badge>
                          </div>
                          {zone.description && <p className="text-xs text-muted-foreground mb-2">{zone.description}</p>}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded bg-muted/50 p-2">
                              <p className="text-lg font-bold">{zoneCameras.length}</p>
                              <p className="text-[10px] text-muted-foreground">Total</p>
                            </div>
                            <div className="rounded bg-green-50 dark:bg-green-950 p-2">
                              <p className="text-lg font-bold text-green-600">{onlineCount}</p>
                              <p className="text-[10px] text-muted-foreground">Online</p>
                            </div>
                            <div className="rounded bg-purple-50 dark:bg-purple-950 p-2">
                              <p className="text-lg font-bold text-purple-600">{Math.round(avgStorage)}d</p>
                              <p className="text-[10px] text-muted-foreground">Storage</p>
                            </div>
                          </div>
                          {/* Camera list */}
                          <div className="mt-3 space-y-1">
                            {zoneCameras.slice(0, 3).map(c => (
                              <div key={c.id} className="flex items-center gap-2 text-xs">
                                <span className={`h-2 w-2 rounded-full ${c.status === 'online' ? 'bg-green-500' : c.status === 'offline' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <span className="text-muted-foreground">{c.cameraName}</span>
                                <span className="text-[10px] text-muted-foreground font-mono ml-auto">{c.ipAddress || ''}</span>
                              </div>
                            ))}
                            {zoneCameras.length > 3 && <p className="text-[10px] text-muted-foreground">+{zoneCameras.length - 3} more</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ================================ */}
        {/* NVR / STORAGE TAB               */}
        {/* ================================ */}
        <TabsContent value="nvr" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">NVR / DVR Servers</h3>
            <Button size="sm" onClick={() => setCreateNvrOpen(true)}>
              <Plus className="mr-1 h-3 w-3" /> Add NVR
            </Button>
          </div>

          {nvrServers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Server className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No NVR/DVR servers configured</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {nvrServers.map(nvr => {
                const storageUsedPct = nvr.totalStorageGb ? Math.round(((nvr.usedStorageGb || 0) / nvr.totalStorageGb) * 100) : 0
                const channelPct = nvr.totalChannels ? Math.round(((nvr.usedChannels || 0) / nvr.totalChannels) * 100) : 0
                const nvrCameras = cameras.filter(c => c.nvrName === nvr.name)
                return (
                  <Card key={nvr.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <Server className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{nvr.name}</p>
                            <p className="text-xs text-muted-foreground">{nvr.brand} {nvr.model} · {nvr.type?.toUpperCase()}</p>
                          </div>
                        </div>
                        <Badge className={`${statusColors[nvr.status || 'online']} text-[10px]`}>{nvr.status}</Badge>
                      </div>

                      {/* Channel Usage */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Channels</span>
                          <span className="font-medium">{nvr.usedChannels || 0}/{nvr.totalChannels} ({channelPct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${channelPct}%` }} />
                        </div>
                      </div>

                      {/* Storage Usage */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Storage</span>
                          <span className="font-medium">{nvr.usedStorageGb || 0}/{nvr.totalStorageGb} GB ({storageUsedPct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${storageUsedPct > 90 ? 'bg-red-500' : storageUsedPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${storageUsedPct}%` }} />
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <HardDrive className="h-3 w-3" /> Est. {nvr.estimatedDays || 0} days
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Wifi className="h-3 w-3" />
                          <span className="font-mono text-[10px]">{nvr.ipAddress || 'N/A'}</span>
                        </div>
                        {nvr.raidConfig && <div className="text-muted-foreground">RAID: {nvr.raidConfig}</div>}
                        {nvr.firmwareVersion && <div className="text-muted-foreground">FW: {nvr.firmwareVersion}</div>}
                      </div>

                      {/* Linked cameras */}
                      {nvrCameras.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-[10px] text-muted-foreground mb-1">Linked Cameras ({nvrCameras.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {nvrCameras.slice(0, 6).map(c => (
                              <Badge key={c.id} variant="outline" className="text-[10px]">
                                <span className={`h-1.5 w-1.5 rounded-full mr-1 ${c.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                {c.cameraName}
                              </Badge>
                            ))}
                            {nvrCameras.length > 6 && <Badge variant="outline" className="text-[10px]">+{nvrCameras.length - 6}</Badge>}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-1">
                        {nvr.accessUrl && (
                          <a href={nvr.accessUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-7 text-xs"><ExternalLink className="h-3 w-3 mr-1" /> Access</Button>
                          </a>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setNvrForm({ ...nvrForm, name: nvr.name, brand: nvr.brand || '', model: nvr.model || '', totalChannels: nvr.totalChannels || 16, usedChannels: nvr.usedChannels || 0, totalStorageGb: nvr.totalStorageGb || 4000, usedStorageGb: nvr.usedStorageGb || 0 }); setEditNvrTarget(nvr) }}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ================================ */}
        {/* STORAGE CALCULATOR TAB          */}
        {/* ================================ */}
        <TabsContent value="calculator" className="space-y-4">
          <StorageCalculator cameraCount={cameras.length} />

          {/* Storage tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" /> Storage Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">🎯 Motion-Only Recording</p>
                  <p className="text-xs text-muted-foreground">Records only when motion is detected. Saves 60-80% storage vs continuous recording.</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">📉 Variable Bitrate (VBR)</p>
                  <p className="text-xs text-muted-foreground">Lower bitrate during static scenes. Can reduce storage by 30% with minimal quality loss.</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">⏰ Schedule Recording</p>
                  <p className="text-xs text-muted-foreground">Record high-res during peak hours, low-res or motion-only at night.</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">💾 H.265+ Codec</p>
                  <p className="text-xs text-muted-foreground">Uses 50% less storage than H.264 at same quality. Requires compatible cameras.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================ */}
        {/* EVENTS TAB                      */}
        {/* ================================ */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Camera Event Log</CardTitle>
              <CardDescription>Motion detection, alerts, and camera activity events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Events will appear here once cameras report activity</p>
                <p className="text-xs text-muted-foreground mt-1">Motion detection, tampering alerts, and offline notifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* CAMERA DETAIL DIALOG                        */}
      {/* ============================================ */}
      <Dialog open={!!cameraDetail} onOpenChange={(o) => { if (!o) setCameraDetail(null) }}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          {cameraDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Cctv className="h-5 w-5" /> {cameraDetail.cameraName}
                  <Badge className={`${statusColors[cameraDetail.status || 'online']} text-[10px]`}>{cameraDetail.status}</Badge>
                </DialogTitle>
                {cameraDetail.cameraCode && <DialogDescription>Code: {cameraDetail.cameraCode}</DialogDescription>}
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Installation Image */}
                {cameraDetail.installationImage && (
                  <div className="rounded-lg overflow-hidden aspect-video bg-muted">
                    <img src={cameraDetail.installationImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Location */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {cameraDetail.location && <div><p className="text-muted-foreground">Location</p><p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{cameraDetail.location}</p></div>}
                  {cameraDetail.zone && <div><p className="text-muted-foreground">Zone</p><p className="font-medium">{cameraDetail.zone}</p></div>}
                  {cameraDetail.floor && <div><p className="text-muted-foreground">Floor</p><p className="font-medium">{cameraDetail.floor}</p></div>}
                  {cameraDetail.installationHeight && <div><p className="text-muted-foreground">Mount Height</p><p className="font-medium">{cameraDetail.installationHeight}</p></div>}
                </div>

                <Separator />

                {/* Camera Specs */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Type</p><p className="font-medium capitalize">{cameraDetail.type || 'dome'}</p></div>
                  <div><p className="text-muted-foreground">Brand</p><p className="font-medium">{cameraDetail.brand || '-'}</p></div>
                  <div><p className="text-muted-foreground">Model</p><p className="font-medium">{cameraDetail.model || '-'}</p></div>
                  <div><p className="text-muted-foreground">Resolution</p><p className="font-medium">{cameraDetail.resolution || '-'}</p></div>
                  <div><p className="text-muted-foreground">FOV</p><p className="font-medium">{cameraDetail.fieldOfView || 0}°</p></div>
                  <div><p className="text-muted-foreground">Coverage</p><p className="font-medium">{cameraDetail.coverageRadius || 0}m</p></div>
                </div>

                <div className="flex gap-2">
                  {cameraDetail.nightVision && <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Night Vision</Badge>}
                  {cameraDetail.hasAudio && <Badge variant="secondary"><Zap className="h-3 w-3 mr-1" />Audio</Badge>}
                </div>

                <Separator />

                {/* Network & Storage */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground">IP Address</p><p className="font-medium font-mono">{cameraDetail.ipAddress || '-'}</p></div>
                  <div><p className="text-muted-foreground">NVR / Channel</p><p className="font-medium">{cameraDetail.nvrName || '-'} {cameraDetail.nvrChannel ? `/ ${cameraDetail.nvrChannel}` : ''}</p></div>
                  <div><p className="text-muted-foreground">Storage Days</p><p className="font-medium">{cameraDetail.storageDays || 0} days</p></div>
                  <div><p className="text-muted-foreground">Storage Size</p><p className="font-medium">{cameraDetail.storageSizeGb || 0} GB</p></div>
                </div>

                {/* Cost */}
                {(Number(cameraDetail.purchaseCost) > 0 || Number(cameraDetail.monthlyAmc) > 0) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Number(cameraDetail.purchaseCost) > 0 && <div><p className="text-muted-foreground">Purchase Cost</p><p className="font-medium">₹{Number(cameraDetail.purchaseCost).toLocaleString('en-IN')}</p></div>}
                      {Number(cameraDetail.monthlyAmc) > 0 && <div><p className="text-muted-foreground">Monthly AMC</p><p className="font-medium">₹{Number(cameraDetail.monthlyAmc).toLocaleString('en-IN')}/mo</p></div>}
                      {cameraDetail.warrantyExpiry && <div><p className="text-muted-foreground">Warranty Expiry</p><p className="font-medium">{new Date(cameraDetail.warrantyExpiry).toLocaleDateString()}</p></div>}
                      {cameraDetail.installDate && <div><p className="text-muted-foreground">Install Date</p><p className="font-medium">{new Date(cameraDetail.installDate).toLocaleDateString()}</p></div>}
                    </div>
                  </>
                )}

                {/* Notes */}
                {cameraDetail.notes && (
                  <>
                    <Separator />
                    <div><p className="text-muted-foreground text-sm mb-1">Notes</p><p className="text-sm">{cameraDetail.notes}</p></div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCameraDetail(null)}>Close</Button>
                <Button onClick={() => { setCameraDetail(null); openEditCamera(cameraDetail) }}>Edit Camera</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* CREATE CAMERA DIALOG                        */}
      {/* ============================================ */}
      <Dialog open={createCameraOpen} onOpenChange={setCreateCameraOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Add Security Camera</DialogTitle>
            <DialogDescription>Configure a new camera installation point.</DialogDescription>
          </DialogHeader>
          <CameraForm form={cameraForm} setForm={setCameraForm} zones={zones} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCameraOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCamera} disabled={submitting || !cameraForm.cameraName}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Camera className="mr-2 h-4 w-4" /> Add Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* EDIT CAMERA DIALOG                          */}
      {/* ============================================ */}
      <Dialog open={!!editCameraTarget} onOpenChange={(o) => { if (!o) setEditCameraTarget(null) }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" /> Edit Camera — {editCameraTarget?.cameraName}</DialogTitle>
          </DialogHeader>
          <CameraForm form={cameraForm} setForm={setCameraForm} zones={zones} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCameraTarget(null)}>Cancel</Button>
            <Button onClick={handleUpdateCamera} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* CREATE NVR DIALOG                           */}
      {/* ============================================ */}
      <Dialog open={createNvrOpen} onOpenChange={setCreateNvrOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> Add NVR/DVR Server</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={nvrForm.name} onChange={(e) => setNvrForm({ ...nvrForm, name: e.target.value })} placeholder="e.g. NVR-1" /></div>
              <div className="space-y-2"><Label>Type</Label>
                <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={nvrForm.type} onChange={(e) => setNvrForm({ ...nvrForm, type: e.target.value })}>
                  <option value="nvr">NVR</option><option value="dvr">DVR</option><option value="server">Server</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Brand</Label><Input value={nvrForm.brand} onChange={(e) => setNvrForm({ ...nvrForm, brand: e.target.value })} /></div>
              <div className="space-y-2"><Label>Model</Label><Input value={nvrForm.model} onChange={(e) => setNvrForm({ ...nvrForm, model: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Total Channels</Label><Input type="number" value={nvrForm.totalChannels} onChange={(e) => setNvrForm({ ...nvrForm, totalChannels: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Used Channels</Label><Input type="number" value={nvrForm.usedChannels} onChange={(e) => setNvrForm({ ...nvrForm, usedChannels: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>RAID Config</Label><Input value={nvrForm.raidConfig} onChange={(e) => setNvrForm({ ...nvrForm, raidConfig: e.target.value })} placeholder="e.g. RAID 5" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Total Storage (GB)</Label><Input type="number" value={nvrForm.totalStorageGb} onChange={(e) => setNvrForm({ ...nvrForm, totalStorageGb: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Used Storage (GB)</Label><Input type="number" value={nvrForm.usedStorageGb} onChange={(e) => setNvrForm({ ...nvrForm, usedStorageGb: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Est. Days</Label><Input type="number" value={nvrForm.estimatedDays} onChange={(e) => setNvrForm({ ...nvrForm, estimatedDays: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>IP Address</Label><Input value={nvrForm.ipAddress} onChange={(e) => setNvrForm({ ...nvrForm, ipAddress: e.target.value })} placeholder="192.168.1.100" /></div>
              <div className="space-y-2"><Label>Port</Label><Input type="number" value={nvrForm.port} onChange={(e) => setNvrForm({ ...nvrForm, port: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Username</Label><Input value={nvrForm.username} onChange={(e) => setNvrForm({ ...nvrForm, username: e.target.value })} /></div>
              <div className="space-y-2"><Label>Firmware Version</Label><Input value={nvrForm.firmwareVersion} onChange={(e) => setNvrForm({ ...nvrForm, firmwareVersion: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Access URL</Label><Input value={nvrForm.accessUrl} onChange={(e) => setNvrForm({ ...nvrForm, accessUrl: e.target.value })} placeholder="http://192.168.1.100:80" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateNvrOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateNvr} disabled={submitting || !nvrForm.name}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add NVR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* CREATE ZONE DIALOG                          */}
      {/* ============================================ */}
      <Dialog open={createZoneOpen} onOpenChange={setCreateZoneOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Add Coverage Zone</DialogTitle>
            <DialogDescription>Define a zone to group cameras by location.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Zone Name *</Label><Input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="e.g. Tower A, Parking, Gate 1" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={zoneForm.description} onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {zoneColors.map(c => (
                  <button key={c} className={`h-8 w-8 rounded-full border-2 transition-all ${zoneForm.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setZoneForm({ ...zoneForm, color: c })} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateZoneOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateZone} disabled={submitting || !zoneForm.name}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Delete Camera</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{deleteTarget?.cameraName}</strong>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCamera}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview */}
      {docPreview && (
        <DocumentPreviewDialog src={docPreview.url} title={docPreview.name} open={!!docPreview} onOpenChange={() => setDocPreview(null)} />
      )}
    </div>
  )
}

// ============================================
// CAMERA FORM COMPONENT (shared by create/edit)
// ============================================
function CameraForm({ form, setForm, zones }: { form: Partial<Camera>; setForm: (f: Partial<Camera>) => void; zones: CameraZone[] }) {
  return (
    <div className="space-y-4 py-2">
      {/* Location Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Camera Name *</Label><Input value={form.cameraName || ''} onChange={(e) => setForm({ ...form, cameraName: e.target.value })} placeholder="e.g. Main Gate Cam 1" /></div>
        <div className="space-y-2"><Label>Camera Code</Label><Input value={form.cameraCode || ''} onChange={(e) => setForm({ ...form, cameraCode: e.target.value })} placeholder="e.g. MG-01" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Zone</Label>
          <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={form.zone || ''} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
            <option value="">No Zone</option>
            {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Gate" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Location Detail</Label><Input value={form.locationDetail || ''} onChange={(e) => setForm({ ...form, locationDetail: e.target.value })} placeholder="e.g. Left pillar near entrance" /></div>
        <div className="space-y-2"><Label>Floor</Label><Input value={form.floor || ''} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. Ground, B1" /></div>
      </div>

      <Separator />

      {/* Camera Specs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Type</Label>
          <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={form.type || 'dome'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {cameraTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>Brand</Label><Input value={form.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Hikvision, CP Plus" /></div>
        <div className="space-y-2"><Label>Model</Label><Input value={form.model || ''} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Resolution</Label>
          <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={form.resolution || '1080p'} onChange={(e) => setForm({ ...form, resolution: e.target.value })}>
            {resolutions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>FOV (degrees)</Label><Input type="number" value={form.fieldOfView || 90} onChange={(e) => setForm({ ...form, fieldOfView: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Mount Height</Label><Input value={form.installationHeight || ''} onChange={(e) => setForm({ ...form, installationHeight: e.target.value })} placeholder="3m" /></div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.nightVision || false} onChange={(e) => setForm({ ...form, nightVision: e.target.checked })} className="rounded" /><span className="text-sm">Night Vision</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasAudio || false} onChange={(e) => setForm({ ...form, hasAudio: e.target.checked })} className="rounded" /><span className="text-sm">Audio</span></label>
      </div>

      <Separator />

      {/* NVR & Storage */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>NVR Name</Label><Input value={form.nvrName || ''} onChange={(e) => setForm({ ...form, nvrName: e.target.value })} placeholder="NVR-1" /></div>
        <div className="space-y-2"><Label>NVR Channel</Label><Input type="number" value={form.nvrChannel || 0} onChange={(e) => setForm({ ...form, nvrChannel: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Status</Label>
          <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={form.status || 'online'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Maintenance</option><option value="faulty">Faulty</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Storage Days</Label><Input type="number" value={form.storageDays || 30} onChange={(e) => setForm({ ...form, storageDays: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Storage (GB)</Label><Input type="number" value={form.storageSizeGb || 1000} onChange={(e) => setForm({ ...form, storageSizeGb: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Bitrate (Mbps)</Label><Input type="number" value={form.bitrate || 0} onChange={(e) => setForm({ ...form, bitrate: Number(e.target.value) })} /></div>
      </div>

      <Separator />

      {/* Network */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>IP Address</Label><Input value={form.ipAddress || ''} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} placeholder="192.168.1.x" /></div>
        <div className="space-y-2"><Label>MAC Address</Label><Input value={form.macAddress || ''} onChange={(e) => setForm({ ...form, macAddress: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Stream URL</Label><Input value={form.streamUrl || ''} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} placeholder="rtsp://..." /></div>

      {/* Coverage */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Coverage Area</Label><Input value={form.coverageArea || ''} onChange={(e) => setForm({ ...form, coverageArea: e.target.value })} placeholder="e.g. Parking lot entrance" /></div>
        <div className="space-y-2"><Label>Coverage Radius (m)</Label><Input type="number" value={form.coverageRadius || 10} onChange={(e) => setForm({ ...form, coverageRadius: Number(e.target.value) })} /></div>
      </div>

      <Separator />

      {/* Cost */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Purchase Cost (₹)</Label><Input type="number" value={String(form.purchaseCost || 0)} onChange={(e) => setForm({ ...form, purchaseCost: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Monthly AMC (₹)</Label><Input type="number" value={String(form.monthlyAmc || 0)} onChange={(e) => setForm({ ...form, monthlyAmc: Number(e.target.value) })} /></div>
      </div>

      {/* Installation Image */}
      <div className="space-y-2">
        <Label>Installation Photo</Label>
        <ImageUploadZone
          label="Installation Photo"
          icon={Camera}
          image={form.installationImage || null}
          onUpload={(url) => setForm({ ...form, installationImage: url })}
          onRemove={() => setForm({ ...form, installationImage: undefined })}
          folder="society_erp/cameras/installation"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any additional notes..." /></div>
    </div>
  )
}
