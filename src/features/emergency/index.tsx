import { useState, useEffect, useMemo } from 'react'
import {
  AlertTriangle,
  Siren,
  Phone,
  Shield,
  Flame,
  Stethoscope,
  Droplets,
  Zap,
  Wrench,
  Building2,
  MapPin,
  Clock,
  Star,
  Navigation,
  Loader2,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Mail,
  Globe,
  Car,
  Plane,
  Train,
  Bus,
  ShoppingBag,
  Building,
  GraduationCap,
  TreePine,
  Dumbbell,
  UtensilsCrossed,
  Hotel,
  Wallet,
  Fuel,
  School,
  Hospital,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

// ============================================
// TYPES
// ============================================
interface EmergencyContact {
  id: number
  societyId: number
  name: string
  category: string
  phone: string
  phone2?: string
  email?: string
  website?: string
  address?: string
  latitude?: string
  longitude?: string
  distance?: string
  distanceText?: string
  isAvailable24x7: boolean
  operatingHours?: string
  rating?: string
  isVerified: boolean
  isActive: boolean
  notes?: string
  createdAt: string
}

interface DistressAlert {
  id: number
  societyId: number
  memberId?: number
  flatId?: number
  alertType: string
  message?: string
  latitude?: string
  longitude?: string
  status: string
  acknowledgedBy?: number
  acknowledgedAt?: string
  resolvedBy?: number
  resolvedAt?: string
  notes?: string
  notifySecurity: boolean
  notifyNeighbors: boolean
  notifyEmergencyServices: boolean
  createdAt: string
}

interface NearbyFacility {
  id: number
  societyId: number
  name: string
  category: string
  subcategory?: string
  description?: string
  phone?: string
  phone2?: string
  email?: string
  website?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  latitude?: string
  longitude?: string
  distance?: string
  distanceText?: string
  travelTime?: string
  roadDistance?: string
  isAvailable24x7: boolean
  operatingHours?: string
  rating?: string
  isVerified: boolean
  isActive: boolean
  photoUrl?: string
  notes?: string
  createdAt: string
}

interface SocietyLocation {
  id: number
  societyId: number
  address?: string
  city?: string
  state?: string
  pincode?: string
  latitude?: string
  longitude?: string
  nearestCity?: string
  nearestCityDistance?: string
  nearestAirport?: string
  nearestAirportDistance?: string
  nearestRailwayStation?: string
  nearestRailwayDistance?: string
  nearestBusStand?: string
  nearestBusStandDistance?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
}

// ============================================
// CONSTANTS
// ============================================
const emergencyCategories = [
  { value: 'hospital', label: 'Hospitals', icon: Hospital, color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { value: 'ambulance', label: 'Ambulance', icon: Siren, color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { value: 'police', label: 'Police', icon: Shield, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'fire', label: 'Fire Station', icon: Flame, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'gas', label: 'Gas Agency', icon: Flame, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  { value: 'electricity', label: 'Electricity', icon: Zap, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'water', label: 'Water Board', icon: Droplets, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  { value: 'plumber', label: 'Plumber', icon: Wrench, color: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' },
  { value: 'electrician', label: 'Electrician', icon: Zap, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'security', label: 'Security', icon: Shield, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  { value: 'other', label: 'Other', icon: Phone, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' },
]

const facilityCategories = [
  { value: 'hospital', label: 'Hospitals', icon: Hospital, color: 'bg-red-100 text-red-700' },
  { value: 'clinic', label: 'Clinics', icon: Stethoscope, color: 'bg-pink-100 text-pink-700' },
  { value: 'pharmacy', label: 'Pharmacy', icon: Building2, color: 'bg-green-100 text-green-700' },
  { value: 'ambulance', label: 'Ambulance', icon: Siren, color: 'bg-red-100 text-red-700' },
  { value: 'police_station', label: 'Police Station', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  { value: 'fire_station', label: 'Fire Station', icon: Flame, color: 'bg-orange-100 text-orange-700' },
  { value: 'gas_agency', label: 'Gas Agency', icon: Flame, color: 'bg-amber-100 text-amber-700' },
  { value: 'electricity_office', label: 'Electricity Office', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'water_office', label: 'Water Office', icon: Droplets, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'bank', label: 'Banks', icon: Wallet, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'atm', label: 'ATMs', icon: Wallet, color: 'bg-violet-100 text-violet-700' },
  { value: 'petrol_pump', label: 'Petrol Pumps', icon: Fuel, color: 'bg-slate-100 text-slate-700' },
  { value: 'market', label: 'Markets', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'supermarket', label: 'Supermarkets', icon: ShoppingBag, color: 'bg-teal-100 text-teal-700' },
  { value: 'mall', label: 'Malls', icon: Building, color: 'bg-purple-100 text-purple-700' },
  { value: 'school', label: 'Schools', icon: GraduationCap, color: 'bg-sky-100 text-sky-700' },
  { value: 'college', label: 'Colleges', icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
  { value: 'park', label: 'Parks', icon: TreePine, color: 'bg-green-100 text-green-700' },
  { value: 'gym', label: 'Gyms', icon: Dumbbell, color: 'bg-orange-100 text-orange-700' },
  { value: 'restaurant', label: 'Restaurants', icon: UtensilsCrossed, color: 'bg-amber-100 text-amber-700' },
  { value: 'hotel', label: 'Hotels', icon: Hotel, color: 'bg-rose-100 text-rose-700' },
  { value: 'airport', label: 'Airport', icon: Plane, color: 'bg-sky-100 text-sky-700' },
  { value: 'railway_station', label: 'Railway Station', icon: Train, color: 'bg-blue-100 text-blue-700' },
  { value: 'bus_stand', label: 'Bus Stand', icon: Bus, color: 'bg-green-100 text-green-700' },
  { value: 'city_center', label: 'City Center', icon: Building2, color: 'bg-violet-100 text-violet-700' },
  { value: 'other', label: 'Other', icon: MapPin, color: 'bg-gray-100 text-gray-700' },
]

const distressTypes = [
  { value: 'panic', label: 'Panic', icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-700' },
  { value: 'fire', label: 'Fire', icon: Flame, color: 'bg-orange-600 hover:bg-orange-700' },
  { value: 'medical', label: 'Medical', icon: Stethoscope, color: 'bg-pink-600 hover:bg-pink-700' },
  { value: 'security', label: 'Security', icon: Shield, color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'gas_leak', label: 'Gas Leak', icon: Flame, color: 'bg-amber-600 hover:bg-amber-700' },
  { value: 'flood', label: 'Flood', icon: Droplets, color: 'bg-cyan-600 hover:bg-cyan-700' },
  { value: 'earthquake', label: 'Earthquake', icon: AlertCircle, color: 'bg-slate-600 hover:bg-slate-700' },
  { value: 'other', label: 'Other', icon: AlertTriangle, color: 'bg-gray-600 hover:bg-gray-700' },
]

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  acknowledged: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  false_alarm: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState('distress')
  const [loading, setLoading] = useState(true)

  // Emergency contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [contactCategory, setContactCategory] = useState('all')
  const [contactSearch, setContactSearch] = useState('')

  // Distress alerts
  const [alerts, setAlerts] = useState<DistressAlert[]>([])
  const [alertSummary, setAlertSummary] = useState<any>(null)
  const [activeAlerts, setActiveAlerts] = useState<DistressAlert[]>([])
  const [alertStatus, setAlertStatus] = useState('all')

  // Nearby facilities
  const [facilities, setFacilities] = useState<NearbyFacility[]>([])
  const [facilityCategory, setFacilityCategory] = useState('all')
  const [facilitySearch, setFacilitySearch] = useState('')

  // Society location
  const [location, setLocation] = useState<SocietyLocation | null>(null)

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [distressDialogOpen, setDistressDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<NearbyFacility | null>(null)

  // Form states
  const [contactForm, setContactForm] = useState({
    name: '', category: 'hospital', phone: '', phone2: '', email: '',
    website: '', address: '', distance: '', distanceText: '',
    isAvailable24x7: false, operatingHours: '',
  })
  const [facilityForm, setFacilityForm] = useState({
    name: '', category: 'hospital', subcategory: '', description: '',
    phone: '', phone2: '', email: '', website: '', address: '',
    city: '', state: '', pincode: '', distance: '', distanceText: '',
    travelTime: '', roadDistance: '', isAvailable24x7: false,
    operatingHours: '', photoUrl: '',
  })
  const [locationForm, setLocationForm] = useState({
    address: '', city: '', state: '', pincode: '',
    latitude: '', longitude: '', nearestCity: '', nearestCityDistance: '',
    nearestAirport: '', nearestAirportDistance: '', nearestRailwayStation: '',
    nearestRailwayDistance: '', nearestBusStand: '', nearestBusStandDistance: '',
    contactPhone: '', contactEmail: '', website: '',
  })
  const [distressForm, setDistressForm] = useState({
    alertType: 'panic', message: '',
    notifySecurity: true, notifyNeighbors: false, notifyEmergencyServices: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [triggerError, setTriggerError] = useState('')
  const [triggerSuccess, setTriggerSuccess] = useState(false)

  // Fetch all data
  const fetchAll = async () => {
    try {
      const [contactsData, alertsData, summaryData, facilitiesData, locationData] = await Promise.all([
        orpc.emergencyContacts.list({ societyId: 1 }),
        orpc.distressAlerts.list({ societyId: 1 }),
        orpc.distressAlerts.summary({ societyId: 1 }),
        orpc.nearbyFacilities.list({ societyId: 1 }),
        orpc.societyLocation.get({ societyId: 1 }),
      ])
      setContacts(contactsData || [])
      setAlerts(alertsData || [])
      setActiveAlerts((alertsData || []).filter((a: any) => a.status === 'active'))
      setAlertSummary(summaryData)
      setFacilities(facilitiesData || [])
      setLocation(locationData)
    } catch (error) {
      console.error('Failed to fetch emergency data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesCategory = contactCategory === 'all' || c.category === contactCategory
      const matchesSearch = !contactSearch || c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone?.includes(contactSearch)
      return matchesCategory && matchesSearch
    })
  }, [contacts, contactCategory, contactSearch])

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      const matchesCategory = facilityCategory === 'all' || f.category === facilityCategory
      const matchesSearch = !facilitySearch || f.name?.toLowerCase().includes(facilitySearch.toLowerCase()) || f.city?.toLowerCase().includes(facilitySearch.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [facilities, facilityCategory, facilitySearch])

  // Trigger distress alert
  const handleTriggerDistress = async () => {
    setSubmitting(true)
    setTriggerError('')
    setTriggerSuccess(false)
    try {
      await orpc.distressAlerts.create({
        societyId: 1,
        alertType: distressForm.alertType as any,
        message: distressForm.message || undefined,
        notifySecurity: distressForm.notifySecurity,
        notifyNeighbors: distressForm.notifyNeighbors,
        notifyEmergencyServices: distressForm.notifyEmergencyServices,
      })
      setTriggerSuccess(true)
      setDistressForm({ alertType: 'panic', message: '', notifySecurity: true, notifyNeighbors: false, notifyEmergencyServices: false })
      fetchAll()
      setTimeout(() => {
        setTriggerSuccess(false)
        setDistressDialogOpen(false)
      }, 2000)
    } catch (error: any) {
      console.error('Failed to trigger distress:', error)
      setTriggerError(error?.message || error?.data?.message || 'Failed to trigger alert. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await orpc.distressAlerts.acknowledge({ id: alertId, acknowledgedBy: 1 })
      fetchAll()
    } catch (error) {
      console.error('Failed to acknowledge:', error)
    }
  }

  // Resolve alert
  const handleResolveAlert = async (alertId: number) => {
    try {
      await orpc.distressAlerts.resolve({ id: alertId, resolvedBy: 1 })
      fetchAll()
    } catch (error) {
      console.error('Failed to resolve:', error)
    }
  }

  // Save contact
  const handleSaveContact = async () => {
    if (!contactForm.name || !contactForm.phone) return
    setSubmitting(true)
    try {
      if (selectedContact) {
        await orpc.emergencyContacts.update({ id: selectedContact.id, data: contactForm })
      } else {
        await orpc.emergencyContacts.create({ societyId: 1, ...contactForm })
      }
      setContactDialogOpen(false)
      setSelectedContact(null)
      resetContactForm()
      fetchAll()
    } catch (error) {
      console.error('Failed to save contact:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Save facility
  const handleSaveFacility = async () => {
    if (!facilityForm.name) return
    setSubmitting(true)
    try {
      if (selectedFacility) {
        await orpc.nearbyFacilities.update({ id: selectedFacility.id, data: facilityForm })
      } else {
        await orpc.nearbyFacilities.create({ societyId: 1, ...facilityForm })
      }
      setFacilityDialogOpen(false)
      setSelectedFacility(null)
      resetFacilityForm()
      fetchAll()
    } catch (error) {
      console.error('Failed to save facility:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Save location
  const handleSaveLocation = async () => {
    setSubmitting(true)
    try {
      await orpc.societyLocation.upsert({ societyId: 1, ...locationForm })
      setLocationDialogOpen(false)
      fetchAll()
    } catch (error) {
      console.error('Failed to save location:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetContactForm = () => setContactForm({ name: '', category: 'hospital', phone: '', phone2: '', email: '', website: '', address: '', distance: '', distanceText: '', isAvailable24x7: false, operatingHours: '' })
  const resetFacilityForm = () => setFacilityForm({ name: '', category: 'hospital', subcategory: '', description: '', phone: '', phone2: '', email: '', website: '', address: '', city: '', state: '', pincode: '', distance: '', distanceText: '', travelTime: '', roadDistance: '', isAvailable24x7: false, operatingHours: '', photoUrl: '' })

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            Emergency & Facilities
          </h1>
          <p className="text-muted-foreground">Distress alerts, emergency contacts, and nearby facilities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setDistressDialogOpen(true)} className="animate-pulse">
            <AlertTriangle className="mr-2 h-4 w-4" />
            SOS / Distress
          </Button>
        </div>
      </div>

      {/* Active Alerts Banner */}
      {activeAlerts.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive animate-pulse">
                <Siren className="h-5 w-5 text-destructive-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-destructive">
                  {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeAlerts.map(a => `${a.alertType} alert`).join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                {activeAlerts.map(a => (
                  <div key={a.id} className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(a.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Ack
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResolveAlert(a.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
                <Siren className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alertSummary?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alertSummary?.resolved ?? 0}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contacts.length}</p>
                <p className="text-xs text-muted-foreground">Emergency Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{facilities.length}</p>
                <p className="text-xs text-muted-foreground">Nearby Facilities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <Navigation className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{location?.nearestCity || '-'}</p>
                <p className="text-xs text-muted-foreground">Nearest City</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distress">Distress Alerts</TabsTrigger>
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="facilities">Nearby Facilities</TabsTrigger>
          <TabsTrigger value="location">Society Location</TabsTrigger>
        </TabsList>

        {/* DISTRESS TAB */}
        <TabsContent value="distress" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Alert History</h3>
            <Select value={alertStatus} onValueChange={setAlertStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_alarm">False Alarm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {alerts.filter(a => alertStatus === 'all' || a.status === alertStatus).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No alerts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.filter(a => alertStatus === 'all' || a.status === alertStatus).map(alert => {
                const typeConfig = distressTypes.find(t => t.value === alert.alertType) || distressTypes[0]
                const TypeIcon = typeConfig.icon
                return (
                  <Card key={alert.id} className={alert.status === 'active' ? 'border-destructive' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeConfig.color}`}>
                            <TypeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{alert.alertType?.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[alert.status] || ''}>{alert.status}</Badge>
                          {alert.status === 'active' && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>Acknowledge</Button>
                              <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>Resolve</Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {alert.message && <p className="text-sm text-muted-foreground mt-2">{alert.message}</p>}
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        {alert.notifySecurity && <Badge variant="secondary">Security Notified</Badge>}
                        {alert.notifyNeighbors && <Badge variant="secondary">Neighbors Notified</Badge>}
                        {alert.notifyEmergencyServices && <Badge variant="secondary">Emergency Services Notified</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* CONTACTS TAB */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Emergency Contacts</h3>
            <Button size="sm" onClick={() => { resetContactForm(); setSelectedContact(null); setContactDialogOpen(true) }}>
              <Plus className="mr-2 h-3 w-3" /> Add Contact
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search contacts..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={contactCategory} onValueChange={setContactCategory}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {emergencyCategories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map(contact => {
              const catConfig = emergencyCategories.find(c => c.value === contact.category)
              const CatIcon = catConfig?.icon || Phone
              return (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${catConfig?.color || 'bg-gray-100 text-gray-700'}`}>
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{contact.name}</p>
                          {contact.isVerified && <Badge variant="secondary" className="text-[10px]">✓ Verified</Badge>}
                          {contact.isAvailable24x7 && <Badge className="bg-green-100 text-green-700 text-[10px]">24/7</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{contact.category?.replace('_', ' ')}</p>
                        <div className="mt-2 space-y-1">
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <Phone className="h-3 w-3" /> {contact.phone}
                          </a>
                          {contact.phone2 && (
                            <a href={`tel:${contact.phone2}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:underline">
                              <Phone className="h-3 w-3" /> {contact.phone2}
                            </a>
                          )}
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:underline">
                              <Mail className="h-3 w-3" /> {contact.email}
                            </a>
                          )}
                          {contact.distanceText && (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Navigation className="h-3 w-3" /> {contact.distanceText}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedContact(contact); setContactForm({ ...contactForm, ...contact }); setContactDialogOpen(true) }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <a href={`tel:${contact.phone}`} className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Phone className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* FACILITIES TAB */}
        <TabsContent value="facilities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Nearby Facilities</h3>
            <Button size="sm" onClick={() => { resetFacilityForm(); setSelectedFacility(null); setFacilityDialogOpen(true) }}>
              <Plus className="mr-2 h-3 w-3" /> Add Facility
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search facilities..." value={facilitySearch} onChange={(e) => setFacilitySearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={facilityCategory} onValueChange={setFacilityCategory}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {facilityCategories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFacilities.map(facility => {
              const catConfig = facilityCategories.find(c => c.value === facility.category)
              const CatIcon = catConfig?.icon || MapPin
              return (
                <Card key={facility.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${catConfig?.color || 'bg-gray-100 text-gray-700'}`}>
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{facility.name}</p>
                          {facility.isVerified && <Badge variant="secondary" className="text-[10px]">✓</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{facility.category?.replace('_', ' ')}</p>
                        <div className="mt-2 space-y-1">
                          {facility.phone && (
                            <a href={`tel:${facility.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <Phone className="h-3 w-3" /> {facility.phone}
                            </a>
                          )}
                          {facility.address && (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" /> {facility.address}
                            </p>
                          )}
                          {facility.distanceText && (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Navigation className="h-3 w-3" /> {facility.distanceText}
                              {facility.travelTime && ` · ${facility.travelTime}`}
                            </p>
                          )}
                          {facility.operatingHours && (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {facility.operatingHours}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedFacility(facility); setFacilityForm({ ...facilityForm, ...facility }); setFacilityDialogOpen(true) }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {facility.phone && (
                            <a href={`tel:${facility.phone}`} className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                              <Phone className="h-3 w-3" />
                            </a>
                          )}
                          {facility.website && (
                            <a href={facility.website} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                              <Globe className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* LOCATION TAB */}
        <TabsContent value="location" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Society Location & Distance Info</h3>
            <Button size="sm" onClick={() => {
              if (location) setLocationForm({
                address: location.address || '', city: location.city || '', state: location.state || '',
                pincode: location.pincode || '', latitude: location.latitude || '', longitude: location.longitude || '',
                nearestCity: location.nearestCity || '', nearestCityDistance: location.nearestCityDistance || '',
                nearestAirport: location.nearestAirport || '', nearestAirportDistance: location.nearestAirportDistance || '',
                nearestRailwayStation: location.nearestRailwayStation || '', nearestRailwayDistance: location.nearestRailwayDistance || '',
                nearestBusStand: location.nearestBusStand || '', nearestBusStandDistance: location.nearestBusStandDistance || '',
                contactPhone: location.contactPhone || '', contactEmail: location.contactEmail || '', website: location.website || '',
              })
              setLocationDialogOpen(true)
            }}>
              <Edit className="mr-2 h-3 w-3" /> {location ? 'Edit Location' : 'Add Location'}
            </Button>
          </div>

          {location ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Society Address</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {location.address && <p>{location.address}</p>}
                  {location.city && <p>{location.city}, {location.state} {location.pincode}</p>}
                  {location.contactPhone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {location.contactPhone}</p>}
                  {location.contactEmail && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {location.contactEmail}</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Plane className="h-4 w-4" /> Nearest Airport</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{location.nearestAirport || '-'}</p>
                  {location.nearestAirportDistance && <p className="text-muted-foreground">{location.nearestAirportDistance} km away</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Train className="h-4 w-4" /> Nearest Railway</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{location.nearestRailwayStation || '-'}</p>
                  {location.nearestRailwayDistance && <p className="text-muted-foreground">{location.nearestRailwayDistance} km away</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bus className="h-4 w-4" /> Nearest Bus Stand</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{location.nearestBusStand || '-'}</p>
                  {location.nearestBusStandDistance && <p className="text-muted-foreground">{location.nearestBusStandDistance} km away</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building className="h-4 w-4" /> Nearest City</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{location.nearestCity || '-'}</p>
                  {location.nearestCityDistance && <p className="text-muted-foreground">{location.nearestCityDistance} km away</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Online Presence</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {location.website && <a href={location.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="h-3 w-3" /> Website</a>}
                  {location.latitude && location.longitude && (
                    <a href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <MapPin className="h-3 w-3" /> View on Map
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No location data yet</p>
                <Button size="sm" onClick={() => { resetFacilityForm(); setLocationDialogOpen(true) }}>Add Location</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* SOS DISTRESS DIALOG */}
      <Dialog open={distressDialogOpen} onOpenChange={setDistressDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Trigger Distress Alert
            </DialogTitle>
            <DialogDescription>This will notify security and emergency services immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-4 gap-2">
              {distressTypes.map(type => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    className={`flex flex-col items-center gap-1 rounded-lg p-3 transition-all ${distressForm.alertType === type.value ? `${type.color} text-white scale-105` : 'bg-muted hover:bg-muted/80'}`}
                    onClick={() => setDistressForm({ ...distressForm, alertType: type.value })}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{type.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea value={distressForm.message} onChange={(e) => setDistressForm({ ...distressForm, message: e.target.value })} placeholder="Describe the emergency..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notify:</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={distressForm.notifySecurity} onChange={(e) => setDistressForm({ ...distressForm, notifySecurity: e.target.checked })} className="rounded" />
                  <span className="text-sm">Security Team</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={distressForm.notifyNeighbors} onChange={(e) => setDistressForm({ ...distressForm, notifyNeighbors: e.target.checked })} className="rounded" />
                  <span className="text-sm">Neighbors</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={distressForm.notifyEmergencyServices} onChange={(e) => setDistressForm({ ...distressForm, notifyEmergencyServices: e.target.checked })} className="rounded" />
                  <span className="text-sm">Emergency Services (Police/Fire/Ambulance)</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistressDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleTriggerDistress} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              TRIGGER SOS ALERT
            </Button>
          </DialogFooter>
          {triggerError && (
            <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive font-medium">{triggerError}</p>
            </div>
          )}
          {triggerSuccess && (
            <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">✓ Alert triggered successfully! Notifying selected teams...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONTACT DIALOG */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add Emergency Contact'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Category *</Label>
                <Select value={contactForm.category} onValueChange={(v) => setContactForm({ ...contactForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{emergencyCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone *</Label><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone 2</Label><Input value={contactForm.phone2} onChange={(e) => setContactForm({ ...contactForm, phone2: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Website</Label><Input value={contactForm.website} onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Textarea value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" value={contactForm.distance} onChange={(e) => setContactForm({ ...contactForm, distance: e.target.value })} /></div>
              <div className="space-y-2"><Label>Distance Text</Label><Input value={contactForm.distanceText} onChange={(e) => setContactForm({ ...contactForm, distanceText: e.target.value })} placeholder="e.g. 2.5 km, 10 min" /></div>
            </div>
            <div className="space-y-2"><Label>Operating Hours</Label><Input value={contactForm.operatingHours} onChange={(e) => setContactForm({ ...contactForm, operatingHours: e.target.value })} placeholder="e.g. 9 AM - 9 PM" /></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={contactForm.isAvailable24x7} onChange={(e) => setContactForm({ ...contactForm, isAvailable24x7: e.target.checked })} className="rounded" /><span className="text-sm">Available 24/7</span></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FACILITY DIALOG */}
      <Dialog open={facilityDialogOpen} onOpenChange={setFacilityDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFacility ? 'Edit Facility' : 'Add Nearby Facility'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Category *</Label>
                <Select value={facilityForm.category} onValueChange={(v) => setFacilityForm({ ...facilityForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{facilityCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={facilityForm.phone} onChange={(e) => setFacilityForm({ ...facilityForm, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={facilityForm.email} onChange={(e) => setFacilityForm({ ...facilityForm, email: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Textarea value={facilityForm.address} onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={facilityForm.city} onChange={(e) => setFacilityForm({ ...facilityForm, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={facilityForm.state} onChange={(e) => setFacilityForm({ ...facilityForm, state: e.target.value })} /></div>
              <div className="space-y-2"><Label>Pincode</Label><Input value={facilityForm.pincode} onChange={(e) => setFacilityForm({ ...facilityForm, pincode: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" value={facilityForm.distance} onChange={(e) => setFacilityForm({ ...facilityForm, distance: e.target.value })} /></div>
              <div className="space-y-2"><Label>Distance Text</Label><Input value={facilityForm.distanceText} onChange={(e) => setFacilityForm({ ...facilityForm, distanceText: e.target.value })} /></div>
              <div className="space-y-2"><Label>Travel Time</Label><Input value={facilityForm.travelTime} onChange={(e) => setFacilityForm({ ...facilityForm, travelTime: e.target.value })} placeholder="e.g. 15 min" /></div>
            </div>
            <div className="space-y-2"><Label>Operating Hours</Label><Input value={facilityForm.operatingHours} onChange={(e) => setFacilityForm({ ...facilityForm, operatingHours: e.target.value })} placeholder="e.g. 9 AM - 9 PM" /></div>
            <div className="space-y-2"><Label>Website</Label><Input value={facilityForm.website} onChange={(e) => setFacilityForm({ ...facilityForm, website: e.target.value })} /></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={facilityForm.isAvailable24x7} onChange={(e) => setFacilityForm({ ...facilityForm, isAvailable24x7: e.target.checked })} className="rounded" /><span className="text-sm">Available 24/7</span></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFacilityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFacility} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOCATION DIALOG */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{location ? 'Edit Society Location' : 'Add Society Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Address</Label><Textarea value={locationForm.address} onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={locationForm.city} onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={locationForm.state} onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })} /></div>
              <div className="space-y-2"><Label>Pincode</Label><Input value={locationForm.pincode} onChange={(e) => setLocationForm({ ...locationForm, pincode: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Latitude</Label><Input value={locationForm.latitude} onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })} /></div>
              <div className="space-y-2"><Label>Longitude</Label><Input value={locationForm.longitude} onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })} /></div>
            </div>
            <Separator />
            <h4 className="font-medium text-sm">Nearest Transport & City</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nearest City</Label><Input value={locationForm.nearestCity} onChange={(e) => setLocationForm({ ...locationForm, nearestCity: e.target.value })} /></div>
              <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" value={locationForm.nearestCityDistance} onChange={(e) => setLocationForm({ ...locationForm, nearestCityDistance: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nearest Airport</Label><Input value={locationForm.nearestAirport} onChange={(e) => setLocationForm({ ...locationForm, nearestAirport: e.target.value })} /></div>
              <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" value={locationForm.nearestAirportDistance} onChange={(e) => setLocationForm({ ...locationForm, nearestAirportDistance: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nearest Railway Station</Label><Input value={locationForm.nearestRailwayStation} onChange={(e) => setLocationForm({ ...locationForm, nearestRailwayStation: e.target.value })} /></div>
              <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" value={locationForm.nearestRailwayDistance} onChange={(e) => setLocationForm({ ...locationForm, nearestRailwayDistance: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nearest Bus Stand</Label><Input value={locationForm.nearestBusStand} onChange={(e) => setLocationForm({ ...locationForm, nearestBusStand: e.target.value })} /></div>
              <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" value={locationForm.nearestBusStandDistance} onChange={(e) => setLocationForm({ ...locationForm, nearestBusStandDistance: e.target.value })} /></div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={locationForm.contactPhone} onChange={(e) => setLocationForm({ ...locationForm, contactPhone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Contact Email</Label><Input value={locationForm.contactEmail} onChange={(e) => setLocationForm({ ...locationForm, contactEmail: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Website</Label><Input value={locationForm.website} onChange={(e) => setLocationForm({ ...locationForm, website: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLocation} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
