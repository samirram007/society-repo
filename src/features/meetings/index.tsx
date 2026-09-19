import { useState, useEffect } from 'react'
import {
  Calendar,
  Plus,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Edit,
  Trash2,
  X,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { MemberPicker } from '@/components/member-picker'
import { DocumentPicker } from '@/components/document-picker'

// ============================================
// TYPES
// ============================================
interface Meeting {
  id: number
  societyId: number
  title: string
  description?: string
  meetingDate: string
  location?: string
  organizedBy: string | number
  status: string
  minutes?: string
  attachments?: string | null
  createdAt: string
}

interface MeetingAttendee {
  id: number
  meetingId: number
  memberId: number
  status: string
}

// ============================================
// CONSTANTS
// ============================================
const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  scheduled: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Clock, label: 'Scheduled' },
  ongoing: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Clock, label: 'Ongoing' },
  completed: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2, label: 'Completed' },
  cancelled: { color: 'bg-muted text-muted-foreground', icon: XCircle, label: 'Cancelled' },
}

const statusOptions = ['scheduled', 'ongoing', 'completed', 'cancelled']

// ============================================
// MAIN COMPONENT
// ============================================
export function MeetingsPage() {
  // State
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingDate: '',
    location: '',
    organizedBy: '',
    status: 'scheduled',
    minutes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Attendees state
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([])
  const [attendeeIds, setAttendeeIds] = useState<string[]>([])
  const [attachmentIds, setAttachmentIds] = useState<string[]>([])
  const [addAttendeeOpen, setAddAttendeeOpen] = useState(false)
  const [newAttendeeId, setNewAttendeeId] = useState('')

  // Fetch meetings
  const fetchMeetings = async () => {
    try {
      const data = await orpc.meetings.list({})
      setMeetings(data || [])
    } catch (error) {
      console.error('Failed to fetch meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [])

  // Split meetings
  const upcoming = meetings.filter((m) => m.status === 'scheduled')
  const past = meetings.filter((m) => m.status === 'completed')

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.meetingDate) errors.meetingDate = 'Date is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({ title: '', description: '', meetingDate: '', location: '', organizedBy: '', status: 'scheduled', minutes: '' })
    setFormErrors({})
    setAttendeeIds([])
    setAttachmentIds([])
    setAttendees([])
  }

  // Fetch attendees for a meeting
  const fetchAttendees = async (meetingId: number) => {
    try {
      const data = await orpc.meetingAttendees.list({ meetingId }) as MeetingAttendee[]
      setAttendees(data || [])
      setAttendeeIds((data || []).map(a => a.memberId.toString()))
    } catch (error) {
      console.error('Failed to fetch attendees:', error)
    }
  }

  // Open edit dialog
  const handleEdit = async (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    const dateStr = meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().slice(0, 16) : ''
    setFormData({
      title: meeting.title || '',
      description: meeting.description || '',
      meetingDate: dateStr,
      location: meeting.location || '',
      organizedBy: typeof meeting.organizedBy === 'string' ? meeting.organizedBy : '',
      status: meeting.status || 'scheduled',
      minutes: meeting.minutes || '',
    })
    // Parse attachments from JSON
    try {
      const atts = meeting.attachments ? JSON.parse(meeting.attachments) : []
      setAttachmentIds(atts.map((a: any) => a.id?.toString() || a.toString()))
    } catch { setAttachmentIds([]) }
    await fetchAttendees(meeting.id)
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setDeleteDialogOpen(true)
  }

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const result: any = await orpc.meetings.create({
        societyId: 1,
        title: formData.title,
        description: formData.description || undefined,
        meetingDate: new Date(formData.meetingDate),
        location: formData.location || undefined,
        organizedBy: formData.organizedBy || undefined,
        status: 'scheduled',
        attachments: attachmentIds.length > 0 ? JSON.stringify(attachmentIds.map(id => ({ id }))) : undefined,
      })
      // Add attendees if any
      if (attendeeIds.length > 0 && result?.id) {
        await orpc.meetingAttendees.addBulk({
          meetingId: result.id,
          memberIds: attendeeIds.map(Number),
        })
      }
      setCreateDialogOpen(false)
      resetForm()
      fetchMeetings()
    } catch (error) {
      console.error('Failed to create meeting:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedMeeting) return
    setSubmitting(true)
    try {
      await orpc.meetings.update({
        id: selectedMeeting.id,
        data: {
          title: formData.title,
          description: formData.description || undefined,
          meetingDate: new Date(formData.meetingDate),
          location: formData.location || undefined,
          status: formData.status,
          minutes: formData.minutes || undefined,
          attachments: attachmentIds.length > 0 ? JSON.stringify(attachmentIds.map(id => ({ id }))) : null,
        },
      })
      // Sync attendees: remove deleted, add new
      const existingIds = attendees.map(a => a.memberId)
      const toRemove = attendees.filter(a => !attendeeIds.includes(a.memberId.toString()))
      const toAdd = attendeeIds.filter(id => !existingIds.includes(Number(id)))
      for (const att of toRemove) {
        await orpc.meetingAttendees.remove({ id: att.id })
      }
      if (toAdd.length > 0) {
        await orpc.meetingAttendees.addBulk({
          meetingId: selectedMeeting.id,
          memberIds: toAdd.map(Number),
        })
      }
      setEditDialogOpen(false)
      fetchMeetings()
    } catch (error) {
      console.error('Failed to update meeting:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedMeeting) return
    setSubmitting(true)
    try {
      await orpc.meetings.delete({ id: selectedMeeting.id })
      setDeleteDialogOpen(false)
      fetchMeetings()
    } catch (error) {
      console.error('Failed to delete meeting:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Meeting form content (shared between create and edit)
  const meetingFormContent = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Monthly Society Meeting"
          className={formErrors.title ? 'border-destructive' : ''}
        />
        {formErrors.title && (
          <p className="text-xs text-destructive">{formErrors.title}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Meeting agenda or details"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="space-y-2">
        <Label>Date & Time *</Label>
        <Input
          type="datetime-local"
          value={formData.meetingDate}
          onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
          className={formErrors.meetingDate ? 'border-destructive' : ''}
        />
        {formErrors.meetingDate && (
          <p className="text-xs text-destructive">{formErrors.meetingDate}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Community Hall"
          />
        </div>
        <div>
          <MemberPicker
            value={formData.organizedBy}
            onChange={(v) => setFormData({ ...formData, organizedBy: v })}
            label="Organized By"
            placeholder="Select organizer"
          />
        </div>
      </div>
      {editDialogOpen && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {editDialogOpen && formData.status === 'completed' && (
        <div className="space-y-2">
          <Label>Meeting Minutes</Label>
          <textarea
            value={formData.minutes}
            onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
            placeholder="Enter meeting minutes or notes"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      )}

      {/* Attendees Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Attendees</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setAddAttendeeOpen(true)}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        {attendeeIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendees added yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attendeeIds.map(id => (
              <Badge key={id} variant="secondary" className="gap-1">
                Member #{id}
                <button type="button" onClick={() => setAttendeeIds(prev => prev.filter(i => i !== id))} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Attachments Section */}
      <DocumentPicker
        value={attachmentIds}
        onChange={setAttachmentIds}
        label="Attachments"
        placeholder="Select documents to attach"
      />

      {/* Add Attendee Dialog */}
      <Dialog open={addAttendeeOpen} onOpenChange={setAddAttendeeOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Attendee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MemberPicker
              value={newAttendeeId}
              onChange={setNewAttendeeId}
              label="Member"
              placeholder="Select a member"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAttendeeOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (newAttendeeId && !attendeeIds.includes(newAttendeeId)) {
                  setAttendeeIds(prev => [...prev, newAttendeeId])
                }
                setNewAttendeeId('')
                setAddAttendeeOpen(false)
              }}
              disabled={!newAttendeeId}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage society meetings</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Upcoming Meetings */}
          <div>
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Meetings
            </h2>
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2">No upcoming meetings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcoming
                  .filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()))
                  .map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          <div>
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Past Meetings
            </h2>
            {past.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No past meetings
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {past
                  .filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()))
                  .map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Meeting Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>Create a new meeting for society members</DialogDescription>
          </DialogHeader>
          {meetingFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={!formData.title || !formData.meetingDate || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update meeting details</DialogDescription>
          </DialogHeader>
          {meetingFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!formData.title || !formData.meetingDate || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Meeting Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedMeeting?.title}</strong>? This action cannot be undone.
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
    </div>
  )
}

// ============================================
// MEETING CARD COMPONENT
// ============================================
function MeetingCard({
  meeting,
  onEdit,
  onDelete,
}: {
  meeting: Meeting
  onEdit: (meeting: Meeting) => void
  onDelete: (meeting: Meeting) => void
}) {
  const status = statusConfig[meeting.status] || statusConfig.scheduled
  const StatusIcon = status.icon
  const isUpcoming = meeting.status === 'scheduled'

  return (
    <Card className={`transition-shadow hover:shadow-md ${isUpcoming ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{meeting.title}</h3>
              <Badge className={`${status.color} border-0`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            {meeting.description && (
              <p className="mt-1 text-sm text-muted-foreground">{meeting.description}</p>
            )}
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>📅 {meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-IN') : 'TBD'}</span>
              <span>📍 {meeting.location || 'TBD'}</span>
              {meeting.organizedBy && <span>👤 {meeting.organizedBy}</span>}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(meeting)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(meeting)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
