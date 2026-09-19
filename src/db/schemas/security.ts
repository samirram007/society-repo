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
import { societies, gates as gatesTable } from './cluster'
import { flats } from './property'
import { members, staff } from './users'

// ============================================
// VISITORS
// ============================================
export const visitors = mysqlTable('visitors', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  purpose: varchar('purpose', { length: 255 }),
  flatId: int('flat_id').notNull().references(() => flats.id),
  visitingMemberId: int('visiting_member_id').references(() => members.id),
  gateId: int('gate_id').references(() => gatesTable.id),
  guardId: int('guard_id').references(() => staff.id),
  entryTime: datetime('entry_time').$defaultFn(() => new Date()),
  exitTime: datetime('exit_time'),
  vehicleNumber: varchar('vehicle_number', { length: 20 }),
  idProof: varchar('id_proof', { length: 255 }),
  idProofImage: text('id_proof_image'),
  photoUrl: varchar('photo_url', { length: 500 }),
  temperature: varchar('temperature', { length: 10 }),
  maskWorn: boolean('mask_worn'),
  status: mysqlEnum('status', ['inside', 'checked_out', 'overstay']).default('inside'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('visitors_society_id_status_idx').on(table.societyId, table.status),
  index('visitors_flat_id_idx').on(table.flatId),
  index('visitors_entry_time_idx').on(table.entryTime),
  index('visitors_gate_id_idx').on(table.gateId),
])

// ============================================
// PRE-APPROVALS
// ============================================
export const preApprovals = mysqlTable('pre_approvals', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  visitorName: varchar('visitor_name', { length: 255 }),
  visitorPhone: varchar('visitor_phone', { length: 20 }),
  visitorType: mysqlEnum('visitor_type', ['guest', 'delivery', 'cab', 'vendor', 'daily_help']).notNull(),
  flatId: int('flat_id').notNull().references(() => flats.id),
  gateId: int('gate_id').references(() => gatesTable.id),
  validFrom: datetime('valid_from').$defaultFn(() => new Date()),
  validUntil: datetime('valid_until'),
  isRecurring: boolean('is_recurring').default(false),
  recurringDays: varchar('recurring_days', { length: 50 }), // comma-separated: "mon,tue,wed"
  status: mysqlEnum('status', ['active', 'used', 'expired', 'cancelled']).default('active'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('pre_approvals_member_id_idx').on(table.memberId),
  index('pre_approvals_flat_id_idx').on(table.flatId),
])

// ============================================
// GUEST INVITATIONS
// ============================================
export const guestInvitations = mysqlTable('guest_invitations', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  guestName: varchar('guest_name', { length: 255 }).notNull(),
  guestPhone: varchar('guest_phone', { length: 20 }),
  inviteDate: datetime('invite_date').$defaultFn(() => new Date()),
  validUntil: datetime('valid_until'),
  status: mysqlEnum('status', ['pending', 'accepted', 'entered', 'expired']).default('pending'),
  inviteCode: varchar('invite_code', { length: 20 }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('guest_invitations_member_id_idx').on(table.memberId),
])

// ============================================
// DAILY HELP
// ============================================
export const dailyHelp = mysqlTable('daily_help', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  type: mysqlEnum('type', ['maid', 'cook', 'driver', 'nurse', 'tutor', 'other']).notNull(),
  passcode: varchar('passcode', { length: 20 }),
  timings: varchar('timings', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('daily_help_member_id_idx').on(table.memberId),
])

// ============================================
// DAILY HELP ATTENDANCE
// ============================================
export const dailyHelpAttendance = mysqlTable('daily_help_attendance', {
  id: int('id').primaryKey().autoincrement(),
  dailyHelpId: int('daily_help_id').notNull().references(() => dailyHelp.id),
  date: datetime('date').$defaultFn(() => new Date()),
  checkIn: datetime('check_in'),
  checkOut: datetime('check_out'),
  gateId: int('gate_id').references(() => gatesTable.id),
  guardId: int('guard_id').references(() => staff.id),
  rating: int('rating'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('daily_help_attendance_daily_help_id_idx').on(table.dailyHelpId),
])

// ============================================
// EMERGENCY CONTACTS
// ============================================
export const memberEmergencyContacts = mysqlTable('member_emergency_contacts', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  relationship: varchar('relationship', { length: 50 }),
  isPrimary: boolean('is_primary').default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('member_emergency_contacts_member_id_idx').on(table.memberId),
])

// ============================================
// PANIC ALERTS
// ============================================
export const panicAlerts = mysqlTable('panic_alerts', {
  id: int('id').primaryKey().autoincrement(),
  memberId: int('member_id').notNull().references(() => members.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  message: text('message'),
  status: mysqlEnum('status', ['active', 'acknowledged', 'resolved']).default('active'),
  acknowledgedBy: int('acknowledged_by').references(() => staff.id),
  acknowledgedAt: datetime('acknowledged_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('panic_alerts_member_id_idx').on(table.memberId),
  index('panic_alerts_status_idx').on(table.status),
])

// ============================================
// GUARD PATROLLING
// ============================================
export const patrolRoutes = mysqlTable('patrol_routes', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 100 }).notNull(),
  checkpoints: text('checkpoints'), // JSON array of checkpoint locations
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

export const patrolLogs = mysqlTable('patrol_logs', {
  id: int('id').primaryKey().autoincrement(),
  routeId: int('route_id').notNull().references(() => patrolRoutes.id),
  staffId: int('staff_id').notNull().references(() => staff.id),
  checkpointId: varchar('checkpoint_id', { length: 50 }),
  scannedAt: datetime('scanned_at').$defaultFn(() => new Date()),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('patrol_logs_route_id_idx').on(table.routeId),
  index('patrol_logs_staff_id_idx').on(table.staffId),
])

// ============================================
// MATERIAL GATEPASS
// ============================================
export const materialGatepass = mysqlTable('material_gatepass', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  flatId: int('flat_id').references(() => flats.id),
  memberId: int('member_id').references(() => members.id),
  direction: mysqlEnum('direction', ['in', 'out']).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: varchar('quantity', { length: 50 }),
  vehicleNumber: varchar('vehicle_number', { length: 20 }),
  guardId: int('guard_id').references(() => staff.id),
  photoUrl: varchar('photo_url', { length: 500 }),
  status: mysqlEnum('status', ['pending', 'approved', 'completed']).default('pending'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('material_gatepass_society_id_idx').on(table.societyId),
])

// ============================================
// UTILITY VEHICLES
// ============================================
export const utilityVehicles = mysqlTable('utility_vehicles', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  vehicleType: mysqlEnum('vehicle_type', ['water_tanker', 'diesel', 'garbage', 'maintenance', 'other']).notNull(),
  vehicleNumber: varchar('vehicle_number', { length: 20 }),
  driverName: varchar('driver_name', { length: 255 }),
  driverPhone: varchar('driver_phone', { length: 20 }),
  purpose: varchar('purpose', { length: 255 }),
  entryTime: datetime('entry_time').$defaultFn(() => new Date()),
  exitTime: datetime('exit_time'),
  gateId: int('gate_id').references(() => gatesTable.id),
  guardId: int('guard_id').references(() => staff.id),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('utility_vehicles_society_id_idx').on(table.societyId),
])

// ============================================
// SECURITY CAMERAS / CCTV
// ============================================
export const securityCameras = mysqlTable('security_cameras', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  cameraName: varchar('camera_name', { length: 100 }).notNull(),
  cameraCode: varchar('camera_code', { length: 20 }),
  zone: varchar('zone', { length: 100 }),
  location: varchar('location', { length: 255 }),
  locationDetail: varchar('location_detail', { length: 255 }),
  towerId: int('tower_id'),
  gateId: int('gate_id').references(() => gatesTable.id),
  floor: varchar('floor', { length: 20 }),
  // Camera specs
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  type: mysqlEnum('type', ['dome', 'bullet', 'ptz', 'cctv', 'ip', 'wireless', 'thermal', 'panoramic']).default('dome'),
  resolution: varchar('resolution', { length: 20 }),
  fieldOfView: int('field_of_view'),
  nightVision: boolean('night_vision').default(false),
  hasAudio: boolean('has_audio').default(false),
  hasStorage: boolean('has_storage').default(true),
  // NVR / Storage
  nvrName: varchar('nvr_name', { length: 100 }),
  nvrChannel: int('nvr_channel'),
  storageDays: int('storage_days'),
  storageSizeGb: int('storage_size_gb'),
  bitrate: int('bitrate'),
  // Network
  ipAddress: varchar('ip_address', { length: 45 }),
  macAddress: varchar('mac_address', { length: 20 }),
  streamUrl: varchar('stream_url', { length: 500 }),
  // Coverage
  coverageArea: varchar('coverage_area', { length: 255 }),
  coverageRadius: int('coverage_radius'),
  installationHeight: varchar('installation_height', { length: 20 }),
  // Status & Maintenance
  status: mysqlEnum('status', ['online', 'offline', 'maintenance', 'faulty']).default('online'),
  lastMaintenance: datetime('last_maintenance'),
  nextMaintenance: datetime('next_maintenance'),
  warrantyExpiry: datetime('warranty_expiry'),
  installDate: datetime('install_date'),
  // Cost
  purchaseCost: decimal('purchase_cost', { precision: 10, scale: 2 }),
  monthlyAmc: decimal('monthly_amc', { precision: 10, scale: 2 }),
  // Images & Docs
  profileImage: text('profile_image'),
  installationImage: text('installation_image'),
  images: text('images'),
  documents: text('documents'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('security_cameras_society_id_idx').on(table.societyId),
  index('security_cameras_zone_idx').on(table.zone),
  index('security_cameras_status_idx').on(table.status),
])

// ============================================
// CAMERA ZONES / COVERAGE AREAS
// ============================================
export const cameraZones = mysqlTable('camera_zones', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 20 }),
  // Coverage stats
  totalCameras: int('total_cameras').default(0),
  onlineCameras: int('online_cameras').default(0),
  totalStorageDays: int('total_storage_days'),
  // Map coordinates (for visual coverage)
  mapPoints: text('map_points'),
  mapCenterLat: varchar('map_center_lat', { length: 20 }),
  mapCenterLng: varchar('map_center_lng', { length: 20 }),
  mapZoom: int('map_zoom'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('camera_zones_society_id_idx').on(table.societyId),
])

// ============================================
// NVR / DVR STORAGE SERVERS
// ============================================
export const nvrServers = mysqlTable('nvr_servers', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  type: mysqlEnum('type', ['nvr', 'dvr', 'server']).default('nvr'),
  totalChannels: int('total_channels').default(16),
  usedChannels: int('used_channels').default(0),
  // Storage
  totalStorageGb: int('total_storage_gb'),
  usedStorageGb: int('used_storage_gb'),
  raidConfig: varchar('raid_config', { length: 50 }),
  estimatedDays: int('estimated_days'),
  // Network
  ipAddress: varchar('ip_address', { length: 45 }),
  port: int('port'),
  username: varchar('username', { length: 100 }),
  accessUrl: varchar('access_url', { length: 500 }),
  // Status
  status: mysqlEnum('status', ['online', 'offline', 'maintenance']).default('online'),
  lastBackup: datetime('last_backup'),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  // Cost
  purchaseCost: decimal('purchase_cost', { precision: 10, scale: 2 }),
  purchaseDate: datetime('purchase_date'),
  warrantyExpiry: datetime('warranty_expiry'),
  // Images & Docs
  images: text('images'),
  documents: text('documents'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('nvr_servers_society_id_idx').on(table.societyId),
])

// ============================================
// CAMERA SNAPSHOTS / EVENT LOG
// ============================================
export const cameraEvents = mysqlTable('camera_events', {
  id: int('id').primaryKey().autoincrement(),
  cameraId: int('camera_id').notNull().references(() => securityCameras.id),
  eventType: varchar('event_type', { length: 50 }),
  description: varchar('description', { length: 255 }),
  snapshotUrl: varchar('snapshot_url', { length: 500 }),
  timestamp: datetime('timestamp').$defaultFn(() => new Date()),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('camera_events_camera_id_idx').on(table.cameraId),
  index('camera_events_timestamp_idx').on(table.timestamp),
])
