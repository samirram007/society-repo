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
// CHARGE HEADS (Types of charges)
// ============================================
export const chargeHeads = mysqlTable('charge_heads', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  type: mysqlEnum('type', ['maintenance', 'sinking_fund', 'parking', 'water', 'electricity', 'penalty', 'other']).notNull(),
  calculationType: mysqlEnum('calculation_type', ['fixed', 'per_sqft', 'percentage']).default('fixed'),
  defaultAmount: decimal('default_amount', { precision: 10, scale: 2 }).default('0'),
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).default('0'),
  isRecurring: boolean('is_recurring').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('charge_heads_society_id_code_uidx').on(table.societyId, table.code),
])

// ============================================
// INVOICES
// ============================================
export const invoices = mysqlTable('invoices', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  memberId: int('member_id').references(() => members.id),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  invoiceDate: datetime('invoice_date').$defaultFn(() => new Date()),
  dueDate: datetime('due_date').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal('gst_amount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'),
  status: mysqlEnum('status', ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']).default('draft'),
  period: varchar('period', { length: 20 }), // e.g., "Aug-2025"
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('invoices_invoice_number_uidx').on(table.invoiceNumber),
  index('invoices_society_id_status_idx').on(table.societyId, table.status),
  index('invoices_flat_id_idx').on(table.flatId),
  index('invoices_member_id_idx').on(table.memberId),
  index('invoices_due_date_idx').on(table.dueDate),
])

// ============================================
// INVOICE LINE ITEMS
// ============================================
export const invoiceItems = mysqlTable('invoice_items', {
  id: int('id').primaryKey().autoincrement(),
  invoiceId: int('invoice_id').notNull().references(() => invoices.id),
  chargeHeadId: int('charge_head_id').notNull().references(() => chargeHeads.id),
  description: varchar('description', { length: 255 }),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).default('1'),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).default('0'),
  gstAmount: decimal('gst_amount', { precision: 12, scale: 2 }).default('0'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('invoice_items_invoice_id_idx').on(table.invoiceId),
])

// ============================================
// CREDIT NOTES
// ============================================
export const creditNotes = mysqlTable('credit_notes', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  flatId: int('flat_id').notNull().references(() => flats.id),
  invoiceId: int('invoice_id').references(() => invoices.id),
  creditNoteNumber: varchar('credit_note_number', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason'),
  status: mysqlEnum('status', ['pending', 'applied', 'cancelled']).default('pending'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('credit_notes_society_id_idx').on(table.societyId),
  index('credit_notes_invoice_id_idx').on(table.invoiceId),
])

// ============================================
// PAYMENTS
// ============================================
export const payments = mysqlTable('payments', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  invoiceId: int('invoice_id').references(() => invoices.id),
  memberId: int('member_id').notNull().references(() => members.id),
  paymentNumber: varchar('payment_number', { length: 50 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'upi', 'bank_transfer', 'cheque', 'online', 'card', 'foreign_card']).notNull(),
  transactionId: varchar('transaction_id', { length: 200 }),
  paymentDate: datetime('payment_date').$defaultFn(() => new Date()),
  status: mysqlEnum('status', ['pending', 'completed', 'failed', 'refunded']).default('pending'),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('payments_society_id_status_idx').on(table.societyId, table.status),
  index('payments_invoice_id_idx').on(table.invoiceId),
  index('payments_member_id_idx').on(table.memberId),
  index('payments_payment_date_idx').on(table.paymentDate),
])

// ============================================
// BANK ACCOUNTS
// ============================================
export const bankAccounts = mysqlTable('bank_accounts', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }),
  ifscCode: varchar('ifsc_code', { length: 20 }),
  branch: varchar('branch', { length: 255 }),
  accountType: mysqlEnum('account_type', ['savings', 'current', 'fixed_deposit']).default('savings'),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
})

// ============================================
// LEDGER ENTRIES (General Ledger)
// ============================================
export const ledgerEntries = mysqlTable('ledger_entries', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  accountHeadId: int('account_head_id').references(() => accountHeads.id),
  type: mysqlEnum('type', ['debit', 'credit']).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: varchar('description', { length: 255 }),
  referenceType: varchar('reference_type', { length: 50 }), // invoice, payment, expense
  referenceId: int('reference_id'),
  transactionDate: datetime('transaction_date').$defaultFn(() => new Date()),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('ledger_entries_society_id_idx').on(table.societyId),
  index('ledger_entries_account_head_id_idx').on(table.accountHeadId),
  index('ledger_entries_transaction_date_idx').on(table.transactionDate),
])

// ============================================
// ACCOUNT HEADS (Chart of Accounts)
// ============================================
export const accountHeads = mysqlTable('account_heads', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  type: mysqlEnum('type', ['asset', 'liability', 'income', 'expense']).notNull(),
  parent_id: int('parent_id').references((): any => accountHeads.id),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('account_heads_society_id_code_uidx').on(table.societyId, table.code),
])

// ============================================
// VENDORS (defined before expenses to avoid circular ref)
// ============================================
export const vendors = mysqlTable('vendors', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  gstNumber: varchar('gst_number', { length: 20 }),
  panNumber: varchar('pan_number', { length: 20 }),
  bankName: varchar('bank_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 50 }),
  ifscCode: varchar('ifsc_code', { length: 20 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('vendors_society_id_idx').on(table.societyId),
])

// ============================================
// EXPENSES
// ============================================
export const expenses = mysqlTable('expenses', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  category: mysqlEnum('category', ['maintenance', 'electricity', 'water', 'security', 'cleaning', 'gardening', 'repairs', 'insurance', 'salary', 'other']).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal('gst_amount', { precision: 12, scale: 2 }).default('0'),
  tdsAmount: decimal('tds_amount', { precision: 12, scale: 2 }).default('0'),
  vendorId: int('vendor_id').references(() => vendors.id),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  expenseDate: datetime('expense_date').$defaultFn(() => new Date()),
  approvedBy: int('approved_by').references(() => users.id),
  status: mysqlEnum('status', ['pending', 'approved', 'paid', 'rejected']).default('pending'),
  receiptImage: text('receipt_image'),
  documents: text('documents'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('expenses_society_id_status_idx').on(table.societyId, table.status),
  index('expenses_vendor_id_idx').on(table.vendorId),
  index('expenses_expense_date_idx').on(table.expenseDate),
])

// ============================================
// BUDGET
// ============================================
export const budgets = mysqlTable('budgets', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  category: varchar('category', { length: 100 }).notNull(),
  period: varchar('period', { length: 20 }), // e.g., "2025-Q1"
  plannedAmount: decimal('planned_amount', { precision: 12, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 12, scale: 2 }).default('0'),
  variance: decimal('variance', { precision: 12, scale: 2 }).default('0'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('budgets_society_id_idx').on(table.societyId),
])

// ============================================
// SECURITY DEPOSITS
// ============================================
export const securityDeposits = mysqlTable('security_deposits', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  memberId: int('member_id').notNull().references(() => members.id),
  type: mysqlEnum('type', ['move_in', 'amenity', 'parking', 'other']).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['held', 'returned', 'partially_returned']).default('held'),
  returnAmount: decimal('return_amount', { precision: 12, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('security_deposits_society_id_idx').on(table.societyId),
  index('security_deposits_member_id_idx').on(table.memberId),
])

// ============================================
// ADVANCE PAYMENTS
// ============================================
export const advancePayments = mysqlTable('advance_payments', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  memberId: int('member_id').notNull().references(() => members.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  usedAmount: decimal('used_amount', { precision: 12, scale: 2 }).default('0'),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 50 }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('advance_payments_society_id_idx').on(table.societyId),
  index('advance_payments_member_id_idx').on(table.memberId),
])

// ============================================
// FIXED DEPOSITS
// ============================================
export const fixedDeposits = mysqlTable('fixed_deposits', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }),
  startDate: datetime('start_date').notNull(),
  maturityDate: datetime('maturity_date').notNull(),
  status: mysqlEnum('status', ['active', 'matured', 'closed']).default('active'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('fixed_deposits_society_id_idx').on(table.societyId),
])

// ============================================
// PAYMENT RECEIPTS
// ============================================
export const paymentReceipts = mysqlTable('payment_receipts', {
  id: int('id').primaryKey().autoincrement(),
  paymentId: int('payment_id').notNull().references(() => payments.id),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  receiptDate: datetime('receipt_date').$defaultFn(() => new Date()),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  generatedBy: int('generated_by').references(() => users.id),
  sentAt: datetime('sent_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('payment_receipts_payment_id_idx').on(table.paymentId),
])

// ============================================
// JOURNAL VOUCHERS
// ============================================
export const journalVouchers = mysqlTable('journal_vouchers', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  voucherNumber: varchar('voucher_number', { length: 50 }).notNull(),
  date: datetime('date').notNull(),
  type: mysqlEnum('type', ['journal', 'receipt', 'payment', 'contra', 'adjustment']).notNull(),
  narration: text('narration'),
  debitAccountHeadId: int('debit_account_head_id').references(() => accountHeads.id),
  creditAccountHeadId: int('credit_account_head_id').references(() => accountHeads.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: int('reference_id'),
  approvedBy: int('approved_by').references(() => users.id),
  status: mysqlEnum('status', ['draft', 'approved', 'posted', 'cancelled']).default('draft'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('journal_vouchers_society_id_status_idx').on(table.societyId, table.status),
  index('journal_vouchers_date_idx').on(table.date),
])

// ============================================
// RECURRING EXPENSES
// ============================================
export const recurringExpenses = mysqlTable('recurring_expenses', {
  id: int('id').primaryKey().autoincrement(),
  societyId: int('society_id').notNull().references(() => societies.id),
  vendorId: int('vendor_id').references(() => vendors.id),
  category: varchar('category', { length: 100 }),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  frequency: mysqlEnum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).notNull(),
  nextDueDate: datetime('next_due_date').notNull(),
  lastPaidDate: datetime('last_paid_date'),
  totalPaid: int('total_paid').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (table) => [
  index('recurring_expenses_society_id_idx').on(table.societyId),
  index('recurring_expenses_next_due_date_idx').on(table.nextDueDate),
])
