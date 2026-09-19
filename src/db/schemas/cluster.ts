import {
  mysqlTable,
  varchar,
  int,
  text,
  datetime,
  boolean,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'

// ============================================
// CLUSTER (Multi-Society Management)
// ============================================
export const clusters = mysqlTable('clusters', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  logo: varchar('logo', { length: 500 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  address: text('address'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
})

// ============================================
// SOCIETY
// ============================================
export const societies = mysqlTable('societies', {
  id: int('id').primaryKey().autoincrement(),
  clusterId: int('cluster_id').references(() => clusters.id),
  name: varchar('name', { length: 255 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }).unique(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  logo: varchar('logo', { length: 500 }),
  totalFlats: int('total_flats').default(0),
  totalTowers: int('total_towers').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
})

// ============================================
// TOWER / BLOCK
// ============================================
export const towers = mysqlTable('towers', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  totalFloors: int('total_floors').default(0),
  flatsPerFloor: int('flats_per_floor').default(0),
  hasLift: boolean('has_lift').default(false),
  hasCctv: boolean('has_cctv').default(false),
  hasFireAlarm: boolean('has_fire_alarm').default(false),
  profileImage: text('profile_image'),
  images: text('images'),
  documents: text('documents'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// GATE / ENTRY POINT
// ============================================
export const gates = mysqlTable('gates', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 100 }).notNull(),
  type: mysqlEnum('type', ['main', 'service', 'pedestrian', 'emergency']).default('main'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})
