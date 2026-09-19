import { useState, useEffect, useMemo } from 'react'
import {
  HelpCircle, Search, MessageSquare, Phone, Mail, ChevronDown, ChevronRight,
  Send, Loader2, CheckCircle2, Clock, AlertTriangle, XCircle, Star,
  Plus, ExternalLink, ThumbsUp, ThumbsDown, Bell, BellOff, Filter,
  Tag, ArrowRight, FileText, Shield, CreditCard, Wrench, Dumbbell,
  UserCheck, Car, Building2, Ticket, MessageCircle, Inbox, Eye,
  CircleDot, AlertCircle, CheckCircle, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { orpc } from '@/server/client'

// ============================================
// TYPES
// ============================================
interface FaqCategory {
  id: number; societyId: number; name: string; description?: string
  icon?: string; sortOrder: number; isActive: boolean
}
interface Faq {
  id: number; societyId: number; categoryId?: number; question: string
  answer: string; sortOrder: number; helpful: number; notHelpful: number
  isActive: boolean; createdAt: string
}
interface HelpTicket {
  id: number; societyId: number; userId: number; ticketNumber: string
  subject: string; description: string; category: string; priority: string
  status: string; assignedTo?: number; createdAt: string; updatedAt: string
  messages?: TicketMessage[]
}
interface TicketMessage {
  id: number; ticketId: number; userId: number; message: string
  createdAt: string
}
interface ContactMessage {
  id: number; name: string; email: string; phone?: string
  subject: string; message: string; category: string; status: string
  createdAt: string
}
interface InAppNotification {
  id: number; title: string; message: string; type: string
  link?: string; isRead: boolean; createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const categoryIcons: Record<string, any> = {
  'credit-card': CreditCard, 'wrench': Wrench, 'dumbbell': Dumbbell,
  'user-check': UserCheck, 'car': Car, 'shield': Shield,
  'billing': CreditCard, 'technical': Wrench, 'maintenance': Wrench,
  'security': Shield, 'amenity': Dumbbell, 'general': HelpCircle,
  'other': HelpCircle,
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  waiting: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  new: 'bg-blue-100 text-blue-700', read: 'bg-gray-100 text-gray-700',
  replied: 'bg-green-100 text-green-700', archived: 'bg-slate-100 text-slate-700',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700', medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
}

const notifTypeColors: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  alert: 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700',
}

const notifTypeIcons: Record<string, any> = {
  info: Info, warning: AlertTriangle, success: CheckCircle2, error: XCircle, alert: AlertCircle,
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState('faq')
  const [loading, setLoading] = useState(true)

  // FAQ state
  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [faqSearch, setFaqSearch] = useState('')
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<number | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Ticket state
  const [tickets, setTickets] = useState<HelpTicket[]>([])
  const [ticketSummary, setTicketSummary] = useState<any>(null)
  const [ticketFilter, setTicketFilter] = useState('all')
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<HelpTicket | null>(null)
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: 'general' as const, priority: 'medium' as const })
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Contact state
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', category: 'general' as const })
  const [contactSubmitted, setContactSubmitted] = useState(false)

  // Notification state
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  // Fetch all data
  const fetchAll = async () => {
    try {
      const [catData, faqData, ticketData, summaryData, notifData, unreadData] = await Promise.all([
        orpc.faqCategories.list({ societyId: 1 }),
        orpc.faqs.list({ societyId: 1 }),
        orpc.helpTickets.list({ societyId: 1 }),
        orpc.helpTickets.summary({ societyId: 1 }),
        orpc.inAppNotifications.list({ societyId: 1, userId: 1 }),
        orpc.inAppNotifications.unreadCount({ societyId: 1, userId: 1 }),
      ])
      setFaqCategories(catData || [])
      setFaqs(faqData || [])
      setTickets(ticketData || [])
      setTicketSummary(summaryData)
      setNotifications(notifData || [])
      setUnreadCount((unreadData as any)?.count ?? 0)
    } catch (error) {
      console.error('Failed to fetch help center data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter(f => {
      const matchesCategory = !selectedFaqCategory || f.categoryId === selectedFaqCategory
      const matchesSearch = !faqSearch ||
        f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.answer.toLowerCase().includes(faqSearch.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [faqs, faqSearch, selectedFaqCategory])

  // Group FAQs by category
  const faqsByCategory = useMemo(() => {
    const map = new Map<number, Faq[]>()
    filteredFaqs.forEach(f => {
      const catId = f.categoryId || 0
      if (!map.has(catId)) map.set(catId, [])
      map.get(catId)!.push(f)
    })
    return map
  }, [filteredFaqs])

  // Create ticket
  const handleCreateTicket = async () => {
    if (!ticketForm.subject || !ticketForm.description) return
    setSubmitting(true)
    try {
      await orpc.helpTickets.create({ societyId: 1, userId: 1, ...ticketForm })
      setNewTicketOpen(false)
      setTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' })
      fetchAll()
      setActiveTab('tickets')
    } catch (error) {
      console.error('Failed to create ticket:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Reply to ticket
  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    setSubmitting(true)
    try {
      await orpc.helpTickets.addMessage({ ticketId: selectedTicket.id, userId: 1, message: replyText })
      setReplyText('')
      const updated = await orpc.helpTickets.get({ id: selectedTicket.id }) as any
      setSelectedTicket(updated)
      fetchAll()
    } catch (error) {
      console.error('Failed to reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit contact form
  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) return
    setSubmitting(true)
    try {
      await orpc.contactMessages.create(contactForm)
      setContactSubmitted(true)
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '', category: 'general' })
      setTimeout(() => setContactSubmitted(false), 5000)
    } catch (error) {
      console.error('Failed to submit contact:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Mark notification read
  const handleMarkRead = async (id: number) => {
    await orpc.inAppNotifications.markRead({ id })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    await orpc.inAppNotifications.markAllRead({ societyId: 1, userId: 1 })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            Help Center
          </h1>
          <p className="text-muted-foreground">FAQs, support tickets, and contact options</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNotifOpen(true)} className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button onClick={() => setNewTicketOpen(true)}>
            <Ticket className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {ticketSummary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setTicketFilter('open'); setActiveTab('tickets') }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{ticketSummary.open || 0}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setTicketFilter('in_progress'); setActiveTab('tickets') }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{ticketSummary.inProgress || 0}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setTicketFilter('waiting'); setActiveTab('tickets') }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{ticketSummary.waiting || 0}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setTicketFilter('resolved'); setActiveTab('tickets') }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{ticketSummary.resolved || 0}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setTicketFilter('all'); setActiveTab('tickets') }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{ticketSummary.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> FAQ
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" /> Tickets
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Contact
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Alerts
            {unreadCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px] h-5 px-1">{unreadCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ============================================
            FAQ TAB
            ============================================ */}
        <TabsContent value="faq" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search FAQs..." value={faqSearch} onChange={e => setFaqSearch(e.target.value)} className="pl-9" />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFaqCategory(null)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${!selectedFaqCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              All
            </button>
            {faqCategories.map(cat => {
              const CatIcon = categoryIcons[cat.icon || ''] || HelpCircle
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFaqCategory(selectedFaqCategory === cat.id ? null : cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${selectedFaqCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  <CatIcon className="h-3.5 w-3.5" />
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* FAQ List */}
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No FAQs found. Try a different search or category.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map(faq => (
                <Card key={faq.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{faq.question}</p>
                      {faq.categoryId && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {faqCategories.find(c => c.id === faq.categoryId)?.name || 'General'}
                        </p>
                      )}
                    </div>
                    {expandedFaq === faq.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="border-t px-4 py-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Was this helpful?</span>
                        <button onClick={async () => { await orpc.faqs.voteHelpful({ id: faq.id, helpful: true }); fetchAll() }} className="flex items-center gap-1 hover:text-green-600 transition-colors">
                          <ThumbsUp className="h-3 w-3" /> Yes ({faq.helpful})
                        </button>
                        <button onClick={async () => { await orpc.faqs.voteHelpful({ id: faq.id, helpful: false }); fetchAll() }} className="flex items-center gap-1 hover:text-red-600 transition-colors">
                          <ThumbsDown className="h-3 w-3" /> No ({faq.notHelpful})
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================
            TICKETS TAB
            ============================================ */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">My Tickets</h3>
            <div className="flex gap-2">
              <Select value={ticketFilter} onValueChange={setTicketFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Ticket className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No tickets found</p>
                <Button size="sm" onClick={() => setNewTicketOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter).map(ticket => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                          <Badge className={statusColors[ticket.status] || ''}>{ticket.status.replace('_', ' ')}</Badge>
                          <Badge className={priorityColors[ticket.priority] || ''}>{ticket.priority}</Badge>
                        </div>
                        <p className="font-medium mt-1 truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ticket.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                        <Badge variant="outline" className="mt-1 text-[10px] capitalize">{ticket.category}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================
            CONTACT TAB
            ============================================ */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Send a Message
                </CardTitle>
                <CardDescription>We typically respond within 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactSubmitted ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                    <p className="font-medium">Message Sent Successfully!</p>
                    <p className="text-sm text-muted-foreground mt-1">We will get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="Phone number" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={contactForm.category} onValueChange={v => setContactForm({ ...contactForm, category: v as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="bug_report">Bug Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Input value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })} placeholder="How can we help?" />
                    </div>
                    <div className="space-y-2">
                      <Label>Message *</Label>
                      <Textarea value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Describe your question or issue..." rows={4} />
                    </div>
                    <Button onClick={handleContactSubmit} disabled={submitting} className="w-full">
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send Message
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Phone Support</p>
                        <p className="text-sm text-muted-foreground">022-26543210</p>
                        <p className="text-xs text-muted-foreground">Mon-Sat, 9 AM - 6 PM</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Email Support</p>
                        <p className="text-sm text-muted-foreground">support@societyerp.com</p>
                        <p className="text-xs text-muted-foreground">Response within 24 hours</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Office Address</p>
                        <p className="text-sm text-muted-foreground">Green Valley Society, Sector 2</p>
                        <p className="text-xs text-muted-foreground">Mumbai, Maharashtra 400001</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Quick Links</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Raise a Ticket', desc: 'For issues and complaints', tab: 'tickets' },
                      { label: 'Report Emergency', desc: 'Use SOS for urgent alerts', link: '/emergency' },
                      { label: 'Community Guidelines', desc: 'Society rules and bylaws', tab: 'faq' },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => item.tab ? setActiveTab(item.tab) : null}
                        className="flex items-center justify-between w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================
            NOTIFICATIONS TAB
            ============================================ */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark All Read
              </Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => {
                const NotifIcon = notifTypeIcons[notif.type] || Info
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-all cursor-pointer ${notif.isRead ? 'opacity-60' : ''} ${notifTypeColors[notif.type] || 'bg-muted border-border'}`}
                  >
                    <NotifIcon className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                    {!notif.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================
          NEW TICKET DIALOG
          ============================================ */}
      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" /> Create Support Ticket
            </DialogTitle>
            <DialogDescription>Describe your issue and we will get back to you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={ticketForm.subject} onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder="Brief description of the issue" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={ticketForm.category} onValueChange={v => setTicketForm({ ...ticketForm, category: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="amenity">Amenity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={ticketForm.priority} onValueChange={v => setTicketForm({ ...ticketForm, priority: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder="Describe the issue in detail..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTicketOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          TICKET DETAIL DIALOG
          ============================================ */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{selectedTicket.ticketNumber}</span>
                  <Badge className={statusColors[selectedTicket.status] || ''}>{selectedTicket.status.replace('_', ' ')}</Badge>
                </DialogTitle>
                <DialogDescription>{selectedTicket.subject}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex gap-2">
                  <Badge className={priorityColors[selectedTicket.priority] || ''}>{selectedTicket.priority}</Badge>
                  <Badge variant="outline" className="capitalize">{selectedTicket.category}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Conversation</p>
                  {(selectedTicket.messages || []).map(msg => (
                    <div key={msg.id} className="rounded-lg border p-3 bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">User #{msg.userId}</span>
                        <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." className="flex-1" onKeyDown={e => e.key === 'Enter' && handleReply()} />
                    <Button onClick={handleReply} disabled={submitting || !replyText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================
          NOTIFICATION PANEL DIALOG
          ============================================ */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</span>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>Mark All Read</Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No notifications</p>
            ) : (
              notifications.map(notif => {
                const NotifIcon = notifTypeIcons[notif.type] || Info
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer ${notif.isRead ? 'opacity-50' : ''}`}
                  >
                    <NotifIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                    {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Info(props: any) { return <HelpCircle {...props} /> }
