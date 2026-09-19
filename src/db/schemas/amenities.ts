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
import { members } from './users'

// ============================================
// AMENITIES
// ============================================
export const amenities = mysqlTable('amenities', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: mysqlEnum('category', ['sports', 'recreation', 'fitness', 'community', 'kids', 'other']).notNull(),
  type: mysqlEnum('type', ['free', 'paid']).default('free'),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  capacity: int('capacity').default(1),
  maxBookingDuration: int('max_booking_duration'), // in minutes
  coolDownPeriod: int('cool_down_period'), // in minutes
  maxBookingsPerDay: int('max_bookings_per_day'),
  maxCancellations: int('max_cancellations'),
  cancellationCharge: decimal('cancellation_charge', { precision: 10, scale: 2 }).default('0'),
  requiresApproval: boolean('requires_approval').default(false),
  location: varchar('location', { length: 255 }),
  operatingHoursStart: varchar('operating_hours_start', { length: 5 }),
  operatingHoursEnd: varchar('operating_hours_end', { length: 5 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('amenities_society_id_idx').on(table.societyId),
])

// ============================================
// AMENITY SLOTS
// ============================================
export const amenitySlots = mysqlTable('amenity_slots', {
  id: int('id').primaryKey().autoincrement(),
  amenityId: int('amenity_id').notNull().references(() => amenities.id),
  dayOfWeek: int('day_of_week'), // 0=Sunday, 6=Saturday
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  maxCapacity: int('max_capacity').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('amenity_slots_amenity_id_idx').on(table.amenityId),
])

// ============================================
// AMENITY BOOKINGS
// ============================================
export const amenityBookings = mysqlTable('amenity_bookings', {
  id: int('id').primaryKey().autoincrement(),
  amenityId: int('amenity_id').notNull().references(() => amenities.id),
  memberId: int('member_id').notNull().references(() => members.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  slotId: int('slot_id').references(() => amenitySlots.id),
  bookingDate: datetime('booking_date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  guests: int('guests').default(1),
  guestNames: text('guest_names'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).default('0'),
  status: mysqlEnum('status', ['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  checkInTime: datetime('check_in_time'),
  checkOutTime: datetime('check_out_time'),
  cancellationReason: text('cancellation_reason'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('amenity_bookings_amenity_id_booking_date_idx').on(table.amenityId, table.bookingDate),
  index('amenity_bookings_member_id_idx').on(table.memberId),
  index('amenity_bookings_status_idx').on(table.status),
])

// ============================================
// AMENITY BOOKING ADD-ONS
// ============================================
export const amenityAddOns = mysqlTable('amenity_add_ons', {
  id: int('id').primaryKey().autoincrement(),
  amenityId: int('amenity_id').notNull().references(() => amenities.id),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// AMENITY MAINTENANCE SCHEDULE
// ============================================
export const amenityMaintenance = mysqlTable('amenity_maintenance', {
  id: int('id').primaryKey().autoincrement(),
  amenityId: int('amenity_id').notNull().references(() => amenities.id),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  reason: varchar('reason', { length: 255 }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('amenity_maintenance_amenity_id_idx').on(table.amenityId),
])

// ============================================
// AMENITY HOLIDAYS
// ============================================
export const amenityHolidays = mysqlTable('amenity_holidays', {
  id: int('id').primaryKey().autoincrement(),
  amenityId: int('amenity_id').references(() => amenities.id), // NULL for society-wide holidays
  date: datetime('date').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// AMENITY BLACKLIST
// ============================================
export const amenityBlacklist = mysqlTable('amenity_blacklist', {
  id: int('id').primaryKey().autoincrement(),
  amenityId: int('amenity_id').references(() => amenities.id),
  memberId: int('member_id').notNull().references(() => members.id),
  reason: text('reason'),
  validUntil: datetime('valid_until'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('amenity_blacklist_member_id_idx').on(table.memberId),
])

// ============================================
// AMENITY REVIEWS
// ============================================
export const amenityReviews = mysqlTable('amenity_reviews', {
  id: int('id').primaryKey().autoincrement(),
  amenityId: int('amenity_id').notNull().references(() => amenities.id),
  memberId: int('member_id').notNull().references(() => members.id),
  rating: int('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('amenity_reviews_amenity_id_idx').on(table.amenityId),
  index('amenity_reviews_member_id_idx').on(table.memberId),
])
