import { useState, useEffect } from 'react'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  Users,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  MoreHorizontal,
  Download,
  Filter,
  X,
  Home,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FlatPicker } from '@/components/flat-picker'
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
import { Separator } from '@/components/ui/separator'
import { orpc } from '@/server/client'
import { DocumentUploader, ImageUploadZone, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'
import type { Member, Flat } from '@/interfaces'

// ============================================
// CONSTANTS
// ============================================
const roleColors: Record<string, string> = {
  owner: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  tenant: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  secretary: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  treasurer: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  chairman: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  committee_member: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
}

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'chairman', label: 'Chairman' },
  { value: 'committee_member', label: 'Committee Member' },
]

// ============================================
// MAIN COMPONENT
// ============================================
export function MembersPage() {
  // State
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'owner' as string,
    flatId: '',
  })
  const [idProofImage, setIdProofImage] = useState<string | null>(null)
  const [memberDocuments, setMemberDocuments] = useState<UploadedDocument[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch members
  const fetchMembers = async () => {
    try {
      const data = await orpc.members.list({})
      setMembers(data || [])
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      member.phone?.includes(search) ||
      member.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && member.isActive) ||
      (statusFilter === 'inactive' && !member.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Stats
  const totalMembers = members.length
  const activeMembers = members.filter((m) => m.isActive).length
  const owners = members.filter((m) => m.role === 'owner').length
  const tenants = members.filter((m) => m.role === 'tenant').length

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.phone.trim()) errors.phone = 'Phone is required'
    if (formData.phone && formData.phone.length < 10) errors.phone = 'Phone must be at least 10 digits'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', role: 'owner', flatId: '' })
    setFormErrors({})
  }

  // Open create dialog
  const handleCreate = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (member: Member) => {
    setSelectedMember(member)
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'owner',
      flatId: member.flatId?.toString() || '',
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member)
    setDeleteDialogOpen(true)
  }

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.members.create({
        societyId: 1,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email || undefined,
        role: formData.role as any,
        flatId: formData.flatId ? Number(formData.flatId) : undefined,
        idProofImage: idProofImage || undefined,
        documents: memberDocuments.length > 0 ? JSON.stringify(memberDocuments) : undefined,
      })
      setCreateDialogOpen(false)
      fetchMembers()
    } catch (error) {
      console.error('Failed to create member:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedMember) return
    setSubmitting(true)
    try {
      await orpc.members.update({
        id: selectedMember.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email || undefined,
          role: formData.role,
          flatId: formData.flatId ? Number(formData.flatId) : undefined,
          idProofImage: idProofImage || null,
          documents: memberDocuments.length > 0 ? JSON.stringify(memberDocuments) : null,
        },
      })
      setEditDialogOpen(false)
      fetchMembers()
    } catch (error) {
      console.error('Failed to update member:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedMember) return
    setSubmitting(true)
    try {
      await orpc.members.delete({ id: selectedMember.id })
      setDeleteDialogOpen(false)
      fetchMembers()
    } catch (error) {
      console.error('Failed to delete member:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Table columns
  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'name',
      header: 'Member',
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {member.profileImage && (
                <AvatarImage src={member.profileImage} alt={`${member.firstName} ${member.lastName}`} />
              )}
              <AvatarFallback className="text-sm font-medium">
                {member.firstName?.[0]}{member.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.firstName} {member.lastName}</p>
              <p className="text-xs text-muted-foreground">{member.email || member.phone}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'flatId',
      header: 'Flat',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.flatId || '-'}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role
        return (
          <Badge className={`${roleColors[role] || ''} border-0`}>
            {role?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(member)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => handleDeleteClick(member)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useTable({
    data: filteredMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage society members and their details
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeMembers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{owners}</p>
                <p className="text-xs text-muted-foreground">Owners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants}</p>
                <p className="text-xs text-muted-foreground">Tenants</p>
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
                placeholder="Search by name, email, or phone..."
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
                        onClick={() => handleEdit(row.original)}
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
                          <Users className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No members found</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Member
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
                    filteredMembers.length
                  )}{' '}
                  of {filteredMembers.length} members
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

      {/* ============================================
          CREATE/EDIT MEMBER DIALOG
          ============================================ */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen
                ? 'Update member details below.'
                : 'Fill in the details to add a new member.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className={formErrors.firstName ? 'border-destructive' : ''}
                />
                {formErrors.firstName && (
                  <p className="text-xs text-destructive">{formErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className={formErrors.lastName ? 'border-destructive' : ''}
                />
                {formErrors.lastName && (
                  <p className="text-xs text-destructive">{formErrors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className={formErrors.email ? 'border-destructive' : ''}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className={formErrors.phone ? 'border-destructive' : ''}
              />
              {formErrors.phone && (
                <p className="text-xs text-destructive">{formErrors.phone}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FlatPicker
                label="Flat"
                value={formData.flatId}
                onChange={(v) => setFormData({ ...formData, flatId: v })}
              />
            </div>
            {/* ID Proof Image */}
            <ImageUploadZone
              label="ID Proof Photo"
              icon={FileText}
              image={idProofImage}
              onUpload={setIdProofImage}
              onRemove={() => setIdProofImage(null)}
              hint="Aadhaar, PAN, Passport etc."
            />
            {/* Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Documents</Label>
              <DocumentUploader
                documents={memberDocuments}
                onAdd={(doc) => setMemberDocuments([...memberDocuments, doc])}
                onRemove={(idx) => setMemberDocuments(memberDocuments.filter((_, i) => i !== idx))}
                onView={(doc) => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }}
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
              {editDialogOpen ? 'Update Member' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE MEMBER DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {selectedMember?.firstName} {selectedMember?.lastName}
              </strong>
              ? This action cannot be undone.
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
      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />
    </div>
  )
}
