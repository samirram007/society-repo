import {
  mysqlTable,
  varchar,
  int,
  decimal,
  text,
  datetime,
  boolean,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { societies } from './cluster'
import { flats } from './property'
import { members, users } from './users'
import { vendors } from './accounting'
import { staff } from './users'

// ============================================
// SERVICE COMPANIES
// ============================================
export const serviceCompanies = mysqlTable('service_companies', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  services: text('services'), // JSON array of service types offered
  gstNumber: varchar('gst_number', { length: 50 }),
  panNumber: varchar('pan_number', { length: 20 }),
  rating: int('rating'), // 1-5
  contractStart: datetime('contract_start'),
  contractEnd: datetime('contract_end'),
  monthlyRetainer: decimal('monthly_retainer', { precision: 10, scale: 2 }),
  profileImage: text('profile_image'),
  documents: text('documents'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('service_companies_society_id_idx').on(table.societyId),
])

// ============================================
// SERVICE PERSONS
// ============================================
export const servicePersons = mysqlTable('service_persons', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  companyId: int('company_id').references(() => serviceCompanies.id),
  staffId: int('staff_id').references(() => staff.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  specialization: varchar('specialization', { length: 100 }), // plumbing, electrical, carpentry, etc.
  skillLevel: mysqlEnum('skill_level', ['apprentice', 'junior', 'senior', 'expert']).default('junior'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  availability: mysqlEnum('availability', ['available', 'busy', 'on_leave', 'inactive']).default('available'),
  profileImage: text('profile_image'),
  idProofImage: text('id_proof_image'),
  documents: text('documents'),
  rating: int('rating'), // 1-5
  totalJobs: int('total_jobs').default(0),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('service_persons_society_id_idx').on(table.societyId),
  index('service_persons_company_id_idx').on(table.companyId),
  index('service_persons_staff_id_idx').on(table.staffId),
])

// ============================================
// SERVICE CATEGORIES
// ============================================
export const serviceCategories = mysqlTable('service_categories', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: int('parent_id').references((): any => serviceCategories.id),
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// SERVICE REQUESTS (Complaints/Helpdesk)
// ============================================
export const serviceRequests = mysqlTable('service_requests', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  memberId: int('member_id').notNull().references(() => members.id),
  categoryId: int('category_id').notNull().references(() => serviceCategories.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('medium'),
  status: mysqlEnum('status', ['open', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened']).default('open'),
  assignedTo: int('assigned_to').references(() => users.id),
  assignedStaffId: int('assigned_staff_id').references(() => staff.id),
  assignedCompanyId: int('assigned_company_id').references(() => serviceCompanies.id),
  assignedPersonId: int('assigned_person_id').references(() => servicePersons.id),
  assignedDepartment: varchar('assigned_department', { length: 100 }),
  photoUrls: text('photo_urls'), // JSON array
  resolutionPhotos: text('resolution_photos'), // JSON array
  documents: text('documents'),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  resolutionNotes: text('resolution_notes'),
  rating: int('rating'), // 1-5
  feedback: text('feedback'),
  resolvedAt: datetime('resolved_at'),
  closedAt: datetime('closed_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('service_requests_society_id_status_idx').on(table.societyId, table.status),
  index('service_requests_flat_id_idx').on(table.flatId),
  index('service_requests_member_id_idx').on(table.memberId),
  index('service_requests_assigned_to_idx').on(table.assignedTo),
])

// ============================================
// SERVICE REQUEST COMMENTS
// ============================================
export const serviceRequestComments = mysqlTable('service_request_comments', {
  id: int('id').primaryKey().autoincrement(),
  serviceRequestId: int('service_request_id').notNull().references(() => serviceRequests.id),
  userId: int('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  photoUrl: varchar('photo_url', { length: 500 }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('service_request_comments_service_request_id_idx').on(table.serviceRequestId),
])

// ============================================
// SERVICE REQUEST ESCALATIONS
// ============================================
export const serviceRequestEscalations = mysqlTable('service_request_escalations', {
  id: int('id').primaryKey().autoincrement(),
  serviceRequestId: int('service_request_id').notNull().references(() => serviceRequests.id),
  level: int('level').notNull(), // 1-4
  escalatedTo: int('escalated_to').notNull().references(() => users.id),
  reason: text('reason'),
  status: mysqlEnum('status', ['pending', 'acknowledged', 'resolved']).default('pending'),
  escalatedAt: datetime('escalated_at').$defaultFn(() => new Date()),
  acknowledgedAt: datetime('acknowledged_at'),
  resolvedAt: datetime('resolved_at'),
}, (table) => [
  index('service_request_escalations_service_request_id_idx').on(table.serviceRequestId),
])

// ============================================
// ASSETS
// ============================================
export const assets = mysqlTable('assets', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: int('category_id').references(() => assetCategories.id),
  location: varchar('location', { length: 255 }),
  purchaseDate: datetime('purchase_date'),
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }),
  warrantyExpiry: datetime('warranty_expiry'),
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  quantity: int('quantity').default(1),
  status: mysqlEnum('status', ['active', 'maintenance', 'retired', 'disposed']).default('active'),
  images: text('images'),
  documents: text('documents'),
  nextMaintenanceDate: datetime('next_maintenance_date'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('assets_society_id_idx').on(table.societyId),
])

// ============================================
// ASSET CATEGORIES
// ============================================
export const assetCategories = mysqlTable('asset_categories', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// INVENTORY
// ============================================
export const inventory = mysqlTable('inventory', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: int('category_id').references(() => assetCategories.id),
  location: varchar('location', { length: 255 }),
  quantity: int('quantity').default(0),
  minQuantity: int('min_quantity').default(0),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  custodianId: int('custodian_id').references(() => users.id),
  department: varchar('department', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('inventory_society_id_idx').on(table.societyId),
])

// ============================================
// INVENTORY TRANSACTIONS
// ============================================
export const inventoryTransactions = mysqlTable('inventory_transactions', {
  id: int('id').primaryKey().autoincrement(),
  inventoryId: int('inventory_id').notNull().references(() => inventory.id),
  type: mysqlEnum('type', ['in', 'out', 'adjustment']).notNull(),
  quantity: int('quantity').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: int('reference_id'),
  notes: text('notes'),
  createdBy: int('created_by').references(() => users.id),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('inventory_transactions_inventory_id_idx').on(table.inventoryId),
])

// ============================================
// PURCHASE REQUISITIONS
// ============================================
export const purchaseRequisitions = mysqlTable('purchase_requisitions', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  requestedBy: int('requested_by').notNull().references(() => users.id),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }),
  priority: mysqlEnum('priority', ['low', 'medium', 'high']).default('medium'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'ordered']).default('pending'),
  approvedBy: int('approved_by').references(() => users.id),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('purchase_requisitions_society_id_status_idx').on(table.societyId, table.status),
])

// ============================================
// PURCHASE ORDERS
// ============================================
export const purchaseOrders = mysqlTable('purchase_orders', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  requisitionId: int('requisition_id').references(() => purchaseRequisitions.id),
  vendorId: int('vendor_id').notNull().references(() => vendors.id),
  poNumber: varchar('po_number', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['draft', 'sent', 'confirmed', 'delivered', 'cancelled']).default('draft'),
  deliveryDate: datetime('delivery_date'),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('purchase_orders_society_id_status_idx').on(table.societyId, table.status),
  index('purchase_orders_vendor_id_idx').on(table.vendorId),
])

// ============================================
// FAQ CATEGORIES
// ============================================
export const faqCategories = mysqlTable('faq_categories', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('faq_categories_society_id_idx').on(table.societyId),
])

// ============================================
// FAQs
// ============================================
export const faqs = mysqlTable('faqs', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  categoryId: int('category_id').references(() => faqCategories.id),
  question: varchar('question', { length: 500 }).notNull(),
  answer: text('answer').notNull(),
  sortOrder: int('sort_order').default(0),
  helpful: int('helpful').default(0),
  notHelpful: int('not_helpful').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('faqs_society_id_category_idx').on(table.societyId, table.categoryId),
])

// ============================================
// HELP TICKETS
// ============================================
export const helpTickets = mysqlTable('help_tickets', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  userId: int('user_id').notNull().references(() => users.id),
  ticketNumber: varchar('ticket_number', { length: 20 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: mysqlEnum('category', ['general', 'billing', 'technical', 'maintenance', 'security', 'amenity', 'other']).default('general'),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('medium'),
  status: mysqlEnum('status', ['open', 'in_progress', 'waiting', 'resolved', 'closed']).default('open'),
  assignedTo: int('assigned_to').references(() => users.id),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  resolvedAt: datetime('resolved_at'),
  closedAt: datetime('closed_at'),
  satisfactionRating: int('satisfaction_rating'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('help_tickets_society_id_status_idx').on(table.societyId, table.status),
  index('help_tickets_user_id_idx').on(table.userId),
  index('help_tickets_ticket_number_idx').on(table.ticketNumber),
])

// ============================================
// HELP TICKET MESSAGES
// ============================================
export const helpTicketMessages = mysqlTable('help_ticket_messages', {
  id: int('id').primaryKey().autoincrement(),
  ticketId: int('ticket_id').notNull().references(() => helpTickets.id),
  userId: int('user_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  isInternal: boolean('is_internal').default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('help_ticket_messages_ticket_id_idx').on(table.ticketId),
])

// ============================================
// CONTACT MESSAGES
// ============================================
export const contactMessages = mysqlTable('contact_messages', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  category: mysqlEnum('category', ['general', 'support', 'sales', 'feedback', 'bug_report']).default('general'),
  status: mysqlEnum('status', ['new', 'read', 'replied', 'archived']).default('new'),
  repliedAt: datetime('replied_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('contact_messages_status_idx').on(table.status),
])

// ============================================
// IN-APP NOTIFICATIONS
// ============================================
export const inAppNotifications = mysqlTable('in_app_notifications', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  userId: int('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: mysqlEnum('type', ['info', 'warning', 'success', 'error', 'alert']).default('info'),
  link: varchar('link', { length: 500 }),
  isRead: boolean('is_read').default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('in_app_notifications_user_id_read_idx').on(table.userId, table.isRead),
  index('in_app_notifications_society_id_idx').on(table.societyId),
])
