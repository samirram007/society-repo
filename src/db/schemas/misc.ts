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

// ============================================
// PETS
// ============================================
export const pets = mysqlTable('pets', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  name: varchar('name', { length: 100 }).notNull(),
  type: mysqlEnum('type', ['dog', 'cat', 'bird', 'fish', 'other']).notNull(),
  breed: varchar('breed', { length: 100 }),
  age: int('age'),
  weight: decimal('weight', { precision: 5, scale: 2 }),
  color: varchar('color', { length: 50 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  images: text('images'),
  documents: text('documents'),
  vaccinationStatus: varchar('vaccination_status', { length: 100 }),
  isRegistered: boolean('is_registered').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('pets_member_id_idx').on(table.memberId),
  index('pets_flat_id_idx').on(table.flatId),
])

// ============================================
// PET VACCINATION RECORDS
// ============================================
export const petVaccinations = mysqlTable('pet_vaccinations', {
  id: int('id').primaryKey().autoincrement(),
  petId: int('pet_id').notNull().references(() => pets.id),
  vaccineName: varchar('vaccine_name', { length: 200 }).notNull(),
  vaccineType: varchar('vaccine_type', { length: 100 }), // rabies, distemper, parvovirus, etc.
  administeredDate: datetime('administered_date').notNull(),
  nextDueDate: datetime('next_due_date'),
  veterinarian: varchar('veterinarian', { length: 200 }),
  clinicName: varchar('clinic_name', { length: 200 }),
  batchNumber: varchar('batch_number', { length: 100 }),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  status: mysqlEnum('status', ['completed', 'scheduled', 'cancelled', 'overdue']).default('completed'),
  isReminderSent: boolean('is_reminder_sent').default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('pet_vaccinations_pet_id_idx').on(table.petId),
  index('pet_vaccinations_next_due_date_idx').on(table.nextDueDate),
])

// ============================================
// PET HEALTH RECORDS
// ============================================
export const petHealthRecords = mysqlTable('pet_health_records', {
  id: int('id').primaryKey().autoincrement(),
  petId: int('pet_id').notNull().references(() => pets.id),
  recordType: mysqlEnum('record_type', ['checkup', 'surgery', 'illness', 'injury', 'dental', 'grooming', 'other']).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  visitDate: datetime('visit_date').notNull(),
  veterinarian: varchar('veterinarian', { length: 200 }),
  clinicName: varchar('clinic_name', { length: 200 }),
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  medications: text('medications'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  nextVisitDate: datetime('next_visit_date'),
  attachments: text('attachments'), // JSON array of file URLs
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('pet_health_records_pet_id_idx').on(table.petId),
  index('pet_health_records_visit_date_idx').on(table.visitDate),
])

// ============================================
// PET REMINDERS
// ============================================
export const petReminders = mysqlTable('pet_reminders', {
  id: int('id').primaryKey().autoincrement(),
  petId: int('pet_id').notNull().references(() => pets.id),
  reminderType: mysqlEnum('reminder_type', ['vaccination', 'medication', 'grooming', 'checkup', 'insurance', 'other']).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  dueDate: datetime('due_date').notNull(),
  isRecurring: boolean('is_recurring').default(false),
  recurringInterval: varchar('recurring_interval', { length: 50 }), // daily, weekly, monthly, yearly
  isCompleted: boolean('is_completed').default(false),
  completedDate: datetime('completed_date'),
  isReminderSent: boolean('is_reminder_sent').default(false),
  priority: mysqlEnum('priority', ['low', 'medium', 'high']).default('medium'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('pet_reminders_pet_id_idx').on(table.petId),
  index('pet_reminders_due_date_idx').on(table.dueDate),
  index('pet_reminders_is_completed_idx').on(table.isCompleted),
])

// ============================================
// PET ACTIVITY LOG
// ============================================
export const petActivityLog = mysqlTable('pet_activity_log', {
  id: int('id').primaryKey().autoincrement(),
  petId: int('pet_id').notNull().references(() => pets.id),
  activityType: mysqlEnum('activity_type', ['feeding', 'walking', 'grooming', 'medication', 'training', 'play', 'other']).notNull(),
  description: text('description'),
  activityDate: datetime('activity_date').notNull(),
  duration: int('duration'), // in minutes
  recordedBy: int('recorded_by').references(() => members.id),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('pet_activity_log_pet_id_idx').on(table.petId),
  index('pet_activity_log_activity_date_idx').on(table.activityDate),
])

// ============================================
// MARKETPLACE PRODUCTS
// ============================================
export const marketplaceProducts = mysqlTable('marketplace_products', {
  id: int('id').primaryKey().autoincrement(),
  sellerId: int('seller_id').notNull().references(() => members.id),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: mysqlEnum('category', ['electronics', 'furniture', 'clothing', 'books', 'services', 'other']).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  negotiable: boolean('negotiable').default(false),
  condition: mysqlEnum('condition', ['new', 'like_new', 'good', 'fair']).default('good'),
  photoUrls: text('photo_urls'),
  status: mysqlEnum('status', ['active', 'sold', 'expired', 'removed']).default('active'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('marketplace_products_society_id_status_idx').on(table.societyId, table.status),
  index('marketplace_products_seller_id_idx').on(table.sellerId),
])

// ============================================
// MARKETPLACE ORDERS
// ============================================
export const marketplaceOrders = mysqlTable('marketplace_orders', {
  id: int('id').primaryKey().autoincrement(),
  productId: int('product_id').notNull().references(() => marketplaceProducts.id),
  buyerId: int('buyer_id').notNull().references(() => members.id),
  sellerId: int('seller_id').notNull().references(() => members.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('marketplace_orders_product_id_idx').on(table.productId),
  index('marketplace_orders_buyer_id_idx').on(table.buyerId),
])

// ============================================
// LOCAL SERVICES
// ============================================
export const localServices = mysqlTable('local_services', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  category: mysqlEnum('category', ['maid', 'plumber', 'electrician', 'painter', 'tutor', 'yoga', 'other']).notNull(),
  phone: varchar('phone', { length: 20 }),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  totalReviews: int('total_reviews').default(0),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('local_services_society_id_idx').on(table.societyId),
])

// ============================================
// SERVICE REVIEWS
// ============================================
export const serviceReviews = mysqlTable('service_reviews', {
  id: int('id').primaryKey().autoincrement(),
  serviceId: int('service_id').notNull().references(() => localServices.id),
  memberId: int('member_id').notNull().references(() => members.id),
  rating: int('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('service_reviews_service_id_idx').on(table.serviceId),
  index('service_reviews_member_id_idx').on(table.memberId),
])

// ============================================
// MOVEMENT LOG (Move-in/Move-out)
// ============================================
export const movementLog = mysqlTable('movement_log', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  type: mysqlEnum('type', ['move_in', 'move_out']).notNull(),
  effectiveDate: datetime('effective_date').notNull(),
  securityDepositPaid: decimal('security_deposit_paid', { precision: 12, scale: 2 }).default('0'),
  duesCleared: boolean('dues_cleared').default(false),
  noDuesCertificate: varchar('no_dues_certificate', { length: 500 }),
  notes: text('notes'),
  approvedBy: int('approved_by').references(() => users.id),
  status: mysqlEnum('status', ['pending', 'approved', 'completed']).default('pending'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('movement_log_member_id_idx').on(table.memberId),
  index('movement_log_flat_id_idx').on(table.flatId),
])

// ============================================
// PET RULES
// ============================================
export const petRules = mysqlTable('pet_rules', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  rule: text('rule').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// SOCIETY RULES
// ============================================
export const societyRules = mysqlTable('society_rules', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// FINE RULES
// ============================================
export const fineRules = mysqlTable('fine_rules', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: mysqlEnum('type', ['flat_amount', 'percentage', 'daily']).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  maxAmount: decimal('max_amount', { precision: 10, scale: 2 }),
  triggerOn: varchar('trigger_on', { length: 100 }),
  gracePeriodDays: int('grace_period_days').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('fine_rules_society_id_idx').on(table.societyId),
])

// ============================================
// HOLIDAYS
// ============================================
export const holidays = mysqlTable('holidays', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  date: datetime('date').notNull(),
  type: mysqlEnum('type', ['public', 'society', 'restricted']).default('public'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('holidays_society_id_idx').on(table.societyId),
])

// ============================================
// SYSTEM SETTINGS
// ============================================
export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value'),
  description: text('description'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('system_settings_society_id_idx').on(table.societyId),
])

// ============================================
// AUDIT LOGS
// ============================================
export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').references(() => societies.id),
  userId: int('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: int('entity_id'),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('audit_logs_society_id_user_id_idx').on(table.societyId, table.userId),
  index('audit_logs_entity_type_entity_id_idx').on(table.entityType, table.entityId),
  index('audit_logs_created_at_idx').on(table.createdAt),
])

// ============================================
// EMERGENCY CONTACTS & DISTRESS
// ============================================
export const emergencyContacts = mysqlTable('emergency_contacts', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 200 }).notNull(),
  category: mysqlEnum('category', ['hospital', 'ambulance', 'police', 'fire', 'gas', 'electricity', 'water', 'plumber', 'electrician', 'security', 'other']).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  phone2: varchar('phone_2', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  distance: decimal('distance', { precision: 10, scale: 2 }), // in km
  distanceText: varchar('distance_text', { length: 100 }), // e.g., "2.5 km, 10 min drive"
  isAvailable24x7: boolean('is_available_24x7').default(false),
  operatingHours: varchar('operating_hours', { length: 200 }),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  totalReviews: int('total_reviews').default(0),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('emergency_contacts_society_id_category_idx').on(table.societyId, table.category),
  index('emergency_contacts_society_id_idx').on(table.societyId),
])

// ============================================
// DISTRESS ALERTS
// ============================================
export const distressAlerts = mysqlTable('distress_alerts', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  memberId: int('member_id').references(() => members.id),
  flatId: int('flat_id').references(() => flats.id),
  alertType: mysqlEnum('alert_type', ['panic', 'fire', 'medical', 'security', 'gas_leak', 'flood', 'earthquake', 'other']).notNull(),
  message: text('message'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  status: mysqlEnum('status', ['active', 'acknowledged', 'resolved', 'false_alarm']).default('active'),
  acknowledgedBy: int('acknowledged_by').references(() => users.id),
  acknowledgedAt: datetime('acknowledged_at'),
  resolvedBy: int('resolved_by').references(() => users.id),
  resolvedAt: datetime('resolved_at'),
  notes: text('notes'),
  notifySecurity: boolean('notify_security').default(true),
  notifyNeighbors: boolean('notify_neighbors').default(false),
  notifyEmergencyServices: boolean('notify_emergency_services').default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('distress_alerts_society_id_status_idx').on(table.societyId, table.status),
  index('distress_alerts_member_id_idx').on(table.memberId),
  index('distress_alerts_created_at_idx').on(table.createdAt),
])

// ============================================
// NEARBY FACILITIES
// ============================================
export const nearbyFacilities = mysqlTable('nearby_facilities', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  category: mysqlEnum('category', ['hospital', 'clinic', 'pharmacy', 'ambulance', 'police_station', 'fire_station', 'gas_agency', 'electricity_office', 'water_office', 'bank', 'atm', 'petrol_pump', 'market', 'supermarket', 'mall', 'school', 'college', 'park', 'gym', 'restaurant', 'hotel', 'airport', 'railway_station', 'bus_stand', 'city_center', 'other']).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  description: text('description'),
  phone: varchar('phone', { length: 50 }),
  phone2: varchar('phone_2', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  distance: decimal('distance', { precision: 10, scale: 2 }), // in km
  distanceText: varchar('distance_text', { length: 100 }),
  travelTime: varchar('travel_time', { length: 100 }), // e.g., "15 min by car"
  roadDistance: varchar('road_distance', { length: 100 }), // road distance
  isAvailable24x7: boolean('is_available_24x7').default(false),
  operatingHours: varchar('operating_hours', { length: 200 }),
  rating: decimal('rating', { precision: 3, scale: 1 }),
  totalReviews: int('total_reviews').default(0),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  photoUrl: varchar('photo_url', { length: 500 }),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('nearby_facilities_society_id_category_idx').on(table.societyId, table.category),
  index('nearby_facilities_society_id_idx').on(table.societyId),
])

// ============================================
// SOCIETY LOCATION (for distance calculations)
// ============================================
export const societyLocation = mysqlTable('society_location', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id).unique(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  nearestCity: varchar('nearest_city', { length: 100 }),
  nearestCityDistance: decimal('nearest_city_distance', { precision: 10, scale: 2 }),
  nearestAirport: varchar('nearest_airport', { length: 200 }),
  nearestAirportDistance: decimal('nearest_airport_distance', { precision: 10, scale: 2 }),
  nearestRailwayStation: varchar('nearest_railway_station', { length: 200 }),
  nearestRailwayDistance: decimal('nearest_railway_distance', { precision: 10, scale: 2 }),
  nearestBusStand: varchar('nearest_bus_stand', { length: 200 }),
  nearestBusStandDistance: decimal('nearest_bus_stand_distance', { precision: 10, scale: 2 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('society_location_society_id_idx').on(table.societyId),
])
