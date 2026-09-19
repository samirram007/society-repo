import { useState, useEffect, useMemo } from 'react'
import {
  Dog,
  Cat,
  Bird,
  Fish,
  PawPrint,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  X,
  Download,
  Syringe,
  Shield,
  Heart,
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Activity,
  Bell,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Pill,
  Scissors,
  Dumbbell,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlatPicker } from '@/components/flat-picker'
import { MemberPicker } from '@/components/member-picker'
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
import { ImageGallery, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'
import { Paperclip, FileCheck, File } from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface Pet {
  id: number
  memberId: number
  flatId: number
  name: string
  type: string
  breed?: string
  age?: number
  weight?: number
  color?: string
  gender?: string
  photoUrl?: string
  vaccinationStatus?: string
  lastVaccinationDate?: string
  nextVaccinationDate?: string
  insuranceExpiry?: string
  registrationNumber?: string
  microchipNumber?: string
  isNeutered?: boolean
  isRegistered?: boolean
  registrationDate?: string
  isActive: boolean
  createdAt: string
}

interface PetVaccination {
  id: number
  petId: number
  vaccineName: string
  vaccineType?: string
  administeredDate: string
  nextDueDate?: string
  veterinarian?: string
  clinicName?: string
  batchNumber?: string
  cost?: number
  notes?: string
  status: string
  createdAt: string
}

interface PetHealthRecord {
  id: number
  petId: number
  recordType: string
  title: string
  description?: string
  visitDate: string
  veterinarian?: string
  clinicName?: string
  diagnosis?: string
  treatment?: string
  medications?: string
  cost?: number
  nextVisitDate?: string
  createdAt: string
}

interface PetReminder {
  id: number
  petId: number
  reminderType: string
  title: string
  description?: string
  dueDate: string
  isRecurring: boolean
  recurringInterval?: string
  isCompleted: boolean
  completedDate?: string
  priority: string
  createdAt: string
}

interface PetActivityLog {
  id: number
  petId: number
  activityType: string
  description?: string
  activityDate: string
  duration?: number
  notes?: string
  createdAt: string
}

interface PetSummary {
  total: number
  byType: Record<string, number>
  needsVaccination: number
}

interface PetRule {
  id: number
  societyId: number
  title?: string
  rule: string
  category?: string
  penaltyAmount?: number
  sortOrder?: number
  isActive: boolean
}

// ============================================
// CONSTANTS
// ============================================
const typeConfig: Record<string, { color: string; icon: any; label: string }> = {
  dog: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Dog, label: 'Dog' },
  cat: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Cat, label: 'Cat' },
  bird: { color: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300', icon: Bird, label: 'Bird' },
  fish: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300', icon: Fish, label: 'Fish' },
  other: { color: 'bg-muted text-muted-foreground', icon: PawPrint, label: 'Other' },
}

const petTypes = ['dog', 'cat', 'bird', 'fish', 'other']
const genderOptions = ['male', 'female']

const activityTypes = [
  { value: 'feeding', label: 'Feeding', icon: Heart },
  { value: 'walking', label: 'Walking', icon: Activity },
  { value: 'grooming', label: 'Grooming', icon: Scissors },
  { value: 'medication', label: 'Medication', icon: Pill },
  { value: 'training', label: 'Training', icon: Dumbbell },
  { value: 'play', label: 'Play', icon: PawPrint },
  { value: 'other', label: 'Other', icon: FileText },
]

const healthRecordTypes = [
  { value: 'checkup', label: 'Checkup' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'illness', label: 'Illness' },
  { value: 'injury', label: 'Injury' },
  { value: 'dental', label: 'Dental' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'other', label: 'Other' },
]

const reminderTypes = [
  { value: 'vaccination', label: 'Vaccination', icon: Syringe },
  { value: 'medication', label: 'Medication', icon: Pill },
  { value: 'grooming', label: 'Grooming', icon: Scissors },
  { value: 'checkup', label: 'Checkup', icon: Stethoscope },
  { value: 'insurance', label: 'Insurance', icon: Shield },
  { value: 'other', label: 'Other', icon: Bell },
]

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

function formatDate(d?: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d?: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(amount?: number): string {
  if (!amount) return '₹0'
  return `₹${amount.toLocaleString('en-IN')}`
}

// ============================================
// MAIN COMPONENT
// ============================================
export function PetsPage() {
  // State
  const [pets, setPets] = useState<Pet[]>([])
  const [summary, setSummary] = useState<PetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [activeTab, setActiveTab] = useState('directory')
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false)
  const [healthRecordDialogOpen, setHealthRecordDialogOpen] = useState(false)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [activityLogDialogOpen, setActivityLogDialogOpen] = useState(false)
  const [petDetailOpen, setPetDetailOpen] = useState(false)
  
  // Care data
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([])
  const [healthRecords, setHealthRecords] = useState<PetHealthRecord[]>([])
  const [reminders, setReminders] = useState<PetReminder[]>([])
  const [activityLogs, setActivityLogs] = useState<PetActivityLog[]>([])
  const [petRules, setPetRules] = useState<PetRule[]>([])
  const [overdueReminders, setOverdueReminders] = useState<PetReminder[]>([])
  
  // Form states
  const [petForm, setPetForm] = useState({
    name: '', type: 'dog', breed: '', age: '', weight: '', color: '',
    gender: 'male', vaccinationStatus: '', lastVaccinationDate: '',
    nextVaccinationDate: '', isNeutered: false, flatId: '1', memberId: '1',
  })
  const [vaccinationForm, setVaccinationForm] = useState({
    vaccineName: '', vaccineType: '', administeredDate: '', nextDueDate: '',
    veterinarian: '', clinicName: '', batchNumber: '', cost: '', notes: '',
  })
  const [healthRecordForm, setHealthRecordForm] = useState({
    recordType: 'checkup', title: '', description: '', visitDate: '',
    veterinarian: '', clinicName: '', diagnosis: '', treatment: '',
    medications: '', cost: '', nextVisitDate: '',
  })
  const [reminderForm, setReminderForm] = useState({
    reminderType: 'vaccination', title: '', description: '', dueDate: '',
    isRecurring: false, recurringInterval: 'monthly', priority: 'medium',
  })
  const [activityLogForm, setActivityLogForm] = useState({
    activityType: 'feeding', description: '', activityDate: '', duration: '', notes: '',
  })
  const [ruleForm, setRuleForm] = useState({ title: '', rule: '', category: '', penaltyAmount: '' })
  
  const [petImages, setPetImages] = useState<string[]>([])
  const [petDocuments, setPetDocuments] = useState<UploadedDocument[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch all data
  const fetchAll = async () => {
    try {
      const [petData, summaryData, rulesData, overdueData] = await Promise.all([
        orpc.pets.list({}),
        orpc.pets.summary(),
        orpc.petRules.list({}),
        orpc.petReminders.getOverdue(),
      ])
      setPets(petData || [])
      setSummary(summaryData)
      setPetRules(rulesData || [])
      setOverdueReminders(overdueData || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch pet care data
  const fetchPetCareData = async (petId: number) => {
    try {
      const [vaccData, healthData, reminderData, activityData] = await Promise.all([
        orpc.petVaccinations.list({ petId }),
        orpc.petHealthRecords.list({ petId }),
        orpc.petReminders.list({ petId, includeCompleted: false }),
        orpc.petActivityLog.list({ petId, limit: 20 }),
      ])
      setVaccinations(vaccData || [])
      setHealthRecords(healthData || [])
      setReminders(reminderData || [])
      setActivityLogs(activityData || [])
    } catch (error) {
      console.error('Failed to fetch pet care data:', error)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Filter pets
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesSearch = pet.name?.toLowerCase().includes(search.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || pet.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [pets, search, typeFilter])

  // Check if vaccination is overdue
  const isVaccinationOverdue = (pet: Pet) => {
    if (!pet.nextVaccinationDate) return false
    return new Date(pet.nextVaccinationDate) <= new Date()
  }

  // Open pet detail
  const openPetDetail = async (pet: Pet) => {
    setSelectedPet(pet)
    setPetDetailOpen(true)
    await fetchPetCareData(pet.id)
  }

  // Reset forms
  const resetPetForm = () => {
    setPetForm({
      name: '', type: 'dog', breed: '', age: '', weight: '', color: '',
      gender: 'male', vaccinationStatus: '', lastVaccinationDate: '',
      nextVaccinationDate: '', isNeutered: false, flatId: '1', memberId: '1',
    })
    setFormErrors({})
  }

  const resetVaccinationForm = () => {
    setVaccinationForm({
      vaccineName: '', vaccineType: '', administeredDate: '', nextDueDate: '',
      veterinarian: '', clinicName: '', batchNumber: '', cost: '', notes: '',
    })
  }

  const resetHealthRecordForm = () => {
    setHealthRecordForm({
      recordType: 'checkup', title: '', description: '', visitDate: '',
      veterinarian: '', clinicName: '', diagnosis: '', treatment: '',
      medications: '', cost: '', nextVisitDate: '',
    })
  }

  const resetReminderForm = () => {
    setReminderForm({
      reminderType: 'vaccination', title: '', description: '', dueDate: '',
      isRecurring: false, recurringInterval: 'monthly', priority: 'medium',
    })
  }

  const resetActivityLogForm = () => {
    setActivityLogForm({
      activityType: 'feeding', description: '', activityDate: '', duration: '', notes: '',
    })
  }

  // Submit pet
  const handlePetSubmit = async (isEdit: boolean) => {
    if (!petForm.name.trim()) {
      setFormErrors({ name: 'Pet name is required' })
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && selectedPet) {
        await orpc.pets.update({ id: selectedPet.id, data: { ...petForm, images: petImages.length > 0 ? JSON.stringify(petImages) : null, documents: petDocuments.length > 0 ? JSON.stringify(petDocuments) : null } })
        setEditDialogOpen(false)
      } else {
        await orpc.pets.create({
          memberId: Number(petForm.memberId),
          flatId: Number(petForm.flatId),
          name: petForm.name,
          type: petForm.type as any,
          breed: petForm.breed || undefined,
          age: petForm.age ? Number(petForm.age) : undefined,
          weight: petForm.weight ? Number(petForm.weight) : undefined,
          color: petForm.color || undefined,
          gender: petForm.gender as any || undefined,
          vaccinationStatus: petForm.vaccinationStatus || undefined,
          lastVaccinationDate: petForm.lastVaccinationDate || undefined,
          nextVaccinationDate: petForm.nextVaccinationDate || undefined,
          isNeutered: petForm.isNeutered,
          images: petImages.length > 0 ? JSON.stringify(petImages) : undefined,
          documents: petDocuments.length > 0 ? JSON.stringify(petDocuments) : undefined,
        })
        setCreateDialogOpen(false)
      }
      fetchAll()
      resetPetForm()
    } catch (error) {
      console.error('Failed to save pet:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit vaccination
  const handleVaccinationSubmit = async () => {
    if (!vaccinationForm.vaccineName || !vaccinationForm.administeredDate || !selectedPet) return
    setSubmitting(true)
    try {
      await orpc.petVaccinations.create({
        petId: selectedPet.id,
        vaccineName: vaccinationForm.vaccineName,
        vaccineType: vaccinationForm.vaccineType || undefined,
        administeredDate: vaccinationForm.administeredDate,
        nextDueDate: vaccinationForm.nextDueDate || undefined,
        veterinarian: vaccinationForm.veterinarian || undefined,
        clinicName: vaccinationForm.clinicName || undefined,
        batchNumber: vaccinationForm.batchNumber || undefined,
        cost: vaccinationForm.cost ? Number(vaccinationForm.cost) : undefined,
        notes: vaccinationForm.notes || undefined,
      })
      setVaccinationDialogOpen(false)
      resetVaccinationForm()
      fetchPetCareData(selectedPet.id)
      fetchAll()
    } catch (error) {
      console.error('Failed to add vaccination:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit health record
  const handleHealthRecordSubmit = async () => {
    if (!healthRecordForm.title || !healthRecordForm.visitDate || !selectedPet) return
    setSubmitting(true)
    try {
      await orpc.petHealthRecords.create({
        petId: selectedPet.id,
        recordType: healthRecordForm.recordType as any,
        title: healthRecordForm.title,
        description: healthRecordForm.description || undefined,
        visitDate: healthRecordForm.visitDate,
        veterinarian: healthRecordForm.veterinarian || undefined,
        clinicName: healthRecordForm.clinicName || undefined,
        diagnosis: healthRecordForm.diagnosis || undefined,
        treatment: healthRecordForm.treatment || undefined,
        medications: healthRecordForm.medications || undefined,
        cost: healthRecordForm.cost ? Number(healthRecordForm.cost) : undefined,
        nextVisitDate: healthRecordForm.nextVisitDate || undefined,
      })
      setHealthRecordDialogOpen(false)
      resetHealthRecordForm()
      fetchPetCareData(selectedPet.id)
    } catch (error) {
      console.error('Failed to add health record:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit reminder
  const handleReminderSubmit = async () => {
    if (!reminderForm.title || !reminderForm.dueDate || !selectedPet) return
    setSubmitting(true)
    try {
      await orpc.petReminders.create({
        petId: selectedPet.id,
        reminderType: reminderForm.reminderType as any,
        title: reminderForm.title,
        description: reminderForm.description || undefined,
        dueDate: reminderForm.dueDate,
        isRecurring: reminderForm.isRecurring,
        recurringInterval: reminderForm.recurringInterval || undefined,
        priority: reminderForm.priority as any,
      })
      setReminderDialogOpen(false)
      resetReminderForm()
      fetchPetCareData(selectedPet.id)
    } catch (error) {
      console.error('Failed to add reminder:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Complete reminder
  const handleCompleteReminder = async (reminderId: number) => {
    try {
      await orpc.petReminders.complete({ id: reminderId })
      if (selectedPet) fetchPetCareData(selectedPet.id)
    } catch (error) {
      console.error('Failed to complete reminder:', error)
    }
  }

  // Submit activity log
  const handleActivityLogSubmit = async () => {
    if (!activityLogForm.activityType || !activityLogForm.activityDate || !selectedPet) return
    setSubmitting(true)
    try {
      await orpc.petActivityLog.create({
        petId: selectedPet.id,
        activityType: activityLogForm.activityType as any,
        description: activityLogForm.description || undefined,
        activityDate: activityLogForm.activityDate,
        duration: activityLogForm.duration ? Number(activityLogForm.duration) : undefined,
        notes: activityLogForm.notes || undefined,
      })
      setActivityLogDialogOpen(false)
      resetActivityLogForm()
      fetchPetCareData(selectedPet.id)
    } catch (error) {
      console.error('Failed to add activity log:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit pet rule
  const handleRuleSubmit = async () => {
    if (!ruleForm.rule.trim()) return
    setSubmitting(true)
    try {
      await orpc.petRules.create({
        societyId: 1,
        title: ruleForm.title || undefined,
        rule: ruleForm.rule,
        category: ruleForm.category || undefined,
        penaltyAmount: ruleForm.penaltyAmount ? Number(ruleForm.penaltyAmount) : undefined,
      })
      setRuleForm({ title: '', rule: '', category: '', penaltyAmount: '' })
      fetchAll()
    } catch (error) {
      console.error('Failed to add rule:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete pet rule
  const handleDeleteRule = async (ruleId: number) => {
    try {
      await orpc.petRules.delete({ id: ruleId })
      fetchAll()
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pet Directory</h1>
          <p className="text-muted-foreground">Manage registered pets and their care</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => { resetPetForm(); setCreateDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Register Pet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <PawPrint className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.total ?? pets.length}</p>
                <p className="text-xs text-muted-foreground">Total Pets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <Dog className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.byType?.dog ?? pets.filter(p => p.type === 'dog').length}</p>
                <p className="text-xs text-muted-foreground">Dogs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <Cat className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.byType?.cat ?? pets.filter(p => p.type === 'cat').length}</p>
                <p className="text-xs text-muted-foreground">Cats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950">
                <Bird className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.byType?.bird ?? pets.filter(p => p.type === 'bird').length}</p>
                <p className="text-xs text-muted-foreground">Birds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
                <Syringe className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.needsVaccination ?? 0}</p>
                <p className="text-xs text-muted-foreground">Vaccination Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueReminders.length}</p>
                <p className="text-xs text-muted-foreground">Overdue Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="directory">Pet Directory</TabsTrigger>
          <TabsTrigger value="care">Care Management</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="rules">Pet Rules</TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* PET DIRECTORY TAB                           */}
        {/* ============================================ */}
        <TabsContent value="directory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, breed..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                  {search && (
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setSearch('')}>
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
                    {petTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pet Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPets.map((pet) => {
                const config = typeConfig[pet.type] || typeConfig.other
                const Icon = config.icon
                const overdue = isVaccinationOverdue(pet)
                return (
                  <Card
                    key={pet.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                    onClick={() => openPetDetail(pet)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{pet.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{pet.type}{pet.breed ? ` · ${pet.breed}` : ''}</p>
                          </div>
                        </div>
                        {overdue && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Due
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Age: <span className="text-foreground">{pet.age ? `${pet.age} yrs` : '-'}</span></div>
                        <div className="text-muted-foreground">Gender: <span className="text-foreground capitalize">{pet.gender || '-'}</span></div>
                        <div className="text-muted-foreground">Color: <span className="text-foreground">{pet.color || '-'}</span></div>
                        <div className="text-muted-foreground">Weight: <span className="text-foreground">{pet.weight ? `${pet.weight} kg` : '-'}</span></div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant={pet.isNeutered ? 'default' : 'secondary'} className="text-xs">
                          {pet.isNeutered ? 'Neutered' : 'Not Neutered'}
                        </Badge>
                        <Badge variant={pet.vaccinationStatus ? 'default' : 'secondary'} className="text-xs">
                          {pet.vaccinationStatus || 'No Status'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No pets found</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => { resetPetForm(); setCreateDialogOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" /> Register Pet
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* CARE MANAGEMENT TAB                         */}
        {/* ============================================ */}
        <TabsContent value="care" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" /> Pet Care Overview
              </CardTitle>
              <CardDescription>Select a pet to view and manage their health records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={selectedPet?.id?.toString() || ''}
                  onValueChange={(v) => {
                    const pet = pets.find(p => p.id === Number(v))
                    if (pet) openPetDetail(pet)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id.toString()}>
                        {pet.name} ({pet.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPet && (
                  <div className="space-y-6">
                    {/* Pet Info Header */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${(typeConfig[selectedPet.type] || typeConfig.other).color}`}>
                        {(() => { const Icon = (typeConfig[selectedPet.type] || typeConfig.other).icon; return <Icon className="h-8 w-8" /> })()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedPet.name}</h3>
                        <p className="text-muted-foreground">{selectedPet.type}{selectedPet.breed ? ` · ${selectedPet.breed}` : ''}</p>
                      </div>
                    </div>

                    {/* Vaccination Records */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Syringe className="h-4 w-4" /> Vaccination Records
                        </h4>
                        <Button size="sm" onClick={() => { resetVaccinationForm(); setVaccinationDialogOpen(true) }}>
                          <Plus className="mr-2 h-3 w-3" /> Add Record
                        </Button>
                      </div>
                      {vaccinations.length > 0 ? (
                        <div className="space-y-2">
                          {vaccinations.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{v.vaccineName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(v.administeredDate)}
                                  {v.veterinarian ? ` · ${v.veterinarian}` : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={v.status === 'completed' ? 'default' : 'secondary'}>{v.status}</Badge>
                                {v.nextDueDate && (
                                  <p className="text-xs text-muted-foreground mt-1">Next: {formatDate(v.nextDueDate)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No vaccination records</p>
                      )}
                    </div>

                    <Separator />

                    {/* Health Records */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Health Records
                        </h4>
                        <Button size="sm" onClick={() => { resetHealthRecordForm(); setHealthRecordDialogOpen(true) }}>
                          <Plus className="mr-2 h-3 w-3" /> Add Record
                        </Button>
                      </div>
                      {healthRecords.length > 0 ? (
                        <div className="space-y-2">
                          {healthRecords.map(h => (
                            <div key={h.id} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{h.title}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{h.recordType} · {formatDate(h.visitDate)}</p>
                                </div>
                                {h.cost && <span className="text-sm font-medium">{formatCurrency(h.cost)}</span>}
                              </div>
                              {h.diagnosis && <p className="text-xs text-muted-foreground mt-1">Diagnosis: {h.diagnosis}</p>}
                              {h.medications && <p className="text-xs text-muted-foreground">Medications: {h.medications}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No health records</p>
                      )}
                    </div>

                    <Separator />

                    {/* Activity Log */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4" /> Recent Activity
                        </h4>
                        <Button size="sm" onClick={() => { resetActivityLogForm(); setActivityLogDialogOpen(true) }}>
                          <Plus className="mr-2 h-3 w-3" /> Log Activity
                        </Button>
                      </div>
                      {activityLogs.length > 0 ? (
                        <div className="space-y-2">
                          {activityLogs.map(a => {
                            const activityConfig = activityTypes.find(at => at.value === a.activityType) || activityTypes[0]
                            const ActivityIcon = activityConfig.icon
                            return (
                              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                  <ActivityIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{activityConfig.label}</p>
                                  <p className="text-xs text-muted-foreground">{formatDateTime(a.activityDate)}</p>
                                </div>
                                {a.duration && <span className="text-xs text-muted-foreground">{a.duration} min</span>}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No activity logged</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* REMINDERS TAB                               */}
        {/* ============================================ */}
        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Pet Reminders
              </CardTitle>
              <CardDescription>Upcoming tasks and reminders for your pets</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueReminders.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Overdue ({overdueReminders.length})
                  </h4>
                  <div className="space-y-2">
                    {overdueReminders.map(r => {
                      const pet = pets.find(p => p.id === r.petId)
                      const typeConfig_ = reminderTypes.find(rt => rt.value === r.reminderType) || reminderTypes[0]
                      const TypeIcon = typeConfig_.icon
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                          <div className="flex items-center gap-3">
                            <TypeIcon className="h-5 w-5 text-destructive" />
                            <div>
                              <p className="font-medium">{r.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {pet?.name} · Due: {formatDate(r.dueDate)}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleCompleteReminder(r.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* All Reminders */}
              <div>
                <h4 className="text-sm font-medium mb-2">All Active Reminders</h4>
                {reminders.length > 0 ? (
                  <div className="space-y-2">
                    {reminders.map(r => {
                      const pet = pets.find(p => p.id === r.petId)
                      const typeConfig_ = reminderTypes.find(rt => rt.value === r.reminderType) || reminderTypes[0]
                      const TypeIcon = typeConfig_.icon
                      const isOverdue = new Date(r.dueDate) < new Date()
                      return (
                        <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                          <div className="flex items-center gap-3">
                            <TypeIcon className={`h-5 w-5 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="font-medium">{r.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {pet?.name} · Due: {formatDate(r.dueDate)}
                                {r.isRecurring ? ` · Recurring ${r.recurringInterval}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={priorityColors[r.priority] || ''}>{r.priority}</Badge>
                            <Button size="sm" variant="ghost" onClick={() => handleCompleteReminder(r.id)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No active reminders</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* PET RULES TAB                               */}
        {/* ============================================ */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Society Pet Rules
              </CardTitle>
              <CardDescription>Rules and regulations for pet owners in the society</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Rule Form */}
              <div className="space-y-3 mb-6 p-4 rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Title (optional)</Label>
                    <Input
                      placeholder="e.g. Leash Policy"
                      value={ruleForm.title}
                      onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      placeholder="e.g. Safety, Hygiene"
                      value={ruleForm.category}
                      onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rule *</Label>
                  <Textarea
                    placeholder="Enter the pet rule..."
                    value={ruleForm.rule}
                    onChange={(e) => setRuleForm({ ...ruleForm, rule: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Penalty Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="Optional"
                      value={ruleForm.penaltyAmount}
                      onChange={(e) => setRuleForm({ ...ruleForm, penaltyAmount: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleRuleSubmit} disabled={submitting || !ruleForm.rule.trim()}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Rule
                    </Button>
                  </div>
                </div>
              </div>

              {/* Rules List */}
              {petRules.length > 0 ? (
                <div className="space-y-3">
                  {petRules.map((rule, index) => (
                    <div key={rule.id} className="flex items-start justify-between p-4 rounded-lg border">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          {rule.title && <p className="font-medium">{rule.title}</p>}
                          <p className="text-sm text-muted-foreground">{rule.rule}</p>
                          <div className="flex gap-2 mt-2">
                            {rule.category && <Badge variant="secondary" className="text-xs">{rule.category}</Badge>}
                            {rule.penaltyAmount && <Badge variant="outline" className="text-xs">Penalty: {formatCurrency(rule.penaltyAmount)}</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pet rules defined</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* CREATE/EDIT PET DIALOG                      */}
      {/* ============================================ */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) { setCreateDialogOpen(false); setEditDialogOpen(false); resetPetForm() }
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Pet' : 'Register Pet'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update pet details.' : 'Fill in the details to register a new pet.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pet Name *</Label>
                <Input
                  value={petForm.name}
                  onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                  placeholder="e.g. Bruno"
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Pet Type *</Label>
                <Select value={petForm.type} onValueChange={(val) => setPetForm({ ...petForm, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {petTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Breed</Label>
                <Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} placeholder="e.g. Labrador" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={petForm.gender} onValueChange={(val) => setPetForm({ ...petForm, gender: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((g) => (
                      <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Age (yrs)</Label>
                <Input type="number" value={petForm.age} onChange={(e) => setPetForm({ ...petForm, age: e.target.value })} placeholder="e.g. 3" min="0" />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" value={petForm.weight} onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })} placeholder="e.g. 12" min="0" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input value={petForm.color} onChange={(e) => setPetForm({ ...petForm, color: e.target.value })} placeholder="e.g. Brown" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vaccination Status</Label>
                <Input value={petForm.vaccinationStatus} onChange={(e) => setPetForm({ ...petForm, vaccinationStatus: e.target.value })} placeholder="e.g. Up to date" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="isNeutered" checked={petForm.isNeutered} onChange={(e) => setPetForm({ ...petForm, isNeutered: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="isNeutered" className="cursor-pointer">Neutered/Spayed</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FlatPicker label="Flat *" value={petForm.flatId} onChange={(v) => setPetForm({ ...petForm, flatId: v })} required />
              <MemberPicker label="Member *" value={petForm.memberId} onChange={(v) => setPetForm({ ...petForm, memberId: v })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Last Vaccination Date</Label>
                <Input type="date" value={petForm.lastVaccinationDate} onChange={(e) => setPetForm({ ...petForm, lastVaccinationDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Next Vaccination Date</Label>
                <Input type="date" value={petForm.nextVaccinationDate} onChange={(e) => setPetForm({ ...petForm, nextVaccinationDate: e.target.value })} />
              </div>
            </div>
            {/* Pet Photos */}
            <ImageGallery
              images={petImages}
              onAdd={(img) => setPetImages([...petImages, img])}
              onRemove={(idx) => setPetImages(petImages.filter((_, i) => i !== idx))}
            />
            {/* Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Documents</Label>
              <DocumentUploader
                documents={petDocuments}
                onAdd={(doc) => setPetDocuments([...petDocuments, doc])}
                onRemove={(idx) => setPetDocuments(petDocuments.filter((_, i) => i !== idx))}
                onView={(doc) => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }}
                docTypes={[
                  { value: 'vaccination_record', label: 'Vaccination Record', icon: FileCheck },
                  { value: 'health_certificate', label: 'Health Certificate', icon: FileCheck },
                  { value: 'breed_certificate', label: 'Breed Certificate', icon: FileCheck },
                  { value: 'insurance', label: 'Pet Insurance', icon: Shield },
                  { value: 'other', label: 'Other', icon: File },
                ]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); resetPetForm() }}>Cancel</Button>
            <Button onClick={() => handlePetSubmit(editDialogOpen)} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialogOpen ? 'Update Pet' : 'Register Pet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />

      {/* ============================================ */}
      {/* VACCINATION DIALOG                          */}
      {/* ============================================ */}
      <Dialog open={vaccinationDialogOpen} onOpenChange={setVaccinationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Vaccination Record</DialogTitle>
            <DialogDescription>Record a vaccination for {selectedPet?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vaccine Name *</Label>
                <Input value={vaccinationForm.vaccineName} onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineName: e.target.value })} placeholder="e.g. Rabies" />
              </div>
              <div className="space-y-2">
                <Label>Vaccine Type</Label>
                <Input value={vaccinationForm.vaccineType} onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineType: e.target.value })} placeholder="e.g. Core" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Administered Date *</Label>
                <Input type="date" value={vaccinationForm.administeredDate} onChange={(e) => setVaccinationForm({ ...vaccinationForm, administeredDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Next Due Date</Label>
                <Input type="date" value={vaccinationForm.nextDueDate} onChange={(e) => setVaccinationForm({ ...vaccinationForm, nextDueDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Veterinarian</Label>
                <Input value={vaccinationForm.veterinarian} onChange={(e) => setVaccinationForm({ ...vaccinationForm, veterinarian: e.target.value })} placeholder="Doctor name" />
              </div>
              <div className="space-y-2">
                <Label>Clinic Name</Label>
                <Input value={vaccinationForm.clinicName} onChange={(e) => setVaccinationForm({ ...vaccinationForm, clinicName: e.target.value })} placeholder="Clinic name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={vaccinationForm.batchNumber} onChange={(e) => setVaccinationForm({ ...vaccinationForm, batchNumber: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Cost (₹)</Label>
                <Input type="number" value={vaccinationForm.cost} onChange={(e) => setVaccinationForm({ ...vaccinationForm, cost: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={vaccinationForm.notes} onChange={(e) => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })} placeholder="Optional notes" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVaccinationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVaccinationSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* HEALTH RECORD DIALOG                        */}
      {/* ============================================ */}
      <Dialog open={healthRecordDialogOpen} onOpenChange={setHealthRecordDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Health Record</DialogTitle>
            <DialogDescription>Record a health visit for {selectedPet?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Record Type *</Label>
                <Select value={healthRecordForm.recordType} onValueChange={(v) => setHealthRecordForm({ ...healthRecordForm, recordType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {healthRecordTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={healthRecordForm.title} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, title: e.target.value })} placeholder="e.g. Annual Checkup" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visit Date *</Label>
                <Input type="date" value={healthRecordForm.visitDate} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, visitDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Cost (₹)</Label>
                <Input type="number" value={healthRecordForm.cost} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, cost: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Veterinarian</Label>
                <Input value={healthRecordForm.veterinarian} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, veterinarian: e.target.value })} placeholder="Doctor name" />
              </div>
              <div className="space-y-2">
                <Label>Clinic Name</Label>
                <Input value={healthRecordForm.clinicName} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, clinicName: e.target.value })} placeholder="Clinic name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea value={healthRecordForm.diagnosis} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, diagnosis: e.target.value })} placeholder="Diagnosis details" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Treatment</Label>
              <Textarea value={healthRecordForm.treatment} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, treatment: e.target.value })} placeholder="Treatment details" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Medications</Label>
              <Input value={healthRecordForm.medications} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, medications: e.target.value })} placeholder="e.g. Amoxicillin 500mg" />
            </div>
            <div className="space-y-2">
              <Label>Next Visit Date</Label>
              <Input type="date" value={healthRecordForm.nextVisitDate} onChange={(e) => setHealthRecordForm({ ...healthRecordForm, nextVisitDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHealthRecordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleHealthRecordSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* REMINDER DIALOG                             */}
      {/* ============================================ */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
            <DialogDescription>Create a reminder for {selectedPet?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reminder Type *</Label>
                <Select value={reminderForm.reminderType} onValueChange={(v) => setReminderForm({ ...reminderForm, reminderType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {reminderTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={reminderForm.priority} onValueChange={(v) => setReminderForm({ ...reminderForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={reminderForm.title} onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} placeholder="e.g. Monthly vaccination" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={reminderForm.description} onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })} placeholder="Optional description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" value={reminderForm.dueDate} onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Recurring</Label>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isRecurring" checked={reminderForm.isRecurring} onChange={(e) => setReminderForm({ ...reminderForm, isRecurring: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="isRecurring" className="cursor-pointer">Recurring</Label>
                </div>
              </div>
            </div>
            {reminderForm.isRecurring && (
              <div className="space-y-2">
                <Label>Recurring Interval</Label>
                <Select value={reminderForm.recurringInterval} onValueChange={(v) => setReminderForm({ ...reminderForm, recurringInterval: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReminderSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* ACTIVITY LOG DIALOG                         */}
      {/* ============================================ */}
      <Dialog open={activityLogDialogOpen} onOpenChange={setActivityLogDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Record an activity for {selectedPet?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity Type *</Label>
                <Select value={activityLogForm.activityType} onValueChange={(v) => setActivityLogForm({ ...activityLogForm, activityType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activityTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={activityLogForm.activityDate} onChange={(e) => setActivityLogForm({ ...activityLogForm, activityDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={activityLogForm.description} onChange={(e) => setActivityLogForm({ ...activityLogForm, description: e.target.value })} placeholder="e.g. Morning walk in park" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input type="number" value={activityLogForm.duration} onChange={(e) => setActivityLogForm({ ...activityLogForm, duration: e.target.value })} placeholder="Optional" min="0" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={activityLogForm.notes} onChange={(e) => setActivityLogForm({ ...activityLogForm, notes: e.target.value })} placeholder="Optional" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityLogDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleActivityLogSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DELETE PET DIALOG                           */}
      {/* ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pet</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{selectedPet?.name}</strong> from the directory?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
