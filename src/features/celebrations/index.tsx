import { useState, useEffect, useMemo } from 'react'
import {
  PartyPopper, Plus, Search, Loader2, Edit, Trash2, X,
  Calendar, Clock, MapPin, Users, DollarSign, CheckCircle2,
  Eye, Heart, Camera, ListTodo, MessageCircle, Star,
  ChevronLeft, ChevronRight, Download, Gift, Sparkles,
  UserCheck, AlertCircle, CalendarDays,
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
import { MemberPicker } from '@/components/member-picker'
import { orpc } from '@/server/client'

// ============================================
// TYPES
// ============================================
interface Celebration {
  id: number; societyId: number; title: string; description?: string
  category: string; subcategory?: string; eventDate: string; endDate?: string
  startTime?: string; endTime?: string; location?: string
  organizedBy?: number; status: string; isRecurring?: boolean
  maxAttendees?: number; isPublic: boolean; contactPerson?: string
  contactPhone?: string; coverImage?: string; isActive: boolean; createdAt: string
}
interface Attendee { id: number; celebrationId: number; memberId: number; status: string; guestCount: number; checkedIn: boolean; createdAt: string }
interface BudgetItem { id: number; celebrationId: number; category: string; description?: string; estimatedAmount: number; actualAmount?: number; paidTo?: string; status: string }
interface Task { id: number; celebrationId: number; title: string; assignedTo?: number; status: string; priority: string; dueDate?: string }
interface Photo { id: number; celebrationId: number; photoUrl: string; caption?: string; isHighlight: boolean; likes: number }
interface Comment { id: number; celebrationId: number; memberId: number; content: string; createdAt: string }

// ============================================
// CONSTANTS
// ============================================
const categories = [
  { value: 'religious', label: 'Religious / Puja', icon: '🙏', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'social', label: 'Social', icon: '🎉', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'cultural', label: 'Cultural', icon: '🎭', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'festival', label: 'Festival', icon: '🪔', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  { value: 'birthday', label: 'Birthday', icon: '🎂', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' },
  { value: 'anniversary', label: 'Anniversary', icon: '💝', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  { value: 'party', label: 'Party', icon: '🥳', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { value: 'puja', label: 'Puja', icon: '🪔', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { value: 'other', label: 'Other', icon: '✨', color: 'bg-muted text-muted-foreground' },
]
const catMap = Object.fromEntries(categories.map(c => [c.value, c]))
const statusConfig: Record<string, { color: string }> = {
  planned: { color: 'bg-blue-100 text-blue-700' }, confirmed: { color: 'bg-green-100 text-green-700' },
  ongoing: { color: 'bg-amber-100 text-amber-700' }, completed: { color: 'bg-purple-100 text-purple-700' },
  cancelled: { color: 'bg-red-100 text-red-700' },
}
const rsvpConfig: Record<string, { color: string; icon: any }> = {
  going: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  maybe: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  not_going: { color: 'bg-red-100 text-red-700', icon: X },
  invited: { color: 'bg-blue-100 text-blue-700', icon: Users },
}
const budgetCategories = ['Decoration', 'Food & Drinks', 'Venue', 'Priest / Pandit', 'Sound / Music', 'Gifts', 'Photography', 'Miscellaneous']

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
function formatTime(t?: string) { if (!t) return ''; const [h, m] = t.split(':'); const hr = Number(h); return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}` }

// ============================================
// CALENDAR COMPONENT
// ============================================
function MiniCalendar({ events, onDateClick }: { events: Celebration[]; onDateClick: (date: Date) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear(), month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const monthName = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const eventsByDay = useMemo(() => {
    const map: Record<number, Celebration[]> = {}
    events.forEach(e => {
      const d = new Date(e.eventDate)
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(e)
      }
    })
    return map
  }, [events, month, year])

  const prev = () => setCurrentDate(new Date(year, month - 1, 1))
  const next = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">{monthName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="font-medium text-muted-foreground py-1">{d}</div>)}
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dayEvents = eventsByDay[day] || []
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
            return (
              <button key={day} onClick={() => onDateClick(new Date(year, month, day))}
                className={`relative h-10 rounded-lg flex flex-col items-center justify-center transition-colors hover:bg-muted ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                <span className={`text-sm font-medium ${isToday ? '' : ''}`}>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5">{dayEvents.slice(0, 3).map((e, j) => (
                    <span key={j} className="h-1 w-1 rounded-full bg-primary" />
                  ))}</div>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function CelebrationsPage() {
  const [events, setEvents] = useState<Celebration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [tab, setTab] = useState('events')
  const [summary, setSummary] = useState({ total: 0, upcoming: 0, completed: 0, thisMonth: 0 })

  // Dialogs
  const [createDlg, setCreateDlg] = useState(false)
  const [detailDlg, setDetailDlg] = useState(false)
  const [budgetDlg, setBudgetDlg] = useState(false)
  const [taskDlg, setTaskDlg] = useState(false)
  const [rsvpDlg, setRsvpDlg] = useState(false)
  const [delDlg, setDelDlg] = useState(false)
  const [selected, setSelected] = useState<Celebration | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Form
  const [form, setForm] = useState({ title: '', description: '', category: 'party', subcategory: '', eventDate: '', startTime: '18:00', endTime: '22:00', location: '', maxAttendees: '', contactPerson: '', contactPhone: '' })
  const [budgetForm, setBudgetForm] = useState({ category: 'Decoration', description: '', estimatedAmount: '', paidTo: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' })
  const [rsvpForm, setRsvpForm] = useState({ status: 'going', guestCount: '0', notes: '', memberId: '' })
  const [submitting, setSubmitting] = useState(false)

  // Fetch
  const fetchAll = async () => {
    try {
      const [ev, sm] = await Promise.all([orpc.celebrations.list({}), orpc.celebrations.summary({})])
      setEvents(ev || []); setSummary(sm || { total: 0, upcoming: 0, completed: 0, thisMonth: 0 })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => events.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)
    const matchCat = catFilter === 'all' || e.category === catFilter
    return matchSearch && matchCat
  }), [events, search, catFilter])

  const upcomingEvents = useMemo(() => filtered.filter(e => new Date(e.eventDate) >= new Date() && e.status !== 'cancelled').sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()), [filtered])
  const pastEvents = useMemo(() => filtered.filter(e => new Date(e.eventDate) < new Date() || e.status === 'completed').sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()), [filtered])

  // Handlers
  const openDetail = async (e: Celebration) => {
    setSelected(e); setDetailDlg(true); setDetailLoading(true)
    try { const d = await orpc.celebrations.getById({ id: e.id }); setDetailData(d) } catch { setDetailData(null) } finally { setDetailLoading(false) }
  }
  const submitCreate = async () => {
    if (!form.title || !form.eventDate) return; setSubmitting(true)
    try {
      await orpc.celebrations.create({ societyId: 1, title: form.title, description: form.description || undefined, category: form.category as any, subcategory: form.subcategory || undefined, eventDate: form.eventDate, startTime: form.startTime || undefined, endTime: form.endTime || undefined, location: form.location || undefined, maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined, contactPerson: form.contactPerson || undefined, contactPhone: form.contactPhone || undefined })
      setCreateDlg(false); setForm({ title: '', description: '', category: 'party', subcategory: '', eventDate: '', startTime: '18:00', endTime: '22:00', location: '', maxAttendees: '', contactPerson: '', contactPhone: '' }); fetchAll()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const submitRsvp = async () => {
    if (!selected) return; setSubmitting(true)
    try { await orpc.celebrations.rsvp({ celebrationId: selected.id, memberId: Number(rsvpForm.memberId) || 1, status: rsvpForm.status as any, guestCount: Number(rsvpForm.guestCount) || 0, notes: rsvpForm.notes || undefined }); setRsvpDlg(false); openDetail(selected) } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const submitBudget = async () => {
    if (!selected || !budgetForm.estimatedAmount) return; setSubmitting(true)
    try { await orpc.celebrations.addBudgetItem({ celebrationId: selected.id, category: budgetForm.category, description: budgetForm.description || undefined, estimatedAmount: Number(budgetForm.estimatedAmount), paidTo: budgetForm.paidTo || undefined }); setBudgetDlg(false); setBudgetForm({ category: 'Decoration', description: '', estimatedAmount: '', paidTo: '' }); openDetail(selected) } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const submitTask = async () => {
    if (!selected || !taskForm.title) return; setSubmitting(true)
    try { await orpc.celebrations.addTask({ celebrationId: selected.id, title: taskForm.title, description: taskForm.description || undefined, priority: taskForm.priority as any, dueDate: taskForm.dueDate || undefined }); setTaskDlg(false); setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '' }); openDetail(selected) } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }
  const doCompleteTask = async (taskId: number) => {
    if (!selected) return; try { await orpc.celebrations.completeTask({ id: taskId }); openDetail(selected) } catch (e) { console.error(e) }
  }
  const doDelete = async () => {
    if (!selected) return; setSubmitting(true)
    try { await orpc.celebrations.delete({ id: selected.id }); setDelDlg(false); setDetailDlg(false); fetchAll() } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900"><PartyPopper className="h-5 w-5 text-pink-600" /></div>
            Celebrations & Events
          </h1>
          <p className="text-muted-foreground mt-1">Parties, pujas, festivals, birthdays and community events</p>
        </div>
        <Button onClick={() => setCreateDlg(true)}><Plus className="mr-2 h-4 w-4" /> Create Event</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-950"><PartyPopper className="h-5 w-5 text-pink-600" /></div><div><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground">Total Events</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950"><CalendarDays className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{summary.upcoming}</p><p className="text-xs text-muted-foreground">Upcoming</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950"><Sparkles className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{summary.thisMonth}</p><p className="text-xs text-muted-foreground">This Month</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950"><Star className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{summary.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div></div></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="events"><PartyPopper className="mr-2 h-4 w-4" />Events</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="mr-2 h-4 w-4" />Calendar</TabsTrigger>
          <TabsTrigger value="upcoming"><CalendarDays className="mr-2 h-4 w-4" />Upcoming ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="past"><Clock className="mr-2 h-4 w-4" />Past ({pastEvents.length})</TabsTrigger>
        </TabsList>

        {/* ALL EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />{search && <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setSearch('')}><X className="h-4 w-4" /></Button>}</div>
            <Select value={catFilter} onValueChange={setCatFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? <div className="col-span-full flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> :
              filtered.length === 0 ? <div className="col-span-full text-center py-12"><PartyPopper className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No events found</p></div> :
              filtered.map(e => {
                const cat = catMap[e.category] || catMap.other
                const st = statusConfig[e.status] || statusConfig.planned
                const isPast = new Date(e.eventDate) < new Date()
                return (
                  <Card key={e.id} className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => openDetail(e)}>
                    {/* Event header with category color */}
                    <div className={`relative h-24 rounded-t-lg bg-gradient-to-br ${e.category === 'festival' ? 'from-amber-500 to-orange-600' : e.category === 'puja' || e.category === 'religious' ? 'from-orange-500 to-red-600' : e.category === 'party' ? 'from-green-500 to-emerald-600' : e.category === 'birthday' ? 'from-pink-500 to-rose-600' : e.category === 'cultural' ? 'from-purple-500 to-violet-600' : 'from-blue-500 to-indigo-600'} flex items-center justify-center`}>
                      <span className="text-4xl">{cat.icon}</span>
                      <div className="absolute top-2 right-2"><Badge className={`${st.color} border-0 text-xs`}>{e.status}</Badge></div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{e.title}</h3>
                      {e.subcategory && <p className="text-xs text-muted-foreground">{e.subcategory}</p>}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(e.eventDate)}
                        {e.startTime && <><Clock className="h-3.5 w-3.5" /> {formatTime(e.startTime)}</>}
                      </div>
                      {e.location && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.location}</p>}
                      {e.description && <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="text-xs">{cat.label}</Badge>
                        {e.maxAttendees && <span className="text-xs text-muted-foreground">Max {e.maxAttendees}</span>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        {/* CALENDAR TAB */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <MiniCalendar events={events} onDateClick={(d) => { const dayStr = d.toISOString().split('T')[0]; setSearch(''); setCatFilter('all') }} />
            <div className="space-y-3">
              <h3 className="font-semibold">Events on Calendar</h3>
              {events.slice(0, 10).map(e => {
                const cat = catMap[e.category] || catMap.other
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openDetail(e)}>
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.eventDate)} {e.startTime ? `· ${formatTime(e.startTime)}` : ''}</p>
                    </div>
                    <Badge className={`${statusConfig[e.status]?.color || ''} border-0 text-xs`}>{e.status}</Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* UPCOMING TAB */}
        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map(e => {
              const cat = catMap[e.category] || catMap.other
              const daysUntil = Math.ceil((new Date(e.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <Card key={e.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => openDetail(e)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-xl">{cat.icon}</span><Badge variant="outline" className="text-xs">{cat.label}</Badge></div>
                      {daysUntil <= 7 && <Badge className="bg-amber-500 text-white text-xs">{daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}</Badge>}
                    </div>
                    <h3 className="font-bold">{e.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(e.eventDate)}
                      {e.startTime && <><Clock className="h-3.5 w-3.5" /> {formatTime(e.startTime)}</>}
                    </div>
                    {e.location && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.location}</p>}
                  </CardContent>
                </Card>
              )
            })}
            {upcomingEvents.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No upcoming events</div>}
          </div>
        </TabsContent>

        {/* PAST TAB */}
        <TabsContent value="past" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map(e => {
              const cat = catMap[e.category] || catMap.other
              return (
                <Card key={e.id} className="cursor-pointer hover:shadow-lg transition-all opacity-80 hover:opacity-100" onClick={() => openDetail(e)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2"><span className="text-xl">{cat.icon}</span><Badge variant="outline" className="text-xs">{cat.label}</Badge></div>
                    <h3 className="font-bold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(e.eventDate)}</p>
                    <Badge className={`${statusConfig[e.status]?.color || ''} border-0 text-xs`}>{e.status}</Badge>
                  </CardContent>
                </Card>
              )
            })}
            {pastEvents.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No past events</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== CREATE EVENT DIALOG ===== */}
      <Dialog open={createDlg} onOpenChange={setCreateDlg}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader><DialogTitle>Create Event</DialogTitle><DialogDescription>Plan a new celebration or event.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Diwali Celebration 2025" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category *</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Subcategory</Label><Input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} placeholder="e.g. Satyanarayan Puja" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Event details..." /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Party Lawn" /></div>
              <div className="space-y-2"><Label>Max Attendees</Label><Input type="number" value={form.maxAttendees} onChange={e => setForm({ ...form, maxAttendees: e.target.value })} min="0" placeholder="Unlimited" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Name" /></div>
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 98765 43210" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateDlg(false)}>Cancel</Button><Button onClick={submitCreate} disabled={submitting || !form.title || !form.eventDate}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EVENT DETAIL DIALOG ===== */}
      <Dialog open={detailDlg} onOpenChange={setDetailDlg}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selected && <span className="text-2xl">{catMap[selected.category]?.icon || '✨'}</span>}
              {selected?.title}
            </DialogTitle>
            {selected && <DialogDescription>{catMap[selected.category]?.label} · {formatDate(selected.eventDate)} {selected.startTime ? `at ${formatTime(selected.startTime)}` : ''}</DialogDescription>}
          </DialogHeader>
          {detailLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : detailData ? (
            <div className="space-y-6">
              {/* Status + Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className={`${statusConfig[detailData.status]?.color || ''} border-0`}>{detailData.status}</Badge>
                  {detailData.isRecurring && <Badge variant="outline">Recurring</Badge>}
                </div>
                <div className="flex gap-2">                   <Button size="sm" variant="outline" onClick={() => { setRsvpDlg(true); setRsvpForm({ status: 'going', guestCount: '0', notes: '', memberId: '' }) }}><UserCheck className="mr-1 h-3 w-3" /> RSVP</Button>
                  <Button size="sm" variant="outline" onClick={() => setBudgetDlg(true)}><DollarSign className="mr-1 h-3 w-3" /> Budget</Button>
                  <Button size="sm" variant="outline" onClick={() => setTaskDlg(true)}><ListTodo className="mr-1 h-3 w-3" /> Task</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDelDlg(true)}><Trash2 className="mr-1 h-3 w-3" /></Button>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detailData.location && <div><p className="text-muted-foreground">Location</p><p className="font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {detailData.location}</p></div>}
                {detailData.startTime && <div><p className="text-muted-foreground">Time</p><p className="font-medium">{formatTime(detailData.startTime)} - {formatTime(detailData.endTime)}</p></div>}
                {detailData.contactPerson && <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{detailData.contactPerson} {detailData.contactPhone ? `(${detailData.contactPhone})` : ''}</p></div>}
                {detailData.maxAttendees && <div><p className="text-muted-foreground">Max Attendees</p><p className="font-medium">{detailData.maxAttendees}</p></div>}
              </div>
              {detailData.description && <p className="text-sm text-muted-foreground">{detailData.description}</p>}

              {/* Attendees */}
              {detailData.attendees?.length > 0 && (<>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1"><Users className="h-4 w-4" /> Attendees ({detailData.attendees.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {detailData.attendees.map((a: Attendee) => { const cfg = rsvpConfig[a.status] || rsvpConfig.invited; return (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border p-2">
                        <span className="text-sm">Member #{a.memberId}</span>
                        <Badge className={`${cfg.color} border-0 text-xs`}>{a.status}{a.guestCount > 0 ? ` +${a.guestCount}` : ''}</Badge>
                      </div>
                    )})}
                  </div>
                </div>
              </>)}

              {/* Budget */}
              {detailData.budget?.length > 0 && (<>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Budget Items</h4>
                  <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Estimated</TableHead><TableHead>Actual</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{detailData.budget.map((b: BudgetItem) => (
                    <TableRow key={b.id}><TableCell className="font-medium">{b.category}</TableCell><TableCell>₹{Number(b.estimatedAmount).toLocaleString('en-IN')}</TableCell><TableCell>{b.actualAmount ? `₹${Number(b.actualAmount).toLocaleString('en-IN')}` : '-'}</TableCell><TableCell><Badge variant={b.status === 'paid' ? 'default' : 'secondary'} className={b.status === 'paid' ? 'bg-green-600' : ''}>{b.status}</Badge></TableCell></TableRow>
                  ))}</TableBody></Table>
                  <div className="text-right text-sm font-medium mt-2">Total Estimated: ₹{detailData.budget.reduce((s: number, b: BudgetItem) => s + Number(b.estimatedAmount), 0).toLocaleString('en-IN')}</div>
                </div>
              </>)}

              {/* Tasks */}
              {detailData.tasks?.length > 0 && (<>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1"><ListTodo className="h-4 w-4" /> Tasks ({detailData.tasks.filter((t: Task) => t.status === 'completed').length}/{detailData.tasks.length} done)</h4>
                  <div className="space-y-2">
                    {detailData.tasks.map((t: Task) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border p-2">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => doCompleteTask(t.id)} disabled={t.status === 'completed'}>
                            <CheckCircle2 className={`h-4 w-4 ${t.status === 'completed' ? 'text-green-600' : 'text-muted-foreground'}`} />
                          </Button>
                          <span className={`text-sm ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs ${t.priority === 'high' ? 'text-red-600' : t.priority === 'medium' ? 'text-amber-600' : ''}`}>{t.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              {/* Photos */}
              {detailData.photos?.length > 0 && (<>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1"><Camera className="h-4 w-4" /> Photos ({detailData.photos.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {detailData.photos.map((p: Photo) => (
                      <div key={p.id} className="relative aspect-square rounded-lg bg-muted overflow-hidden"><div className="flex items-center justify-center h-full text-2xl">📷</div>{p.isHighlight && <Star className="absolute top-1 right-1 h-4 w-4 text-amber-500 fill-amber-500" />}</div>
                    ))}
                  </div>
                </div>
              </>)}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===== RSVP DIALOG ===== */}
      <Dialog open={rsvpDlg} onOpenChange={setRsvpDlg}>
        <DialogContent className="sm:max-w-[400px]">           <DialogHeader><DialogTitle>RSVP</DialogTitle><DialogDescription>Confirm your attendance for {selected?.title}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <MemberPicker label="Member" value={rsvpForm.memberId} onChange={v => setRsvpForm({ ...rsvpForm, memberId: v })} required />
            <div className="space-y-2"><Label>Status</Label><Select value={rsvpForm.status} onValueChange={v => setRsvpForm({ ...rsvpForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="going">✅ Going</SelectItem><SelectItem value="maybe">🤔 Maybe</SelectItem><SelectItem value="not_going">❌ Not Going</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Guests (excluding yourself)</Label><Input type="number" value={rsvpForm.guestCount} onChange={e => setRsvpForm({ ...rsvpForm, guestCount: e.target.value })} min="0" max="10" /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={rsvpForm.notes} onChange={e => setRsvpForm({ ...rsvpForm, notes: e.target.value })} placeholder="Any special requests..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRsvpDlg(false)}>Cancel</Button><Button onClick={submitRsvp} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit RSVP</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== BUDGET DIALOG ===== */}
      <Dialog open={budgetDlg} onOpenChange={setBudgetDlg}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Add Budget Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Category *</Label><Select value={budgetForm.category} onValueChange={v => setBudgetForm({ ...budgetForm, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{budgetCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Description</Label><Input value={budgetForm.description} onChange={e => setBudgetForm({ ...budgetForm, description: e.target.value })} placeholder="Details..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Estimated Amount (₹) *</Label><Input type="number" value={budgetForm.estimatedAmount} onChange={e => setBudgetForm({ ...budgetForm, estimatedAmount: e.target.value })} min="0" /></div>
              <div className="space-y-2"><Label>Paid To</Label><Input value={budgetForm.paidTo} onChange={e => setBudgetForm({ ...budgetForm, paidTo: e.target.value })} placeholder="Vendor name" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBudgetDlg(false)}>Cancel</Button><Button onClick={submitBudget} disabled={submitting || !budgetForm.estimatedAmount}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== TASK DIALOG ===== */}
      <Dialog open={taskDlg} onOpenChange={setTaskDlg}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Details..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Priority</Label><Select value={taskForm.priority} onValueChange={v => setTaskForm({ ...taskForm, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTaskDlg(false)}>Cancel</Button><Button onClick={submitTask} disabled={submitting || !taskForm.title}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE DIALOG ===== */}
      <Dialog open={delDlg} onOpenChange={setDelDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Event</DialogTitle><DialogDescription>Are you sure you want to delete <strong>{selected?.title}</strong>?</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDelDlg(false)}>Cancel</Button><Button variant="destructive" onClick={doDelete} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
