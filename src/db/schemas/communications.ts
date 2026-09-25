import {
  mysqlTable,
  varchar,
  int,
  text,
  datetime,
  boolean,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core'
import { societies } from './cluster'
import { flats } from './property'
import { members, users } from './users'

// ============================================
// NOTICES
// ============================================
export const notices = mysqlTable('notices', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  postedBy: int('posted_by').notNull().references(() => users.id),
  category: mysqlEnum('category', ['general', 'holiday', 'maintenance', 'event', 'security', 'rule']).default('general'),
  priority: mysqlEnum('priority', ['low', 'medium', 'high']).default('medium'),
  targetAudience: mysqlEnum('target_audience', ['all', 'owners', 'tenants', 'committee', 'specific_tower']).default('all'),
  targetTowers: text('target_towers'), // JSON array of tower IDs
  targetFlats: text('target_flats'), // JSON array of flat IDs
  isPinned: boolean('is_pinned').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('notices_society_id_active_idx').on(table.societyId, table.isActive),
  index('notices_posted_by_idx').on(table.postedBy),
])

// ============================================
// NOTICE COMMENTS
// ============================================
export const noticeComments = mysqlTable('notice_comments', {
  id: int('id').primaryKey().autoincrement(),
  noticeId: int('notice_id').notNull().references(() => notices.id, { onDelete: 'cascade' }),
  userId: int('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('notice_comments_notice_id_idx').on(table.noticeId),
  index('notice_comments_user_id_idx').on(table.userId),
])

// ============================================
// MEETINGS
// ============================================
export const meetings = mysqlTable('meetings', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  meetingDate: datetime('meeting_date').notNull(),
  location: varchar('location', { length: 255 }),
  organizedBy: int('organized_by').notNull().references(() => users.id),
  status: mysqlEnum('status', ['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled'),
  minutes: text('minutes'),
  attachments: text('attachments'), // JSON array of file URLs
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('meetings_society_id_idx').on(table.societyId),
  index('meetings_meeting_date_idx').on(table.meetingDate),
])

// ============================================
// MEETING ATTENDEES
// ============================================
export const meetingAttendees = mysqlTable('meeting_attendees', {
  id: int('id').primaryKey().autoincrement(),
  meetingId: int('meeting_id').notNull().references(() => meetings.id),
  memberId: int('member_id').notNull().references(() => members.id),
  status: mysqlEnum('status', ['invited', 'accepted', 'declined', 'attended']).default('invited'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('meeting_attendees_meeting_id_idx').on(table.meetingId),
  index('meeting_attendees_member_id_idx').on(table.memberId),
])

// ============================================
// DOCUMENT FOLDERS
// ============================================
export const documentFolders = mysqlTable('document_folders', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: int('parent_id').references((): any => documentFolders.id),
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('folder'),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('document_folders_society_id_idx').on(table.societyId),
  index('document_folders_parent_id_idx').on(table.parentId),
])

// ============================================
// DOCUMENTS
// ============================================
export const documents = mysqlTable('documents', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: mysqlEnum('category', ['personal', 'society', 'management', 'financial', 'legal', 'other']).notNull(),
  folderId: int('folder_id').references(() => documentFolders.id),
  flatId: int('flat_id').references(() => flats.id),
  memberId: int('member_id').references(() => members.id),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: int('file_size'),
  fileData: text('file_data'),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  tags: varchar('tags', { length: 500 }),
  version: int('version').default(1),
  uploadedBy: int('uploaded_by').notNull().references(() => users.id),
  lastAccessedAt: datetime('last_accessed_at'),
  downloadCount: int('download_count').default(0),
  isStarred: boolean('is_starred').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  index('documents_society_id_category_idx').on(table.societyId, table.category),
  index('documents_folder_id_idx').on(table.folderId),
  index('documents_member_id_idx').on(table.memberId),
  index('documents_uploaded_by_idx').on(table.uploadedBy),
])

// ============================================
// POLLS
// ============================================
export const polls = mysqlTable('polls', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: mysqlEnum('type', ['opinion', 'secret', 'election']).default('opinion'),
  options: text('options'), // JSON array of options
  startDate: datetime('start_date').$defaultFn(() => new Date()),
  endDate: datetime('end_date'),
  status: mysqlEnum('status', ['active', 'closed', 'cancelled']).default('active'),
  createdBy: int('created_by').notNull().references(() => users.id),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('polls_society_id_status_idx').on(table.societyId, table.status),
])

// ============================================
// POLL VOTES
// ============================================
export const pollVotes = mysqlTable('poll_votes', {
  id: int('id').primaryKey().autoincrement(),
  pollId: int('poll_id').notNull().references(() => polls.id),
  memberId: int('member_id').notNull().references(() => members.id),
  selectedOption: varchar('selected_option', { length: 255 }),
  votedAt: datetime('voted_at').$defaultFn(() => new Date()),
}, (table) => [
  index('poll_votes_poll_id_idx').on(table.pollId),
  index('poll_votes_member_id_idx').on(table.memberId),
])

// ============================================
// SURVEYS
// ============================================
export const surveys = mysqlTable('surveys', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  questions: text('questions'), // JSON array of questions
  startDate: datetime('start_date').$defaultFn(() => new Date()),
  endDate: datetime('end_date'),
  status: mysqlEnum('status', ['active', 'closed', 'cancelled']).default('active'),
  createdBy: int('created_by').notNull().references(() => users.id),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('surveys_society_id_idx').on(table.societyId),
])

// ============================================
// SURVEY RESPONSES
// ============================================
export const surveyResponses = mysqlTable('survey_responses', {
  id: int('id').primaryKey().autoincrement(),
  surveyId: int('survey_id').notNull().references(() => surveys.id),
  memberId: int('member_id').notNull().references(() => members.id),
  responses: text('responses'), // JSON object of question-answer pairs
  submittedAt: datetime('submitted_at').$defaultFn(() => new Date()),
}, (table) => [
  index('survey_responses_survey_id_idx').on(table.surveyId),
  index('survey_responses_member_id_idx').on(table.memberId),
])

// ============================================
// TASKS
// ============================================
export const tasks = mysqlTable('tasks', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assignedTo: int('assigned_to').references(() => users.id),
  assignedBy: int('assigned_by').references(() => users.id),
  priority: mysqlEnum('priority', ['low', 'medium', 'high']).default('medium'),
  status: mysqlEnum('status', ['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  dueDate: datetime('due_date'),
  completedAt: datetime('completed_at'),
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: varchar('recurring_pattern', { length: 50 }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('tasks_society_id_status_idx').on(table.societyId, table.status),
  index('tasks_assigned_to_idx').on(table.assignedTo),
])

// ============================================
// EMAIL CAMPAIGNS
// ============================================
export const emailCampaigns = mysqlTable('email_campaigns', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  subject: varchar('subject', { length: 255 }).notNull(),
  content: text('content').notNull(),
  targetAudience: mysqlEnum('target_audience', ['all', 'owners', 'tenants', 'committee']).default('all'),
  sentBy: int('sent_by').notNull().references(() => users.id),
  sentAt: datetime('sent_at'),
  totalSent: int('total_sent').default(0),
  totalOpened: int('total_opened').default(0),
  status: mysqlEnum('status', ['draft', 'sent', 'failed']).default('draft'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// NOTIFICATION LOGS
// ============================================
export const notificationLogs = mysqlTable('notification_logs', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  recipientId: int('recipient_id').references(() => users.id),
  type: mysqlEnum('type', ['email', 'sms', 'push', 'in_app']).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  status: mysqlEnum('status', ['pending', 'sent', 'delivered', 'failed']).default('pending'),
  sentAt: datetime('sent_at'),
  deliveredAt: datetime('delivered_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('notification_logs_society_id_type_idx').on(table.societyId, table.type),
  index('notification_logs_recipient_id_idx').on(table.recipientId),
])
