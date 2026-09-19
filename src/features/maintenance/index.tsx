import { useState, useEffect } from 'react'
import {
  Wrench,
  Plus,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  X,
  Edit,
  Trash2,
  Building2,
  UserCheck,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  IndianRupee,
  FileText,
  Eye,
  Briefcase,
  Award,
  Users,
  TrendingUp,
  Camera,
  Paperclip,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { FlatPicker } from '@/components/flat-picker'
import { MemberPicker } from '@/components/member-picker'
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
import { ImageGallery, ImageUploadZone, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'

// ============================================
// TYPES
// ============================================
interface MaintenanceRequest {
  id: number
  societyId: number
  flatId: number
  memberId: number
  title: string
  description?: string
  category?: string
  priority: string
  status: string
  assignedTo?: number
  assignedStaffId?: number
  assignedCompanyId?: number
  assignedPersonId?: number
  estimatedCost?: number
  actualCost?: number
  resolutionNotes?: string
  photoUrls?: string
  resolutionPhotos?: string
  documents?: string
  rating?: number
  feedback?: string
  resolvedAt?: string
  closedAt?: string
  createdAt: string
}

interface ServiceCompany {
  id: number
  societyId: number
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  services?: string
  gstNumber?: string
  panNumber?: string
  rating?: number
  contractStart?: string
  contractEnd?: string
  monthlyRetainer?: number
  profileImage?: string
  documents?: string
  notes?: string
  isActive: boolean
  createdAt: string
}

interface ServicePerson {
  id: number
  societyId: number
  companyId?: number
  staffId?: number
  firstName: string
  lastName?: string
  phone?: string
  email?: string
  specialization?: string
  skillLevel?: string
  hourlyRate?: number
  availability?: string
  profileImage?: string
  idProofImage?: string
  documents?: string
  rating?: number
  totalJobs?: number
  notes?: string
  isActive: boolean
  createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Urgent' },
  high: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', label: 'High' },
  medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', label: 'Medium' },
  low: { color: 'bg-muted text-muted-foreground', label: 'Low' },
}

const statusConfig: Record<string, { color: string; icon: any }> = {
  open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
  in_progress: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: AlertTriangle },
  on_hold: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Clock },
  resolved: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
  closed: { color: 'bg-muted text-muted-foreground', icon: XCircle },
  reopened: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: RotateCcw },
}

const categories = [
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
  { value: 'painting', label: 'Painting', icon: '🎨' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'security', label: 'Security', icon: '🛡️' },
  { value: 'gardening', label: 'Gardening', icon: '🌿' },
  { value: 'ac_hvac', label: 'AC/HVAC', icon: '❄️' },
  { value: 'elevator', label: 'Elevator', icon: '🛗' },
  { value: 'water_supply', label: 'Water Supply', icon: '💧' },
  { value: 'pest_control', label: 'Pest Control', icon: '🐛' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const statusOptions = ['open', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened']
const specializations = ['plumbing', 'electrical', 'carpentry', 'painting', 'cleaning', 'gardening', 'ac_hvac', 'elevator', 'pest_control', 'general']
const serviceTypes = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Gardening', 'AC/HVAC', 'Elevator', 'Pest Control', 'Security', 'General Maintenance']

// ============================================
// MAIN COMPONENT
// ============================================
export function MaintenancePage() {
  // State
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [companies, setCompanies] = useState<ServiceCompany[]>([])
  const [persons, setPersons] = useState<ServicePerson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tabValue, setTabValue] = useState('requests')

  // Request dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)

  // Company dialog states
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [companyEditOpen, setCompanyEditOpen] = useState(false)
  const [companyDeleteOpen, setCompanyDeleteOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<ServiceCompany | null>(null)

  // Person dialog states
  const [personDialogOpen, setPersonDialogOpen] = useState(false)
  const [personEditOpen, setPersonEditOpen] = useState(false)
  const [personDeleteOpen, setPersonDeleteOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<ServicePerson | null>(null)

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  // Request form state
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'medium', flatId: '1', memberId: '1',
    category: 'plumbing', status: 'open', assignedCompanyId: '', assignedPersonId: '',
    estimatedCost: '', actualCost: '', resolutionNotes: '',
  })
  const [issuePhotos, setIssuePhotos] = useState<string[]>([])
  const [resolutionPhotos, setResolutionPhotos] = useState<string[]>([])
  const [requestDocuments, setRequestDocuments] = useState<UploadedDocument[]>([])

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '',
    gstNumber: '', panNumber: '', monthlyRetainer: '', notes: '',
  })
  const [companyServices, setCompanyServices] = useState<string[]>([])
  const [companyImage, setCompanyImage] = useState<string | null>(null)
  const [companyDocuments, setCompanyDocuments] = useState<UploadedDocument[]>([])

  // Person form state
  const [personForm, setPersonForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', specialization: 'plumbing',
    skillLevel: 'junior', hourlyRate: '', companyId: '', notes: '',
  })
  const [personImage, setPersonImage] = useState<string | null>(null)
  const [personIdProof, setPersonIdProof] = useState<string | null>(null)
  const [personDocuments, setPersonDocuments] = useState<UploadedDocument[]>([])

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchAll = async () => {
    try {
      const [r, c, p] = await Promise.all([
        orpc.maintenance.list({}),
        orpc.serviceCompanies.list(),
        orpc.servicePersons.list(),
      ])
      setRequests(r || [])
      setCompanies(c || [])
      setPersons(p || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // ============================================
  // FILTERS
  // ============================================
  const filteredRequests = requests.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCompanies = companies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPersons = persons.filter(p =>
    `${p.firstName} ${p.lastName || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    p.specialization?.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const openRequests = requests.filter(r => r.status === 'open').length
  const inProgressRequests = requests.filter(r => r.status === 'in_progress').length
  const resolvedRequests = requests.filter(r => r.status === 'resolved').length
  const totalEstimatedCost = requests.reduce((s, r) => s + (r.estimatedCost || 0), 0)
  const totalActualCost = requests.reduce((s, r) => s + (r.actualCost || 0), 0)
  const avgRating = companies.filter(c => c.rating).reduce((s, c, _, a) => s + (c.rating || 0) / a.length, 0)

  // ============================================
  // REQUEST CRUD
  // ============================================
  const resetRequestForm = () => {
    setFormData({
      title: '', description: '', priority: 'medium', flatId: '1', memberId: '1',
      category: 'plumbing', status: 'open', assignedCompanyId: '', assignedPersonId: '',
      estimatedCost: '', actualCost: '', resolutionNotes: '',
    })
    setIssuePhotos([])
    setResolutionPhotos([])
    setRequestDocuments([])
    setFormErrors({})
  }

  const handleCreateRequest = () => {
    resetRequestForm()
    setCreateDialogOpen(true)
  }

  const handleEditRequest = (req: MaintenanceRequest) => {
    setSelectedRequest(req)
    setFormData({
      title: req.title || '', description: req.description || '', priority: req.priority || 'medium',
      flatId: req.flatId?.toString() || '1', memberId: req.memberId?.toString() || '1',
      category: req.category || 'plumbing', status: req.status || 'open',
      assignedCompanyId: req.assignedCompanyId?.toString() || '',
      assignedPersonId: req.assignedPersonId?.toString() || '',
      estimatedCost: req.estimatedCost?.toString() || '',
      actualCost: req.actualCost?.toString() || '',
      resolutionNotes: req.resolutionNotes || '',
    })
    try { setIssuePhotos(req.photoUrls ? JSON.parse(req.photoUrls) : []) } catch { setIssuePhotos([]) }
    try { setResolutionPhotos(req.resolutionPhotos ? JSON.parse(req.resolutionPhotos) : []) } catch { setResolutionPhotos([]) }
    try { setRequestDocuments(req.documents ? JSON.parse(req.documents) : []) } catch { setRequestDocuments([]) }
    setFormErrors({})
    setEditDialogOpen(true)
  }

  const handleViewRequest = (req: MaintenanceRequest) => {
    setSelectedRequest(req)
    setDetailDialogOpen(true)
  }

  const handleSubmitRequest = async (isEdit: boolean) => {
    if (!formData.title.trim()) { setFormErrors({ title: 'Title is required' }); return }
    setSubmitting(true)
    try {
      if (isEdit && selectedRequest) {
        await orpc.maintenance.update({
          id: selectedRequest.id,
          data: {
            title: formData.title, description: formData.description, priority: formData.priority,
            status: formData.status, category: formData.category,
            assignedCompanyId: formData.assignedCompanyId ? Number(formData.assignedCompanyId) : null,
            assignedPersonId: formData.assignedPersonId ? Number(formData.assignedPersonId) : null,
            estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : null,
            actualCost: formData.actualCost ? Number(formData.actualCost) : null,
            resolutionNotes: formData.resolutionNotes || null,
            photoUrls: issuePhotos.length > 0 ? JSON.stringify(issuePhotos) : null,
            resolutionPhotos: resolutionPhotos.length > 0 ? JSON.stringify(resolutionPhotos) : null,
            documents: requestDocuments.length > 0 ? JSON.stringify(requestDocuments) : null,
          },
        })
        setEditDialogOpen(false)
      } else {
        await orpc.maintenance.create({
          societyId: 1, flatId: Number(formData.flatId), memberId: Number(formData.memberId),
          categoryId: 1, title: formData.title, description: formData.description,
          priority: formData.priority as any,
        })
        setCreateDialogOpen(false)
      }
      resetRequestForm()
      fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return
    setSubmitting(true)
    try { await orpc.maintenance.delete({ id: selectedRequest.id }); setDeleteDialogOpen(false); fetchAll() }
    catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ============================================
  // COMPANY CRUD
  // ============================================
  const resetCompanyForm = () => {
    setCompanyForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '', panNumber: '', monthlyRetainer: '', notes: '' })
    setCompanyServices([])
    setCompanyImage(null)
    setCompanyDocuments([])
  }

  const handleSubmitCompany = async (isEdit: boolean) => {
    if (!companyForm.name.trim()) return
    setSubmitting(true)
    try {
      if (isEdit && selectedCompany) {
        await orpc.serviceCompanies.update({
          id: selectedCompany.id,
          data: {
            ...companyForm,
            services: companyServices.length > 0 ? JSON.stringify(companyServices) : null,
            profileImage: companyImage || null,
            documents: companyDocuments.length > 0 ? JSON.stringify(companyDocuments) : null,
          },
        })
        setCompanyEditOpen(false)
      } else {
        await orpc.serviceCompanies.create({
          societyId: 1,
          name: companyForm.name,
          contactPerson: companyForm.contactPerson || undefined,
          phone: companyForm.phone || undefined,
          email: companyForm.email || undefined,
          address: companyForm.address || undefined,
          services: companyServices.length > 0 ? JSON.stringify(companyServices) : undefined,
          gstNumber: companyForm.gstNumber || undefined,
          panNumber: companyForm.panNumber || undefined,
          monthlyRetainer: companyForm.monthlyRetainer ? Number(companyForm.monthlyRetainer) : undefined,
          profileImage: companyImage || undefined,
          documents: companyDocuments.length > 0 ? JSON.stringify(companyDocuments) : undefined,
          notes: companyForm.notes || undefined,
        })
        setCompanyDialogOpen(false)
      }
      resetCompanyForm()
      fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return
    setSubmitting(true)
    try { await orpc.serviceCompanies.delete({ id: selectedCompany.id }); setCompanyDeleteOpen(false); fetchAll() }
    catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ============================================
  // PERSON CRUD
  // ============================================
  const resetPersonForm = () => {
    setPersonForm({ firstName: '', lastName: '', phone: '', email: '', specialization: 'plumbing', skillLevel: 'junior', hourlyRate: '', companyId: '', notes: '' })
    setPersonImage(null)
    setPersonIdProof(null)
    setPersonDocuments([])
  }

  const handleSubmitPerson = async (isEdit: boolean) => {
    if (!personForm.firstName.trim()) return
    setSubmitting(true)
    try {
      if (isEdit && selectedPerson) {
        await orpc.servicePersons.update({
          id: selectedPerson.id,
          data: {
            ...personForm,
            companyId: personForm.companyId ? Number(personForm.companyId) : null,
            hourlyRate: personForm.hourlyRate ? Number(personForm.hourlyRate) : null,
            profileImage: personImage || null,
            idProofImage: personIdProof || null,
            documents: personDocuments.length > 0 ? JSON.stringify(personDocuments) : null,
          },
        })
        setPersonEditOpen(false)
      } else {
        await orpc.servicePersons.create({
          societyId: 1,
          firstName: personForm.firstName,
          lastName: personForm.lastName || undefined,
          phone: personForm.phone || undefined,
          email: personForm.email || undefined,
          specialization: personForm.specialization || undefined,
          skillLevel: personForm.skillLevel as any || undefined,
          hourlyRate: personForm.hourlyRate ? Number(personForm.hourlyRate) : undefined,
          companyId: personForm.companyId ? Number(personForm.companyId) : undefined,
          profileImage: personImage || undefined,
          idProofImage: personIdProof || undefined,
          documents: personDocuments.length > 0 ? JSON.stringify(personDocuments) : undefined,
          notes: personForm.notes || undefined,
        })
        setPersonDialogOpen(false)
      }
      resetPersonForm()
      fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleDeletePerson = async () => {
    if (!selectedPerson) return
    setSubmitting(true)
    try { await orpc.servicePersons.delete({ id: selectedPerson.id }); setPersonDeleteOpen(false); fetchAll() }
    catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ============================================
  // HELPER: Get company/person names
  // ============================================
  const getCompanyName = (id?: number) => companies.find(c => c.id === id)?.name || '-'
  const getPersonName = (id?: number) => { const p = persons.find(x => x.id === id); return p ? `${p.firstName} ${p.lastName || ''}`.trim() : '-' }

  // ============================================
  // RENDER: Request Form
  // ============================================
  const renderRequestForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Leaking tap in bathroom" className={formErrors.title ? 'border-destructive' : ''} />
        {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the issue in detail" className="min-h-[80px]" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!editDialogOpen && (
        <div className="grid grid-cols-2 gap-4">
          <FlatPicker label="Flat" value={formData.flatId} onChange={v => setFormData({ ...formData, flatId: v })} />
          <MemberPicker label="Member" value={formData.memberId} onChange={v => setFormData({ ...formData, memberId: v })} />
        </div>
      )}

      <Separator />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Assignment</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Service Company</Label>
          <Select value={formData.assignedCompanyId} onValueChange={v => setFormData({ ...formData, assignedCompanyId: v, assignedPersonId: '' })}>
            <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {companies.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Service Person</Label>
          <Select value={formData.assignedPersonId} onValueChange={v => setFormData({ ...formData, assignedPersonId: v })}>
            <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {persons.filter(p => p.isActive && (!formData.assignedCompanyId || p.companyId?.toString() === formData.assignedCompanyId))
                .map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.firstName} {p.lastName || ''} ({p.specialization})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cost Tracking</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estimated Cost (₹)</Label>
          <Input type="number" value={formData.estimatedCost} onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })} min="0" placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Actual Cost (₹)</Label>
          <Input type="number" value={formData.actualCost} onChange={e => setFormData({ ...formData, actualCost: e.target.value })} min="0" placeholder="0" />
        </div>
      </div>

      {editDialogOpen && (
        <>
          <div className="space-y-2">
            <Label>Resolution Notes</Label>
            <Textarea value={formData.resolutionNotes} onChange={e => setFormData({ ...formData, resolutionNotes: e.target.value })}
              placeholder="How was the issue resolved?" className="min-h-[60px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Resolution Photos</Label>
            <ImageGallery images={resolutionPhotos}
              onAdd={img => setResolutionPhotos([...resolutionPhotos, img])}
              onRemove={idx => setResolutionPhotos(resolutionPhotos.filter((_, i) => i !== idx))} />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Issue Photos</Label>
        <ImageGallery images={issuePhotos}
          onAdd={img => setIssuePhotos([...issuePhotos, img])}
          onRemove={idx => setIssuePhotos(issuePhotos.filter((_, i) => i !== idx))} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Documents</Label>
        <DocumentUploader documents={requestDocuments}
          onAdd={doc => setRequestDocuments([...requestDocuments, doc])}
          onRemove={idx => setRequestDocuments(requestDocuments.filter((_, i) => i !== idx))}
          onView={doc => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }} />
      </div>
    </div>
  )

  // ============================================
  // RENDER: Company Form
  // ============================================
  const renderCompanyForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <ImageUploadZone label="Company Logo" icon={Building2} image={companyImage}
        onUpload={setCompanyImage} onRemove={() => setCompanyImage(null)} aspect="aspect-video" hint="Company logo or office photo" />
      <div className="space-y-2">
        <Label>Company Name *</Label>
        <Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
          placeholder="e.g. ABC Maintenance Services" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Contact Person</Label><Input value={companyForm.contactPerson} onChange={e => setCompanyForm({ ...companyForm, contactPerson: e.target.value })} placeholder="Name" /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} placeholder="email@company.com" /></div>
        <div className="space-y-2"><Label>Monthly Retainer (₹)</Label><Input type="number" value={companyForm.monthlyRetainer} onChange={e => setCompanyForm({ ...companyForm, monthlyRetainer: e.target.value })} min="0" /></div>
      </div>
      <div className="space-y-2"><Label>Address</Label><Textarea value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} placeholder="Full address" className="min-h-[60px]" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>GST Number</Label><Input value={companyForm.gstNumber} onChange={e => setCompanyForm({ ...companyForm, gstNumber: e.target.value })} placeholder="GSTIN" /></div>
        <div className="space-y-2"><Label>PAN Number</Label><Input value={companyForm.panNumber} onChange={e => setCompanyForm({ ...companyForm, panNumber: e.target.value })} placeholder="PAN" /></div>
      </div>
      <div className="space-y-2">
        <Label>Services Offered</Label>
        <div className="flex flex-wrap gap-2">
          {serviceTypes.map(s => (
            <Button key={s} type="button" size="sm" variant={companyServices.includes(s) ? 'default' : 'outline'}
              className="h-7 text-xs" onClick={() => setCompanyServices(companyServices.includes(s) ? companyServices.filter(x => x !== s) : [...companyServices, s])}>
              {s}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2"><Label>Notes</Label><Textarea value={companyForm.notes} onChange={e => setCompanyForm({ ...companyForm, notes: e.target.value })} placeholder="Additional notes" className="min-h-[60px]" /></div>
      <DocumentUploader documents={companyDocuments}
        onAdd={doc => setCompanyDocuments([...companyDocuments, doc])}
        onRemove={idx => setCompanyDocuments(companyDocuments.filter((_, i) => i !== idx))}
        onView={doc => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }} />
    </div>
  )

  // ============================================
  // RENDER: Person Form
  // ============================================
  const renderPersonForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <ImageUploadZone label="Photo" icon={Users} image={personImage}
          onUpload={setPersonImage} onRemove={() => setPersonImage(null)} aspect="square" hint="Profile photo" />
        <ImageUploadZone label="ID Proof" icon={FileText} image={personIdProof}
          onUpload={setPersonIdProof} onRemove={() => setPersonIdProof(null)} aspect="square" hint="ID proof image" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>First Name *</Label><Input value={personForm.firstName} onChange={e => setPersonForm({ ...personForm, firstName: e.target.value })} placeholder="First name" /></div>
        <div className="space-y-2"><Label>Last Name</Label><Input value={personForm.lastName} onChange={e => setPersonForm({ ...personForm, lastName: e.target.value })} placeholder="Last name" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Phone</Label><Input value={personForm.phone} onChange={e => setPersonForm({ ...personForm, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={personForm.email} onChange={e => setPersonForm({ ...personForm, email: e.target.value })} placeholder="email" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Specialization</Label>
          <Select value={personForm.specialization} onValueChange={v => setPersonForm({ ...personForm, specialization: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {specializations.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Skill Level</Label>
          <Select value={personForm.skillLevel} onValueChange={v => setPersonForm({ ...personForm, skillLevel: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['apprentice', 'junior', 'senior', 'expert'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Hourly Rate (₹)</Label><Input type="number" value={personForm.hourlyRate} onChange={e => setPersonForm({ ...personForm, hourlyRate: e.target.value })} min="0" /></div>
      </div>
      <div className="space-y-2">
        <Label>Company</Label>
        <Select value={personForm.companyId} onValueChange={v => setPersonForm({ ...personForm, companyId: v })}>
          <SelectTrigger><SelectValue placeholder="Select company (optional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Independent</SelectItem>
            {companies.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Notes</Label><Textarea value={personForm.notes} onChange={e => setPersonForm({ ...personForm, notes: e.target.value })} placeholder="Skills, experience, etc." className="min-h-[60px]" /></div>
      <DocumentUploader documents={personDocuments}
        onAdd={doc => setPersonDocuments([...personDocuments, doc])}
        onRemove={idx => setPersonDocuments(personDocuments.filter((_, i) => i !== idx))}
        onView={doc => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }} />
    </div>
  )

  // ============================================
  // RENDER: Company Card
  // ============================================
  const renderCompanyCard = (company: ServiceCompany) => {
    const svcList: string[] = (() => { try { return company.services ? JSON.parse(company.services) : [] } catch { return [] } })()
    const personCount = persons.filter(p => p.companyId === company.id).length
    const reqCount = requests.filter(r => r.assignedCompanyId === company.id).length
    return (
      <Card key={company.id} className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group" onClick={() => { setSelectedCompany(company); setCompanyEditOpen(true) }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            {company.profileImage ? (
              <img src={company.profileImage} alt={company.name} className="h-12 w-12 rounded-lg object-cover border" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{company.name}</p>
              <p className="text-xs text-muted-foreground">{company.contactPerson || 'No contact'}</p>
            </div>
            {company.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium">{company.rating}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {svcList.slice(0, 4).map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
            {svcList.length > 4 && <Badge variant="secondary" className="text-[10px]">+{svcList.length - 4}</Badge>}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {company.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{company.phone}</span>}
            {personCount > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{personCount} staff</span>}
            {reqCount > 0 && <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{reqCount} jobs</span>}
          </div>
          {company.monthlyRetainer && company.monthlyRetainer > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
              <IndianRupee className="h-3 w-3" />₹{Number(company.monthlyRetainer).toLocaleString('en-IN')}/mo retainer
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ============================================
  // RENDER: Person Card
  // ============================================
  const renderPersonCard = (person: ServicePerson) => {
    const availColor: Record<string, string> = {
      available: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      busy: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      on_leave: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      inactive: 'bg-muted text-muted-foreground',
    }
    return (
      <Card key={person.id} className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group" onClick={() => { setSelectedPerson(person); setPersonEditOpen(true) }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            {person.profileImage ? (
              <img src={person.profileImage} alt={person.firstName} className="h-12 w-12 rounded-full object-cover border" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{person.firstName} {person.lastName || ''}</p>
              <p className="text-xs text-muted-foreground capitalize">{person.specialization?.replace('_', ' ') || 'General'} · {person.skillLevel}</p>
            </div>
            <Badge className={`text-[10px] ${availColor[person.availability || 'available']}`}>
              {(person.availability || 'available').replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {person.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{person.phone}</span>}
            {person.hourlyRate && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />₹{Number(person.hourlyRate)}/hr</span>}
            {person.totalJobs && person.totalJobs > 0 && <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{person.totalJobs} jobs</span>}
            {person.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{person.rating}</span>}
          </div>
          {person.companyId && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />{getCompanyName(person.companyId)}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ============================================
  // RENDER: Request Detail
  // ============================================
  const renderRequestDetail = () => {
    if (!selectedRequest) return null
    const sc = statusConfig[selectedRequest.status] || statusConfig.open
    const pc = priorityConfig[selectedRequest.priority] || priorityConfig.medium
    const photos: string[] = (() => { try { return selectedRequest.photoUrls ? JSON.parse(selectedRequest.photoUrls) : [] } catch { return [] } })()
    const resPhotos: string[] = (() => { try { return selectedRequest.resolutionPhotos ? JSON.parse(selectedRequest.resolutionPhotos) : [] } catch { return [] } })()
    const docs: UploadedDocument[] = (() => { try { return selectedRequest.documents ? JSON.parse(selectedRequest.documents) : [] } catch { return [] } })()
    const StatusIcon = sc.icon
    return (
      <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-2">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${sc.color}`}><StatusIcon className="h-5 w-5" /></div>
          <div>
            <h3 className="font-semibold">{selectedRequest.title}</h3>
            <p className="text-xs text-muted-foreground">#{selectedRequest.id} · {new Date(selectedRequest.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge className={pc.color}>{pc.label}</Badge>
            <Badge className={sc.color}>{selectedRequest.status?.replace('_', ' ')}</Badge>
          </div>
        </div>
        {selectedRequest.description && <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>}
        <Separator />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Category</p><p className="font-medium capitalize">{selectedRequest.category?.replace('_', ' ') || '-'}</p></div>
          <div><p className="text-muted-foreground text-xs">Flat</p><p className="font-medium">Flat {selectedRequest.flatId}</p></div>
          <div><p className="text-muted-foreground text-xs">Assigned Company</p><p className="font-medium">{getCompanyName(selectedRequest.assignedCompanyId)}</p></div>
          <div><p className="text-muted-foreground text-xs">Assigned Person</p><p className="font-medium">{getPersonName(selectedRequest.assignedPersonId)}</p></div>
          <div><p className="text-muted-foreground text-xs">Estimated Cost</p><p className="font-medium">₹{Number(selectedRequest.estimatedCost || 0).toLocaleString('en-IN')}</p></div>
          <div><p className="text-muted-foreground text-xs">Actual Cost</p><p className="font-medium">₹{Number(selectedRequest.actualCost || 0).toLocaleString('en-IN')}</p></div>
        </div>
        {selectedRequest.resolutionNotes && (
          <><Separator /><div><p className="text-xs text-muted-foreground mb-1">Resolution Notes</p><p className="text-sm">{selectedRequest.resolutionNotes}</p></div></>
        )}
        {photos.length > 0 && (
          <><Separator /><p className="text-xs text-muted-foreground">Issue Photos</p>
            <div className="flex gap-2 flex-wrap">{photos.map((p, i) => (
              <div key={i} className="h-16 w-24 rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50"
                onClick={() => { setPreviewSrc(p); setPreviewTitle(`Issue Photo ${i + 1}`); setPreviewOpen(true) }}>
                <img src={p} alt="" className="w-full h-full object-cover" />
              </div>))}</div></>
        )}
        {resPhotos.length > 0 && (
          <><Separator /><p className="text-xs text-muted-foreground">Resolution Photos</p>
            <div className="flex gap-2 flex-wrap">{resPhotos.map((p, i) => (
              <div key={i} className="h-16 w-24 rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50"
                onClick={() => { setPreviewSrc(p); setPreviewTitle(`Resolution Photo ${i + 1}`); setPreviewOpen(true) }}>
                <img src={p} alt="" className="w-full h-full object-cover" />
              </div>))}</div></>
        )}
        {docs.length > 0 && (
          <><Separator /><p className="text-xs text-muted-foreground">Documents</p>
            <div className="flex gap-2 flex-wrap">{docs.map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border bg-muted/30 cursor-pointer hover:bg-muted/50"
                onClick={() => { setPreviewSrc(d.data); setPreviewTitle(d.name); setPreviewOpen(true) }}>
                {d.data.startsWith('data:image/') ? <img src={d.data} className="h-8 w-10 rounded object-cover" alt="" /> : <FileText className="h-5 w-5 text-red-500" />}
                <span className="text-xs">{d.name}</span>
              </div>))}</div></>
        )}
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
          <h1 className="text-3xl font-bold tracking-tight">Maintenance & Services</h1>
          <p className="text-muted-foreground">Manage requests, service companies, and service persons</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Export</Button>
          {tabValue === 'requests' && <Button onClick={handleCreateRequest}><Plus className="mr-2 h-4 w-4" /> New Request</Button>}
          {tabValue === 'companies' && <Button onClick={() => { resetCompanyForm(); setCompanyDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" /> Add Company</Button>}
          {tabValue === 'persons' && <Button onClick={() => { resetPersonForm(); setPersonDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" /> Add Person</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{openRequests}</p><p className="text-xs text-muted-foreground">Open</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{inProgressRequests}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{resolvedRequests}</p><p className="text-xs text-muted-foreground">Resolved</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950"><Building2 className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{companies.length}</p><p className="text-xs text-muted-foreground">Companies</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950"><IndianRupee className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold">₹{totalActualCost.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Total Spent</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Search */}
      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search requests, companies, or persons..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          {search && <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setSearch('')}><X className="h-4 w-4" /></Button>}
        </div>
      </CardContent></Card>

      {/* Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList>
          <TabsTrigger value="requests"><Wrench className="mr-1.5 h-4 w-4" />Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="companies"><Building2 className="mr-1.5 h-4 w-4" />Companies ({companies.length})</TabsTrigger>
          <TabsTrigger value="persons"><Users className="mr-1.5 h-4 w-4" />Persons ({persons.length})</TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* REQUESTS TAB                                */}
        {/* ============================================ */}
        <TabsContent value="requests" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredRequests.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No requests found</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateRequest}><Plus className="mr-2 h-4 w-4" />New Request</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => {
                const sc = statusConfig[req.status] || statusConfig.open
                const pc = priorityConfig[req.priority] || priorityConfig.medium
                const StatusIcon = sc.icon
                return (
                  <Card key={req.id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => handleViewRequest(req)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${sc.color} shrink-0`}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{req.title}</p>
                            <Badge className={`text-[10px] ${pc.color}`}>{pc.label}</Badge>
                            <Badge className={`text-[10px] ${sc.color}`}>{req.status?.replace('_', ' ')}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            #{req.id} · Flat {req.flatId} · {categories.find(c => c.value === req.category)?.icon} {req.category?.replace('_', ' ')}
                            {req.assignedCompanyId && <> · {getCompanyName(req.assignedCompanyId)}</>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {(req.actualCost || req.estimatedCost) ? (
                            <p className="text-sm font-medium">₹{Number(req.actualCost || req.estimatedCost || 0).toLocaleString('en-IN')}</p>
                          ) : null}
                          <p className="text-[10px] text-muted-foreground">{new Date(req.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); handleEditRequest(req) }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); setSelectedRequest(req); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* COMPANIES TAB                               */}
        {/* ============================================ */}
        <TabsContent value="companies" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredCompanies.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No service companies yet</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => { resetCompanyForm(); setCompanyDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" />Add Company</Button>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map(renderCompanyCard)}
            </div>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* PERSONS TAB                                 */}
        {/* ============================================ */}
        <TabsContent value="persons" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredPersons.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No service persons yet</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => { resetPersonForm(); setPersonDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" />Add Person</Button>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPersons.map(renderPersonCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* DIALOGS                                     */}
      {/* ============================================ */}

      {/* Create Request */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle><DialogDescription>Submit a new maintenance request</DialogDescription></DialogHeader>
          {renderRequestForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSubmitRequest(false)} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Request */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Request</DialogTitle><DialogDescription>Update request details and assignment</DialogDescription></DialogHeader>
          {renderRequestForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSubmitRequest(true)} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Detail */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Request Details</DialogTitle></DialogHeader>
          {renderRequestDetail()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setDetailDialogOpen(false); handleEditRequest(selectedRequest!) }}><Edit className="mr-2 h-4 w-4" />Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Request */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Request</DialogTitle><DialogDescription>Are you sure you want to delete request <strong>#{selectedRequest?.id}</strong>?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRequest} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Company */}
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Service Company</DialogTitle><DialogDescription>Register a new maintenance service company</DialogDescription></DialogHeader>
          {renderCompanyForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSubmitCompany(false)} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company */}
      <Dialog open={companyEditOpen} onOpenChange={setCompanyEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Company</DialogTitle><DialogDescription>Update company details</DialogDescription></DialogHeader>
          {renderCompanyForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyEditOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setCompanyEditOpen(false); setCompanyDeleteOpen(true) }} className="mr-auto">Delete</Button>
            <Button onClick={() => handleSubmitCompany(true)} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company */}
      <Dialog open={companyDeleteOpen} onOpenChange={setCompanyDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Company</DialogTitle><DialogDescription>Delete <strong>{selectedCompany?.name}</strong>? This may affect assigned requests.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCompany} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Person */}
      <Dialog open={personDialogOpen} onOpenChange={setPersonDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Service Person</DialogTitle><DialogDescription>Register a new service person or technician</DialogDescription></DialogHeader>
          {renderPersonForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPersonDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSubmitPerson(false)} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Person</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Person */}
      <Dialog open={personEditOpen} onOpenChange={setPersonEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Person</DialogTitle><DialogDescription>Update person details</DialogDescription></DialogHeader>
          {renderPersonForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPersonEditOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setPersonEditOpen(false); setPersonDeleteOpen(true) }} className="mr-auto">Delete</Button>
            <Button onClick={() => handleSubmitPerson(true)} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Person */}
      <Dialog open={personDeleteOpen} onOpenChange={setPersonDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Person</DialogTitle><DialogDescription>Delete <strong>{selectedPerson?.firstName} {selectedPerson?.lastName}</strong>?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPersonDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePerson} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />
    </div>
  )
}
