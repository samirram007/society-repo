import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  Search,
  LayoutDashboard,
  Users,
  Home,
  IndianRupee,
  Wrench,
  Megaphone,
  Calendar,
  UserCheck,
  Receipt,
  Settings,
  Book,
  Dumbbell,
  Car,
  Bike,
  Landmark,
  Box,
  UserCog,
  FileText,
  Map as MapIcon,
  PartyPopper,
  Siren,
  Shield,
  CreditCard,
  Clock,
  Star,
  ArrowRight,
  Command,
  X,
} from 'lucide-react'
import { getUserPermissions, type UserRole, type ModuleName } from '@/lib/permissions'

// ============================================
// TYPES
// ============================================
interface SearchResult {
  id: string
  label: string
  description?: string
  icon: any
  to?: string
  category: string
  keywords: string[]
  shortcut?: string[]
  action?: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: UserRole
  userPermissions?: string | null
  extraItems?: SearchResult[]
}

// ============================================
// ALL SEARCHABLE ITEMS
// ============================================
const allItems: SearchResult[] = [
  // Main
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/', category: 'Main', keywords: ['home', 'overview', 'summary', 'stats'], shortcut: ['G', 'H'] },
  { id: 'society-map', label: 'Society Map', icon: MapIcon, to: '/society-map', category: 'Main', keywords: ['map', 'tower', 'building', 'layout', 'society'] },

  // Property
  { id: 'members', label: 'Members', icon: Users, to: '/members', category: 'Property', keywords: ['resident', 'owner', 'tenant', 'family'] },
  { id: 'flats', label: 'Flats', icon: Home, to: '/flats', category: 'Property', keywords: ['apartment', 'unit', 'room', 'floor'] },
  { id: 'parking', label: 'Parking', icon: Car, to: '/parking', category: 'Property', keywords: ['slot', 'vehicle', 'garage', 'basement'] },
  { id: 'vehicles', label: 'Vehicles', icon: Bike, to: '/vehicles', category: 'Property', keywords: ['car', 'bike', 'number plate', 'registration'] },

  // Finance
  { id: 'dues', label: 'Dues & Payments', icon: CreditCard, to: '/dues', category: 'Finance', keywords: ['payment', 'invoice', 'bill', 'maintenance fee', 'dues'] },
  { id: 'accounts', label: 'Accounts', icon: Landmark, to: '/accounts', category: 'Finance', keywords: ['ledger', 'chart', 'journal', 'balance'] },
  { id: 'expenses', label: 'Expenses', icon: Receipt, to: '/expenses', category: 'Finance', keywords: ['cost', 'spending', 'budget', 'receipt'] },
  { id: 'assets', label: 'Assets', icon: Box, to: '/assets', category: 'Finance', keywords: ['inventory', 'equipment', 'item'] },

  // Operations
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, to: '/maintenance', category: 'Operations', keywords: ['repair', 'service', 'ticket', 'helpdesk'] },
  { id: 'amenities', label: 'Amenities', icon: Dumbbell, to: '/amenities', category: 'Operations', keywords: ['gym', 'pool', 'club', 'booking', 'facility'] },
  { id: 'staff', label: 'Staff', icon: UserCog, to: '/staff', category: 'Operations', keywords: ['employee', 'guard', 'housekeeping', 'attendance'] },

  // Security
  { id: 'visitors', label: 'Visitors', icon: UserCheck, to: '/visitors', category: 'Security', keywords: ['guest', 'entry', 'pass', 'gate'] },
  { id: 'emergency', label: 'Emergency', icon: Siren, to: '/emergency', category: 'Security', keywords: ['sos', 'panic', 'contact', 'hospital', 'police'] },

  // Communication
  { id: 'notices', label: 'Notice Board', icon: Megaphone, to: '/notices', category: 'Communication', keywords: ['announcement', 'news', 'circular'] },
  { id: 'celebrations', label: 'Celebrations', icon: PartyPopper, to: '/celebrations', category: 'Communication', keywords: ['birthday', 'event', 'festival', 'holiday'] },
  { id: 'meetings', label: 'Meetings', icon: Calendar, to: '/meetings', category: 'Communication', keywords: ['agenda', 'minutes', 'resolution', 'committee'] },
  { id: 'documents', label: 'Documents', icon: FileText, to: '/documents', category: 'Communication', keywords: ['file', 'folder', 'upload', 'download'] },

  // System
  { id: 'users', label: 'Users', icon: UserCog, to: '/users', category: 'System', keywords: ['account', 'login', 'admin'] },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield, to: '/roles', category: 'System', keywords: ['role', 'permission', 'access', 'rbac'] },
  { id: 'settings', label: 'Settings', icon: Settings, to: '/settings', category: 'System', keywords: ['config', 'preference', 'general'], shortcut: ['Ctrl', ','] },
  { id: 'api-docs', label: 'API Docs', icon: Book, to: '/api-docs', category: 'System', keywords: ['api', 'endpoint', 'documentation', 'swagger'] },
]

// ============================================
// FUZZY MATCH
// ============================================
function fuzzyMatch(text: string, query: string): number {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  // Exact substring match = high score
  if (lower.includes(q)) return 100
  // Word-start match
  const words = lower.split(/[\s\-_/]+/)
  const qWords = q.split(/[\s\-_/]+/)
  let score = 0
  for (const qw of qWords) {
    for (const w of words) {
      if (w === qw) score += 50
      else if (w.startsWith(qw)) score += 30
      else if (w.includes(qw)) score += 10
    }
  }
  return score
}

function searchItems(query: string, items: SearchResult[]): SearchResult[] {
  if (!query.trim()) return []
  const scored = items.map(item => {
    const labelScore = fuzzyMatch(item.label, query)
    const catScore = fuzzyMatch(item.category, query) * 0.5
    const kwScore = Math.max(...item.keywords.map(k => fuzzyMatch(k, query)), 0) * 0.8
    return { item, score: Math.max(labelScore, catScore, kwScore) }
  })
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.item)
}

// ============================================
// COMPONENT
// ============================================
const RECENT_KEY = 'command-palette-recent'
const MAX_RECENT = 5

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecent(id: string) {
  const recent = getRecent().filter(r => r !== id)
  recent.unshift(id)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

export function CommandPalette({ open, onOpenChange, userRole = 'member', userPermissions, extraItems = [] }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const resultsRef = useRef<HTMLDivElement>(null)

  // Load recent on open
  useEffect(() => {
    if (open) {
      setRecentIds(getRecent())
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Filter by permissions
  const permittedItems = useMemo(() => {
    const perms = getUserPermissions(userRole, userPermissions)
    const navItems = allItems.filter(item => {
      const mod = item.id.split('-')[0] as ModuleName
      return perms[mod]?.access ?? false
    })
    return [...extraItems, ...navItems]
  }, [userRole, userPermissions, extraItems])

  // Search results or recent
  const results = useMemo(() => {
    if (query.trim()) return searchItems(query, permittedItems)
    // Show recent items when no query
    return recentIds
      .map(id => permittedItems.find(item => item.id === id))
      .filter(Boolean) as SearchResult[]
  }, [query, permittedItems, recentIds])

  // Category groups for no-query state
  const groupedResults = useMemo(() => {
    if (query.trim()) return null
    const groups: Record<string, SearchResult[]> = {}
    for (const item of permittedItems) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [query, permittedItems])

  // Keyboard navigation
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = useCallback((item: SearchResult) => {
    if (item.action) {
      item.action()
      onOpenChange(false)
      return
    }
    addRecent(item.id)
    onOpenChange(false)
    if (item.to) router.navigate({ to: item.to })
  }, [router, onOpenChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  // Scroll selected into view
  useEffect(() => {
    const el = resultsRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999]" onClick={() => onOpenChange(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="absolute left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2 rounded-xl border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, modules, actions..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() ? (
            // Search results
            results.length > 0 ? (
              <div className="space-y-0.5">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Search Results
                </p>
                {results.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      data-index={i}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        i === selectedIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.label}</p>
                        {item.description && (
                          <p className={`text-xs truncate ${i === selectedIndex ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.shortcut ? (
                        <div className="flex items-center gap-0.5">
                          {item.shortcut.map((k, ki) => (
                            <kbd key={ki} className={`rounded border px-1 py-0.5 text-[9px] font-mono ${i === selectedIndex ? 'border-primary-foreground/30 text-primary-foreground/70' : 'border-border bg-muted text-muted-foreground'}`}>
                              {k}
                            </kbd>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[10px] ${i === selectedIndex ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {item.category}
                        </span>
                      )}
                      <ArrowRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No results found for "{query}"</p>
              </div>
            )
          ) : (
            // Default: show recent + all categories
            <>
              {recentIds.length > 0 && (
                <div className="space-y-0.5 mb-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Recent
                  </p>
                  {recentIds
                    .map(id => permittedItems.find(item => item.id === id))
                    .filter(Boolean)
                    .map((item, i) => {
                      if (!item) return null
                      const Icon = item.icon
                      return (
                        <button
                          key={`recent-${item.id}`}
                          data-index={i}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            i === selectedIndex
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="font-medium">{item.label}</span>
                          <span className={`ml-auto text-[10px] ${i === selectedIndex ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {item.category}
                          </span>
                        </button>
                      )
                    })}
                </div>
              )}

              {groupedResults && Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="space-y-0.5 mb-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {category}
                  </p>
                  {items.map(item => {
                    const globalIndex = results.indexOf(item)
                    const Icon = item.icon
                    if (globalIndex === -1) return null
                    return (
                      <button
                        key={item.id}
                        data-index={globalIndex}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                        {item.shortcut && (
                          <div className="ml-auto flex items-center gap-0.5">
                            {item.shortcut.map((k, ki) => (
                              <kbd key={ki} className={`rounded border px-1 py-0.5 text-[9px] font-mono ${globalIndex === selectedIndex ? 'border-primary-foreground/30 text-primary-foreground/70' : 'border-border bg-muted text-muted-foreground'}`}>
                                {k}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t px-4 py-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[9px]">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[9px]">↵</kbd> Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[9px]">ESC</kbd> Close
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Command className="h-3 w-3" /> K
          </span>
        </div>
      </div>
    </div>
  )
}
