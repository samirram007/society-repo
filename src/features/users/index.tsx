import { useState, useEffect, useCallback } from 'react'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  UserCog,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  X,
  ToggleLeft,
  ToggleRight,
  Key,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  getUserPermissions,
  roleDisplayNames,
  roleBadgeColors,
  ALL_MODULES,
  MODULE_GROUP_LABELS,
  MODULE_GROUPS,
  type UserRole,
  type ModuleName,
  type ModulePermissions,
  type ModuleOverrideMap,
} from '@/lib/permissions'

interface UserRecord {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  role?: string | null
  permissions?: string | null
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
}

interface Role {
  id: number
  name: string
  description?: string | null
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)

  // Permission override state
  const [userOverrides, setUserOverrides] = useState<Partial<ModuleOverrideMap>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [savingPerms, setSavingPerms] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>('member')

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roleIds: [] as number[],
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch users
  const fetchUsers = async () => {
    try {
      const data = await orpc.userManagement.list({ search: search || undefined }) as UserRecord[]
      setUsers(data || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const data = await orpc.userManagement.getRoles() as Role[]
      setRoles(data || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  // Re-fetch on search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Filter
  const filteredUsers = users.filter((user) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    return matchesStatus
  })

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.isActive).length
  const inactiveUsers = totalUsers - activeUsers

  // Form validation
  const validateForm = (isEdit = false) => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email'
    if (!isEdit && !formData.password) errors.password = 'Password is required'
    if (!isEdit && formData.password && formData.password.length < 6) errors.password = 'Min 6 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', roleIds: [] })
    setFormErrors({})
  }

  // Create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.userManagement.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        roleIds: formData.roleIds.length > 0 ? formData.roleIds : undefined,
      })
      setCreateDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      setFormErrors({ submit: error.message || 'Failed to create user' })
    } finally {
      setSubmitting(false)
    }
  }

  // Edit
  const handleEdit = async (user: UserRecord) => {
    setSelectedUser(user)
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      roleIds: [],
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!validateForm(true) || !selectedUser) return
    setSubmitting(true)
    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
      }
      if (formData.password) updateData.password = formData.password
      await orpc.userManagement.update({ id: selectedUser.id, data: updateData })
      setEditDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      setFormErrors({ submit: error.message || 'Failed to update user' })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      await orpc.userManagement.delete({ id: selectedUser.id })
      setDeleteDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle active
  const handleToggleActive = async (user: UserRecord) => {
    try {
      await orpc.userManagement.toggleActive({ id: user.id })
      fetchUsers()
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  // ============================================
  // PERMISSION OVERRIDES
  // ============================================
  const openPermissionsDialog = async (user: UserRecord) => {
    setSelectedUser(user)
    const role = (user.role || 'member') as UserRole
    setUserRole(role)
    // Parse existing overrides
    try {
      const perms = user.permissions ? JSON.parse(user.permissions) : {}
      setUserOverrides(perms)
    } catch {
      setUserOverrides({})
    }
    // Expand all groups by default
    const expanded: Record<string, boolean> = {}
    for (const group of Object.keys(MODULE_GROUP_LABELS)) {
      expanded[group] = true
    }
    setExpandedGroups(expanded)
    setPermissionsDialogOpen(true)
  }

  const toggleGroupExpand = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const updateOverride = (module: ModuleName, field: keyof ModulePermissions, value: boolean) => {
    setUserOverrides((prev: Partial<ModuleOverrideMap>) => ({
      ...prev,
      [module]: { ...prev[module], [field]: value },
    }))
  }

  const applyPreset = (preset: 'full' | 'read' | 'view' | 'clear') => {
    const modules = ALL_MODULES
    const newOverrides: Partial<ModuleOverrideMap> = {}
    for (const mod of modules) {
      if (preset === 'full') newOverrides[mod] = { access: true, view: true, modify: true, read: true }
      else if (preset === 'read') newOverrides[mod] = { access: true, view: true, modify: false, read: true }
      else if (preset === 'view') newOverrides[mod] = { access: true, view: true, modify: false, read: false }
      else newOverrides[mod] = { access: false, view: false, modify: false, read: false }
    }
    setUserOverrides(newOverrides)
  }

  const savePermissions = async () => {
    if (!selectedUser) return
    setSavingPerms(true)
    try {
      await orpc.userManagement.updatePermissions({
        id: selectedUser.id,
        permissions: userOverrides as any,
      })
      setPermissionsDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to save permissions:', error)
    } finally {
      setSavingPerms(false)
    }
  }

  const resetOverrides = () => {
    setUserOverrides({})
  }

  // Table columns
  const columns: ColumnDef<UserRecord>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original
        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone || '-'}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = (row.original.role || 'member') as UserRole
        const hasOverrides = !!row.original.permissions && row.original.permissions !== 'null' && row.original.permissions !== '{}'
        return (
          <div className="flex items-center gap-2">
            <Badge className={roleBadgeColors[role] || ''}>
              <ShieldCheck className="mr-1 h-3 w-3" />
              {roleDisplayNames[role] || role}
            </Badge>
            {hasOverrides && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                <Key className="mr-0.5 h-2.5 w-2.5" />
                Custom
              </Badge>
            )}
          </div>
        )
      },
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
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => {
        if (!row.original.lastLoginAt) return <span className="text-sm text-muted-foreground">Never</span>
        const date = new Date(row.original.lastLoginAt)
        return <span className="text-sm">{date.toLocaleDateString('en-IN')}</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={user.isActive ? 'Deactivate' : 'Activate'}
              onClick={() => handleToggleActive(user)}
            >
              {user.isActive ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(user)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Permission Overrides"
              onClick={() => openPermissionsDialog(user)}
            >
              <Key className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => {
                setSelectedUser(user)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useTable({
    data: filteredUsers,
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, roles, and access permissions
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <UserCog className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
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
                <p className="text-2xl font-bold">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
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
                <p className="text-2xl font-bold">{inactiveUsers}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
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
                          <UserCog className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No users found</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
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
                    filteredUsers.length
                  )}{' '}
                  of {filteredUsers.length} users
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
          CREATE USER DIALOG
          ============================================ */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) { setCreateDialogOpen(false); resetForm() }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new system user account.</DialogDescription>
          </DialogHeader>
          <UserForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            roles={roles}
            isEdit={false}
          />
          {formErrors.submit && (
            <p className="text-sm text-destructive">{formErrors.submit}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          EDIT USER DIALOG
          ============================================ */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) { setEditDialogOpen(false); resetForm() }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and permissions.</DialogDescription>
          </DialogHeader>
          <UserForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            roles={roles}
            isEdit={true}
          />
          {formErrors.submit && (
            <p className="text-sm text-destructive">{formErrors.submit}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE USER DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          PERMISSION OVERRIDES DIALOG
          ============================================ */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Permission Overrides
            </DialogTitle>
            <DialogDescription>
              Customize permissions for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
              {' '}(base role: {roleDisplayNames[userRole]}). Overrides apply <em>on top of</em> role defaults.
            </DialogDescription>
          </DialogHeader>

          {/* Preset buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick presets:</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => applyPreset('full')}>
              <Check className="mr-1 h-3 w-3" /> Full Access
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => applyPreset('read')}>
              <Check className="mr-1 h-3 w-3" /> Read Only
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => applyPreset('view')}>
              <Check className="mr-1 h-3 w-3" /> View Only
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => applyPreset('clear')}>
              <RotateCcw className="mr-1 h-3 w-3" /> Clear All
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetOverrides}>
              Reset to Role Defaults
            </Button>
          </div>

          {/* Permission matrix */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {Object.entries(MODULE_GROUP_LABELS).map(([group, groupLabel]) => {
              const modules = MODULE_GROUPS[group as keyof typeof MODULE_GROUPS] as ModuleName[]
              if (!modules || modules.length === 0) return null
              const isExpanded = expandedGroups[group] !== false
              const basePerms = getUserPermissions(userRole)

              return (
                <div key={group} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
                    onClick={() => toggleGroupExpand(group)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {groupLabel}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {modules.length} modules
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="divide-y">
                      <div className="grid grid-cols-[1fr_repeat(4,60px)] gap-0 px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                        <span>Module</span>
                        <span className="text-center">Access</span>
                        <span className="text-center">View</span>
                        <span className="text-center">Modify</span>
                        <span className="text-center">Read</span>
                      </div>
                      {modules.map((mod) => {
                        const overrides = userOverrides[mod] || {}
                        const base = basePerms[mod]
                        const effective = {
                          access: overrides.access ?? base?.access ?? false,
                          view: overrides.view ?? base?.view ?? false,
                          modify: overrides.modify ?? base?.modify ?? false,
                          read: overrides.read ?? base?.read ?? false,
                        }

                        const hasAccess = effective.access
                        const moduleLabel = mod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

                        return (
                          <div key={mod} className="grid grid-cols-[1fr_repeat(4,60px)] gap-0 px-3 py-2 items-center hover:bg-muted/20">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${hasAccess ? '' : 'text-muted-foreground'}`}>
                                {moduleLabel}
                              </span>
                              {/* Show role default indicator */}
                              <span className="text-[9px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
                                role
                              </span>
                            </div>
                            {(['access', 'view', 'modify', 'read'] as const).map((field) => {
                              const isOverridden = overrides[field] !== undefined
                              const val = effective[field]
                              return (
                                <div key={field} className="flex justify-center">
                                  <button
                                    type="button"
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all text-[10px]
                                      ${val
                                        ? isOverridden
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300'
                                        : isOverridden
                                          ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                          : 'bg-muted border-border text-muted-foreground'
                                      }`
                                    }
                                    onClick={() => updateOverride(mod, field, !val)}
                                    title={isOverridden ? `${field}: overridden (click to toggle)` : `${field}: using role default (${val ? 'on' : 'off'}) (click to override)`}
                                  >
                                    {val ? '✓' : '×'}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t pt-2">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700" />
              Role default (on)
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-muted border border-border" />
              Role default (off)
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary border border-primary" />
              Override (on)
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" />
              Override (off)
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePermissions} disabled={savingPerms}>
              {savingPerms && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Overrides
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// USER FORM SUBCOMPONENT
// ============================================
function UserForm({
  formData,
  setFormData,
  formErrors,
  roles,
  isEdit,
}: {
  formData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
    roleIds: number[]
  }
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>
  formErrors: Record<string, string>
  roles: Role[]
  isEdit: boolean
}) {
  const toggleRole = (roleId: number) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }))
  }

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="First name"
            className={formErrors.firstName ? 'border-destructive' : ''}
          />
          {formErrors.firstName && (
            <p className="text-xs text-destructive">{formErrors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Last name"
            className={formErrors.lastName ? 'border-destructive' : ''}
          />
          {formErrors.lastName && (
            <p className="text-xs text-destructive">{formErrors.lastName}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          className={formErrors.email ? 'border-destructive' : ''}
          disabled={isEdit}
        />
        {formErrors.email && (
          <p className="text-xs text-destructive">{formErrors.email}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91 98765 43210"
        />
      </div>
      <div className="space-y-2">
        <Label>{isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder={isEdit ? 'Enter new password' : 'Min 6 characters'}
          className={formErrors.password ? 'border-destructive' : ''}
        />
        {formErrors.password && (
          <p className="text-xs text-destructive">{formErrors.password}</p>
        )}
      </div>
      {roles.length > 0 && (
        <div className="space-y-2">
          <Label>Roles</Label>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Badge
                key={role.id}
                variant={formData.roleIds.includes(role.id) ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => toggleRole(role.id)}
              >
                <ShieldCheck className="mr-1 h-3 w-3" />
                {role.name}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Click to toggle role assignment</p>
        </div>
      )}
    </div>
  )
}
