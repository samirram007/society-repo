// ============================================
// ROLE-BASED PERMISSIONS CONFIGURATION
// ============================================

export type ModuleName =
  | 'dashboard'
  | 'society_map'
  | 'members'
  | 'flats'
  | 'parking'
  | 'vehicles'
  | 'dues'
  | 'accounts'
  | 'expenses'
  | 'assets'
  | 'maintenance'
  | 'amenities'
  | 'documents'
  | 'notices'
  | 'celebrations'
  | 'meetings'
  | 'visitors'
  | 'emergency'
  | 'staff'
  | 'users'
  | 'security'
  | 'help_center'
  | 'settings'
  | 'api_docs'

export type PermissionLevel = 'none' | 'read' | 'view' | 'modify' | 'full'

export interface ModulePermissions {
  access: boolean    // Can see the page in sidebar
  view: boolean     // Can view data
  modify: boolean   // Can create/edit/delete
  read: boolean     // Can view detailed data
}

export type UserRole = 'developer' | 'admin' | 'super_admin' | 'staff' | 'member'

export type ModuleOverrideMap = Record<ModuleName, Partial<ModulePermissions>>

// ============================================
// DEFAULT PERMISSIONS BY ROLE
// ============================================
export const ALL_MODULES: ModuleName[] = [
  'dashboard', 'society_map', 'members', 'flats', 'parking', 'vehicles',
  'dues', 'accounts', 'expenses', 'assets', 'maintenance', 'amenities',
  'documents', 'notices', 'celebrations', 'meetings', 'visitors', 'emergency', 'security', 'staff', 'help_center', 'users', 'settings', 'api_docs',
]

export const MODULE_GROUPS = {
  main: ['dashboard', 'society_map'] as ModuleName[],
  property: ['members', 'flats', 'parking', 'vehicles'] as ModuleName[],
  finance: ['dues', 'accounts', 'expenses', 'assets'] as ModuleName[],
  operations: ['maintenance', 'amenities', 'staff'] as ModuleName[],
  security: ['visitors', 'emergency', 'security'] as ModuleName[],
  communication: ['documents', 'notices', 'celebrations', 'meetings'] as ModuleName[],
  system: ['users', 'settings', 'api_docs', 'help_center'] as ModuleName[],
}

export const MODULE_GROUP_LABELS: Record<string, string> = {
  main: 'Main',
  property: 'Property',
  finance: 'Finance',
  operations: 'Operations',
  security: 'Security',
  communication: 'Communication',
  system: 'System',
}

const NO_ACCESS: ModulePermissions = { access: false, view: false, modify: false, read: false }
const READ_ONLY: ModulePermissions = { access: true, view: true, modify: false, read: true }
const VIEW_ONLY: ModulePermissions = { access: true, view: true, modify: false, read: false }
const FULL_ACCESS: ModulePermissions = { access: true, view: true, modify: true, read: true }

// Developer: Full access to everything
const developerPermissions: Record<ModuleName, ModulePermissions> = Object.fromEntries(
  ALL_MODULES.map(m => [m, FULL_ACCESS])
) as Record<ModuleName, ModulePermissions>

// Admin: Full access except API docs
const adminPermissions: Record<ModuleName, ModulePermissions> = {
  ...Object.fromEntries(ALL_MODULES.map(m => [m, FULL_ACCESS])) as Record<ModuleName, ModulePermissions>,
  api_docs: { access: true, view: true, modify: false, read: true },
}

// Super Admin: Society management, no system settings
const superAdminPermissions: Record<ModuleName, ModulePermissions> = {
  dashboard: FULL_ACCESS,
  society_map: FULL_ACCESS,
  members: FULL_ACCESS,
  flats: FULL_ACCESS,
  parking: FULL_ACCESS,
  vehicles: FULL_ACCESS,
  dues: FULL_ACCESS,
  accounts: FULL_ACCESS,
  expenses: FULL_ACCESS,
  assets: FULL_ACCESS,
  maintenance: FULL_ACCESS,
  amenities: FULL_ACCESS,
  documents: FULL_ACCESS,
  notices: FULL_ACCESS,
  celebrations: FULL_ACCESS,
  meetings: FULL_ACCESS,
  visitors: FULL_ACCESS,
  emergency: FULL_ACCESS,
  security: FULL_ACCESS,
  staff: FULL_ACCESS,
  help_center: FULL_ACCESS,
  users: { access: true, view: true, modify: false, read: true },
  settings: { access: true, view: true, modify: false, read: true },
  api_docs: NO_ACCESS,
}

// Staff: Limited access - security, visitors, maintenance
const staffPermissions: Record<ModuleName, ModulePermissions> = {
  dashboard: VIEW_ONLY,
  society_map: VIEW_ONLY,
  members: VIEW_ONLY,
  flats: VIEW_ONLY,
  parking: VIEW_ONLY,
  vehicles: VIEW_ONLY,
  dues: NO_ACCESS,
  accounts: NO_ACCESS,
  expenses: NO_ACCESS,
  assets: VIEW_ONLY,
  maintenance: { access: true, view: true, modify: true, read: true },
  amenities: VIEW_ONLY,
  documents: VIEW_ONLY,
  notices: VIEW_ONLY,
  celebrations: NO_ACCESS,
  meetings: NO_ACCESS,
  visitors: FULL_ACCESS,
  emergency: FULL_ACCESS,
  security: FULL_ACCESS,
  staff: VIEW_ONLY,
  help_center: VIEW_ONLY,
  users: NO_ACCESS,
  settings: NO_ACCESS,
  api_docs: NO_ACCESS,
}

// Member: View own data, limited interactions
const memberPermissions: Record<ModuleName, ModulePermissions> = {
  dashboard: VIEW_ONLY,
  society_map: VIEW_ONLY,
  members: { access: true, view: true, modify: false, read: false },
  flats: VIEW_ONLY,
  parking: VIEW_ONLY,
  vehicles: VIEW_ONLY,
  dues: READ_ONLY,
  accounts: NO_ACCESS,
  expenses: NO_ACCESS,
  assets: NO_ACCESS,
  maintenance: { access: true, view: true, modify: true, read: true },
  amenities: { access: true, view: true, modify: true, read: true },
  documents: VIEW_ONLY,
  notices: VIEW_ONLY,
  celebrations: VIEW_ONLY,
  meetings: VIEW_ONLY,
  visitors: { access: true, view: true, modify: true, read: true },
  emergency: VIEW_ONLY,
  security: VIEW_ONLY,
  staff: NO_ACCESS,
  help_center: VIEW_ONLY,
  users: NO_ACCESS,
  settings: NO_ACCESS,
  api_docs: NO_ACCESS,
}

// ============================================
// ROLE PERMISSIONS MAP
// ============================================
export const rolePermissions: Record<UserRole, Record<ModuleName, ModulePermissions>> = {
  developer: developerPermissions,
  admin: adminPermissions,
  super_admin: superAdminPermissions,
  staff: staffPermissions,
  member: memberPermissions,
}

// ============================================
// ROLE DISPLAY NAMES
// ============================================
export const roleDisplayNames: Record<UserRole, string> = {
  developer: 'Developer',
  admin: 'Administrator',
  super_admin: 'Super Admin',
  staff: 'Staff',
  member: 'Member',
}

// ============================================
// ROLE BADGE COLORS
// ============================================
export const roleBadgeColors: Record<UserRole, string> = {
  developer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  super_admin: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  staff: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  member: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get permissions for a user role, optionally merged with custom permissions
 */
const ROLE_SIDEBAR_KEY = 'role-sidebar-permissions'

function getRoleSidebarOverrides(): Record<UserRole, Record<ModuleName, boolean>> | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(ROLE_SIDEBAR_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

export function getUserPermissions(
  role: UserRole,
  customPermissions?: string | null
): Record<ModuleName, ModulePermissions> {
  const basePermissions = rolePermissions[role] || rolePermissions.member

  // Start with base permissions
  let merged = { ...basePermissions }

  // Apply role-level sidebar overrides from Settings > Roles & Sidebar
  const roleOverrides = getRoleSidebarOverrides()
  if (roleOverrides?.[role]) {
    for (const [module, hasAccess] of Object.entries(roleOverrides[role])) {
      if (module in merged) {
        merged[module as ModuleName] = {
          ...merged[module as ModuleName],
          access: hasAccess,
        }
      }
    }
  }

  // Apply per-user custom permissions (highest priority)
  if (customPermissions) {
    try {
      const custom = JSON.parse(customPermissions) as Partial<Record<ModuleName, Partial<ModulePermissions>>>
      for (const [module, perms] of Object.entries(custom)) {
        if (module in merged && perms) {
          merged[module as ModuleName] = {
            ...merged[module as ModuleName],
            ...perms,
          }
        }
      }
    } catch {}
  }

  return merged
}

/**
 * Check if a user can access a specific module
 */
export function canAccess(
  role: UserRole,
  module: ModuleName,
  customPermissions?: string | null
): boolean {
  const perms = getUserPermissions(role, customPermissions)
  return perms[module]?.access ?? false
}

/**
 * Check if a user can modify (create/edit/delete) in a module
 */
export function canModify(
  role: UserRole,
  module: ModuleName,
  customPermissions?: string | null
): boolean {
  const perms = getUserPermissions(role, customPermissions)
  return perms[module]?.modify ?? false
}

/**
 * Check if a user can view data in a module
 */
export function canView(
  role: UserRole,
  module: ModuleName,
  customPermissions?: string | null
): boolean {
  const perms = getUserPermissions(role, customPermissions)
  return perms[module]?.view ?? false
}

/**
 * Filter nav items based on user role permissions
 */
export function filterNavByRole<T extends { to: string }>(
  items: T[],
  role: UserRole,
  customPermissions?: string | null
): T[] {
  const perms = getUserPermissions(role, customPermissions)
  return items.filter(item => {
    // Extract module name from route path
    const path = item.to.replace(/^\//, '').split('/')[0] || 'dashboard'
    const moduleName = path.replace(/-/g, '_') as ModuleName
    return perms[moduleName]?.access ?? false
  })
}
