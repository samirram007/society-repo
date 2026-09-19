import { useState, useEffect } from 'react'
import {
  UserCheck,
  Plus,
  Loader2,
  LogIn,
  LogOut,
  Users,
  Car,
  Search,
  X,
  Edit,
  Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { orpc } from '@/server/client'
import { ImageUploadZone, DocumentPreviewDialog } from '@/components/document-uploader'
import { FileText } from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface Visitor {
  id: number
  societyId: number
  name: string
  phone?: string
  purpose?: string
  flatId: number
  entryTime: string
  exitTime?: string
  vehicleNumber?: string
  status: string
}

// ============================================
// MAIN COMPONENT
// ============================================
export function VisitorsPage() {
  // State
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: '',
    flatId: '1',
    vehicleNumber: '',
  })
  const [idProofImage, setIdProofImage] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch visitors
  const fetchVisitors = async () => {
    try {
      const data = await orpc.visitors.list({})
      setVisitors(data || [])
    } catch (error) {
      console.error('Failed to fetch visitors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisitors()
  }, [])

  // Filter visitors
  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.includes(search) ||
      v.purpose?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  // Stats
  const insideCount = visitors.filter((v) => v.status === 'inside').length
  const todayCount = visitors.length
  const checkedOutCount = visitors.filter((v) => v.status === 'checked_out').length
  const withVehicleCount = visitors.filter((v) => v.vehicleNumber).length

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.flatId) errors.flatId = 'Flat ID is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', phone: '', purpose: '', flatId: '1', vehicleNumber: '' })
    setFormErrors({})
  }

  // Open edit dialog
  const handleEdit = (visitor: Visitor) => {
    setSelectedVisitor(visitor)
    setFormData({
      name: visitor.name || '',
      phone: visitor.phone || '',
      purpose: visitor.purpose || '',
      flatId: visitor.flatId?.toString() || '1',
      vehicleNumber: visitor.vehicleNumber || '',
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (visitor: Visitor) => {
    setSelectedVisitor(visitor)
    setDeleteDialogOpen(true)
  }

  // Submit check-in
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.visitors.create({
        societyId: 1,
        name: formData.name,
        phone: formData.phone || undefined,
        purpose: formData.purpose || undefined,
        flatId: Number(formData.flatId),
        vehicleNumber: formData.vehicleNumber || undefined,
        idProofImage: idProofImage || undefined,
      })
      setCreateDialogOpen(false)
      resetForm()
      fetchVisitors()
    } catch (error) {
      console.error('Failed to check in visitor:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedVisitor) return
    setSubmitting(true)
    try {
      await orpc.visitors.update({
        id: selectedVisitor.id,
        data: {
          name: formData.name,
          phone: formData.phone || undefined,
          purpose: formData.purpose || undefined,
          flatId: Number(formData.flatId),
          vehicleNumber: formData.vehicleNumber || undefined,
        idProofImage: idProofImage || null,
        },
      })
      setEditDialogOpen(false)
      fetchVisitors()
    } catch (error) {
      console.error('Failed to update visitor:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedVisitor) return
    setSubmitting(true)
    try {
      await orpc.visitors.delete({ id: selectedVisitor.id })
      setDeleteDialogOpen(false)
      fetchVisitors()
    } catch (error) {
      console.error('Failed to delete visitor:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Check out visitor
  const handleCheckOut = async (id: number) => {
    try {
      await orpc.visitors.checkOut({ id })
      fetchVisitors()
    } catch (error) {
      console.error('Failed to check out visitor:', error)
    }
  }

  // Form content shared between create and edit
  const formContent = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Visitor Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter visitor name"
          className={formErrors.name ? 'border-destructive' : ''}
        />
        {formErrors.name && (
          <p className="text-xs text-destructive">{formErrors.name}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
          />
        </div>
        <div className="space-y-2">
          <Label>Vehicle Number</Label>
          <Input
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
            placeholder="Optional"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Purpose</Label>
        <Input
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="e.g. Delivery, Maintenance"
        />
      </div>
      <FlatPicker
        label="Visiting Flat"
        value={formData.flatId}
        onChange={(v) => setFormData({ ...formData, flatId: v })}
        error={formErrors.flatId}
        required
      />
      <ImageUploadZone
        label="ID Proof Photo"
        icon={FileText}
        image={idProofImage}
        onUpload={setIdProofImage}
        onRemove={() => setIdProofImage(null)}
        hint="Aadhaar, PAN, Driving License"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visitor Management</h1>
          <p className="text-muted-foreground">Track and manage visitor entries</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Log Visitor Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <LogIn className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insideCount}</p>
                <p className="text-xs text-muted-foreground">Currently Inside</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Today's Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <LogOut className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checkedOutCount}</p>
                <p className="text-xs text-muted-foreground">Checked Out</p>
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
                <p className="text-2xl font-bold">{withVehicleCount}</p>
                <p className="text-xs text-muted-foreground">With Vehicle</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or purpose..."
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
        </CardContent>
      </Card>

      {/* Visitors Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Visiting</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <UserCheck className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">No visitors found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{visitor.name}</p>
                          <p className="text-xs text-muted-foreground">{visitor.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{visitor.purpose || '-'}</TableCell>
                      <TableCell>Flat {visitor.flatId}</TableCell>
                      <TableCell>
                        {new Date(visitor.entryTime).toLocaleTimeString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {visitor.exitTime
                          ? new Date(visitor.exitTime).toLocaleTimeString('en-IN')
                          : '-'}
                      </TableCell>
                      <TableCell>{visitor.vehicleNumber || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={visitor.status === 'inside' ? 'default' : 'secondary'}
                        >
                          {visitor.status === 'inside' ? 'Inside' : 'Checked Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {visitor.status === 'inside' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-green-600 hover:text-green-700"
                              onClick={() => handleCheckOut(visitor.id)}
                            >
                              Check Out
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(visitor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteClick(visitor)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Check-In Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Visitor Entry</DialogTitle>
            <DialogDescription>Record a new visitor entry</DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={!formData.name || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Visitor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Visitor</DialogTitle>
            <DialogDescription>Update visitor details</DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!formData.name || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Visitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Visitor Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Visitor Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the record for <strong>{selectedVisitor?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={submitting}>
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
