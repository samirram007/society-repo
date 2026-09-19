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
import { societies, towers as towersTable, gates as gatesTable } from './cluster'
import { members, staff } from './users'

// ============================================
// FLATS
// ============================================
export const flats = mysqlTable('flats', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  towerId: int('tower_id').references(() => towersTable.id),
  flatNumber: varchar('flat_number', { length: 20 }).notNull(),
  wing: varchar('wing', { length: 10 }),
  floor: int('floor').notNull(),
  area: decimal('area', { precision: 10, scale: 2 }),
  type: mysqlEnum('type', ['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'villa', 'shop', 'office']).notNull(),
  maintenanceAmount: decimal('maintenance_amount', { precision: 10, scale: 2 }).default('0'),
  ownerName: varchar('owner_name', { length: 200 }),
  tenantName: varchar('tenant_name', { length: 200 }),
  isOccupied: boolean('is_occupied').default(false),
  images: text('images'),
  documents: text('documents'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('flats_society_id_flat_number_uidx').on(table.societyId, table.flatNumber),
  index('flats_tower_id_idx').on(table.towerId),
])

// ============================================
// PARKING SPACES
// ============================================
export const parkingSpaces = mysqlTable('parking_spaces', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  flatId: int('flat_id').references(() => flats.id),
  allocatedVehicleId: int('allocated_vehicle_id'),
  slotNumber: varchar('slot_number', { length: 20 }).notNull(),
  floor: varchar('floor', { length: 20 }),
  section: varchar('section', { length: 20 }),
  type: mysqlEnum('type', ['covered', 'open', 'basement']).default('open'),
  vehicleType: varchar('vehicle_type', { length: 20 }).default('car'),
  isVisitorParking: boolean('is_visitor_parking').default(false),
  isOccupied: boolean('is_occupied').default(false),
  monthlyCharges: decimal('monthly_charges', { precision: 10, scale: 2 }).default('0'),
  dimensions: varchar('dimensions', { length: 50 }),
  hasCctv: boolean('has_cctv').default(false),
  hasCharging: boolean('has_charging').default(false),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('parking_spaces_society_id_slot_number_uidx').on(table.societyId, table.slotNumber),
  index('parking_spaces_flat_id_idx').on(table.flatId),
])

// ============================================
// VEHICLES
// ============================================
export const vehicles = mysqlTable('vehicles', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  vehicleNumber: varchar('vehicle_number', { length: 20 }).notNull(),
  type: mysqlEnum('type', ['car', 'bike', 'scooter', 'bicycle', 'other']).notNull(),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  color: varchar('color', { length: 50 }),
  yearOfManufacture: int('year_of_manufacture'),
  fuelType: varchar('fuel_type', { length: 20 }),
  insuranceExpiry: datetime('insurance_expiry'),
  rcExpiry: datetime('rc_expiry'),
  numberPlateImage: text('number_plate_image'),
  bodyImage: text('body_image'),
  images: text('images'),
  documents: text('documents'),
  parkingSpaceId: int('parking_space_id').references(() => parkingSpaces.id),
  isPrimary: boolean('is_primary').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('vehicles_member_id_idx').on(table.memberId),
  index('vehicles_flat_id_idx').on(table.flatId),
])

// ============================================
// VEHICLE MOVEMENT LOG
// ============================================
export const vehicleMovements = mysqlTable('vehicle_movements', {
  id: int('id').primaryKey().autoincrement(),
  vehicleId: int('vehicle_id').references(() => vehicles.id),
  vehicleNumber: varchar('vehicle_number', { length: 20 }).notNull(),
  gateId: int('gate_id').references(() => gatesTable.id),
  type: mysqlEnum('type', ['visitor', 'resident', 'delivery', 'utility']).notNull(),
  direction: mysqlEnum('direction', ['entry', 'exit']).notNull(),
  guardId: int('guard_id').references(() => staff.id),
  purpose: varchar('purpose', { length: 255 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  timestamp: datetime('timestamp').$defaultFn(() => new Date()),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('vehicle_movements_vehicle_id_idx').on(table.vehicleId),
  index('vehicle_movements_timestamp_idx').on(table.timestamp),
])

// ============================================
// VISITOR PARKING ALLOCATION
// ============================================
export const visitorParking = mysqlTable('visitor_parking', {
  id: int('id').primaryKey().autoincrement(),
  visitorId: int('visitor_id').notNull(),
  visitorName: varchar('visitor_name', { length: 255 }),
  visitorPhone: varchar('visitor_phone', { length: 20 }),
  parkingSpaceId: int('parking_space_id').references(() => parkingSpaces.id),
  flatId: int('flat_id').references(() => flats.id),
  vehicleNumber: varchar('vehicle_number', { length: 20 }),
  vehicleType: varchar('vehicle_type', { length: 20 }),
  vehicleColor: varchar('vehicle_color', { length: 50 }),
  purpose: varchar('purpose', { length: 255 }),
  visitingMemberName: varchar('visiting_member_name', { length: 255 }),
  idProofImage: text('id_proof_image'),
  entryTime: datetime('entry_time').$defaultFn(() => new Date()),
  exitTime: datetime('exit_time'),
  expectedDuration: varchar('expected_duration', { length: 50 }),
  status: mysqlEnum('status', ['parked', 'exited', 'overstay']).default('parked'),
  charges: decimal('charges', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})
