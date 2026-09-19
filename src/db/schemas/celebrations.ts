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
} from 'drizzle-orm/mysql-core'
import { societies } from './cluster'
import { flats } from './property'
import { members, users, staff } from './users'
import { vendors } from './accounting'

// ============================================
// CELEBRATIONS / EVENTS
// ============================================
export const celebrations = mysqlTable('celebrations', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: mysqlEnum('category', ['religious', 'social', 'cultural', 'festival', 'birthday', 'anniversary', 'party', 'puja', 'other']).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  eventDate: datetime('event_date').notNull(),
  endDate: datetime('end_date'),
  startTime: varchar('start_time', { length: 5 }),
  endTime: varchar('end_time', { length: 5 }),
  location: varchar('location', { length: 255 }),
  organizedBy: int('organized_by').references(() => members.id),
  organizedByStaff: int('organized_by_staff').references(() => staff.id),
  status: mysqlEnum('status', ['planned', 'confirmed', 'ongoing', 'completed', 'cancelled']).default('planned'),
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: varchar('recurring_pattern', { length: 50 }),
  recurringGroupId: int('recurring_group_id').references((): any => celebrations.id),
  maxAttendees: int('max_attendees'),
  requiresApproval: boolean('requires_approval').default(false),
  isPublic: boolean('is_public').default(true),
  targetAudience: mysqlEnum('target_audience', ['all', 'owners', 'tenants', 'committee', 'specific_tower']).default('all'),
  targetTowers: text('target_towers'),
  contactPerson: varchar('contact_person', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  coverImage: varchar('cover_image', { length: 500 }),
  attachmentUrls: text('attachment_urls'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('celebrations_society_id_event_date_idx').on(table.societyId, table.eventDate),
  index('celebrations_status_idx').on(table.status),
])

// ============================================
// CELEBRATION ATTENDEES (RSVP)
// ============================================
export const celebrationAttendees = mysqlTable('celebration_attendees', {
  id: int('id').primaryKey().autoincrement(),
  celebrationId: int('celebration_id').notNull().references(() => celebrations.id),
  memberId: int('member_id').notNull().references(() => members.id),
  flatId: int('flat_id').references(() => flats.id),
  status: mysqlEnum('status', ['invited', 'going', 'maybe', 'not_going', 'waitlisted']).default('invited'),
  guestCount: int('guest_count').default(0),
  guestNames: text('guest_names'),
  responseDate: datetime('response_date'),
  notes: text('notes'),
  checkedIn: boolean('checked_in').default(false),
  checkedInAt: datetime('checked_in_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('celebration_attendees_celebration_id_idx').on(table.celebrationId),
  index('celebration_attendees_member_id_idx').on(table.memberId),
])

// ============================================
// CELEBRATION BUDGET
// ============================================
export const celebrationBudgets = mysqlTable('celebration_budgets', {
  id: int('id').primaryKey().autoincrement(),
  celebrationId: int('celebration_id').notNull().references(() => celebrations.id),
  category: varchar('category', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  estimatedAmount: decimal('estimated_amount', { precision: 10, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 10, scale: 2 }).default('0'),
  vendorId: int('vendor_id').references(() => vendors.id),
  paidBy: int('paid_by').references(() => members.id),
  paidTo: varchar('paid_to', { length: 255 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  status: mysqlEnum('status', ['pending', 'approved', 'paid', 'rejected']).default('pending'),
  approvedBy: int('approved_by').references(() => users.id),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('celebration_budgets_celebration_id_idx').on(table.celebrationId),
])

// ============================================
// CELEBRATION PHOTOS
// ============================================
export const celebrationPhotos = mysqlTable('celebration_photos', {
  id: int('id').primaryKey().autoincrement(),
  celebrationId: int('celebration_id').notNull().references(() => celebrations.id),
  uploadedBy: int('uploaded_by').references(() => members.id),
  photoUrl: varchar('photo_url', { length: 500 }).notNull(),
  caption: varchar('caption', { length: 255 }),
  isHighlight: boolean('is_highlight').default(false),
  likes: int('likes').default(0),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('celebration_photos_celebration_id_idx').on(table.celebrationId),
])

// ============================================
// CELEBRATION TASKS (to-do for event planning)
// ============================================
export const celebrationTasks = mysqlTable('celebration_tasks', {
  id: int('id').primaryKey().autoincrement(),
  celebrationId: int('celebration_id').notNull().references(() => celebrations.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assignedTo: int('assigned_to').references(() => members.id),
  assignedToStaff: int('assigned_to_staff').references(() => staff.id),
  priority: mysqlEnum('priority', ['low', 'medium', 'high']).default('medium'),
  status: mysqlEnum('status', ['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  dueDate: datetime('due_date'),
  completedAt: datetime('completed_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('celebration_tasks_celebration_id_idx').on(table.celebrationId),
])

// ============================================
// CELEBRATION COMMENTS
// ============================================
export const celebrationComments = mysqlTable('celebration_comments', {
  id: int('id').primaryKey().autoincrement(),
  celebrationId: int('celebration_id').notNull().references(() => celebrations.id),
  memberId: int('member_id').notNull().references(() => members.id),
  content: text('content').notNull(),
  parentCommentId: int('parent_comment_id').references((): any => celebrationComments.id),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('celebration_comments_celebration_id_idx').on(table.celebrationId),
])
