import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  Palette,
  Building2,
  CreditCard,
  Bell,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Shield,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeCustomizer } from '@/components/theme-customizer'
import { orpc } from '@/server/client'
import {
  ALL_MODULES,
  MODULE_GROUPS,
  MODULE_GROUP_LABELS,
  roleDisplayNames,
  rolePermissions,
  type UserRole,
  type ModuleName,
  type ModulePermissions,
} from '@/lib/permissions'

// ============================================
// TYPES
// ============================================
interface Society {
  id: number
  name: string
  registrationNumber?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  logo?: string
  totalFlats: number
  totalTowers: number
  totalMembers: number
  foundingYear?: number
  area?: number
  bankName?: string
  bankAccountNumber?: string
  bankIfsc?: string
  gstNumber?: string
  panNumber?: string
  maintenanceDay: number
  lateFeePercentage: number
  gracePeriodDays: number
  isActive: boolean
}

// ============================================
// MAIN COMPONENT
// ============================================
export function SettingsPage() {
  // State
  const [society, setSociety] = useState<Society | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    registrationNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    foundingYear: '',
    area: '',
  })

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceDay: '10',
    lateFeePercentage: '2',
    gracePeriodDays: '5',
  })

  const [bankingForm, setBankingForm] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    gstNumber: '',
    panNumber: '',
  })

  const [notificationForm, setNotificationForm] = useState({
    emailDues: true,
    smsReminder: true,
    maintenanceAlert: true,
    whatsapp: false,
    emailNotices: true,
    visitorAlerts: true,
  })

  // Role permissions state
  const ROLES: UserRole[] = ['developer', 'admin', 'super_admin', 'staff', 'member']
  const [rolePerms, setRolePerms] = useState<Record<UserRole, Record<ModuleName, boolean>>>({} as any)
  const ROLE_PERMS_KEY = 'role-sidebar-permissions'

  const loadRolePerms = () => {
    try {
      const saved = localStorage.getItem(ROLE_PERMS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    // Initialize from default rolePermissions
    const initial: Record<UserRole, Record<ModuleName, boolean>> = {} as any
    for (const role of ROLES) {
      initial[role] = {} as Record<ModuleName, boolean>
      for (const mod of ALL_MODULES) {
        initial[role][mod] = rolePermissions[role][mod]?.access ?? false
      }
    }
    return initial
  }

  const toggleRoleModule = (role: UserRole, module: ModuleName) => {
    setRolePerms(prev => ({
      ...prev,
      [role]: { ...prev[role], [module]: !prev[role][module] },
    }))
  }

  const toggleRoleAllModules = (role: UserRole, value: boolean) => {
    setRolePerms(prev => ({
      ...prev,
      [role]: Object.fromEntries(ALL_MODULES.map(m => [m, value])) as Record<ModuleName, boolean>,
    }))
  }

  const toggleModuleAllRoles = (module: ModuleName, value: boolean) => {
    setRolePerms(prev => {
      const next = { ...prev }
      for (const role of ROLES) {
        next[role] = { ...next[role], [module]: value }
      }
      return next
    })
  }

  const saveRolePerms = () => {
    setSaving(true)
    try {
      localStorage.setItem(ROLE_PERMS_KEY, JSON.stringify(rolePerms))
      // Dispatch storage event so sidebar re-reads
      window.dispatchEvent(new Event('storage'))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const resetRolePerms = () => {
    localStorage.removeItem(ROLE_PERMS_KEY)
    setRolePerms(loadRolePerms())
  }

  useEffect(() => {
    setRolePerms(loadRolePerms())
  }, [])

  // Fetch society data
  const fetchSociety = async () => {
    try {
      const data = await orpc.societies.get({})
      if (data) {
        setSociety(data)
        setProfileForm({
          name: data.name || '',
          registrationNumber: data.registrationNumber || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          website: data.website || '',
          foundingYear: data.foundingYear?.toString() || '',
          area: data.area?.toString() || '',
        })
        setMaintenanceForm({
          maintenanceDay: data.maintenanceDay?.toString() || '10',
          lateFeePercentage: data.lateFeePercentage?.toString() || '2',
          gracePeriodDays: data.gracePeriodDays?.toString() || '5',
        })
        setBankingForm({
          bankName: data.bankName || '',
          bankAccountNumber: data.bankAccountNumber || '',
          bankIfsc: data.bankIfsc || '',
          gstNumber: data.gstNumber || '',
          panNumber: data.panNumber || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch society:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSociety()
  }, [])

  // Save profile
  const handleSaveProfile = async () => {
    if (!society) return
    setSaving(true)
    try {
      await orpc.societies.update({
        id: society.id,
        data: {
          name: profileForm.name,
          registrationNumber: profileForm.registrationNumber || undefined,
          address: profileForm.address || undefined,
          city: profileForm.city || undefined,
          state: profileForm.state || undefined,
          pincode: profileForm.pincode || undefined,
          contactEmail: profileForm.contactEmail || undefined,
          contactPhone: profileForm.contactPhone || undefined,
          website: profileForm.website || undefined,
          foundingYear: profileForm.foundingYear ? Number(profileForm.foundingYear) : undefined,
          area: profileForm.area ? Number(profileForm.area) : undefined,
        },
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      fetchSociety()
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  // Save maintenance settings
  const handleSaveMaintenance = async () => {
    if (!society) return
    setSaving(true)
    try {
      await orpc.societies.update({
        id: society.id,
        data: {
          maintenanceDay: Number(maintenanceForm.maintenanceDay),
          lateFeePercentage: Number(maintenanceForm.lateFeePercentage),
          gracePeriodDays: Number(maintenanceForm.gracePeriodDays),
        },
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      fetchSociety()
    } catch (error) {
      console.error('Failed to save maintenance settings:', error)
    } finally {
      setSaving(false)
    }
  }

  // Save banking details
  const handleSaveBanking = async () => {
    if (!society) return
    setSaving(true)
    try {
      await orpc.societies.update({
        id: society.id,
        data: {
          bankName: bankingForm.bankName || undefined,
          bankAccountNumber: bankingForm.bankAccountNumber || undefined,
          bankIfsc: bankingForm.bankIfsc || undefined,
          gstNumber: bankingForm.gstNumber || undefined,
          panNumber: bankingForm.panNumber || undefined,
        },
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      fetchSociety()
    } catch (error) {
      console.error('Failed to save banking details:', error)
    } finally {
      setSaving(false)
    }
  }

  // Save notification settings (local storage for now)
  const handleSaveNotifications = () => {
    setSaving(true)
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationForm))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Load notification settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings')
    if (saved) {
      try {
        setNotificationForm(JSON.parse(saved))
      } catch {}
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your society settings and preferences</p>
        </div>
        {saveSuccess && (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Saved Successfully
          </Badge>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Society Profile
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="banking" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Banking
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Sidebar
          </TabsTrigger>
        </TabsList>

        {/* ============================================
            SOCIETY PROFILE TAB
            ============================================ */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Society Profile</CardTitle>
              <CardDescription>Basic information about your society</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Society Name *</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter society name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    value={profileForm.registrationNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                    placeholder="e.g. SOC/2020/12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={profileForm.pincode}
                    onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                    placeholder="Pincode"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={profileForm.contactPhone}
                    onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                    placeholder="+91 22 2678 9012"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profileForm.contactEmail}
                    onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                    placeholder="admin@society.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foundingYear">Founding Year</Label>
                  <Input
                    id="foundingYear"
                    type="number"
                    value={profileForm.foundingYear}
                    onChange={(e) => setProfileForm({ ...profileForm, foundingYear: e.target.value })}
                    placeholder="e.g. 2018"
                    min="1900"
                    max="2030"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area (acres)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={profileForm.area}
                    onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                    placeholder="e.g. 2.5"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Society Stats */}
              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-sm font-medium mb-3">Society Statistics</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{society?.totalTowers || 0}</p>
                    <p className="text-xs text-muted-foreground">Towers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{society?.totalFlats || 0}</p>
                    <p className="text-xs text-muted-foreground">Flats</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{society?.totalMembers || 0}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving || !profileForm.name}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            MAINTENANCE SETTINGS TAB
            ============================================ */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Settings</CardTitle>
              <CardDescription>Configure maintenance billing rules and policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceDay">Due Date (Day of Month)</Label>
                  <Input
                    id="maintenanceDay"
                    type="number"
                    value={maintenanceForm.maintenanceDay}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceDay: e.target.value })}
                    min="1"
                    max="28"
                  />
                  <p className="text-xs text-muted-foreground">Day of month when maintenance is due (1-28)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lateFeePercentage">Late Fee (%)</Label>
                  <Input
                    id="lateFeePercentage"
                    type="number"
                    value={maintenanceForm.lateFeePercentage}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, lateFeePercentage: e.target.value })}
                    min="0"
                    max="20"
                    step="0.5"
                  />
                  <p className="text-xs text-muted-foreground">Percentage charged after grace period (0-20%)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    value={maintenanceForm.gracePeriodDays}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, gracePeriodDays: e.target.value })}
                    min="0"
                    max="30"
                  />
                  <p className="text-xs text-muted-foreground">Days after due date before late fee applies</p>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-sm font-medium mb-3">Billing Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance Due On:</span>
                    <span className="font-medium">{maintenanceForm.maintenanceDay}th of every month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grace Period:</span>
                    <span className="font-medium">{maintenanceForm.gracePeriodDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Fee After Grace:</span>
                    <span className="font-medium">{maintenanceForm.lateFeePercentage}% per month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Fee Starts:</span>
                    <span className="font-medium">
                      {Number(maintenanceForm.maintenanceDay) + Number(maintenanceForm.gracePeriodDays)}th of every month
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveMaintenance} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Maintenance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            BANKING DETAILS TAB
            ============================================ */}
        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
              <CardDescription>Society bank account and tax information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankingForm.bankName}
                    onChange={(e) => setBankingForm({ ...bankingForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={bankingForm.bankAccountNumber}
                    onChange={(e) => setBankingForm({ ...bankingForm, bankAccountNumber: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankIfsc">IFSC Code</Label>
                  <Input
                    id="bankIfsc"
                    value={bankingForm.bankIfsc}
                    onChange={(e) => setBankingForm({ ...bankingForm, bankIfsc: e.target.value })}
                    placeholder="e.g. HDFC0001234"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={bankingForm.gstNumber}
                    onChange={(e) => setBankingForm({ ...bankingForm, gstNumber: e.target.value })}
                    placeholder="27AABCT1234F1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={bankingForm.panNumber}
                    onChange={(e) => setBankingForm({ ...bankingForm, panNumber: e.target.value })}
                    placeholder="AABCT1234F"
                  />
                </div>
              </div>

              <Button onClick={handleSaveBanking} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Banking Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            NOTIFICATION SETTINGS TAB
            ============================================ */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how residents receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Email Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'emailDues', label: 'Send email for new dues and invoices' },
                    { key: 'emailNotices', label: 'Send email for new notices and announcements' },
                    { key: 'maintenanceAlert', label: 'Notify on new maintenance requests' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationForm[item.key as keyof typeof notificationForm] as boolean}
                        onChange={(e) => setNotificationForm({ ...notificationForm, [item.key]: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">SMS Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'smsReminder', label: 'Send SMS for payment reminders' },
                    { key: 'visitorAlerts', label: 'Send SMS for visitor check-in/out alerts' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationForm[item.key as keyof typeof notificationForm] as boolean}
                        onChange={(e) => setNotificationForm({ ...notificationForm, [item.key]: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">WhatsApp</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationForm.whatsapp}
                      onChange={(e) => setNotificationForm({ ...notificationForm, whatsapp: e.target.checked })}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-sm">Send meeting reminders via WhatsApp</span>
                  </label>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            THEME CUSTOMIZATION TAB
            ============================================ */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Customization
              </CardTitle>
              <CardDescription>
                Customize colors, typography, and border radius for the entire application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeCustomizer />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            ROLES & SIDEBAR PERMISSIONS TAB
            ============================================ */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sidebar Menu Permissions
              </CardTitle>
              <CardDescription>
                Control which sidebar menu items each role can see. Changes apply after saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role quick-toggle row */}
              <div className="flex flex-wrap items-center gap-2">
                {ROLES.map(role => (
                  <div key={role} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm">
                    <span className="font-medium">{roleDisplayNames[role]}</span>
                    <button
                      onClick={() => toggleRoleAllModules(role, true)}
                      className="text-xs text-primary hover:underline"
                      title="Enable all"
                    >All</button>
                    <span className="text-muted-foreground">/</span>
                    <button
                      onClick={() => toggleRoleAllModules(role, false)}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      title="Disable all"
                    >None</button>
                  </div>
                ))}
              </div>

              {/* Permission matrix by group */}
              {Object.entries(MODULE_GROUPS).map(([groupKey, modules]) => (
                <div key={groupKey} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {MODULE_GROUP_LABELS[groupKey] || groupKey}
                    </h4>
                    <Separator className="flex-1" />
                  </div>

                  {/* Header row */}
                  <div className="grid items-center gap-1" style={{ gridTemplateColumns: `180px repeat(${ROLES.length}, 1fr)` }}>
                    <div className="text-xs font-medium text-muted-foreground px-2">Module</div>
                    {ROLES.map(role => (
                      <div key={role} className="text-center text-xs font-medium text-muted-foreground">
                        {roleDisplayNames[role].split(' ')[0]}
                      </div>
                    ))}
                  </div>

                  {/* Module rows */}
                  {modules.map(mod => (
                    <div
                      key={mod}
                      className="grid items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                      style={{ gridTemplateColumns: `180px repeat(${ROLES.length}, 1fr)` }}
                    >
                      <span className="text-sm font-medium capitalize truncate">
                        {mod.replace(/_/g, ' ')}
                      </span>
                      {ROLES.map(role => (
                        <label
                          key={role}
                          className="flex items-center justify-center cursor-pointer"
                          title={`${roleDisplayNames[role]}: ${mod.replace(/_/g, ' ')}`}
                        >
                          <input
                            type="checkbox"
                            checked={rolePerms[role]?.[mod] ?? false}
                            onChange={() => toggleRoleModule(role, mod)}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveRolePerms} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Permissions
                </Button>
                <Button variant="outline" onClick={resetRolePerms} disabled={saving}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
