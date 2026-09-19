import { useState, useEffect } from 'react'
import {
  Dumbbell,
  Plus,
  Loader2,
  Clock,
  Users,
  Calendar,
  Star,
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
import { AmenityPicker } from '@/components/amenity-picker'
import { MemberPicker } from '@/components/member-picker'
import { FlatPicker } from '@/components/flat-picker'

// ============================================
// TYPES
// ============================================
interface Amenity {
  id: number
  societyId: number
  name: string
  description?: string
  category: string
  type: string
  price: number
  capacity: number
  location?: string
  operatingHoursStart?: string
  operatingHoursEnd?: string
  isActive: boolean
  createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const categoryConfig: Record<string, { color: string; icon: any }> = {
  sports: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: Dumbbell },
  recreation: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Calendar },
  fitness: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Dumbbell },
  community: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Users },
  kids: { color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300', icon: Star },
  other: { color: 'bg-muted text-muted-foreground', icon: Calendar },
}

const categories = ['sports', 'recreation', 'fitness', 'community', 'kids', 'other']

// ============================================
// MAIN COMPONENT
// ============================================
export function AmenitiesPage() {
  // State
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'fitness',
    type: 'paid',
    price: '0',
    capacity: '10',
    location: '',
    operatingHoursStart: '06:00',
    operatingHoursEnd: '22:00',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Booking dialog state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    amenityId: '',
    memberId: '',
    flatId: '',
    bookingDate: '',
    startTime: '09:00',
    endTime: '10:00',
    guests: '1',
    guestNames: '',
  })
  const [bookingSubmitting, setBookingSubmitting] = useState(false)

  // Fetch amenities
  const fetchAmenities = async () => {
    try {
      const data = await orpc.amenities.list({})
      setAmenities(data || [])
    } catch (error) {
      console.error('Failed to fetch amenities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAmenities()
  }, [])

  // Filter amenities
  const filteredAmenities = amenities.filter((amenity) => {
    const matchesSearch =
      amenity.name?.toLowerCase().includes(search.toLowerCase()) ||
      amenity.description?.toLowerCase().includes(search.toLowerCase()) ||
      amenity.location?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || amenity.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Stats
  const totalAmenities = amenities.length
  const activeAmenities = amenities.filter((a) => a.isActive).length
  const freeAmenities = amenities.filter((a) => a.type === 'free').length
  const paidAmenities = amenities.filter((a) => a.type === 'paid').length

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '', description: '', category: 'fitness', type: 'paid',
      price: '0', capacity: '10', location: '', operatingHoursStart: '06:00', operatingHoursEnd: '22:00',
    })
    setFormErrors({})
  }

  const resetBookingForm = () => {
    setBookingForm({
      amenityId: '', memberId: '', flatId: '', bookingDate: '',
      startTime: '09:00', endTime: '10:00', guests: '1', guestNames: '',
    })
  }

  // Open create dialog
  const handleCreate = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (amenity: Amenity) => {
    setSelectedAmenity(amenity)
    setFormData({
      name: amenity.name || '',
      description: amenity.description || '',
      category: amenity.category || 'fitness',
      type: amenity.type || 'paid',
      price: String(amenity.price || 0),
      capacity: String(amenity.capacity || 10),
      location: amenity.location || '',
      operatingHoursStart: amenity.operatingHoursStart || '06:00',
      operatingHoursEnd: amenity.operatingHoursEnd || '22:00',
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity)
    setDeleteDialogOpen(true)
  }

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.amenities.create({
        societyId: 1,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category as any,
        type: formData.type as any,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        location: formData.location || undefined,
        operatingHoursStart: formData.operatingHoursStart,
        operatingHoursEnd: formData.operatingHoursEnd,
      })
      setCreateDialogOpen(false)
      fetchAmenities()
    } catch (error) {
      console.error('Failed to create amenity:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedAmenity) return
    setSubmitting(true)
    try {
      await orpc.amenities.update({
        id: selectedAmenity.id,
        data: {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          type: formData.type,
          price: Number(formData.price),
          capacity: Number(formData.capacity),
          location: formData.location || undefined,
          operatingHoursStart: formData.operatingHoursStart,
          operatingHoursEnd: formData.operatingHoursEnd,
        },
      })
      setEditDialogOpen(false)
      fetchAmenities()
    } catch (error) {
      console.error('Failed to update amenity:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedAmenity) return
    setSubmitting(true)
    try {
      await orpc.amenities.delete({ id: selectedAmenity.id })
      setDeleteDialogOpen(false)
      fetchAmenities()
    } catch (error) {
      console.error('Failed to delete amenity:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit booking
  const handleBookingSubmit = async () => {
    if (!bookingForm.amenityId || !bookingForm.memberId || !bookingForm.flatId || !bookingForm.bookingDate) return
    setBookingSubmitting(true)
    try {
      await orpc.amenityBookings.create({
        societyId: 1,
        amenityId: Number(bookingForm.amenityId),
        memberId: Number(bookingForm.memberId),
        flatId: Number(bookingForm.flatId),
        bookingDate: new Date(bookingForm.bookingDate),
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        guests: Number(bookingForm.guests) || 1,
        guestNames: bookingForm.guestNames || undefined,
      })
      setBookingDialogOpen(false)
      resetBookingForm()
    } catch (error) {
      console.error('Failed to create booking:', error)
    } finally {
      setBookingSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Amenities</h1>
          <p className="text-muted-foreground">Manage society amenities and bookings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { resetBookingForm(); setBookingDialogOpen(true) }}>
            <Calendar className="mr-2 h-4 w-4" />
            Book Amenity
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Amenity
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Dumbbell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAmenities}</p>
                <p className="text-xs text-muted-foreground">Total Amenities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAmenities}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{freeAmenities}</p>
                <p className="text-xs text-muted-foreground">Free</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{paidAmenities}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
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
                placeholder="Search amenities by name, description, or location..."
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Amenities Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAmenities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2">No amenities found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAmenities.map((amenity) => {
            const catConfig = categoryConfig[amenity.category] || categoryConfig.other
            const CatIcon = catConfig.icon
            return (
              <Card key={amenity.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${catConfig.color}`}>
                        <CatIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{amenity.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{amenity.category}</p>
                      </div>
                    </div>
                    <Badge variant={amenity.type === 'free' ? 'secondary' : 'default'}>
                      {amenity.type === 'free' ? 'Free' : `₹${amenity.price}`}
                    </Badge>
                  </div>
                  {amenity.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{amenity.description}</p>
                  )}
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{amenity.capacity} people</span>
                    </div>
                    {amenity.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium">{amenity.location}</span>
                      </div>
                    )}
                    {amenity.operatingHoursStart && amenity.operatingHoursEnd && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Hours</span>
                        <span className="font-medium">{amenity.operatingHoursStart} - {amenity.operatingHoursEnd}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(amenity)}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(amenity)}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ============================================
          CREATE/EDIT AMENITY DIALOG
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
            <DialogTitle>{editDialogOpen ? 'Edit Amenity' : 'Add New Amenity'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update amenity details below.' : 'Fill in the details to add a new amenity.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Swimming Pool"
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the amenity"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Block A, Ground Floor"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={formData.operatingHoursStart}
                  onChange={(e) => setFormData({ ...formData, operatingHoursStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={formData.operatingHoursEnd}
                  onChange={(e) => setFormData({ ...formData, operatingHoursEnd: e.target.value })}
                />
              </div>
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
              {editDialogOpen ? 'Update Amenity' : 'Add Amenity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          BOOK AMENITY DIALOG
          ============================================ */}
      <Dialog open={bookingDialogOpen} onOpenChange={(open) => {
        if (!open) { setBookingDialogOpen(false); resetBookingForm() }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book Amenity</DialogTitle>
            <DialogDescription>Select an amenity and fill in the booking details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <AmenityPicker
              value={bookingForm.amenityId}
              onChange={(v) => setBookingForm({ ...bookingForm, amenityId: v })}
              label="Amenity"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <MemberPicker
                value={bookingForm.memberId}
                onChange={(v) => setBookingForm({ ...bookingForm, memberId: v })}
                label="Booked By"
                required
              />
              <FlatPicker
                label="Flat"
                value={bookingForm.flatId}
                onChange={(v) => setBookingForm({ ...bookingForm, flatId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Booking Date *</Label>
              <Input
                type="date"
                value={bookingForm.bookingDate}
                onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guests</Label>
                <Input
                  type="number"
                  value={bookingForm.guests}
                  onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Guest Names</Label>
                <Input
                  value={bookingForm.guestNames}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestNames: e.target.value })}
                  placeholder="Comma-separated"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBookingDialogOpen(false); resetBookingForm() }}>Cancel</Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={!bookingForm.amenityId || !bookingForm.memberId || !bookingForm.flatId || !bookingForm.bookingDate || bookingSubmitting}
            >
              {bookingSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE AMENITY DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Amenity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedAmenity?.name}</strong>? This action cannot be undone.
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
    </div>
  )
}
