import {
  mysqlTable,
  varchar,
  int,
  text,
  datetime,
  boolean,
  mysqlEnum,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { societies } from './cluster'
import { flats as flatsTable } from './property'

// ============================================
// USERS (System-wide users)
// ============================================
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  profileImage: text('profile_image'),
  role: mysqlEnum('role', ['developer', 'admin', 'super_admin', 'staff', 'member']).default('member'),
  permissions: text('permissions'), // JSON: { module: { access, view, modify, read } }
  isActive: boolean('is_active').default(true),
  lastLoginAt: datetime('last_login_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
})

// ============================================
// ROLES (System-wide roles)
// ============================================
export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: text('permissions'), // JSON array of permissions
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// USER ROLES (User-Role mapping)
// ============================================
export const userRoles = mysqlTable('user_roles', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id),
  roleId: int('role_id').notNull().references(() => roles.id),
  societyId: int('society_id').references(() => societies.id), // NULL for cluster-level roles
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('user_roles_user_id_idx').on(table.userId),
  index('user_roles_society_id_idx').on(table.societyId),
])

// ============================================
// MEMBERS (Society residents)
// ============================================
export const members = mysqlTable('members', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  userId: int('user_id').references(() => users.id), // Linked to system user
  flatId: int('flat_id').references(() => flatsTable.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }).notNull(),
  alternatePhone: varchar('alternate_phone', { length: 20 }),
  role: mysqlEnum('role', ['owner', 'tenant', 'secretary', 'treasurer', 'chairman', 'committee_member']).default('owner'),
  residentType: mysqlEnum('resident_type', ['owner', 'tenant', 'family_member']).default('owner'),
  profileImage: text('profile_image'),
  idProofType: varchar('id_proof_type', { length: 50 }),
  idProofNumber: varchar('id_proof_number', { length: 100 }),
  idProofImage: text('id_proof_image'),
  documents: text('documents'),
  moveInDate: datetime('move_in_date'),
  moveOutDate: datetime('move_out_date'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('members_society_id_idx').on(table.societyId),
  index('members_flat_id_idx').on(table.flatId),
  index('members_user_id_idx').on(table.userId),
])

// ============================================
// FAMILY MEMBERS
// ============================================
export const familyMembers = mysqlTable('family_members', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  relationship: varchar('relationship', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  dateOfBirth: datetime('date_of_birth'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('family_members_member_id_idx').on(table.memberId),
])

// ============================================
// STAFF (Society staff - guards, housekeeping, etc.)
// ============================================
export const staff = mysqlTable('staff', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  department: mysqlEnum('department', ['security', 'housekeeping', 'maintenance', 'gardening', 'admin', 'other']).notNull(),
  designation: varchar('designation', { length: 100 }),
  shift: varchar('shift', { length: 50 }),
  salary: int('salary'),
  joiningDate: datetime('joining_date'),
  profileImage: text('profile_image'),
  idProofImage: text('id_proof_image'),
  documents: text('documents'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('staff_society_id_idx').on(table.societyId),
])

// ============================================
// STAFF ATTENDANCE
// ============================================
export const staffAttendance = mysqlTable('staff_attendance', {
  id: int('id').primaryKey().autoincrement(),
  staffId: int('staff_id').notNull().references(() => staff.id),
  date: datetime('date').notNull(),
  checkIn: datetime('check_in'),
  checkOut: datetime('check_out'),
  status: mysqlEnum('status', ['present', 'absent', 'late', 'half_day', 'leave']).default('present'),
  overtimeHours: decimal('overtime_hours', { precision: 4, scale: 2 }).default('0'),
  notes: text('notes'),
  selfieUrl: varchar('selfie_url', { length: 500 }),
  approvedBy: int('approved_by').references(() => users.id),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('staff_attendance_staff_id_date_uidx').on(table.staffId, table.date),
])

// ============================================
// STAFF LEAVE REQUESTS
// ============================================
export const staffLeaves = mysqlTable('staff_leaves', {
  id: int('id').primaryKey().autoincrement(),
  staffId: int('staff_id').notNull().references(() => staff.id),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  reason: text('reason'),
  type: mysqlEnum('type', ['sick', 'casual', 'earned', 'unpaid', 'other']).default('casual'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  approvedBy: int('approved_by').references(() => users.id),
  approvedAt: datetime('approved_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('staff_leaves_staff_id_idx').on(table.staffId),
])

// ============================================
// STAFF SALARY RECORDS
// ============================================
export const staffSalaries = mysqlTable('staff_salaries', {
  id: int('id').primaryKey().autoincrement(),
  staffId: int('staff_id').notNull().references(() => staff.id),
  month: varchar('month', { length: 7 }).notNull(),
  basicSalary: decimal('basic_salary', { precision: 10, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 10, scale: 2 }).default('0'),
  deductions: decimal('deductions', { precision: 10, scale: 2 }).default('0'),
  overtime: decimal('overtime', { precision: 10, scale: 2 }).default('0'),
  netPay: decimal('net_pay', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'bank_transfer', 'upi']).default('bank_transfer'),
  paymentDate: datetime('payment_date'),
  status: mysqlEnum('status', ['pending', 'paid', 'held']).default('pending'),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('staff_salaries_staff_id_month_uidx').on(table.staffId, table.month),
])
