import { useState, useCallback } from 'react'
import { z } from 'zod'
import {
  Book,
  Key,
  Users,
  Home,
  FileText,
  Receipt,
  UserCheck,
  Megaphone,
  Calendar,
  Wrench,
  Dumbbell,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  AlertCircle,
  Search,
  Building,
  CreditCard,
  Shield,
  Car,
  Bike,
  Box,
  Landmark,
  Map,
  PartyPopper,
  Star,
  Settings,
  Eye,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { orpc } from '@/server/client'

// ============================================
// TYPES
// ============================================
interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  params: string
  exampleInput?: Record<string, any>
  returns: string
  schema?: z.ZodTypeAny
}

interface ApiGroup {
  group: string
  icon: any
  color: string
  description: string
  endpoints: ApiEndpoint[]
}

// ============================================
// ALL API ENDPOINTS
// ============================================
const apiGroups: ApiGroup[] = [
  {
    group: 'Auth',
    icon: Key,
    color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    description: 'Authentication & user sessions',
    endpoints: [
      { method: 'POST', path: 'auth.login', description: 'Authenticate user with email and password', params: '{ email: string, password: string }', exampleInput: { email: 'admin@society.com', password: 'admin123' }, returns: '{ token: string, user: { id, email, name, role, permissions, profileImage } }', schema: z.object({ email: z.string().email('Invalid email address'), password: z.string().min(6, 'Password must be at least 6 characters') }) },
      { method: 'POST', path: 'auth.me', description: 'Get current user from JWT token', params: '{ token: string }', exampleInput: { token: 'eyJhbGciOi...' }, returns: '{ id, email, name, role, permissions, profileImage } | null', schema: z.object({ token: z.string().min(1, 'Token is required') }) },
    ],
  },
  {
    group: 'Members',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    description: 'Resident & member management',
    endpoints: [
      { method: 'GET', path: 'members.list', description: 'List all society members with pagination', params: '{ page?: number, limit?: number }', exampleInput: { page: 1, limit: 10 }, returns: 'Member[]', schema: z.object({ page: z.number().optional(), limit: z.number().optional() }).optional() },
      { method: 'GET', path: 'members.getById', description: 'Get member details by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Member | null', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'POST', path: 'members.create', description: 'Create a new member', params: '{ societyId, firstName, lastName, phone, role, flatId?, ... }', exampleInput: { societyId: 1, firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210', role: 'owner' }, returns: '{ id, ...Member }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), firstName: z.string().min(1, 'First name is required'), lastName: z.string().min(1, 'Last name is required'), phone: z.string().min(10, 'Phone must be at least 10 digits'), role: z.enum(['owner', 'tenant', 'secretary', 'treasurer', 'chairman', 'committee_member']), flatId: z.number().optional() }) },
      { method: 'PUT', path: 'members.update', description: 'Update member details', params: '{ id: number, data: Partial<Member> }', exampleInput: { id: 1, data: { phone: '9876543211' } }, returns: 'Member', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update is required') }) },
      { method: 'DELETE', path: 'members.delete', description: 'Delete a member', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Flats',
    icon: Home,
    color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    description: 'Flat & property management',
    endpoints: [
      { method: 'GET', path: 'flats.list', description: 'List all flats with pagination', params: '{ page?: number, limit?: number }', exampleInput: { page: 1, limit: 10 }, returns: 'Flat[]', schema: z.object({ page: z.number().optional(), limit: z.number().optional() }).optional() },
      { method: 'GET', path: 'flats.getById', description: 'Get flat details by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Flat | null', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'POST', path: 'flats.create', description: 'Create a new flat', params: '{ societyId, flatNumber, floor, type, maintenanceAmount, ... }', exampleInput: { societyId: 1, flatNumber: '101', floor: 1, type: '2BHK', maintenanceAmount: 5000 }, returns: '{ id, ...Flat }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), flatNumber: z.string().min(1, 'Flat number is required'), floor: z.number().min(0, 'Floor is required'), type: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'villa', 'shop', 'office']), maintenanceAmount: z.number().min(0, 'Maintenance amount must be positive') }) },
      { method: 'PUT', path: 'flats.update', description: 'Update flat details', params: '{ id: number, data: Partial<Flat> }', exampleInput: { id: 1, data: { isOccupied: true } }, returns: 'Flat', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update is required') }) },
      { method: 'DELETE', path: 'flats.delete', description: 'Delete a flat', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Invoices',
    icon: FileText,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    description: 'Invoicing & billing',
    endpoints: [
      { method: 'GET', path: 'invoices.list', description: 'List all invoices with pagination', params: '{ page?: number, limit?: number }', exampleInput: { page: 1 }, returns: 'Invoice[]', schema: z.object({ page: z.number().optional(), limit: z.number().optional() }).optional() },
      { method: 'GET', path: 'invoices.getById', description: 'Get invoice by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Invoice | null', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'GET', path: 'invoices.summary', description: 'Get dues & payment summary', params: '{}', returns: '{ totalExpected, collected, pending, overdue }' },
      { method: 'POST', path: 'invoices.create', description: 'Create a new invoice', params: '{ societyId, flatId, invoiceNumber, totalAmount, period }', exampleInput: { societyId: 1, flatId: 1, invoiceNumber: 'INV-2025-001', totalAmount: 5000, period: '2025-01' }, returns: '{ id, ...Invoice }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), flatId: z.number().min(1, 'Flat ID required'), invoiceNumber: z.string().min(1, 'Invoice number is required'), totalAmount: z.number().min(0.01, 'Amount must be greater than 0'), period: z.string().min(1, 'Period is required') }) },
      { method: 'PUT', path: 'invoices.update', description: 'Update invoice', params: '{ id: number, data: Partial<Invoice> }', exampleInput: { id: 1, data: { status: 'paid', paidAmount: 5000 } }, returns: 'Invoice', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'invoices.delete', description: 'Delete an invoice', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Expenses',
    icon: Receipt,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    description: 'Expense tracking & approvals',
    endpoints: [
      { method: 'GET', path: 'expenses.list', description: 'List all expenses', params: '{ page?: number, limit?: number }', exampleInput: {}, returns: 'Expense[]', schema: z.object({ page: z.number().optional(), limit: z.number().optional() }).optional() },
      { method: 'GET', path: 'expenses.summary', description: 'Get expense summary with budget', params: '{}', returns: '{ totalExpenses, paid, pending, budget }' },
      { method: 'POST', path: 'expenses.create', description: 'Create a new expense', params: '{ societyId, category, description, amount, ... }', exampleInput: { societyId: 1, category: 'electricity', description: 'Monthly electricity bill', amount: 15000 }, returns: '{ id, ...Expense }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), category: z.enum(['maintenance', 'electricity', 'water', 'security', 'cleaning', 'gardening', 'repairs', 'insurance', 'salary', 'other']), description: z.string().min(1, 'Description is required'), amount: z.number().min(0.01, 'Amount must be greater than 0') }) },
      { method: 'PUT', path: 'expenses.update', description: 'Update expense', params: '{ id: number, data: Partial<Expense> }', exampleInput: { id: 1, data: { status: 'paid' } }, returns: 'Expense', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'POST', path: 'expenses.approve', description: 'Approve an expense', params: '{ id: number, approvedBy: number }', exampleInput: { id: 1, approvedBy: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required'), approvedBy: z.number().min(1, 'Approver ID required') }) },
      { method: 'DELETE', path: 'expenses.delete', description: 'Delete an expense', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Society',
    icon: Building,
    color: 'bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400',
    description: 'Society profile & settings',
    endpoints: [
      { method: 'GET', path: 'societies.get', description: 'Get society profile', params: '{}', returns: 'Society | null' },
      { method: 'POST', path: 'societies.create', description: 'Create a new society', params: '{ name, registrationNumber?, address?, city?, ... }', exampleInput: { name: 'Green Valley Society' }, returns: 'Society', schema: z.object({ name: z.string().min(1, 'Society name is required') }) },
      { method: 'PUT', path: 'societies.update', description: 'Update society settings', params: '{ id: number, data: Partial<Society> }', exampleInput: { id: 1, data: { maintenanceDay: 10, lateFeePercentage: 2 } }, returns: 'Society', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
    ],
  },
  {
    group: 'Layout',
    icon: Map,
    color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
    description: 'Towers, floors & layout management',
    endpoints: [
      { method: 'GET', path: 'societyLayout.getLayout', description: 'Get full society layout (towers → floors → flats)', params: '{}', returns: '{ society, towers[], gates[], summary }' },
      { method: 'GET', path: 'societyLayout.getFlatDetail', description: 'Get flat detail with member info', params: '{ flatId: number }', exampleInput: { flatId: 1 }, returns: '{ flat, member }', schema: z.object({ flatId: z.number().min(1, 'Flat ID is required') }) },
      { method: 'POST', path: 'societyLayout.createTower', description: 'Create tower with auto-generated flats', params: '{ societyId, name, totalFloors, flatsPerFloor, ... }', exampleInput: { societyId: 1, name: 'Tower A', totalFloors: 10, flatsPerFloor: 4, flatType: '2BHK', maintenanceAmount: 5000 }, returns: '{ id, name, flatsCreated, ... }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), name: z.string().min(1, 'Tower name is required'), totalFloors: z.number().min(1, 'Must have at least 1 floor').max(100), flatsPerFloor: z.number().min(1, 'Must have at least 1 flat per floor').max(20) }) },
      { method: 'PUT', path: 'societyLayout.updateTower', description: 'Update tower details', params: '{ id: number, data: Partial<Tower> }', exampleInput: { id: 1, data: { hasLift: true } }, returns: 'Tower', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'societyLayout.deleteTower', description: 'Delete tower (moves flats to root)', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Parking',
    icon: Car,
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    description: 'Parking space management',
    endpoints: [
      { method: 'GET', path: 'parking.list', description: 'List all parking spaces', params: '{ page?: number, limit?: number }', exampleInput: {}, returns: 'ParkingSpace[]', schema: z.object({ page: z.number().optional(), limit: z.number().optional() }).optional() },
      { method: 'GET', path: 'parking.getById', description: 'Get parking space by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'ParkingSpace | null', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'POST', path: 'parking.create', description: 'Create a parking space', params: '{ societyId, slotNumber, type, ... }', exampleInput: { societyId: 1, slotNumber: 'P-001', type: 'covered' }, returns: '{ id, ...ParkingSpace }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), slotNumber: z.string().min(1, 'Slot number is required'), type: z.enum(['covered', 'open', 'basement']) }) },
      { method: 'PUT', path: 'parking.update', description: 'Update parking space', params: '{ id: number, data: Partial<ParkingSpace> }', exampleInput: { id: 1, data: { isOccupied: true } }, returns: 'ParkingSpace', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'parking.delete', description: 'Delete parking space', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Vehicles',
    icon: Bike,
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    description: 'Vehicle registration & tracking',
    endpoints: [
      { method: 'GET', path: 'vehicles.list', description: 'List all registered vehicles', params: '{ page?: number, limit?: number }', exampleInput: {}, returns: 'Vehicle[]', schema: z.object({ page: z.number().optional(), limit: z.number().optional() }).optional() },
      { method: 'GET', path: 'vehicles.getById', description: 'Get vehicle by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Vehicle | null', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'POST', path: 'vehicles.create', description: 'Register a new vehicle', params: '{ memberId, flatId, vehicleNumber, type, ... }', exampleInput: { memberId: 1, flatId: 1, vehicleNumber: 'MH-01-AB-1234', type: 'car', brand: 'Maruti', model: 'Swift' }, returns: '{ id, ...Vehicle }', schema: z.object({ memberId: z.number().min(1, 'Member ID required'), flatId: z.number().min(1, 'Flat ID required'), vehicleNumber: z.string().min(1, 'Vehicle number is required'), type: z.enum(['car', 'bike', 'scooter', 'bicycle', 'other']) }) },
      { method: 'PUT', path: 'vehicles.update', description: 'Update vehicle details', params: '{ id: number, data: Partial<Vehicle> }', exampleInput: { id: 1, data: { color: 'White' } }, returns: 'Vehicle', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'vehicles.delete', description: 'Delete vehicle', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Visitors',
    icon: UserCheck,
    color: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
    description: 'Visitor management & check-in/out',
    endpoints: [
      { method: 'GET', path: 'visitors.list', description: 'List all visitors', params: '{ page?: number, limit?: number }', exampleInput: {}, returns: 'Visitor[]', schema: z.object({ page: z.number().optional(), limit: z.number().optional() }).optional() },
      { method: 'POST', path: 'visitors.create', description: 'Register a new visitor', params: '{ societyId, name, phone, flatId, purpose, ... }', exampleInput: { societyId: 1, name: 'Guest', phone: '9876543210', flatId: 1, purpose: 'Meeting' }, returns: '{ id, ...Visitor }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), name: z.string().min(1, 'Visitor name is required'), flatId: z.number().min(1, 'Flat ID is required') }) },
      { method: 'PUT', path: 'visitors.update', description: 'Update visitor details', params: '{ id: number, data: Partial<Visitor> }', exampleInput: { id: 1, data: { status: 'inside' } }, returns: 'Visitor', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'POST', path: 'visitors.checkOut', description: 'Check out a visitor', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
      { method: 'DELETE', path: 'visitors.delete', description: 'Delete visitor record', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
    ],
  },
  {
    group: 'Notices',
    icon: Megaphone,
    color: 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
    description: 'Notice board & announcements',
    endpoints: [
      { method: 'GET', path: 'notices.list', description: 'List all notices', params: '{}', returns: 'Notice[]' },
      { method: 'POST', path: 'notices.create', description: 'Create a new notice', params: '{ societyId, title, content, postedBy, priority }', exampleInput: { societyId: 1, title: 'Water Supply Maintenance', content: 'Water supply will be interrupted tomorrow', postedBy: 1, priority: 'high' }, returns: '{ id, ...Notice }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), title: z.string().min(1, 'Title is required'), content: z.string().min(1, 'Content is required'), postedBy: z.number().min(1, 'Posted by is required'), priority: z.enum(['low', 'medium', 'high']) }) },
      { method: 'PUT', path: 'notices.update', description: 'Update a notice', params: '{ id: number, data: Partial<Notice> }', exampleInput: { id: 1, data: { isPinned: true } }, returns: 'Notice', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'notices.delete', description: 'Delete a notice', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Meetings',
    icon: Calendar,
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    description: 'Meeting scheduling & minutes',
    endpoints: [
      { method: 'GET', path: 'meetings.list', description: 'List all meetings', params: '{}', returns: 'Meeting[]' },
      { method: 'POST', path: 'meetings.create', description: 'Create a new meeting', params: '{ societyId, title, meetingDate, location, ... }', exampleInput: { societyId: 1, title: 'AGM 2025', meetingDate: '2025-03-15', location: 'Community Hall' }, returns: '{ id, ...Meeting }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), title: z.string().min(1, 'Title is required'), meetingDate: z.any() }) },
      { method: 'PUT', path: 'meetings.update', description: 'Update meeting details', params: '{ id: number, data: Partial<Meeting> }', exampleInput: { id: 1, data: { status: 'completed' } }, returns: 'Meeting', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'meetings.delete', description: 'Delete a meeting', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Maintenance',
    icon: Wrench,
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
    description: 'Service requests & helpdesk',
    endpoints: [
      { method: 'GET', path: 'maintenance.list', description: 'List all service requests', params: '{}', returns: 'ServiceRequest[]' },
      { method: 'POST', path: 'maintenance.create', description: 'Create a service request', params: '{ societyId, flatId, memberId, title, priority, ... }', exampleInput: { societyId: 1, flatId: 1, memberId: 1, title: 'Plumbing issue in bathroom', priority: 'high' }, returns: '{ id, ...ServiceRequest }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), flatId: z.number().min(1, 'Flat ID required'), memberId: z.number().min(1, 'Member ID required'), title: z.string().min(1, 'Title is required'), priority: z.enum(['low', 'medium', 'high', 'urgent']) }) },
      { method: 'PUT', path: 'maintenance.update', description: 'Update service request', params: '{ id: number, data: Partial<ServiceRequest> }', exampleInput: { id: 1, data: { status: 'in_progress' } }, returns: 'ServiceRequest', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'maintenance.delete', description: 'Delete service request', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Amenities',
    icon: Dumbbell,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    description: 'Amenity management & bookings',
    endpoints: [
      { method: 'GET', path: 'amenities.list', description: 'List all amenities', params: '{}', returns: 'Amenity[]' },
      { method: 'POST', path: 'amenities.create', description: 'Create a new amenity', params: '{ societyId, name, category, price?, capacity?, ... }', exampleInput: { societyId: 1, name: 'Swimming Pool', category: 'fitness', price: 200, capacity: 20 }, returns: '{ id, ...Amenity }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), name: z.string().min(1, 'Name is required'), category: z.enum(['sports', 'recreation', 'fitness', 'community', 'kids', 'other']) }) },
      { method: 'PUT', path: 'amenities.update', description: 'Update amenity details', params: '{ id: number, data: Partial<Amenity> }', exampleInput: { id: 1, data: { capacity: 30 } }, returns: 'Amenity', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'amenities.delete', description: 'Delete amenity', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'GET', path: 'amenityBookings.list', description: 'List all amenity bookings', params: '{}', returns: 'AmenityBooking[]' },
      { method: 'POST', path: 'amenityBookings.create', description: 'Book an amenity slot', params: '{ societyId, amenityId, memberId, flatId, bookingDate, startTime, endTime }', exampleInput: { societyId: 1, amenityId: 1, memberId: 1, flatId: 1, bookingDate: '2025-03-20', startTime: '10:00', endTime: '12:00' }, returns: '{ id, totalAmount, ... }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), amenityId: z.number().min(1, 'Amenity ID required'), memberId: z.number().min(1, 'Member ID required'), flatId: z.number().min(1, 'Flat ID required'), bookingDate: z.any(), startTime: z.string().min(1, 'Start time is required'), endTime: z.string().min(1, 'End time is required') }) },
      { method: 'POST', path: 'amenityBookings.cancel', description: 'Cancel an amenity booking', params: '{ id: number, cancellationReason?: string }', exampleInput: { id: 1, cancellationReason: 'Change of plans' }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
    ],
  },
  {
    group: 'Staff',
    icon: Shield,
    color: 'bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-400',
    description: 'Staff management, attendance & payroll',
    endpoints: [
      { method: 'GET', path: 'staff.list', description: 'List all staff members', params: '{ societyId?: number }', exampleInput: {}, returns: 'Staff[]', schema: z.object({ societyId: z.number().optional() }).optional() },
      { method: 'GET', path: 'staff.getById', description: 'Get staff member by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Staff | null', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'POST', path: 'staff.create', description: 'Add a new staff member', params: '{ societyId, firstName, department, ... }', exampleInput: { societyId: 1, firstName: 'Vikram', department: 'security' }, returns: '{ id, ...Staff }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), firstName: z.string().min(1, 'First name is required'), department: z.enum(['security', 'housekeeping', 'maintenance', 'gardening', 'admin', 'other']) }) },
      { method: 'PUT', path: 'staff.update', description: 'Update staff details', params: '{ id: number, data: Partial<Staff> }', exampleInput: { id: 1, data: { designation: 'Senior Guard' } }, returns: 'Staff', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'staff.delete', description: 'Remove staff member', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'POST', path: 'attendance.checkIn', description: 'Staff check-in', params: '{ staffId: number, status?, notes? }', exampleInput: { staffId: 1, status: 'present' }, returns: '{ id, ...Attendance }', schema: z.object({ staffId: z.number().min(1, 'Staff ID required') }) },
      { method: 'POST', path: 'attendance.checkOut', description: 'Staff check-out', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Attendance', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'GET', path: 'attendance.list', description: 'List attendance records', params: '{ staffId?: number, date?: string }', exampleInput: {}, returns: 'Attendance[]', schema: z.object({ staffId: z.number().optional(), date: z.string().optional() }).optional() },
      { method: 'GET', path: 'staffSalaries.list', description: 'List salary records', params: '{ staffId?: number, month?: string }', exampleInput: {}, returns: 'StaffSalary[]', schema: z.object({ staffId: z.number().optional(), month: z.string().optional() }).optional() },
      { method: 'POST', path: 'staffSalaries.create', description: 'Create salary record', params: '{ staffId, month, basicSalary, ... }', exampleInput: { staffId: 1, month: '2025-03', basicSalary: 15000 }, returns: '{ id, netPay, ... }', schema: z.object({ staffId: z.number().min(1, 'Staff ID required'), month: z.string().min(1, 'Month is required'), basicSalary: z.number().min(0, 'Salary must be positive') }) },
      { method: 'POST', path: 'staffSalaries.markPaid', description: 'Mark salary as paid', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'GET', path: 'staffSalaries.payrollSummary', description: 'Get payroll summary', params: '{ month?: string }', exampleInput: {}, returns: '{ totalPaid, totalPending, activeStaff, ... }' },
    ],
  },
  {
    group: 'Accounts',
    icon: Landmark,
    color: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    description: 'Chart of accounts & journal entries',
    endpoints: [
      { method: 'GET', path: 'accountHeads.list', description: 'List all account heads', params: '{}', returns: 'AccountHead[]' },
      { method: 'GET', path: 'accountHeads.getById', description: 'Get account head by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'AccountHead | null', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'POST', path: 'accountHeads.create', description: 'Create account head', params: '{ societyId, name, type, ... }', exampleInput: { societyId: 1, name: 'Maintenance Income', type: 'income' }, returns: '{ id, ...AccountHead }', schema: z.object({ societyId: z.number().min(1, 'Society ID required'), name: z.string().min(1, 'Name is required'), type: z.enum(['asset', 'liability', 'income', 'expense']) }) },
      { method: 'PUT', path: 'accountHeads.update', description: 'Update account head', params: '{ id: number, data: Partial<AccountHead> }', exampleInput: { id: 1, data: { description: 'Monthly maintenance collection' } }, returns: 'AccountHead', schema: z.object({ id: z.number().min(1, 'ID is required'), data: z.record(z.string(), z.any()).refine(d => Object.keys(d).length > 0, 'At least one field to update') }) },
      { method: 'DELETE', path: 'accountHeads.delete', description: 'Delete account head', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }', schema: z.object({ id: z.number().min(1, 'ID is required') }) },
      { method: 'GET', path: 'bankAccounts.list', description: 'List bank accounts', params: '{}', returns: 'BankAccount[]' },
      { method: 'GET', path: 'bankAccounts.summary', description: 'Get bank summary', params: '{}', returns: '{ totalBalance, accountCount }' },
      { method: 'POST', path: 'bankAccounts.create', description: 'Add bank account', params: '{ societyId, bankName, ... }', exampleInput: { societyId: 1, bankName: 'HDFC Bank', accountNumber: '1234567890' }, returns: '{ id, ...BankAccount }' },
      { method: 'PUT', path: 'bankAccounts.update', description: 'Update bank account', params: '{ id: number, data: Partial<BankAccount> }', exampleInput: { id: 1, data: { balance: 500000 } }, returns: 'BankAccount' },
      { method: 'DELETE', path: 'bankAccounts.delete', description: 'Delete bank account', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
      { method: 'GET', path: 'journalVouchers.list', description: 'List journal vouchers', params: '{}', returns: 'JournalVoucher[]' },
      { method: 'POST', path: 'journalVouchers.create', description: 'Create journal voucher', params: '{ societyId, voucherNumber, date, type, amount, ... }', exampleInput: { societyId: 1, voucherNumber: 'JV-001', date: '2025-03-15', type: 'journal', amount: 5000 }, returns: '{ id, ...JournalVoucher }' },
      { method: 'PUT', path: 'journalVouchers.update', description: 'Update journal voucher', params: '{ id: number, data: Partial<JournalVoucher> }', exampleInput: { id: 1, data: { status: 'posted' } }, returns: 'JournalVoucher' },
      { method: 'DELETE', path: 'journalVouchers.delete', description: 'Delete journal voucher', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
    ],
  },
  {
    group: 'Assets & Inventory',
    icon: Box,
    color: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400',
    description: 'Asset tracking & inventory management',
    endpoints: [
      { method: 'GET', path: 'assets.list', description: 'List all assets', params: '{}', returns: 'Asset[]' },
      { method: 'GET', path: 'assets.getById', description: 'Get asset by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Asset | null' },
      { method: 'POST', path: 'assets.create', description: 'Create a new asset', params: '{ societyId, name, purchasePrice?, ... }', exampleInput: { societyId: 1, name: 'Generator', purchasePrice: 250000 }, returns: '{ id, ...Asset }' },
      { method: 'PUT', path: 'assets.update', description: 'Update asset', params: '{ id: number, data: Partial<Asset> }', exampleInput: { id: 1, data: { location: 'Basement' } }, returns: 'Asset' },
      { method: 'DELETE', path: 'assets.delete', description: 'Delete asset', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
      { method: 'GET', path: 'assetCategories.list', description: 'List asset categories', params: '{}', returns: 'AssetCategory[]' },
      { method: 'POST', path: 'assetCategories.create', description: 'Create asset category', params: '{ societyId, name, description? }', exampleInput: { societyId: 1, name: 'Electrical' }, returns: '{ id, ...AssetCategory }' },
      { method: 'GET', path: 'inventory.list', description: 'List inventory items', params: '{}', returns: 'Inventory[]' },
      { method: 'POST', path: 'inventory.create', description: 'Add inventory item', params: '{ societyId, name, quantity?, ... }', exampleInput: { societyId: 1, name: 'Light Bulbs', quantity: 50 }, returns: '{ id, ...Inventory }' },
      { method: 'PUT', path: 'inventory.update', description: 'Update inventory item', params: '{ id: number, data: Partial<Inventory> }', exampleInput: { id: 1, data: { quantity: 45 } }, returns: 'Inventory' },
      { method: 'DELETE', path: 'inventory.delete', description: 'Delete inventory item', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
    ],
  },
  {
    group: 'Celebrations',
    icon: PartyPopper,
    color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
    description: 'Events, celebrations & social gatherings',
    endpoints: [
      { method: 'GET', path: 'celebrations.list', description: 'List all celebrations', params: '{ category?, status? }', exampleInput: {}, returns: 'Celebration[]' },
      { method: 'GET', path: 'celebrations.getById', description: 'Get celebration with attendees & tasks', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'Celebration with attendees, budget, tasks, photos, comments' },
      { method: 'POST', path: 'celebrations.create', description: 'Create a celebration', params: '{ societyId, title, category, eventDate, ... }', exampleInput: { societyId: 1, title: 'Diwali Celebration', category: 'festival', eventDate: '2025-10-20' }, returns: '{ id, ...Celebration }' },
      { method: 'PUT', path: 'celebrations.update', description: 'Update celebration', params: '{ id: number, data: Partial<Celebration> }', exampleInput: { id: 1, data: { status: 'ongoing' } }, returns: 'Celebration' },
      { method: 'DELETE', path: 'celebrations.delete', description: 'Delete celebration', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
      { method: 'POST', path: 'celebrations.rsvp', description: 'RSVP to a celebration', params: '{ celebrationId, memberId, status, guestCount?, ... }', exampleInput: { celebrationId: 1, memberId: 1, status: 'going', guestCount: 2 }, returns: '{ id, ...Attendee }' },
    ],
  },
  {
    group: 'Service Providers',
    icon: Settings,
    color: 'bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
    description: 'Service companies & personnel',
    endpoints: [
      { method: 'GET', path: 'serviceCompanies.list', description: 'List all service companies', params: '{}', returns: 'ServiceCompany[]' },
      { method: 'GET', path: 'serviceCompanies.getById', description: 'Get service company by ID', params: '{ id: number }', exampleInput: { id: 1 }, returns: 'ServiceCompany | null' },
      { method: 'POST', path: 'serviceCompanies.create', description: 'Add a service company', params: '{ societyId, name, ... }', exampleInput: { societyId: 1, name: 'ABC Plumbing Services' }, returns: '{ id, ...ServiceCompany }' },
      { method: 'PUT', path: 'serviceCompanies.update', description: 'Update service company', params: '{ id: number, data: Partial<ServiceCompany> }', exampleInput: { id: 1, data: { rating: 4.5 } }, returns: 'ServiceCompany' },
      { method: 'DELETE', path: 'serviceCompanies.delete', description: 'Delete service company', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
      { method: 'GET', path: 'servicePersons.list', description: 'List all service persons', params: '{}', returns: 'ServicePerson[]' },
      { method: 'POST', path: 'servicePersons.create', description: 'Add a service person', params: '{ societyId, firstName, ... }', exampleInput: { societyId: 1, firstName: 'Ramesh', specialization: 'Plumbing' }, returns: '{ id, ...ServicePerson }' },
      { method: 'PUT', path: 'servicePersons.update', description: 'Update service person', params: '{ id: number, data: Partial<ServicePerson> }', exampleInput: { id: 1, data: { skillLevel: 'senior' } }, returns: 'ServicePerson' },
      { method: 'DELETE', path: 'servicePersons.delete', description: 'Delete service person', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
    ],
  },
  {
    group: 'Vendors',
    icon: Star,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    description: 'Vendor management',
    endpoints: [
      { method: 'GET', path: 'vendors.list', description: 'List all vendors', params: '{}', returns: 'Vendor[]' },
      { method: 'POST', path: 'vendors.create', description: 'Add a vendor', params: '{ societyId, name, category?, ... }', exampleInput: { societyId: 1, name: 'BuildMart Supplies', category: 'hardware' }, returns: '{ id, ...Vendor }' },
      { method: 'PUT', path: 'vendors.update', description: 'Update vendor', params: '{ id: number, data: Partial<Vendor> }', exampleInput: { id: 1, data: { phone: '9876543210' } }, returns: 'Vendor' },
      { method: 'DELETE', path: 'vendors.delete', description: 'Delete vendor', params: '{ id: number }', exampleInput: { id: 1 }, returns: '{ success: boolean }' },
    ],
  },
]

// ============================================
// METHOD COLORS
// ============================================
const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

// ============================================
// TOTAL STATS
// ============================================
const totalEndpoints = apiGroups.reduce((sum, g) => sum + g.endpoints.length, 0)
const methodCounts = apiGroups.flatMap(g => g.endpoints).reduce((acc, e) => { acc[e.method] = (acc[e.method] || 0) + 1; return acc }, {} as Record<string, number>)

// ============================================
// COMPONENTS
// ============================================
function generateCurl(endpoint: ApiEndpoint, token?: string): string {
  const url = `http://localhost:3000/api/rpc/${endpoint.path}`
  const body = JSON.stringify(endpoint.exampleInput || {}, null, 2)
  const tokenHeader = token ? ` \
  -H 'Authorization: Bearer ${token}'` : ''

  if (endpoint.method === 'GET') {
    return `curl -X GET '${url}' \
  -H 'Content-Type: application/json'${tokenHeader}`
  }

  return `curl -X ${endpoint.method} '${url}' \
  -H 'Content-Type: application/json'${tokenHeader} \
  -d '${body.replace(/'/g, "'\"'\"'")}'`
}

function EndpointRow({ endpoint, onTryIt }: { endpoint: ApiEndpoint; onTryIt: (ep: ApiEndpoint) => void }) {
  const [copied, setCopied] = useState(false)
  const [showCurl, setShowCurl] = useState(false)
  const [curlCopied, setCurlCopied] = useState(false)

  const curlCommand = generateCurl(endpoint)

  const copyPath = () => {
    navigator.clipboard.writeText(`/api/rpc/${endpoint.path}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    setCurlCopied(true)
    setTimeout(() => setCurlCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 px-4 py-3 group">
        <Badge className={`${methodColors[endpoint.method]} border-0 font-mono text-[10px] min-w-[52px] justify-center`}>{endpoint.method}</Badge>
        <code className="flex-1 text-sm font-mono text-foreground truncate">{endpoint.path}</code>
        <span className="hidden sm:block text-xs text-muted-foreground max-w-[300px] truncate">{endpoint.description}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPath} title="Copy path">
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCurl(!showCurl)} title="Show curl command">
            <span className="text-[10px] font-mono font-bold">$</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onTryIt(endpoint)} title="Try it">
            <Play className="h-3 w-3 text-primary" />
          </Button>
        </div>
      </div>

      {showCurl && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">cURL Command</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={copyCurl}>
              {curlCopied ? <Check className="mr-1 h-3 w-3 text-green-600" /> : <Copy className="mr-1 h-3 w-3" />}
              {curlCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="bg-background rounded-lg border p-3 text-xs overflow-x-auto font-mono text-foreground whitespace-pre-wrap">
            {curlCommand}
          </pre>
        </div>
      )}
    </div>
  )
}

function TryItPanel({ endpoint, onClose }: { endpoint: ApiEndpoint; onClose: () => void }) {
  const [input, setInput] = useState(JSON.stringify(endpoint.exampleInput || {}, null, 2))
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('auth_token') || '' } catch { return '' }
  })
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [curlCopied, setCurlCopied] = useState(false)
  const curlCommand = generateCurl({ ...endpoint, exampleInput: (() => { try { return JSON.parse(input) } catch { return endpoint.exampleInput } })() }, token || undefined)

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    setCurlCopied(true)
    setTimeout(() => setCurlCopied(false), 2000)
  }

  const executeRequest = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    setValidationErrors([])

    try {
      const parsedInput = JSON.parse(input)

      // Zod schema validation
      if (endpoint.schema) {
        const result = endpoint.schema.safeParse(parsedInput)
        if (!result.success) {
          const errors = result.error.issues.map(i => {
            const path = i.path.length > 0 ? i.path.join('.') : 'input'
            return `${path}: ${i.message}`
          })
          setValidationErrors(errors)
          setLoading(false)
          return
        }
      }

      const [group, method] = endpoint.path.split('.')
      const procedure = (orpc as any)[group]?.[method]

      if (!procedure) {
        throw new Error(`Procedure ${endpoint.path} not found`)
      }

      const result = await procedure(parsedInput)
      setResponse(result)
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON: ' + err.message)
      } else {
        setError(err.message || 'Request failed')
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint.path, endpoint.schema, input])

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${methodColors[endpoint.method]} border-0 font-mono`}>{endpoint.method}</Badge>
            <code className="text-sm font-mono font-semibold">{endpoint.path}</code>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auth Token */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authorization Token</Label>
          <div className="flex gap-2">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="font-mono text-xs"
              placeholder="Paste JWT token here (optional)"
            />
            {token && (
              <Button variant="ghost" size="sm" onClick={() => setToken('')} className="shrink-0 text-xs text-muted-foreground">
                Clear
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">Auto-filled from localStorage if logged in. Required for protected endpoints.</p>
        </div>

        {/* Request */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request Body</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-sm min-h-[120px]"
            placeholder='{"key": "value"}'
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Parameters:</span> <code>{endpoint.params}</code>
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={copyCurl}>
                {curlCopied ? <Check className="mr-1 h-3 w-3 text-green-600" /> : <span className="mr-1 text-[10px] font-mono font-bold">$</span>}
                {curlCopied ? 'Copied' : 'Copy curl'}
              </Button>
              <Button size="sm" onClick={executeRequest} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
                {loading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-destructive text-sm mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Validation Error{validationErrors.length > 1 ? 's' : ''}</span>
            </div>
            <ul className="space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i} className="text-xs text-destructive/80 flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <code className="font-mono">{err}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Curl Command */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">cURL</Label>
          <pre className="bg-muted rounded-lg border p-3 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
            {curlCommand}
          </pre>
        </div>

        {/* Response */}
        {(response !== null || error) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</Label>
                {response !== null && (
                  <Button variant="ghost" size="sm" onClick={copyResponse} className="h-6 text-xs">
                    {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>
              {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <pre className="mt-2 text-xs text-destructive/80 whitespace-pre-wrap">{error}</pre>
                </div>
              ) : (
                <pre className="rounded-lg border bg-muted p-3 text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Returns:</span> <code>{endpoint.returns}</code>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN PAGE
// ============================================
export function ApiDocsPage() {
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [tryItEndpoint, setTryItEndpoint] = useState<ApiEndpoint | null>(null)

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const filteredGroups = apiGroups.map(g => ({
    ...g,
    endpoints: g.endpoints.filter(e =>
      !search ||
      e.path.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      g.group.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.endpoints.length > 0)

  // Auto-expand matching groups when searching
  const visibleGroups = search
    ? new Set(filteredGroups.map(g => g.group))
    : expandedGroups

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Book className="h-8 w-8" />
          API Documentation
        </h1>
        <p className="text-muted-foreground">
          Interactive API reference for Society ERP — test endpoints directly from the browser
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{totalEndpoints}</p>
            <p className="text-xs text-muted-foreground">Total Endpoints</p>
          </CardContent>
        </Card>
        {Object.entries(methodCounts).map(([method, count]) => (
          <Card key={method}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${method === 'GET' ? 'text-green-600' : method === 'POST' ? 'text-blue-600' : method === 'PUT' ? 'text-amber-600' : 'text-red-600'}`}>{count}</p>
              <p className="text-xs text-muted-foreground">{method} Endpoints</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">1. Import the RPC client</p>
            <pre className="bg-muted p-2 rounded-lg text-xs overflow-x-auto">
{`import { orpc } from '@/server/client'`}
            </pre>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">2. Call any procedure</p>
            <pre className="bg-muted p-2 rounded-lg text-xs overflow-x-auto">
{`// Login\nconst { token, user } = await orpc.auth.login({ email: 'admin@society.com', password: 'admin123' })\n\n// List members\nconst members = await orpc.members.list({ page: 1, limit: 10 })\n\n// Get flat\nconst flat = await orpc.flats.getById({ id: 1 })\n\n// Create expense\nconst expense = await orpc.expenses.create({\n  societyId: 1, category: 'electricity', description: 'Monthly bill', amount: 15000\n})`}
            </pre>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">3. Use with React Query hooks</p>
            <pre className="bg-muted p-2 rounded-lg text-xs overflow-x-auto">
{`import { orpc } from '@/server/hooks'\n\nfunction MembersList() {\n  const { data, isLoading } = orpc.members.list.useQuery({})\n  // data is fully typed as Member[]\n}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search endpoints... (e.g. members, expenses, create)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Try It Panel */}
      {tryItEndpoint && (
        <TryItPanel endpoint={tryItEndpoint} onClose={() => setTryItEndpoint(null)} />
      )}

      {/* Endpoint Groups */}
      <div className="space-y-2">
        {filteredGroups.map(group => {
          const Icon = group.icon
          const isExpanded = visibleGroups.has(group.group)

          return (
            <Card key={group.group}>
              <button
                onClick={() => toggleGroup(group.group)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${group.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{group.group}</span>
                    <Badge variant="secondary" className="text-[10px]">{group.endpoints.length} endpoints</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-4 space-y-1.5">
                  <Separator className="mb-3" />
                  {group.endpoints.map(endpoint => (
                    <EndpointRow
                      key={endpoint.path}
                      endpoint={endpoint}
                      onTryIt={setTryItEndpoint}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
