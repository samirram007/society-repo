import React, { useState, useEffect, useCallback, type ReactNode, useRef } from 'react'
import {
  Outlet,
  Link,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import {
  Building2,
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
  LogOut,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Book,
  Dumbbell,
  Car,
  Bike,
  Landmark,
  Box,
  UserCog,
  User,
  FileText,
  Map as MapIcon,
  PartyPopper,
  Siren,
  Shield,
  Cctv,
  CreditCard,
  Building,
  Search,
  Command,
  HelpCircle,
  Bell,
  Menu,
  X,
  Star,
  Clock,
  Zap,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser, useLogout } from '@/hooks/auth'
import { ThemeToggle } from './theme-toggle'
import { getUserPermissions, roleDisplayNames, roleBadgeColors, type UserRole, type ModuleName } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CommandPalette } from '@/components/command-palette'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { orpc } from '@/server/client'

interface NavItem {
  to: string
  label: string
  icon: any
  module: ModuleName
}

interface NavGroup {
  label: string
  icon: any
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    icon: LayoutDashboard,
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
      { to: '/society-map', label: 'Society Map', icon: MapIcon, module: 'society_map' },
    ],
  },
  {
    label: 'Property',
    icon: Building,
    items: [
      { to: '/members', label: 'Members', icon: Users, module: 'members' },
      { to: '/flats', label: 'Flats', icon: Home, module: 'flats' },
      { to: '/parking', label: 'Parking', icon: Car, module: 'parking' },
      { to: '/vehicles', label: 'Vehicles', icon: Bike, module: 'vehicles' },
    ],
  },
  {
    label: 'Finance',
    icon: IndianRupee,
    items: [
      { to: '/dues', label: 'Dues & Payments', icon: CreditCard, module: 'dues' },
      { to: '/accounts', label: 'Accounts', icon: Landmark, module: 'accounts' },
      { to: '/expenses', label: 'Expenses', icon: Receipt, module: 'expenses' },
      { to: '/assets', label: 'Assets', icon: Box, module: 'assets' },
    ],
  },
  {
    label: 'Operations',
    icon: Wrench,
    items: [
      { to: '/maintenance', label: 'Maintenance', icon: Wrench, module: 'maintenance' },
      { to: '/amenities', label: 'Amenities', icon: Dumbbell, module: 'amenities' },
      { to: '/staff', label: 'Staff', icon: UserCog, module: 'staff' },
    ],
  },
  {
    label: 'Security',
    icon: Shield,
    items: [
      { to: '/visitors', label: 'Visitors', icon: UserCheck, module: 'visitors' },
      { to: '/emergency', label: 'Emergency', icon: Siren, module: 'emergency' },
      { to: '/security', label: 'CCTV & Vigilance', icon: Cctv, module: 'security' },
    ],
  },
  {
    label: 'Communication',
    icon: Megaphone,
    items: [
      { to: '/notices', label: 'Notice Board', icon: Megaphone, module: 'notices' },
      { to: '/celebrations', label: 'Celebrations', icon: PartyPopper, module: 'celebrations' },
      { to: '/meetings', label: 'Meetings', icon: Calendar, module: 'meetings' },
      { to: '/documents', label: 'Documents', icon: FileText, module: 'documents' },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    items: [
      { to: '/users', label: 'Users', icon: UserCog, module: 'users' },
      { to: '/roles', label: 'Roles & Permissions', icon: Shield, module: 'users' },
      { to: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
      { to: '/api-docs', label: 'API Docs', icon: Book, module: 'api_docs' },
      { to: '/help-center', label: 'Help Center', icon: HelpCircle, module: 'settings' },
    ],
  },
]

const RECENT_NAV_KEY = 'sidebar-recent-nav'
const PINNED_NAV_KEY = 'sidebar-pinned-nav'
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'
const BOTTOM_NAV_KEY = 'bottom-nav-tabs'
const MAX_RECENT = 5

// All available bottom nav tab options
const ALL_BOTTOM_TABS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/flats', label: 'Flats', icon: Home },
  { to: '/dues', label: 'Dues', icon: CreditCard },
  { to: '/notices', label: 'Notices', icon: Megaphone },
  { to: '/meetings', label: 'Meetings', icon: Calendar },
  { to: '/maintenance', label: 'Help', icon: Wrench },
  { to: '/amenities', label: 'Amenities', icon: Dumbbell },
  { to: '/visitors', label: 'Visitors', icon: UserCheck },
  { to: '/emergency', label: 'Emergency', icon: Siren },
  { to: '/parking', label: 'Parking', icon: Car },
  { to: '/documents', label: 'Docs', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const DEFAULT_BOTTOM_TABS = ['/', '/members', '/notices', '/maintenance', '/profile']

function getBottomNavTabs(): string[] {
  try {
    const saved = localStorage.getItem(BOTTOM_NAV_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 5) return parsed
    }
  } catch {}
  return DEFAULT_BOTTOM_TABS
}

function setBottomNavTabs(tabs: string[]) {
  localStorage.setItem(BOTTOM_NAV_KEY, JSON.stringify(tabs))
}

function getRecentNav(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_NAV_KEY) || '[]') } catch { return [] }
}

function addRecentNav(path: string) {
  const recent = getRecentNav().filter(r => r !== path)
  recent.unshift(path)
  localStorage.setItem(RECENT_NAV_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function getPinnedNav(): string[] {
  try { return JSON.parse(localStorage.getItem(PINNED_NAV_KEY) || '[]') } catch { return [] }
}

function togglePinnedNav(path: string) {
  const pinned = getPinnedNav()
  const next = pinned.includes(path) ? pinned.filter(p => p !== path) : [...pinned, path]
  localStorage.setItem(PINNED_NAV_KEY, JSON.stringify(next))
}

function isSidebarCollapsed(): boolean {
  try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true' } catch { return false }
}

function setSidebarCollapsed(value: boolean) {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value))
}

// Flatten all nav items for quick lookup
function findNavItem(to: string): NavItem | undefined {
  for (const group of navGroups) {
    const found = group.items.find(item => item.to === to)
    if (found) return found
  }
  return undefined
}

export function ProtectedLayout() {
  const router = useRouter()
  const routerState = useRouterState()
  const { data: user, isLoading } = useCurrentUser()
  const logoutMutation = useLogout()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Main', 'Property', 'Finance', 'Operations', 'Security', 'Communication', 'System']))
  const [cmdOpen, setCmdOpen] = useState(false)
  const [pinnedPaths, setPinnedPaths] = useState<string[]>([])
  const [recentPaths, setRecentPaths] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(isSidebarCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const swipeRef = useRef({ startX: 0, currentX: 0, swiping: false })
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [unreadNotices, setUnreadNotices] = useState(0)
  const [bottomTabs, setBottomTabs] = useState<string[]>(DEFAULT_BOTTOM_TABS)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [editingTabs, setEditingTabs] = useState<string[]>([])
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [bottomNavVisible, setBottomNavVisible] = useState(true)
  const [bottomNavEntered, setBottomNavEntered] = useState(false)

  // Load pinned/recent from localStorage
  useEffect(() => {
    setPinnedPaths(getPinnedNav())
    setRecentPaths(getRecentNav())
  }, [])

  // Track current path as recent
  useEffect(() => {
    const path = routerState.location.pathname
    if (path !== '/login' && path !== '/') {
      addRecentNav(path)
      setRecentPaths(getRecentNav())
    }
  }, [routerState.location.pathname])

  // Load bottom nav tabs from localStorage
  useEffect(() => {
    setBottomTabs(getBottomNavTabs())
    // Trigger entrance animation after mount
    requestAnimationFrame(() => setBottomNavEntered(true))
  }, [])

  const saveBottomTabs = () => {
    if (editingTabs.length >= 3 && editingTabs.length <= 5) {
      setBottomNavTabs(editingTabs)
      setBottomTabs(editingTabs)
      setCustomizeOpen(false)
    }
  }

  const toggleBottomTab = (to: string) => {
    setEditingTabs(prev => {
      if (prev.includes(to)) return prev.filter(t => t !== to)
      if (prev.length >= 5) return prev
      return [...prev, to]
    })
  }

  // Fetch unread notices count
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const notices = await (orpc as any).notices.list({})
        // Count notices as "unread" if created in last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const unread = (notices || []).filter((n: any) => {
          const created = new Date(n.createdAt).getTime()
          return created > weekAgo
        }).length
        setUnreadNotices(unread)
      } catch {}
    }
    fetchNotices()
    const interval = setInterval(fetchNotices, 60000) // refresh every 60s
    return () => clearInterval(interval)
  }, [])

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev
      setSidebarCollapsed(next)
      return next
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Cmd+K / Ctrl+K — Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }

      // Cmd+B / Ctrl+B — Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }

      // Ctrl+\ — Toggle mobile sidebar sheet
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setMobileOpen(prev => !prev)
      }

      // ? — Shortcuts help (only when not typing)
      if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setShortcutsOpen(prev => !prev)
      }

      // Escape — Close panels
      if (e.key === 'Escape') {
        if (shortcutsOpen) setShortcutsOpen(false)
        else if (cmdOpen) setCmdOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcutsOpen, cmdOpen])

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.navigate({ to: '/' })
      },
    })
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const currentY = target.scrollTop
    const diff = currentY - lastScrollY.current

    if (Math.abs(diff) < 5) return // ignore tiny scrolls

    if (diff > 0 && currentY > 48) {
      // Scrolling down — hide header & bottom nav
      setHeaderVisible(false)
      setBottomNavVisible(false)
    } else {
      // Scrolling up — show header & bottom nav
      setHeaderVisible(true)
      setBottomNavVisible(true)
    }

    lastScrollY.current = currentY
  }, [])

  // Swipe-to-close handlers for mobile sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    swipeRef.current = { startX: touch.clientX, currentX: touch.clientX, swiping: true }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeRef.current.swiping) return
    const touch = e.touches[0]
    swipeRef.current.currentX = touch.clientX
    const delta = swipeRef.current.currentX - swipeRef.current.startX
    // Only allow swiping left (negative delta) to close
    if (delta < 0) {
      setSwipeOffset(delta)
    }
  }

  const handleTouchEnd = () => {
    if (!swipeRef.current.swiping) return
    swipeRef.current.swiping = false
    const delta = swipeRef.current.currentX - swipeRef.current.startX
    if (delta < -100) {
      // Swiped past threshold — close
      setMobileOpen(false)
    }
    setSwipeOffset(0)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <TooltipProvider delayDuration={200}>
      <aside className={`hidden flex-col border-r bg-card lg:flex overflow-hidden transition-[width] duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className={`flex h-16 items-center gap-2 border-b ${collapsed ? 'justify-center px-2' : 'px-6'}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <span className={`text-lg font-bold whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Society ERP</span>
        </div>

        {/* Theme Toggle */}
        <div className={`flex ${collapsed ? 'justify-center px-2 py-2' : ''}`}>
          <ThemeToggle variant="sidebar" collapsed={collapsed} />
        </div>

        {/* Search Trigger */}
        {!collapsed && (
          <div className="px-3">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="px-2 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCmdOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Search (Ctrl+K)</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Quick Menu (Pinned + Recent) — hidden when collapsed */}
        {!collapsed && (() => {
          const userRole = (user?.role as UserRole) || 'member'
          const userPerms = user?.permissions as string | null | undefined
          const perms = getUserPermissions(userRole, userPerms)

          const pinned = pinnedPaths
            .filter(path => {
              const item = findNavItem(path)
              return item && perms[item.module]?.access
            })
            .map(path => ({ path, item: findNavItem(path)! }))

          const recent = recentPaths
            .filter(path => !pinnedPaths.includes(path))
            .filter(path => {
              const item = findNavItem(path)
              return item && perms[item.module]?.access
            })
            .slice(0, 3)
            .map(path => ({ path, item: findNavItem(path)! }))

          if (pinned.length === 0 && recent.length === 0) return null

          return (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Access</span>
              </div>
              <div className="space-y-0.5">
                {pinned.map(({ path, item }) => {
                  const Icon = item.icon
                  const isActive = routerState.location.pathname === path
                  return (
                    <div key={path} className="group relative">
                      <Link
                        to={path}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="truncate">{item.label}</span>
                        <Star className="ml-auto h-3 w-3 shrink-0 fill-current opacity-50" />
                      </Link>
                    </div>
                  )
                })}
                {recent.map(({ path, item }) => {
                  const Icon = item.icon
                  const isActive = routerState.location.pathname === path
                  return (
                    <div key={path} className="group relative">
                      <Link
                        to={path}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="truncate text-[13px]">{item.label}</span>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? 'px-2 py-2' : 'p-3'}`}>
          {(() => {
            const userRole = (user?.role as UserRole) || 'member'
            const userPerms = user?.permissions as string | null | undefined
            const perms = getUserPermissions(userRole, userPerms)

            // Collapsed: flat list of icons
            if (collapsed) {
              return navGroups.map(group => {
                const visibleItems = group.items.filter(item => perms[item.module]?.access)
                if (visibleItems.length === 0) return null
                return visibleItems.map(item => {
                  const Icon = item.icon
                  const isActive = routerState.location.pathname === item.to
                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.to}
                          className={`mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg transition-colors mx-auto ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  )
                })
              })
            }

            // Expanded: grouped with labels
            return navGroups.map(group => {
              const visibleItems = group.items.filter(item => perms[item.module]?.access)
              if (visibleItems.length === 0) return null
              const isExpanded = expandedGroups.has(group.label)
              const hasActive = visibleItems.some(item => routerState.location.pathname === item.to)
              const GroupIcon = group.icon

              return (
                <div key={group.label} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      hasActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <GroupIcon className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">{group.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-0.5 space-y-0.5">
                      {visibleItems.map(item => {
                        const Icon = item.icon
                        const isActive = routerState.location.pathname === item.to
                        const isPinned = pinnedPaths.includes(item.to)
                        return (
                          <div key={item.to} className="group/nav relative">
                            <Link
                              to={item.to}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 pl-8 text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="flex-1 truncate">{item.label}</span>
                              {isPinned && !isActive && (
                                <Star className="h-3 w-3 shrink-0 fill-current text-amber-400" />
                              )}
                            </Link>
                            {!isActive && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  togglePinnedNav(item.to)
                                  setPinnedPaths(getPinnedNav())
                                }}
                                title={isPinned ? 'Unpin from Quick Access' : 'Pin to Quick Access'}
                                className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 transition-all ${
                                  isPinned
                                    ? 'text-amber-400 opacity-100 hover:text-amber-500'
                                    : 'text-muted-foreground opacity-0 group-hover/nav:opacity-100 hover:text-foreground'
                                }`}
                              >
                                <Star className={`h-3 w-3 ${isPinned ? 'fill-current' : ''}`} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </nav>

        {/* Collapse Toggle */}
        <div className={`border-t ${collapsed ? 'px-2 py-2' : 'px-3 py-2'}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className={`flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${collapsed ? 'h-9 w-9 mx-auto' : 'w-full gap-2 px-3 py-1.5 text-sm'}`}
              >
                <ChevronLeft className={`h-4 w-4 transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`} />
                <span className={`transition-opacity duration-200 whitespace-nowrap ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Collapse</span>
                {collapsed && <ChevronRight className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User Section */}
        <div className={`border-t ${collapsed ? 'px-2 py-2' : 'p-2'}`}>
          {isLoading ? (
            <div className={`flex items-center gap-2 py-1.5 ${collapsed ? 'justify-center' : 'px-3'}`}>
              <Loader2 className="h-4 w-4 animate-spin" />
              {!collapsed && <span className="text-sm text-muted-foreground">Loading...</span>}
            </div>
          ) : user ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/profile" className={`flex items-center gap-2.5 rounded-lg py-1.5 hover:bg-muted transition-colors group/user ${collapsed ? 'justify-center px-1' : 'px-2.5'}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    {user.profileImage && (
                      <AvatarImage src={user.profileImage} alt={user.name} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 min-w-0 transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                    <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
                    <Badge variant="secondary" className={`text-[9px] px-1 py-0 mt-px ${roleBadgeColors[(user.role as UserRole) || 'member']}`}>
                      {roleDisplayNames[(user.role as UserRole) || 'member']}
                    </Badge>
                  </div>
                  {!collapsed && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleLogout()
                          }}
                          disabled={logoutMutation.isPending}
                          className="rounded-md p-1 text-muted-foreground opacity-0 group-hover/user:opacity-100 hover:text-destructive transition-all"
                        >
                          {logoutMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <LogOut className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Sign out</TooltipContent>
                    </Tooltip>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{user.name}</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className={`${collapsed ? 'h-9 w-9 mx-auto justify-center px-0' : 'w-full justify-start h-8 text-sm'}`} asChild>
                  <Link to="/login">
                    <LogOut className={`${collapsed ? '' : 'mr-2 h-3.5 w-3.5'}`} />
                    {!collapsed && 'Sign in'}
                  </Link>
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Sign in</TooltipContent>}
            </Tooltip>
          )}
        </div>
      </aside>
      </TooltipProvider>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className={`flex h-12 items-center justify-between border-b bg-card px-3 lg:hidden transition-transform duration-200 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm">Society ERP</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCmdOpen(true)}>
              <Search className="h-3.5 w-3.5" />
            </Button>
            <ThemeToggle variant="header" />
            {user && (
              <Link to="/profile">
                <Avatar className="h-7 w-7 cursor-pointer">
                  {user.profileImage && (
                    <AvatarImage src={user.profileImage} alt={user.name} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </header>

        {/* Desktop Top Bar with Breadcrumb + Profile Avatar */}
        <div className="hidden lg:flex items-center justify-between border-b bg-card px-6 py-2">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            {routerState.location.pathname !== '/' && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground capitalize">
                  {routerState.location.pathname.slice(1).replace(/-/g, ' ')}
                </span>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="header" />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 outline-none">
                    <div className="text-right hidden xl:block">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                    <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-background hover:ring-primary/50 transition-all">
                      {user.profileImage && (
                        <AvatarImage src={user.profileImage} alt={user.name} />
                      )}
                      <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
                        {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user.email || 'admin@society.com'}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dues">
                      <CreditCard className="h-4 w-4" /> My Dues
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notices">
                      <Bell className="h-4 w-4" /> Notices
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/documents">
                      <FileText className="h-4 w-4" /> Documents
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/api-docs">
                      <Book className="h-4 w-4" /> API Docs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCmdOpen(true)}>
                    <Search className="h-4 w-4" /> Search
                    <kbd className="ml-auto text-[10px] text-muted-foreground border rounded px-1 py-0.5">
                      <Command className="inline h-2.5 w-2.5" />K
                    </kbd>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
            )}
          </div>
        </div>

        {/* Page Content — only this re-renders on navigation */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6" onScroll={handleScroll}>
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation Bar (mobile only) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden transition-transform duration-200 ${bottomNavVisible ? 'translate-y-0' : 'translate-y-full'} ${!bottomNavEntered ? 'bottom-nav-enter' : ''}`}>
        <div className="flex h-14 items-center justify-around px-1">
          {(() => {
            const bottomItems = bottomTabs
              .map(path => ALL_BOTTOM_TABS.find(t => t.to === path))
              .filter(Boolean) as typeof ALL_BOTTOM_TABS

            // If path not found in ALL_BOTTOM_TABS, show default
            const items = bottomItems.length >= 3 ? bottomItems : ALL_BOTTOM_TABS.filter(t => DEFAULT_BOTTOM_TABS.includes(t.to))

            return items.map(item => {
              const Icon = item.icon
              const isActive = routerState.location.pathname === item.to
              const showBadge = item.to === '/notices' && unreadNotices > 0
            return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${isActive ? 'tab-active-icon' : 'transition-transform'}`} />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                        {unreadNotices > 99 ? '99+' : unreadNotices}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium truncate max-w-[48px]">{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary tab-indicator" />
                  )}
                </Link>
              )
            })
          })()}

          {/* Customize button — admin/developer only */}
          {(user?.role === 'developer' || user?.role === 'admin' || user?.role === 'super_admin') && (
            <button
              onClick={() => { setEditingTabs([...bottomTabs]); setCustomizeOpen(true) }}
              className="flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Customize Bottom Nav Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Bottom Navigation</DialogTitle>
            <DialogDescription>
              Select 3–5 tabs. Drag selected items to reorder.
            </DialogDescription>
          </DialogHeader>

          {/* Live Preview */}
          <div className="rounded-xl border bg-muted/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center justify-around rounded-lg bg-card border py-2 px-2">
              {editingTabs.length > 0 ? (
                editingTabs.map(tabPath => {
                  const tab = ALL_BOTTOM_TABS.find(t => t.to === tabPath)
                  if (!tab) return null
                  const Icon = tab.icon
                  return (
                    <div key={tab.to} className="flex flex-col items-center gap-0.5 px-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-[8px] font-medium text-primary truncate max-w-[40px]">{tab.label}</span>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground py-2">Select tabs to preview</p>
              )}
              {/* More button placeholder */}
              {(user?.role === 'developer' || user?.role === 'admin' || user?.role === 'super_admin') && editingTabs.length > 0 && (
                <div className="flex flex-col items-center gap-0.5 px-1">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[8px] font-medium text-muted-foreground">More</span>
                </div>
              )}
            </div>
          </div>

          <div className="py-2 max-h-[50vh] overflow-y-auto space-y-3">
            {/* Selected items — draggable */}
            {editingTabs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Selected (drag to reorder)</p>
                <div className="space-y-1">
                  {editingTabs.map((tabPath, index) => {
                    const tab = ALL_BOTTOM_TABS.find(t => t.to === tabPath)
                    if (!tab) return null
                    const Icon = tab.icon
                    return (
                      <div
                        key={tab.to}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(index))
                          e.dataTransfer.effectAllowed = 'move'
                          ;(e.target as HTMLElement).classList.add('opacity-50')
                        }}
                        onDragEnd={(e) => {
                          ;(e.target as HTMLElement).classList.remove('opacity-50')
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          ;(e.currentTarget as HTMLElement).classList.add('bg-primary/10', 'border-primary/30')
                        }}
                        onDragLeave={(e) => {
                          ;(e.currentTarget as HTMLElement).classList.remove('bg-primary/10', 'border-primary/30')
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          ;(e.currentTarget as HTMLElement).classList.remove('bg-primary/10', 'border-primary/30')
                          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                          const toIndex = index
                          if (fromIndex === toIndex) return
                          const next = [...editingTabs]
                          const [moved] = next.splice(fromIndex, 1)
                          next.splice(toIndex, 0, moved)
                          setEditingTabs(next)
                        }}
                        onClick={() => toggleBottomTab(tab.to)}
                        className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm cursor-grab active:cursor-grabbing transition-all hover:bg-primary/10"
                      >
                        <span className="text-muted-foreground cursor-grab" title="Drag to reorder">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" /></svg>
                        </span>
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="flex-1 text-left font-medium text-primary">{tab.label}</span>
                        <span className="text-[10px] text-primary/60 font-mono">{index + 1}</span>
                        <span title="Remove"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available items */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Available</p>
              <div className="space-y-1">
                {ALL_BOTTOM_TABS.filter(t => !editingTabs.includes(t.to)).map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.to}
                      onClick={() => toggleBottomTab(tab.to)}
                      disabled={editingTabs.length >= 5}
                      className={`flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm transition-all ${
                        editingTabs.length >= 5
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-muted hover:border-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left text-muted-foreground">{tab.label}</span>
                      <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {editingTabs.length}/5 selected {editingTabs.length < 3 && '(min 3)'}
            </p>
            <DialogFooter className="border-0 pt-0">
              <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveBottomTabs} disabled={editingTabs.length < 3 || editingTabs.length > 5}>
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <kbd className="inline-flex h-6 items-center rounded border bg-muted px-1.5 text-xs font-mono">?</kbd>
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>Quick reference for all available shortcuts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              {
                section: 'Navigation',
                shortcuts: [
                  { keys: ['Ctrl', 'K'], label: 'Open command palette' },
                  { keys: ['Ctrl', 'B'], label: 'Toggle sidebar collapse' },
                  { keys: ['Ctrl', '\\'], label: 'Toggle mobile sidebar' },
                  { keys: ['?'], label: 'Show this help panel' },
                ],
              },
              {
                section: 'Sidebar',
                shortcuts: [
                  { keys: ['Click'], label: 'Expand/collapse group' },
                  { keys: ['★'], label: 'Pin/unpin to Quick Access' },
                  { keys: ['Drag'], label: 'Swipe left to close (mobile)' },
                ],
              },
              {
                section: 'Bottom Nav',
                shortcuts: [
                  { keys: ['Gear icon'], label: 'Customize visible tabs' },
                  { keys: ['Tap'], label: 'Switch pages with animation' },
                ],
              },
            ].map(group => (
              <div key={group.section}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.section}</p>
                <div className="space-y-1.5">
                  {group.shortcuts.map(s => (
                    <div key={s.label} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50">
                      <span className="text-sm">{s.label}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map(k => (
                          <kbd key={k} className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1 text-[10px] font-mono text-muted-foreground">
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setShortcutsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0"
          style={{
            transform: swipeOffset < 0 ? `translateX(${swipeOffset}px)` : undefined,
            transition: swipeRef.current.swiping ? 'none' : 'transform 200ms ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe drag handle */}
          <div className="flex justify-center pt-3 lg:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              Society ERP
            </SheetTitle>
          </SheetHeader>

          {/* Theme Toggle */}
          <div className="px-3 py-2">
            <ThemeToggle variant="sidebar" />
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <button
              onClick={() => { setMobileOpen(false); setCmdOpen(true) }}
              className="flex w-full items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
          </div>

          {/* Quick Access (Pinned + Recent) */}
          {(() => {
            const userRole = (user?.role as UserRole) || 'member'
            const userPerms = user?.permissions as string | null | undefined
            const perms = getUserPermissions(userRole, userPerms)

            const pinned = pinnedPaths
              .filter(path => {
                const item = findNavItem(path)
                return item && perms[item.module]?.access
              })
              .map(path => ({ path, item: findNavItem(path)! }))

            const recent = recentPaths
              .filter(path => !pinnedPaths.includes(path))
              .filter(path => {
                const item = findNavItem(path)
                return item && perms[item.module]?.access
              })
              .slice(0, 3)
              .map(path => ({ path, item: findNavItem(path)! }))

            if (pinned.length === 0 && recent.length === 0) return null

            return (
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 px-2 py-1">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Access</span>
                </div>
                <div className="space-y-0.5">
                  {pinned.map(({ path, item }) => {
                    const Icon = item.icon
                    const isActive = routerState.location.pathname === path
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="truncate">{item.label}</span>
                        <Star className="ml-auto h-3 w-3 shrink-0 fill-current opacity-50" />
                      </Link>
                    )
                  })}
                  {recent.map(({ path, item }) => {
                    const Icon = item.icon
                    const isActive = routerState.location.pathname === path
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="truncate text-[13px]">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {(() => {
              const userRole = (user?.role as UserRole) || 'member'
              const userPerms = user?.permissions as string | null | undefined
              const perms = getUserPermissions(userRole, userPerms)

              return navGroups.map(group => {
                const visibleItems = group.items.filter(item => perms[item.module]?.access)
                if (visibleItems.length === 0) return null
                const isExpanded = expandedGroups.has(group.label)
                const hasActive = visibleItems.some(item => routerState.location.pathname === item.to)
                const GroupIcon = group.icon

                return (
                  <div key={group.label} className="mb-1">
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                        hasActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <GroupIcon className="h-3.5 w-3.5" />
                      <span className="flex-1 text-left">{group.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-0.5 space-y-0.5">
                        {visibleItems.map(item => {
                          const Icon = item.icon
                          const isActive = routerState.location.pathname === item.to
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 pl-8 text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="flex-1 truncate">{item.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </nav>

          {/* User Section */}
          <div className="border-t p-3">
            {user ? (
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors">
                <Avatar className="h-7 w-7 shrink-0">
                  {user.profileImage && (
                    <AvatarImage src={user.profileImage} alt={user.name} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
                  <Badge variant="secondary" className={`text-[9px] px-1 py-0 mt-px ${roleBadgeColors[(user.role as UserRole) || 'member']}`}>
                    {roleDisplayNames[(user.role as UserRole) || 'member']}
                  </Badge>
                </div>
              </Link>
            ) : null}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground mt-1"
              onClick={() => { setMobileOpen(false); handleLogout() }}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign out
            </Button>
            {/* Tap-to-close hint */}
            <p className="mt-3 text-center text-[10px] text-muted-foreground/60 tap-hint pointer-events-none">
              Tap outside to close
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        userRole={(user?.role as UserRole) || 'member'}
        userPermissions={user?.permissions as string | null | undefined}
        extraItems={[
          {
            id: 'action-toggle-sidebar',
            label: 'Toggle Sidebar',
            icon: collapsed ? ChevronRight : ChevronLeft,
            category: 'Actions',
            keywords: ['sidebar', 'collapse', 'expand', 'toggle'],
            shortcut: ['Ctrl', 'B'],
            action: toggleSidebar,
          },
          {
            id: 'action-shortcuts',
            label: 'Keyboard Shortcuts',
            icon: Command,
            category: 'Actions',
            keywords: ['keyboard', 'shortcuts', 'help', 'hotkeys'],
            shortcut: ['?'],
            action: () => setShortcutsOpen(true),
          },
          {
            id: 'action-toggle-mobile-sidebar',
            label: 'Toggle Mobile Sidebar',
            icon: Menu,
            category: 'Actions',
            keywords: ['mobile', 'sidebar', 'menu', 'hamburger'],
            shortcut: ['Ctrl', '\\'],
            action: () => setMobileOpen(prev => !prev),
          },
        ]}
      />
    </div>
  )
}
