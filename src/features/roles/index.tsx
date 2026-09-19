import { useState, useEffect } from 'react'
import {
  Shield, Plus, Pencil, Trash2, Users, ChevronDown, ChevronRight,
  Check, X, Loader2, Save, Eye, EyeOff, Edit, Lock, Unlock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { orpc } from '@/server/client'
import {
  type ModuleName, type ModulePermissions, roleDisplayNames, roleBadgeColors,
} from '@/lib/permissions'

// ============================================
// CONSTANTS
// ============================================
const ALL_MODULES: { key: ModuleName; label: string; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard', group: 'Main' },
  { key: 'society_map', label: 'Society Map', group: 'Main' },
  { key: 'members', label: 'Members', group: 'Property' },
  { key: 'flats', label: 'Flats', group: 'Property' },
  { key: 'parking', label: 'Parking', group: 'Property' },
  { key: 'vehicles', label: 'Vehicles', group: 'Property' },
  { key: 'dues', label: 'Dues & Payments', group: 'Finance' },
  { key: 'accounts', label: 'Accounts', group: 'Finance' },
  { key: 'expenses', label: 'Expenses', group: 'Finance' },
  { key: 'assets', label: 'Assets', group: 'Finance' },
  { key: 'maintenance', label: 'Maintenance', group: 'Operations' },
  { key: 'amenities', label: 'Amenities', group: 'Operations' },
  { key: 'staff', label: 'Staff', group: 'Operations' },
  { key: 'visitors', label: 'Visitors', group: 'Security' },
  { key: 'emergency', label: 'Emergency', group: 'Security' },
  { key: 'security', label: 'CCTV & Vigilance', group: 'Security' },
  { key: 'help_center', label: 'Help Center', group: 'System' },
  { key: 'notices', label: 'Notice Board', group: 'Communication' },
  { key: 'celebrations', label: 'Celebrations', group: 'Communication' },
  { key: 'meetings', label: 'Meetings', group: 'Communication' },
  { key: 'documents', label: 'Documents', group: 'Communication' },
  { key: 'users', label: 'Users', group: 'System' },
  { key: 'settings', label: 'Settings', group: 'System' },
  { key: 'api_docs', label: 'API Docs', group: 'System' },
]

const MODULE_GROUPS = ['Main', 'Property', 'Finance', 'Operations', 'Security', 'Communication', 'System']

const DEFAULT_PERMISSIONS: Record<ModuleName, ModulePermissions> = Object.fromEntries(
  ALL_MODULES.map(m => [m.key, { access: false, view: false, modify: false, read: false }])
) as Record<ModuleName, ModulePermissions>

const PRESET_ROLES: Record<string, Record<ModuleName, ModulePermissions>> = {
  developer: Object.fromEntries(ALL_MODULES.map(m => [m.key, { access: true, view: true, modify: true, read: true }])) as Record<ModuleName, ModulePermissions>,
  admin: Object.fromEntries(ALL_MODULES.map(m => [m.key, { access: true, view: true, modify: true, read: true }])) as Record<ModuleName, ModulePermissions>,
  super_admin: Object.fromEntries(ALL_MODULES.map(m => [m.key, { access: true, view: true, modify: true, read: true }])) as Record<ModuleName, ModulePermissions>,
  staff: {
    dashboard: { access: true, view: true, modify: false, read: false },
    society_map: { access: true, view: true, modify: false, read: false },
    members: { access: true, view: true, modify: false, read: false },
    flats: { access: true, view: true, modify: false, read: false },
    parking: { access: true, view: true, modify: false, read: false },
    vehicles: { access: true, view: true, modify: false, read: false },
    dues: { access: false, view: false, modify: false, read: false },
    accounts: { access: false, view: false, modify: false, read: false },
    expenses: { access: false, view: false, modify: false, read: false },
    assets: { access: true, view: true, modify: false, read: false },
    maintenance: { access: true, view: true, modify: true, read: true },
    amenities: { access: true, view: true, modify: false, read: false },
    staff: { access: true, view: true, modify: false, read: false },
    visitors: { access: true, view: true, modify: true, read: true },
    emergency: { access: true, view: true, modify: true, read: true },
    security: { access: true, view: true, modify: true, read: true },
    help_center: { access: true, view: true, modify: false, read: false },
    notices: { access: true, view: true, modify: false, read: false },
    celebrations: { access: false, view: false, modify: false, read: false },
    meetings: { access: false, view: false, modify: false, read: false },
    documents: { access: true, view: true, modify: false, read: false },
    users: { access: false, view: false, modify: false, read: false },
    settings: { access: false, view: false, modify: false, read: false },
    api_docs: { access: false, view: false, modify: false, read: false },
  },
  member: {
    dashboard: { access: true, view: true, modify: false, read: false },
    society_map: { access: true, view: true, modify: false, read: false },
    members: { access: true, view: true, modify: false, read: false },
    flats: { access: true, view: true, modify: false, read: false },
    parking: { access: true, view: true, modify: false, read: false },
    vehicles: { access: true, view: true, modify: false, read: false },
    dues: { access: true, view: true, modify: false, read: true },
    accounts: { access: false, view: false, modify: false, read: false },
    expenses: { access: false, view: false, modify: false, read: false },
    assets: { access: false, view: false, modify: false, read: false },
    maintenance: { access: true, view: true, modify: true, read: true },
    amenities: { access: true, view: true, modify: true, read: true },
    staff: { access: false, view: false, modify: false, read: false },
    visitors: { access: true, view: true, modify: true, read: true },
    emergency: { access: true, view: true, modify: false, read: false },
    security: { access: true, view: true, modify: false, read: false },
    help_center: { access: true, view: true, modify: false, read: false },
    notices: { access: true, view: true, modify: false, read: false },
    celebrations: { access: true, view: true, modify: false, read: false },
    meetings: { access: true, view: true, modify: false, read: false },
    documents: { access: true, view: true, modify: false, read: false },
    users: { access: false, view: false, modify: false, read: false },
    settings: { access: false, view: false, modify: false, read: false },
    api_docs: { access: false, view: false, modify: false, read: false },
  },
}

// ============================================
// PERMISSION TOGGLE COMPONENT
// ============================================
function PermissionToggle({
  label, checked, onChange, icon: Icon,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; icon?: any
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
        checked
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function RolesPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(MODULE_GROUPS))

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPermissions, setFormPermissions] = useState<Record<ModuleName, ModulePermissions>>({ ...DEFAULT_PERMISSIONS })
  const [submitting, setSubmitting] = useState(false)

  // Load roles
  const loadRoles = async () => {
    try {
      const data = await orpc.roleManagement.list({})
      setRoles(data)
    } catch (e) {
      console.error('Failed to load roles:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await orpc.roleManagement.list({})
        if (!cancelled) setRoles(data)
      } catch (e) {
        console.error('Failed to load roles:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Toggle group expand
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  // Toggle all modules in a group
  const toggleGroupAll = (group: string, value: boolean) => {
    const groupModules = ALL_MODULES.filter(m => m.group === group)
    setFormPermissions(prev => {
      const next = { ...prev }
      for (const mod of groupModules) {
        next[mod.key] = { access: value, view: value, modify: value, read: value }
      }
      return next
    })
  }

  // Toggle single permission
  const togglePerm = (module: ModuleName, perm: keyof ModulePermissions) => {
    setFormPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [perm]: !prev[module][perm],
      },
    }))
  }

  // Apply preset
  const applyPreset = (preset: string) => {
    const p = PRESET_ROLES[preset]
    if (p) setFormPermissions({ ...p })
  }

  // Open create dialog
  const openCreate = () => {
    setFormName('')
    setFormDescription('')
    setFormPermissions({ ...DEFAULT_PERMISSIONS })
    setCreateOpen(true)
  }

  // Open edit dialog
  const openEdit = (role: any) => {
    setSelectedRole(role)
    setFormName(role.name)
    setFormDescription(role.description || '')
    try {
      const perms = JSON.parse(role.permissions || '{}')
      setFormPermissions({ ...DEFAULT_PERMISSIONS, ...perms })
    } catch {
      setFormPermissions({ ...DEFAULT_PERMISSIONS })
    }
    setEditOpen(true)
  }

  // Open delete dialog
  const openDelete = (role: any) => {
    setSelectedRole(role)
    setDeleteOpen(true)
  }

  // Save role
  const handleSave = async (isEdit: boolean) => {
    if (!formName.trim()) return
    setSubmitting(true)
    try {
      const permsJson = JSON.stringify(formPermissions)
      if (isEdit && selectedRole) {
        await orpc.roleManagement.update({
          id: selectedRole.id,
          data: { name: formName.trim(), description: formDescription || null, permissions: permsJson },
        })
        setEditOpen(false)
      } else {
        await orpc.roleManagement.create({
          name: formName.trim(),
          description: formDescription || undefined,
          permissions: permsJson,
        })
        setCreateOpen(false)
      }
      loadRoles()
    } catch (e: any) {
      console.error('Failed to save role:', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete role
  const handleDelete = async () => {
    if (!selectedRole) return
    setSubmitting(true)
    try {
      await orpc.roleManagement.delete({ id: selectedRole.id })
      setDeleteOpen(false)
      setSelectedRole(null)
      loadRoles()
    } catch (e: any) {
      console.error('Failed to delete role:', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Count permissions for a role
  const countPerms = (permsJson: string | null) => {
    try {
      const perms = JSON.parse(permsJson || '{}')
      const modules = Object.keys(perms).filter(k => perms[k]?.access)
      return modules.length
    } catch {
      return 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            Role Management
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage custom roles with granular permissions</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => {
          const permCount = countPerms(role.permissions)
          const roleKey = role.name.toLowerCase().replace(/\s+/g, '_') as string
          return (
            <Card key={role.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 mt-0.5 ${roleBadgeColors[roleKey as keyof typeof roleBadgeColors] || 'bg-slate-100 text-slate-800'}`}
                      >
                        {roleDisplayNames[roleKey as keyof typeof roleDisplayNames] || role.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(role)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => openDelete(role)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {role.description && (
                  <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" />
                    {permCount} modules accessible
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Add Role Card */}
        <Card
          className="border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          onClick={openCreate}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Create New Role</p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* CREATE / EDIT DIALOG                        */}
      {/* ============================================ */}
      <Dialog open={createOpen || editOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditOpen(false) } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editOpen ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editOpen ? 'Update role name and permissions' : 'Define a new role with specific module permissions'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name <span className="text-destructive">*</span></Label>
                <Input
                  id="role-name"
                  placeholder="e.g. Finance Manager"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-desc">Description</Label>
                <Input
                  id="role-desc"
                  placeholder="Brief description of this role"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESET_ROLES).map(preset => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFormPermissions({ ...DEFAULT_PERMISSIONS })}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <Separator />

            {/* Permission Matrix */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Module Permissions</Label>
              <p className="text-xs text-muted-foreground">
                Toggle permissions for each module. <strong>Access</strong> = see in sidebar, <strong>View</strong> = see data, <strong>Modify</strong> = create/edit, <strong>Read</strong> = view details.
              </p>

              {MODULE_GROUPS.map(group => {
                const groupModules = ALL_MODULES.filter(m => m.group === group)
                const allChecked = groupModules.every(m => formPermissions[m.key]?.access)
                const someChecked = groupModules.some(m => formPermissions[m.key]?.access)
                const isExpanded = expandedGroups.has(group)

                return (
                  <div key={group} className="rounded-lg border">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="flex items-center gap-1.5"
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <span className="text-xs font-semibold uppercase tracking-wider">{group}</span>
                      </button>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => toggleGroupAll(group, !allChecked)}
                      >
                        {allChecked ? 'Remove All' : 'Grant All'}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="p-3 space-y-2">
                        {groupModules.map(mod => {
                          const perms = formPermissions[mod.key] || DEFAULT_PERMISSIONS[mod.key]
                          return (
                            <div key={mod.key} className="flex items-center gap-3">
                              <span className="text-sm font-medium w-32 shrink-0">{mod.label}</span>
                              <div className="flex flex-wrap gap-1.5">
                                <PermissionToggle
                                  label="Access"
                                  checked={perms.access}
                                  onChange={() => togglePerm(mod.key, 'access')}
                                  icon={perms.access ? Eye : EyeOff}
                                />
                                <PermissionToggle
                                  label="View"
                                  checked={perms.view}
                                  onChange={() => togglePerm(mod.key, 'view')}
                                  icon={perms.view ? Check : X}
                                />
                                <PermissionToggle
                                  label="Modify"
                                  checked={perms.modify}
                                  onChange={() => togglePerm(mod.key, 'modify')}
                                  icon={perms.modify ? Edit : Lock}
                                />
                                <PermissionToggle
                                  label="Read"
                                  checked={perms.read}
                                  onChange={() => togglePerm(mod.key, 'read')}
                                  icon={perms.read ? Unlock : Lock}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditOpen(false) }}>Cancel</Button>
            <Button onClick={() => handleSave(editOpen)} disabled={submitting || !formName.trim()}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editOpen ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DELETE DIALOG                               */}
      {/* ============================================ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedRole?.name}</strong>? Users with this role will lose their permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
