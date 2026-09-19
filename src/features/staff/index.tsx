import { useState, useEffect, useMemo } from 'react'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  Users, Plus, Search, Loader2, Edit, Trash2, X, Download,
  Shield, Wrench, Leaf, Clock, Calendar, CheckCircle2, XCircle,
  AlertCircle, User, Phone, Briefcase, DollarSign, Eye,
  ChevronDown, FileText, CreditCard, Banknote, Wallet,
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw,
  MapPin, BadgeCheck, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { orpc } from '@/server/client'
import { StaffPicker } from '@/components/staff-picker'
import { ImageUploadZone, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'
import { Paperclip } from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface StaffMember {
  id: number; societyId: number; firstName: string; lastName?: string
  phone?: string; alternatePhone?: string; email?: string
  department: string; designation?: string; shift?: string
  salary?: number; joiningDate?: string; dateOfBirth?: string
  dateOfLeaving?: string; idProofType?: string; idProofNumber?: string
  emergencyContactName?: string; emergencyContactPhone?: string
  bankName?: string; bankAccountNumber?: string; bankIfsc?: string
  aadhaarNumber?: string; panNumber?: string
  monthlyDeductions?: number; pfNumber?: string; esiNumber?: string
  isActive: boolean; createdAt: string
}
interface AttendanceRecord {
  id: number; staffId: number; date: string; checkIn?: string
  checkOut?: string; status: string; overtimeHours?: number
  notes?: string; createdAt: string
}
interface LeaveRequest {
  id: number; staffId: number; startDate: string; endDate: string
  reason?: string; type: string; status: string
  approvedBy?: number; approvedAt?: string; createdAt: string
}
interface SalaryRecord {
  id: number; staffId: number; month: string; basicSalary: number
  allowances?: number; deductions?: number; overtime?: number
  netPay: number; paymentMethod?: string; paymentDate?: string
  status: string; notes?: string; createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const departments = ['security', 'housekeeping', 'maintenance', 'gardening', 'admin', 'other']
const shifts = ['Day', 'Night', 'Morning', 'Evening', 'Split', 'On-Call']
const deptConfig: Record<string, { color: string; icon: any }> = {
  security: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Shield },
  housekeeping: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: Users },
  maintenance: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Wrench },
  gardening: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', icon: Leaf },
  admin: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Briefcase },
  other: { color: 'bg-muted text-muted-foreground', icon: Users },
}
const attStatusCfg: Record<string, { color: string; icon: any }> = {
  present: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2 },
  absent: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle },
  late: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: AlertCircle },
  half_day: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: Clock },
  leave: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Calendar },
}
const leaveTypes = ['sick', 'casual', 'earned', 'unpaid', 'other']
const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2025, i, 1)
  return { value: `${d.getFullYear()}-${String(i + 1).padStart(2, '0')}`, label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }) }
})
const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

function getMonthLabel(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

// ============================================
// MAIN COMPONENT
// ============================================
export function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([])
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([])
  const [salaryList, setSalaryList] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [tab, setTab] = useState('roster')
  const [activeStaffFilter, setActiveStaffFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Dialog states
  const [dlg, setDlg] = useState<{
    create: boolean; edit: boolean; del: boolean; view: boolean
    attendance: boolean; leave: boolean; salary: boolean; bulkSalary: boolean
  }>({ create: false, edit: false, del: false, view: false, attendance: false, leave: false, salary: false, bulkSalary: false })
  const [sel, setSel] = useState<StaffMember | null>(null)
  const [selAtt, setSelAtt] = useState<AttendanceRecord | null>(null)

  // Form
  const blankStaff = { firstName: '', lastName: '', phone: '', email: '', department: 'security', designation: '', shift: 'Day', salary: '', joiningDate: '', dateOfBirth: '', idProofType: '', idProofNumber: '', aadhaarNumber: '', panNumber: '', emergencyContactName: '', emergencyContactPhone: '', bankName: '', bankAccountNumber: '', bankIfsc: '', pfNumber: '', esiNumber: '', monthlyDeductions: '' }
  const [form, setForm] = useState(blankStaff)
  const [attForm, setAttForm] = useState({ staffId: '', status: 'present', notes: '' })
  const [leaveForm, setLeaveForm] = useState({ staffId: '', startDate: '', endDate: '', reason: '', type: 'casual' })
  const [salForm, setSalForm] = useState({ staffId: '', month: currentMonth, basicSalary: '', allowances: '', deductions: '', overtime: '', paymentMethod: 'bank_transfer', notes: '' })
  const [attDateFilter, setAttDateFilter] = useState('')
  const [salMonthFilter, setSalMonthFilter] = useState(currentMonth)
  const [idProofImage, setIdProofImage] = useState<string | null>(null)
  const [staffDocuments, setStaffDocuments] = useState<UploadedDocument[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // ===== FETCH =====
  const fetchAll = async () => {
    try {
      const [s, a, l, sa] = await Promise.all([
        orpc.staff.list({}), orpc.attendance.list({}),
        orpc.staffLeaves.list(), orpc.staffSalaries.list({}),
      ])
      setStaffList(s || []); setAttendanceList(a || []); setLeaveList(l || []); setSalaryList(sa || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  // ===== FILTERS =====
  const filteredStaff = useMemo(() => staffList.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.firstName?.toLowerCase().includes(q) || s.lastName?.toLowerCase().includes(q) || s.phone?.includes(q) || s.designation?.toLowerCase().includes(q)
    const matchDept = deptFilter === 'all' || s.department === deptFilter
    const matchActive = activeStaffFilter === 'all' || (activeStaffFilter === 'active' && s.isActive) || (activeStaffFilter === 'inactive' && !s.isActive)
    return matchSearch && matchDept && matchActive
  }), [staffList, search, deptFilter, activeStaffFilter])

  const filteredAttendance = useMemo(() => {
    let list = attendanceList
    if (attDateFilter) list = list.filter(a => String(a.date).startsWith(attDateFilter))
    return list
  }, [attendanceList, attDateFilter])

  const filteredSalaries = useMemo(() => salaryList.filter(s => !salMonthFilter || s.month === salMonthFilter), [salaryList, salMonthFilter])

  // ===== STATS =====
  const totalStaff = staffList.length, activeCount = staffList.filter(s => s.isActive).length
  const today = new Date().toISOString().split('T')[0]
  const todayAtt = attendanceList.filter(a => String(a.date).startsWith(today))
  const presentToday = todayAtt.filter(a => ['present', 'late'].includes(a.status)).length
  const absentToday = todayAtt.filter(a => a.status === 'absent').length
  const pendingLeaves = leaveList.filter(l => l.status === 'pending').length
  const monthSal = salaryList.filter(s => s.month === salMonthFilter)
  const totalPayroll = monthSal.reduce((sum, s) => sum + Number(s.netPay || 0), 0)
  const paidPayroll = monthSal.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.netPay || 0), 0)
  const pendingPayroll = totalPayroll - paidPayroll

  // ===== DUTY ROSTER (grouped by department + shift) =====
  const dutyRoster = useMemo(() => {
    const grouped: Record<string, Record<string, StaffMember[]>> = {}
    staffList.filter(s => s.isActive).forEach(s => {
      if (!grouped[s.department]) grouped[s.department] = {}
      const sh = s.shift || 'Day'
      if (!grouped[s.department][sh]) grouped[s.department][sh] = []
      grouped[s.department][sh].push(s)
    })
    return grouped
  }, [staffList])

  // ===== FORM HELPERS =====
  const resetForm = () => { setForm(blankStaff); setErrs({}) }
  const validate = () => { const e: Record<string, string> = {}; if (!form.firstName.trim()) e.firstName = 'Required'; setErrs(e); return Object.keys(e).length === 0 }

  // ===== STAFF CRUD =====
  const openCreate = () => { resetForm(); setDlg(d => ({ ...d, create: true })) }
  const openEdit = (s: StaffMember) => {
    setSel(s); setForm({
      firstName: s.firstName || '', lastName: s.lastName || '', phone: s.phone || '', email: s.email || '',
      department: s.department || 'security', designation: s.designation || '', shift: s.shift || 'Day',
      salary: s.salary?.toString() || '', joiningDate: s.joiningDate ? new Date(s.joiningDate).toISOString().split('T')[0] : '',
      dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '', idProofType: s.idProofType || '', idProofNumber: s.idProofNumber || '',
      aadhaarNumber: s.aadhaarNumber || '', panNumber: s.panNumber || '',
      emergencyContactName: s.emergencyContactName || '', emergencyContactPhone: s.emergencyContactPhone || '',
      bankName: s.bankName || '', bankAccountNumber: s.bankAccountNumber || '', bankIfsc: s.bankIfsc || '',
      pfNumber: s.pfNumber || '', esiNumber: s.esiNumber || '', monthlyDeductions: s.monthlyDeductions?.toString() || '',
    }); setDlg(d => ({ ...d, edit: true }))
  }
  const openView = (s: StaffMember) => { setSel(s); setDlg(d => ({ ...d, view: true })) }
  const openDel = (s: StaffMember) => { setSel(s); setDlg(d => ({ ...d, del: true })) }

  const submitCreate = async () => {
    if (!validate()) return; setSubmitting(true)
    try {
      await orpc.staff.create({ societyId: 1, firstName: form.firstName, lastName: form.lastName || undefined, phone: form.phone || undefined, email: form.email || undefined, department: form.department as any, designation: form.designation || undefined, shift: form.shift || undefined, salary: form.salary ? Number(form.salary) : undefined, joiningDate: form.joiningDate || undefined })
      setDlg(d => ({ ...d, create: false })); fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const submitEdit = async () => {
    if (!validate() || !sel) return; setSubmitting(true)
    try {
      await orpc.staff.update({ id: sel.id, data: {
        firstName: form.firstName, lastName: form.lastName || undefined, phone: form.phone || undefined, email: form.email || undefined,
        department: form.department, designation: form.designation || undefined, shift: form.shift || undefined,
        salary: form.salary ? Number(form.salary) : undefined, joiningDate: form.joiningDate ? new Date(form.joiningDate) : undefined,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined,
        idProofType: form.idProofType || undefined, idProofNumber: form.idProofNumber || undefined,
        aadhaarNumber: form.aadhaarNumber || undefined, panNumber: form.panNumber || undefined,
        emergencyContactName: form.emergencyContactName || undefined, emergencyContactPhone: form.emergencyContactPhone || undefined,
        bankName: form.bankName || undefined, bankAccountNumber: form.bankAccountNumber || undefined, bankIfsc: form.bankIfsc || undefined,
        pfNumber: form.pfNumber || undefined, esiNumber: form.esiNumber || undefined,
        monthlyDeductions: form.monthlyDeductions ? Number(form.monthlyDeductions) : undefined,
      }})
      setDlg(d => ({ ...d, edit: false })); fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const submitDel = async () => {
    if (!sel) return; setSubmitting(true)
    try { await orpc.staff.delete({ id: sel.id }); setDlg(d => ({ ...d, del: false })); fetchAll() } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ===== ATTENDANCE =====
  const doCheckIn = async (staffId: number, status = 'present') => {
    try { await orpc.attendance.checkIn({ staffId, status: status as any }); fetchAll() } catch (e) { console.error(e) }
  }
  const doCheckOut = async (id: number) => {
    try { await orpc.attendance.checkOut({ id }); fetchAll() } catch (e) { console.error(e) }
  }
  const submitAtt = async () => {
    if (!attForm.staffId) return; setSubmitting(true)
    try { await orpc.attendance.checkIn({ staffId: Number(attForm.staffId), status: attForm.status as any, notes: attForm.notes || undefined }); setDlg(d => ({ ...d, attendance: false })); setAttForm({ staffId: '', status: 'present', notes: '' }); fetchAll() } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ===== LEAVES =====
  const submitLeave = async () => {
    if (!leaveForm.staffId || !leaveForm.startDate || !leaveForm.endDate) return; setSubmitting(true)
    try { await orpc.staffLeaves.create({ staffId: Number(leaveForm.staffId), startDate: leaveForm.startDate, endDate: leaveForm.endDate, reason: leaveForm.reason || undefined, type: leaveForm.type as any }); setDlg(d => ({ ...d, leave: false })); setLeaveForm({ staffId: '', startDate: '', endDate: '', reason: '', type: 'casual' }); fetchAll() } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const doApproveLeave = async (id: number) => {
    try { await orpc.staffLeaves.approve({ id, approvedBy: 1 }); fetchAll() } catch (e) { console.error(e) }
  }
  const doRejectLeave = async (id: number) => {
    try { await orpc.staffLeaves.approve({ id, approvedBy: 1 }); fetchAll() } catch (e) { console.error(e) }
  }

  // ===== SALARY =====
  const openSalary = (s: StaffMember) => {
    setSalForm({ staffId: s.id.toString(), month: currentMonth, basicSalary: s.salary?.toString() || '', allowances: '', deductions: s.monthlyDeductions?.toString() || '', overtime: '', paymentMethod: 'bank_transfer', notes: '' })
    setDlg(d => ({ ...d, salary: true }))
  }
  const submitSalary = async () => {
    if (!salForm.staffId || !salForm.basicSalary) return; setSubmitting(true)
    try {
      await orpc.staffSalaries.create({ staffId: Number(salForm.staffId), month: salForm.month, basicSalary: Number(salForm.basicSalary), allowances: salForm.allowances ? Number(salForm.allowances) : 0, deductions: salForm.deductions ? Number(salForm.deductions) : 0, overtime: salForm.overtime ? Number(salForm.overtime) : 0, paymentMethod: salForm.paymentMethod as any, notes: salForm.notes || undefined })
      setDlg(d => ({ ...d, salary: false })); fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const doMarkPaid = async (id: number) => {
    try { await orpc.staffSalaries.markPaid({ id }); fetchAll() } catch (e) { console.error(e) }
  }

  // ===== STAFF FORM JSX =====
  const StaffFormFields = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First name" className={errs.firstName ? 'border-destructive' : ''} />{errs.firstName && <p className="text-xs text-destructive">{errs.firstName}</p>}</div>
        <div className="space-y-2"><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
        <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} /></div>
      </div>

      <Separator />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Employment Details</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Department *</Label><Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Head Guard" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Shift</Label><Select value={form.shift} onValueChange={v => setForm({ ...form, shift: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{shifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Monthly Salary (₹)</Label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} min="0" /></div>
        <div className="space-y-2"><Label>Monthly Deductions (₹)</Label><Input type="number" value={form.monthlyDeductions} onChange={e => setForm({ ...form, monthlyDeductions: e.target.value })} min="0" /></div>
      </div>

      <Separator />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ID & Tax Information</h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>ID Proof Type</Label><Select value={form.idProofType} onValueChange={v => setForm({ ...form, idProofType: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>ID Proof Number</Label><Input value={form.idProofNumber} onChange={e => setForm({ ...form, idProofNumber: e.target.value })} placeholder="ID number" /></div>
        <div className="space-y-2"><Label>Aadhaar Number</Label><Input value={form.aadhaarNumber} onChange={e => setForm({ ...form, aadhaarNumber: e.target.value })} placeholder="12-digit Aadhaar" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>PAN Number</Label><Input value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value })} placeholder="ABCDE1234F" /></div>
        <div className="space-y-2"><Label>PF Number</Label><Input value={form.pfNumber} onChange={e => setForm({ ...form, pfNumber: e.target.value })} placeholder="PF number" /></div>
        <div className="space-y-2"><Label>ESI Number</Label><Input value={form.esiNumber} onChange={e => setForm({ ...form, esiNumber: e.target.value })} placeholder="ESI number" /></div>
      </div>

      <Separator />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Contact Name</Label><Input value={form.emergencyContactName} onChange={e => setForm({ ...form, emergencyContactName: e.target.value })} placeholder="Emergency contact" /></div>
        <div className="space-y-2"><Label>Contact Phone</Label><Input value={form.emergencyContactPhone} onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })} placeholder="+91 98765 43210" /></div>
      </div>

      <Separator />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bank Details</h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Bank Name</Label><Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="Bank name" /></div>
        <div className="space-y-2"><Label>Account Number</Label><Input value={form.bankAccountNumber} onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })} placeholder="Account number" /></div>
        <div className="space-y-2"><Label>IFSC Code</Label><Input value={form.bankIfsc} onChange={e => setForm({ ...form, bankIfsc: e.target.value })} placeholder="IFSC code" /></div>
      </div>

      <Separator />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ID Proof & Documents</h4>
      <ImageUploadZone
        label="ID Proof Photo"
        icon={FileText}
        image={idProofImage}
        onUpload={setIdProofImage}
        onRemove={() => setIdProofImage(null)}
        hint="Aadhaar, PAN, etc."
      />
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Documents</Label>
        <DocumentUploader
          documents={staffDocuments}
          onAdd={(doc) => setStaffDocuments([...staffDocuments, doc])}
          onRemove={(idx) => setStaffDocuments(staffDocuments.filter((_, i) => i !== idx))}
          onView={(doc) => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }}
        />
      </div>
    </div>
  )

  // ===== STAFF ROSTER TABLE =====
  const rosterCols: ColumnDef<StaffMember>[] = [
    { accessorKey: 'firstName', header: 'Staff Member', cell: ({ row }) => { const c = deptConfig[row.original.department] || deptConfig.other; const I = c.icon; return (<div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}><I className="h-5 w-5" /></div><div><p className="font-medium">{row.original.firstName} {row.original.lastName || ''}</p><p className="text-xs text-muted-foreground capitalize">{row.original.department} · {row.original.designation || 'Staff'}</p></div></div>) } },
    { accessorKey: 'phone', header: 'Contact', cell: ({ row }) => (<div className="text-sm"><p>{row.original.phone || '-'}</p>{row.original.email && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{row.original.email}</p>}</div>) },
    { accessorKey: 'shift', header: 'Shift', cell: ({ row }) => (<Badge variant="outline">{row.original.shift || 'Day'}</Badge>) },
    { accessorKey: 'salary', header: 'Salary', cell: ({ row }) => (<span className="font-medium">₹{Number(row.original.salary || 0).toLocaleString('en-IN')}</span>) },
    { accessorKey: 'joiningDate', header: 'Joined', cell: ({ row }) => (<span className="text-sm">{row.original.joiningDate ? new Date(row.original.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>) },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => (<Badge variant={row.original.isActive ? 'default' : 'secondary'} className={row.original.isActive ? 'bg-green-600' : ''}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>) },
    { id: 'actions', header: '', cell: ({ row }) => { const s = row.original; return (<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(s)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => doCheckIn(s.id)} title="Quick Check-in"><CheckCircle2 className="h-4 w-4 text-green-600" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDel(s)}><Trash2 className="h-4 w-4" /></Button></div>) } },
  ]
  const rosterTbl = useTable({ data: filteredStaff, columns: rosterCols, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageIndex: 0, pageSize: 10 } } })

  // ===== ATTENDANCE TABLE =====
  const attCols: ColumnDef<AttendanceRecord>[] = [
    { accessorKey: 'staffId', header: 'Staff', cell: ({ row }) => { const s = staffList.find(x => x.id === row.original.staffId); return <span className="font-medium">{s ? `${s.firstName} ${s.lastName || ''}` : `#${row.original.staffId}`}</span> } },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => <span className="text-sm">{new Date(row.original.date).toLocaleDateString('en-IN')}</span> },
    { accessorKey: 'checkIn', header: 'Check In', cell: ({ row }) => <span className="text-sm font-mono">{row.original.checkIn ? new Date(row.original.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</span> },
    { accessorKey: 'checkOut', header: 'Check Out', cell: ({ row }) => <span className="text-sm font-mono">{row.original.checkOut ? new Date(row.original.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const c = attStatusCfg[row.original.status] || attStatusCfg.present; return <Badge className={`${c.color} border-0`}>{row.original.status?.replace('_', ' ')?.replace(/\b\w/g, c => c.toUpperCase())}</Badge> } },
    { accessorKey: 'overtimeHours', header: 'OT Hours', cell: ({ row }) => <span className="text-sm">{Number(row.original.overtimeHours || 0) > 0 ? `${row.original.overtimeHours}h` : '-'}</span> },
    { id: 'actions', header: '', cell: ({ row }) => !row.original.checkOut ? <Button variant="ghost" size="sm" onClick={() => doCheckOut(row.original.id)}><Clock className="mr-1 h-3 w-3" /> Check Out</Button> : null },
  ]
  const attTbl = useTable({ data: filteredAttendance, columns: attCols, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageIndex: 0, pageSize: 15 } } })

  // ===== LEAVE TABLE =====
  const leaveCols: ColumnDef<LeaveRequest>[] = [
    { accessorKey: 'staffId', header: 'Staff', cell: ({ row }) => { const s = staffList.find(x => x.id === row.original.staffId); return <span className="font-medium">{s ? `${s.firstName} ${s.lastName || ''}` : `#${row.original.staffId}`}</span> } },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.type}</Badge> },
    { accessorKey: 'startDate', header: 'From', cell: ({ row }) => <span className="text-sm">{new Date(row.original.startDate).toLocaleDateString('en-IN')}</span> },
    { accessorKey: 'endDate', header: 'To', cell: ({ row }) => <span className="text-sm">{new Date(row.original.endDate).toLocaleDateString('en-IN')}</span> },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <span className="text-sm text-muted-foreground max-w-[200px] truncate">{row.original.reason || '-'}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'approved' ? 'default' : row.original.status === 'rejected' ? 'destructive' : 'secondary'} className={row.original.status === 'approved' ? 'bg-green-600' : ''}>{row.original.status?.charAt(0).toUpperCase() + row.original.status?.slice(1)}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => row.original.status === 'pending' ? (<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => doApproveLeave(row.original.id)} title="Approve"><CheckCircle2 className="h-4 w-4 text-green-600" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => doRejectLeave(row.original.id)} title="Reject"><XCircle className="h-4 w-4 text-red-600" /></Button></div>) : null },
  ]
  const leaveTbl = useTable({ data: leaveList, columns: leaveCols, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageIndex: 0, pageSize: 15 } } })

  // ===== SALARY TABLE =====
  const salCols: ColumnDef<SalaryRecord>[] = [
    { accessorKey: 'staffId', header: 'Staff', cell: ({ row }) => { const s = staffList.find(x => x.id === row.original.staffId); return <span className="font-medium">{s ? `${s.firstName} ${s.lastName || ''}` : `#${row.original.staffId}`}</span> } },
    { accessorKey: 'month', header: 'Month', cell: ({ row }) => <span className="text-sm">{getMonthLabel(row.original.month)}</span> },
    { accessorKey: 'basicSalary', header: 'Basic', cell: ({ row }) => <span className="text-sm">₹{Number(row.original.basicSalary).toLocaleString('en-IN')}</span> },
    { accessorKey: 'allowances', header: 'Allow.', cell: ({ row }) => <span className="text-sm text-green-600">+₹{Number(row.original.allowances || 0).toLocaleString('en-IN')}</span> },
    { accessorKey: 'deductions', header: 'Ded.', cell: ({ row }) => <span className="text-sm text-red-600">-₹{Number(row.original.deductions || 0).toLocaleString('en-IN')}</span> },
    { accessorKey: 'overtime', header: 'OT', cell: ({ row }) => <span className="text-sm">{Number(row.original.overtime || 0) > 0 ? `+₹${Number(row.original.overtime).toLocaleString('en-IN')}` : '-'}</span> },
    { accessorKey: 'netPay', header: 'Net Pay', cell: ({ row }) => <span className="font-bold">₹{Number(row.original.netPay).toLocaleString('en-IN')}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'paid' ? 'default' : 'secondary'} className={row.original.status === 'paid' ? 'bg-green-600' : 'bg-amber-100 text-amber-700'}>{row.original.status?.charAt(0).toUpperCase() + row.original.status?.slice(1)}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => row.original.status === 'pending' ? <Button variant="ghost" size="sm" onClick={() => doMarkPaid(row.original.id)}><Banknote className="mr-1 h-3 w-3" /> Mark Paid</Button> : null },
  ]
  const salTbl = useTable({ data: filteredSalaries, columns: salCols, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageIndex: 0, pageSize: 15 } } })

  const TablePagination = ({ tbl, total }: { tbl: any; total: number }) => (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">Showing {tbl.getState().pagination.pageIndex * tbl.getState().pagination.pageSize + 1} to {Math.min((tbl.getState().pagination.pageIndex + 1) * tbl.getState().pagination.pageSize, total)} of {total}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => tbl.previousPage()} disabled={!tbl.getCanPreviousPage()}>Prev</Button>
        <span className="text-sm text-muted-foreground">{tbl.getState().pagination.pageIndex + 1}/{tbl.getPageCount()}</span>
        <Button variant="outline" size="sm" onClick={() => tbl.nextPage()} disabled={!tbl.getCanNextPage()}>Next</Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Staff Management</h1><p className="text-muted-foreground">Roster, duties, attendance, leaves & payroll</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Staff</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{totalStaff}</p><p className="text-xs text-muted-foreground">Total Staff</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950"><CheckCircle2 className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{presentToday}</p><p className="text-xs text-muted-foreground">Present Today</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{absentToday}</p><p className="text-xs text-muted-foreground">Absent Today</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950"><Calendar className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{pendingLeaves}</p><p className="text-xs text-muted-foreground">Pending Leaves</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950"><Wallet className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">₹{(totalPayroll / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Payroll ({getMonthLabel(salMonthFilter)})</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950"><CreditCard className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">₹{(paidPayroll / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Paid / ₹{(pendingPayroll / 1000).toFixed(0)}K Pending</p></div></div></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="roster"><Users className="mr-2 h-4 w-4" />Roster ({totalStaff})</TabsTrigger>
          <TabsTrigger value="duty"><Shield className="mr-2 h-4 w-4" />Duty Roster</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="mr-2 h-4 w-4" />Attendance ({attendanceList.length})</TabsTrigger>
          <TabsTrigger value="leaves"><Calendar className="mr-2 h-4 w-4" />Leaves ({leaveList.length})</TabsTrigger>
          <TabsTrigger value="salary"><DollarSign className="mr-2 h-4 w-4" />Salary ({salaryList.length})</TabsTrigger>
        </TabsList>

        {/* ===== ROSTER TAB ===== */}
        <TabsContent value="roster" className="space-y-4">
          <Card><CardContent className="p-4"><div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by name, phone, or designation..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />{search && <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setSearch('')}><X className="h-4 w-4" /></Button>}</div>
            <Select value={deptFilter} onValueChange={setDeptFilter}><SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Departments" /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{departments.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent></Select>
            <Select value={activeStaffFilter} onValueChange={v => setActiveStaffFilter(v as any)}><SelectTrigger className="w-full sm:w-[130px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
          </div></CardContent></Card>
          <Card><CardContent className="p-0">
            {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
              <>
                <Table><TableHeader>{rosterTbl.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                <TableBody>{rosterTbl.getRowModel().rows?.length ? rosterTbl.getRowModel().rows.map(row => <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openView(row.original)}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={rosterCols.length} className="h-24 text-center"><Users className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No staff found</p><Button variant="outline" size="sm" className="mt-2" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Staff</Button></TableCell></TableRow>}</TableBody></Table>
                <TablePagination tbl={rosterTbl} total={filteredStaff.length} />
              </>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* ===== DUTY ROSTER TAB ===== */}
        <TabsContent value="duty" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(dutyRoster).map(([dept, shifts]) => {
              const cfg = deptConfig[dept] || deptConfig.other
              const I = cfg.icon
              return (
                <Card key={dept}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.color}`}><I className="h-4 w-4" /></div><span className="capitalize">{dept}</span><Badge variant="secondary" className="ml-auto">{Object.values(shifts).flat().length} staff</Badge></CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(shifts).map(([shift, members]) => (
                        <div key={shift} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between"><Badge variant="outline" className="text-xs">{shift} Shift</Badge><span className="text-xs text-muted-foreground">{members.length} assigned</span></div>
                          <div className="space-y-1.5">
                            {members.map(m => (
                              <div key={m.id} className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5">
                                <div><p className="text-sm font-medium">{m.firstName} {m.lastName || ''}</p><p className="text-xs text-muted-foreground">{m.designation || 'Staff'}</p></div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => doCheckIn(m.id)} title="Quick Check-in"><CheckCircle2 className="h-3 w-3 text-green-600" /></Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {Object.keys(dutyRoster).length === 0 && <Card><CardContent className="py-12 text-center"><Shield className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No active staff for duty roster</p></CardContent></Card>}
          </div>
        </TabsContent>

        {/* ===== ATTENDANCE TAB ===== */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Filter by month:</Label>
              <Input type="month" value={attDateFilter} onChange={e => setAttDateFilter(e.target.value)} className="w-[180px]" />
              {attDateFilter && <Button variant="ghost" size="sm" onClick={() => setAttDateFilter('')}><X className="h-4 w-4" /> Clear</Button>}
            </div>
            <Button onClick={() => setDlg(d => ({ ...d, attendance: true }))}><Plus className="mr-2 h-4 w-4" /> Record Attendance</Button>
          </div>
          <Card><CardContent className="p-0">
            {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
              <>
                <Table><TableHeader>{attTbl.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                <TableBody>{attTbl.getRowModel().rows?.length ? attTbl.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={attCols.length} className="h-24 text-center"><Clock className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No attendance records</p></TableCell></TableRow>}</TableBody></Table>
                <TablePagination tbl={attTbl} total={filteredAttendance.length} />
              </>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* ===== LEAVES TAB ===== */}
        <TabsContent value="leaves" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setDlg(d => ({ ...d, leave: true }))}><Plus className="mr-2 h-4 w-4" /> Apply for Leave</Button>
          </div>
          <Card><CardContent className="p-0">
            {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
              <>
                <Table><TableHeader>{leaveTbl.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                <TableBody>{leaveTbl.getRowModel().rows?.length ? leaveTbl.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={leaveCols.length} className="h-24 text-center"><Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No leave requests</p></TableCell></TableRow>}</TableBody></Table>
                <TablePagination tbl={leaveTbl} total={leaveList.length} />
              </>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* ===== SALARY TAB ===== */}
        <TabsContent value="salary" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Month:</Label>
              <Select value={salMonthFilter} onValueChange={setSalMonthFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button onClick={() => setDlg(d => ({ ...d, salary: true }))}><Plus className="mr-2 h-4 w-4" /> Generate Salary</Button>
          </div>
          <Card><CardContent className="p-0">
            {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
              <>
                <Table><TableHeader>{salTbl.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                <TableBody>{salTbl.getRowModel().rows?.length ? salTbl.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={salCols.length} className="h-24 text-center"><DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No salary records for {getMonthLabel(salMonthFilter)}</p></TableCell></TableRow>}</TableBody></Table>
                <TablePagination tbl={salTbl} total={filteredSalaries.length} />
              </>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOGS ===== */}

      {/* CREATE/EDIT STAFF */}
      <Dialog open={dlg.create || dlg.edit} onOpenChange={o => { if (!o) { setDlg(d => ({ ...d, create: false, edit: false })); resetForm() } }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>{dlg.edit ? 'Edit Staff' : 'Add Staff Member'}</DialogTitle><DialogDescription>{dlg.edit ? 'Update staff details across all sections.' : 'Fill in the details to add a new staff member.'}</DialogDescription></DialogHeader>
          <StaffFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDlg(d => ({ ...d, create: false, edit: false })); resetForm() }}>Cancel</Button>
            <Button onClick={dlg.edit ? submitEdit : submitCreate} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{dlg.edit ? 'Update' : 'Add Staff'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />

      {/* VIEW STAFF */}
      <Dialog open={dlg.view} onOpenChange={o => setDlg(d => ({ ...d, view: o }))}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Staff Profile</DialogTitle></DialogHeader>
          {sel && (
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${deptConfig[sel.department]?.color || ''}`}>{(() => { const I = deptConfig[sel.department]?.icon || Users; return <I className="h-8 w-8" /> })()}</div>
                <div><h3 className="text-lg font-semibold">{sel.firstName} {sel.lastName || ''}</h3><p className="text-muted-foreground capitalize">{sel.department} · {sel.designation || 'Staff'} · {sel.shift || 'Day'} Shift</p><Badge variant={sel.isActive ? 'default' : 'secondary'} className={sel.isActive ? 'bg-green-600 mt-1' : 'mt-1'}>{sel.isActive ? 'Active' : 'Inactive'}</Badge></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{sel.phone || '-'}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{sel.email || '-'}</p></div>
                <div><p className="text-muted-foreground">Monthly Salary</p><p className="font-medium">₹{Number(sel.salary || 0).toLocaleString('en-IN')}</p></div>
                <div><p className="text-muted-foreground">Monthly Deductions</p><p className="font-medium">₹{Number(sel.monthlyDeductions || 0).toLocaleString('en-IN')}</p></div>
                <div><p className="text-muted-foreground">Joining Date</p><p className="font-medium">{sel.joiningDate ? new Date(sel.joiningDate).toLocaleDateString('en-IN') : '-'}</p></div>
                <div><p className="text-muted-foreground">Date of Birth</p><p className="font-medium">{sel.dateOfBirth ? new Date(sel.dateOfBirth).toLocaleDateString('en-IN') : '-'}</p></div>
              </div>
              {(sel.idProofType || sel.aadhaarNumber || sel.panNumber) && (<><Separator /><h4 className="text-sm font-semibold text-muted-foreground">ID & Tax</h4><div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-muted-foreground">ID Proof</p><p className="font-medium">{sel.idProofType || '-'}</p></div>
                <div><p className="text-muted-foreground">ID Number</p><p className="font-medium">{sel.idProofNumber || '-'}</p></div>
                <div><p className="text-muted-foreground">Aadhaar</p><p className="font-medium">{sel.aadhaarNumber || '-'}</p></div>
                <div><p className="text-muted-foreground">PAN</p><p className="font-medium">{sel.panNumber || '-'}</p></div>
                <div><p className="text-muted-foreground">PF Number</p><p className="font-medium">{sel.pfNumber || '-'}</p></div>
                <div><p className="text-muted-foreground">ESI Number</p><p className="font-medium">{sel.esiNumber || '-'}</p></div>
              </div></>)}
              {(sel.emergencyContactName || sel.bankName) && (<><Separator /><div className="grid grid-cols-2 gap-3 text-sm">
                {sel.emergencyContactName && <div><p className="text-muted-foreground">Emergency Contact</p><p className="font-medium">{sel.emergencyContactName} {sel.emergencyContactPhone ? `(${sel.emergencyContactPhone})` : ''}</p></div>}
                {sel.bankName && <div><p className="text-muted-foreground">Bank</p><p className="font-medium">{sel.bankName} {sel.bankAccountNumber ? `****${sel.bankAccountNumber.slice(-4)}` : ''}</p></div>}
              </div></>)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(d => ({ ...d, view: false }))}>Close</Button>
            {sel && <><Button variant="outline" onClick={() => { setDlg(d => ({ ...d, view: false })); openSalary(sel) }}><DollarSign className="mr-2 h-4 w-4" /> Salary</Button><Button onClick={() => { setDlg(d => ({ ...d, view: false })); openEdit(sel) }}><Edit className="mr-2 h-4 w-4" /> Edit</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE STAFF */}
      <Dialog open={dlg.del} onOpenChange={o => setDlg(d => ({ ...d, del: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Staff</DialogTitle><DialogDescription>Are you sure you want to delete <strong>{sel?.firstName} {sel?.lastName || ''}</strong>? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDlg(d => ({ ...d, del: false }))}>Cancel</Button><Button variant="destructive" onClick={submitDel} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RECORD ATTENDANCE */}
      <Dialog open={dlg.attendance} onOpenChange={o => setDlg(d => ({ ...d, attendance: o }))}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <StaffPicker value={attForm.staffId} onChange={v => setAttForm({ ...attForm, staffId: v })} label="Staff" required filterActive />
            <div className="space-y-2"><Label>Status</Label><Select value={attForm.status} onValueChange={v => setAttForm({ ...attForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="present">Present</SelectItem><SelectItem value="late">Late</SelectItem><SelectItem value="half_day">Half Day</SelectItem><SelectItem value="absent">Absent</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={attForm.notes} onChange={e => setAttForm({ ...attForm, notes: e.target.value })} placeholder="Optional notes" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDlg(d => ({ ...d, attendance: false }))}>Cancel</Button><Button onClick={submitAtt} disabled={submitting || !attForm.staffId}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* APPLY LEAVE */}
      <Dialog open={dlg.leave} onOpenChange={o => setDlg(d => ({ ...d, leave: o }))}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <StaffPicker value={leaveForm.staffId} onChange={v => setLeaveForm({ ...leaveForm, staffId: v })} label="Staff" required filterActive />
            <div className="space-y-2"><Label>Type</Label><Select value={leaveForm.type} onValueChange={v => setLeaveForm({ ...leaveForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{leaveTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Start *</Label><Input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} /></div><div className="space-y-2"><Label>End *</Label><Input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} /></div></div>
            <div className="space-y-2"><Label>Reason</Label><Input value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason for leave" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDlg(d => ({ ...d, leave: false }))}>Cancel</Button><Button onClick={submitLeave} disabled={submitting || !leaveForm.staffId || !leaveForm.startDate || !leaveForm.endDate}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GENERATE SALARY */}
      <Dialog open={dlg.salary} onOpenChange={o => setDlg(d => ({ ...d, salary: o }))}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Generate Salary Slip</DialogTitle><DialogDescription>Create a salary record for a staff member.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <StaffPicker value={salForm.staffId} onChange={v => setSalForm({ ...salForm, staffId: v })} onSelect={s => { if (s) setSalForm(prev => ({ ...prev, staffId: s.id.toString(), basicSalary: (s as any).salary?.toString() || '', deductions: (s as any).monthlyDeductions?.toString() || '' })) }} label="Staff" required filterActive />
            <div className="space-y-2"><Label>Month *</Label><Select value={salForm.month} onValueChange={v => setSalForm({ ...salForm, month: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Basic Salary (₹) *</Label><Input type="number" value={salForm.basicSalary} onChange={e => setSalForm({ ...salForm, basicSalary: e.target.value })} min="0" /></div>
              <div className="space-y-2"><Label>Allowances (₹)</Label><Input type="number" value={salForm.allowances} onChange={e => setSalForm({ ...salForm, allowances: e.target.value })} min="0" placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Deductions (₹)</Label><Input type="number" value={salForm.deductions} onChange={e => setSalForm({ ...salForm, deductions: e.target.value })} min="0" placeholder="0" /></div>
              <div className="space-y-2"><Label>Overtime Pay (₹)</Label><Input type="number" value={salForm.overtime} onChange={e => setSalForm({ ...salForm, overtime: e.target.value })} min="0" placeholder="0" /></div>
            </div>
            <div className="space-y-2"><Label>Payment Method</Label><Select value={salForm.paymentMethod} onValueChange={v => setSalForm({ ...salForm, paymentMethod: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem></SelectContent></Select></div>
            {salForm.basicSalary && (
              <div className="rounded-lg bg-muted p-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Net Pay:</span><span className="font-bold">₹{((Number(salForm.basicSalary) || 0) + (Number(salForm.allowances) || 0) - (Number(salForm.deductions) || 0) + (Number(salForm.overtime) || 0)).toLocaleString('en-IN')}</span></div></div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDlg(d => ({ ...d, salary: false }))}>Cancel</Button><Button onClick={submitSalary} disabled={submitting || !salForm.staffId || !salForm.basicSalary}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
