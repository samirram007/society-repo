// ============================================
// BASE INTERFACES
// ============================================
export interface BaseEntity {
  id: number
  createdAt: Date
  updatedAt?: Date
}

export interface IRepository<T extends BaseEntity> {
  findAll(options?: QueryOptions): Promise<T[]>
  findById(id: number): Promise<T | null>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: number, data: Partial<T>): Promise<T | null>
  delete(id: number): Promise<boolean>
  count(filters?: Record<string, unknown>): Promise<number>
}

export interface IService<T extends BaseEntity> {
  getAll(options?: QueryOptions): Promise<T[]>
  getById(id: number): Promise<T | null>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: number, data: Partial<T>): Promise<T | null>
  delete(id: number): Promise<boolean>
}

export interface QueryOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
  societyId?: number
}

// ============================================
// CLUSTER & SOCIETY INTERFACES
// ============================================
export interface Cluster extends BaseEntity {
  name: string
  description?: string
  logo?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  isActive: boolean
}

export interface Society extends BaseEntity {
  clusterId?: number
  name: string
  registrationNumber?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  contactEmail?: string
  contactPhone?: string
  logo?: string
  totalFlats: number
  totalTowers: number
  isActive: boolean
}

export interface Tower extends BaseEntity {
  societyId: number
  name: string
  totalFloors: number
  flatsPerFloor: number
  isActive: boolean
}

export interface Gate extends BaseEntity {
  societyId: number
  name: string
  type: 'main' | 'service' | 'pedestrian' | 'emergency'
  isActive: boolean
}

// ============================================
// USER & MEMBER INTERFACES
// ============================================
export interface User extends BaseEntity {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone?: string
  profileImage?: string
  isActive: boolean
  lastLoginAt?: Date
}

export interface Role extends BaseEntity {
  name: string
  description?: string
  permissions: string[]
}

export interface Member extends BaseEntity {
  societyId: number
  userId?: number
  flatId?: number
  firstName: string
  lastName: string
  email?: string
  phone: string
  alternatePhone?: string
  role: 'owner' | 'tenant' | 'secretary' | 'treasurer' | 'chairman' | 'committee_member'
  residentType: 'owner' | 'tenant' | 'family_member'
  profileImage?: string
  idProofType?: string
  idProofNumber?: string
  moveInDate?: Date
  moveOutDate?: Date
  isActive: boolean
}

export interface FamilyMember extends BaseEntity {
  memberId: number
  firstName: string
  lastName?: string
  relationship?: string
  phone?: string
  email?: string
  dateOfBirth?: Date
  isActive: boolean
}

export interface Staff extends BaseEntity {
  societyId: number
  firstName: string
  lastName?: string
  phone?: string
  department: 'security' | 'housekeeping' | 'maintenance' | 'gardening' | 'admin' | 'other'
  designation?: string
  shift?: string
  salary?: number
  joiningDate?: Date
  profileImage?: string
  isActive: boolean
}

// ============================================
// PROPERTY INTERFACES
// ============================================
export interface Flat extends BaseEntity {
  societyId: number
  towerId?: number
  flatNumber: string
  wing?: string
  floor: number
  area?: number
  type: '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'penthouse' | 'villa' | 'shop' | 'office'
  maintenanceAmount: number
  ownerName?: string
  tenantName?: string
  isOccupied: boolean
  isActive: boolean
}

export interface ParkingSpace extends BaseEntity {
  societyId: number
  flatId?: number
  slotNumber: string
  floor?: string
  section?: string
  type: 'covered' | 'open' | 'basement'
  isVisitorParking: boolean
  isOccupied: boolean
  isActive: boolean
}

export interface Vehicle extends BaseEntity {
  memberId: number
  flatId: number
  vehicleNumber: string
  type: 'car' | 'bike' | 'scooter' | 'bicycle' | 'other'
  brand?: string
  model?: string
  color?: string
  parkingSpaceId?: number
  isActive: boolean
}

// ============================================
// ACCOUNTING INTERFACES
// ============================================
export interface ChargeHead extends BaseEntity {
  societyId: number
  name: string
  code?: string
  type: 'maintenance' | 'sinking_fund' | 'parking' | 'water' | 'electricity' | 'penalty' | 'other'
  calculationType: 'fixed' | 'per_sqft' | 'percentage'
  defaultAmount: number
  gstRate: number
  isRecurring: boolean
  isActive: boolean
}

export interface Invoice extends BaseEntity {
  societyId: number
  flatId: number
  memberId?: number
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  subtotal: number
  gstAmount: number
  totalAmount: number
  paidAmount: number
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  period?: string
  notes?: string
}

export interface InvoiceItem extends BaseEntity {
  invoiceId: number
  chargeHeadId: number
  description?: string
  quantity: number
  rate: number
  amount: number
  gstRate: number
  gstAmount: number
}

export interface CreditNote extends BaseEntity {
  societyId: number
  flatId: number
  invoiceId?: number
  creditNoteNumber: string
  amount: number
  reason?: string
  status: 'pending' | 'applied' | 'cancelled'
}

export interface Payment extends BaseEntity {
  societyId: number
  invoiceId?: number
  memberId: number
  paymentNumber?: string
  amount: number
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'online' | 'card' | 'foreign_card'
  transactionId?: string
  paymentDate: Date
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  notes?: string
}

export interface BankAccount extends BaseEntity {
  societyId: number
  bankName: string
  accountNumber?: string
  ifscCode?: string
  branch?: string
  accountType: 'savings' | 'current' | 'fixed_deposit'
  balance: number
  isActive: boolean
}

export interface Expense extends BaseEntity {
  societyId: number
  category: string
  description: string
  amount: number
  gstAmount: number
  tdsAmount: number
  vendorId?: number
  invoiceNumber?: string
  expenseDate: Date
  approvedBy?: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
}

export interface Vendor extends BaseEntity {
  societyId: number
  name: string
  category?: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  gstNumber?: string
  panNumber?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  isActive: boolean
}

// ============================================
// SECURITY INTERFACES
// ============================================
export interface Visitor extends BaseEntity {
  societyId: number
  name: string
  phone?: string
  purpose?: string
  flatId: number
  visitingMemberId?: number
  gateId?: number
  guardId?: number
  entryTime: Date
  exitTime?: Date
  vehicleNumber?: string
  idProof?: string
  photoUrl?: string
  temperature?: string
  maskWorn?: boolean
  status: 'inside' | 'checked_out' | 'overstay'
}

export interface PreApproval extends BaseEntity {
  memberId: number
  visitorName?: string
  visitorPhone?: string
  visitorType: 'guest' | 'delivery' | 'cab' | 'vendor' | 'daily_help'
  flatId: number
  gateId?: number
  validFrom: Date
  validUntil?: Date
  isRecurring: boolean
  recurringDays?: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
}

export interface DailyHelp extends BaseEntity {
  memberId: number
  name: string
  phone?: string
  type: 'maid' | 'cook' | 'driver' | 'nurse' | 'tutor' | 'other'
  passcode?: string
  timings?: string
  isActive: boolean
}

export interface PanicAlert extends BaseEntity {
  memberId: number
  flatId: number
  message?: string
  status: 'active' | 'acknowledged' | 'resolved'
  acknowledgedBy?: number
  acknowledgedAt?: Date
}

// ============================================
// AMENITIES INTERFACES
// ============================================
export interface Amenity extends BaseEntity {
  societyId: number
  name: string
  description?: string
  category: 'sports' | 'recreation' | 'fitness' | 'community' | 'kids' | 'other'
  type: 'free' | 'paid'
  price: number
  capacity: number
  maxBookingDuration?: number
  coolDownPeriod?: number
  maxBookingsPerDay?: number
  maxCancellations?: number
  cancellationCharge: number
  requiresApproval: boolean
  location?: string
  operatingHoursStart?: string
  operatingHoursEnd?: string
  isActive: boolean
}

export interface AmenitySlot extends BaseEntity {
  amenityId: number
  dayOfWeek?: number
  startTime: string
  endTime: string
  price: number
  maxCapacity: number
  isActive: boolean
}

export interface AmenityBooking extends BaseEntity {
  amenityId: number
  memberId: number
  flatId: number
  slotId?: number
  bookingDate: Date
  startTime: string
  endTime: string
  guests: number
  guestNames?: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  checkInTime?: Date
  checkOutTime?: Date
  cancellationReason?: string
}

// ============================================
// HELPDESK INTERFACES
// ============================================
export interface ServiceCategory extends BaseEntity {
  societyId: number
  name: string
  parentId?: number
  icon?: string
  isActive: boolean
}

export interface ServiceRequest extends BaseEntity {
  societyId: number
  flatId: number
  memberId: number
  categoryId: number
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'reopened'
  assignedTo?: number
  assignedDepartment?: string
  photoUrls?: string
  estimatedCost?: number
  actualCost?: number
  resolutionNotes?: string
  rating?: number
  feedback?: string
  resolvedAt?: Date
  closedAt?: Date
}

export interface Asset extends BaseEntity {
  societyId: number
  name: string
  description?: string
  categoryId?: number
  location?: string
  purchaseDate?: Date
  purchasePrice?: number
  warrantyExpiry?: Date
  manufacturer?: string
  model?: string
  serialNumber?: string
  quantity: number
  status: 'active' | 'maintenance' | 'retired' | 'disposed'
  nextMaintenanceDate?: Date
}

export interface Inventory extends BaseEntity {
  societyId: number
  name: string
  description?: string
  categoryId?: number
  location?: string
  quantity: number
  minQuantity: number
  unitPrice?: number
  custodianId?: number
  department?: string
  isActive: boolean
}

// ============================================
// COMMUNICATIONS INTERFACES
// ============================================
export interface Notice extends BaseEntity {
  societyId: number
  title: string
  content: string
  postedBy: number
  priority: 'low' | 'medium' | 'high'
  targetAudience: 'all' | 'owners' | 'tenants' | 'committee' | 'specific_tower'
  targetTowers?: string
  targetFlats?: string
  isPinned: boolean
  isActive: boolean
}

export interface Meeting extends BaseEntity {
  societyId: number
  title: string
  description?: string
  meetingDate: Date
  location?: string
  organizedBy: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  minutes?: string
  attachments?: string
}

export interface Document extends BaseEntity {
  societyId: number
  title: string
  description?: string
  category: 'personal' | 'society' | 'management' | 'financial' | 'legal' | 'other'
  flatId?: number
  memberId?: number
  fileUrl: string
  fileSize?: number
  uploadedBy: number
  isActive: boolean
}

export interface Poll extends BaseEntity {
  societyId: number
  title: string
  description?: string
  type: 'opinion' | 'secret' | 'election'
  options: string[]
  startDate: Date
  endDate?: Date
  status: 'active' | 'closed' | 'cancelled'
  createdBy: number
}

export interface Task extends BaseEntity {
  societyId: number
  title: string
  description?: string
  assignedTo?: number
  assignedBy?: number
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: Date
  completedAt?: Date
  isRecurring: boolean
  recurringPattern?: string
}

// ============================================
// PET INTERFACES
// ============================================
export interface Pet extends BaseEntity {
  memberId: number
  flatId: number
  name: string
  type: 'dog' | 'cat' | 'bird' | 'fish' | 'other'
  breed?: string
  age?: number
  weight?: number
  color?: string
  gender?: 'male' | 'female'
  photoUrl?: string
  vaccinationStatus?: string
  lastVaccinationDate?: Date
  nextVaccinationDate?: Date
  insuranceExpiry?: Date
  registrationNumber?: string
  microchipNumber?: string
  isNeutered?: boolean
  isRegistered?: boolean
  registrationDate?: Date
  isActive: boolean
}

export interface PetRule extends BaseEntity {
  societyId: number
  title?: string
  rule: string
  category?: string
  penaltyAmount?: number
  sortOrder: number
  isActive: boolean
}

// ============================================
// SUMMARY INTERFACES
// ============================================
export interface DuesSummary {
  totalExpected: number
  collected: number
  pending: number
  overdue: number
}

export interface ExpensesSummary {
  totalExpenses: number
  paid: number
  pending: number
  budget: number
}

export interface DashboardSummary {
  totalFlats: number
  totalMembers: number
  totalStaff: number
  pendingDues: number
  openComplaints: number
  todayVisitors: number
  activeAmenityBookings: number
  recentActivities: Activity[]
}

export interface Activity {
  id: number
  type: string
  description: string
  timestamp: Date
  userId?: number
}

// ============================================
// AUTH INTERFACES
// ============================================
export interface IUser {
  id: number
  email: string
  name: string
  role: string
  societyId?: number
}

export interface IAuthService {
  login(email: string, password: string, societyId?: number): Promise<{ token: string; user: IUser }>
  verify(token: string): Promise<IUser | null>
  logout(token: string): Promise<void>
}
