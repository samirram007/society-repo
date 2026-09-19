import { useState, useEffect } from 'react'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  IndianRupee,
  Plus,
  Search,
  Loader2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Download,
  Eye,
  Receipt,
  Edit,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FlatPicker } from '@/components/flat-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { orpc } from '@/server/client'

// ============================================
// TYPES
// ============================================
interface Invoice {
  id: number
  societyId: number
  flatId: number
  memberId?: number
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  subtotal: number
  gstAmount: number
  totalAmount: number
  paidAmount: number
  status: string
  period?: string
  notes?: string
}

interface DuesSummary {
  totalExpected: number
  collected: number
  pending: number
  overdue: number
}

// ============================================
// CONSTANTS
// ============================================
const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  paid: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2, label: 'Paid' },
  pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Clock, label: 'Pending' },
  sent: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Receipt, label: 'Sent' },
  overdue: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle, label: 'Overdue' },
  partial: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: TrendingUp, label: 'Partial' },
  draft: { color: 'bg-muted text-muted-foreground', icon: Clock, label: 'Draft' },
  cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: X, label: 'Cancelled' },
}

const statusOptions = ['draft', 'pending', 'sent', 'partial', 'paid', 'overdue', 'cancelled']

const paymentMethods = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online' },
  { value: 'card', label: 'Credit/Debit Card' },
]

// ============================================
// MAIN COMPONENT
// ============================================
export function DuesPage() {
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<DuesSummary>({ totalExpected: 0, collected: 0, pending: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'upi',
    transactionId: '',
    notes: '',
  })
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    flatId: '',
    invoiceNumber: '',
    dueDate: '',
    period: '',
    totalAmount: '',
    status: 'pending',
    notes: '',
  })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Fetch data
  const fetchData = async () => {
    try {
      const [invoicesData, summaryData] = await Promise.all([
        orpc.invoices.list({}),
        orpc.invoices.summary(),
      ])
      setInvoices(invoicesData || [])
      setSummary(summaryData || { totalExpected: 0, collected: 0, pending: 0, overdue: 0 })
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.period?.toLowerCase().includes(search.toLowerCase()) ||
      inv.flatId?.toString().includes(search)
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    const matchesPeriod = periodFilter === 'all' || inv.period === periodFilter
    return matchesSearch && matchesStatus && matchesPeriod
  })

  // Get unique periods
  const periods = [...new Set(invoices.map((i) => i.period).filter(Boolean))]

  // Open payment dialog
  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount)
    setPaymentForm({
      amount: outstanding.toString(),
      method: 'upi',
      transactionId: '',
      notes: '',
    })
    setPaymentDialogOpen(true)
  }

  // Open view dialog
  const handleViewClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setViewDialogOpen(true)
  }

  // Open edit dialog
  const handleEditClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setEditForm({
      flatId: invoice.flatId?.toString() || '',
      invoiceNumber: invoice.invoiceNumber || '',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      period: invoice.period || '',
      totalAmount: invoice.totalAmount?.toString() || '',
      status: invoice.status || 'pending',
      notes: invoice.notes || '',
    })
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDeleteDialogOpen(true)
  }

  // Submit payment
  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return
    setPaymentSubmitting(true)
    try {
      await orpc.invoices.update({
        id: selectedInvoice.id,
        data: {
          paidAmount: Number(selectedInvoice.paidAmount) + Number(paymentForm.amount),
          status: Number(selectedInvoice.paidAmount) + Number(paymentForm.amount) >= Number(selectedInvoice.totalAmount) ? 'paid' : 'partial',
        },
      })
      setPaymentDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to record payment:', error)
    } finally {
      setPaymentSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!selectedInvoice) return
    setEditSubmitting(true)
    try {
      await orpc.invoices.update({
        id: selectedInvoice.id,
        data: {
          flatId: Number(editForm.flatId),
          invoiceNumber: editForm.invoiceNumber,
          dueDate: new Date(editForm.dueDate),
          period: editForm.period || undefined,
          totalAmount: Number(editForm.totalAmount),
          subtotal: Number(editForm.totalAmount),
          status: editForm.status,
          notes: editForm.notes || undefined,
        },
      })
      setEditDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to update invoice:', error)
    } finally {
      setEditSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedInvoice) return
    setDeleteSubmitting(true)
    try {
      await orpc.invoices.delete({ id: selectedInvoice.id })
      setDeleteDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Table columns
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: 'flatId',
      header: 'Flat',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.flatId}</span>
      ),
    },
    {
      accessorKey: 'period',
      header: 'Period',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.period || '-'}</span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium">₹{Number(row.original.totalAmount).toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid',
      cell: ({ row }) => (
        <span className={Number(row.original.paidAmount) > 0 ? 'text-green-600' : 'text-muted-foreground'}>
          ₹{Number(row.original.paidAmount).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = statusConfig[row.original.status] || statusConfig.pending
        const StatusIcon = status.icon
        return (
          <Badge className={`${status.color} border-0`}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.dueDate).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const invoice = row.original
        const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount)
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleViewClick(invoice)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {outstanding > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-green-600 hover:text-green-700"
                onClick={() => handlePayClick(invoice)}
              >
                <CreditCard className="mr-1 h-4 w-4" />
                Pay
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEditClick(invoice)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => handleDeleteClick(invoice)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useTable({
    data: filteredInvoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  // Collection percentage
  const collectionRate = summary.totalExpected > 0
    ? Math.round((summary.collected / summary.totalExpected) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dues & Payments</h1>
          <p className="text-muted-foreground">
            Track maintenance dues and payment history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setGenerateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Dues
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expected</p>
                <p className="text-3xl font-bold">
                  ₹{summary.totalExpected.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <IndianRupee className="h-7 w-7 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Collection Rate</span>
                <span className="font-medium">{collectionRate}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{summary.collected.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  ₹{summary.pending.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{summary.overdue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, flat, or period..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setSearch('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p} value={p!}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <IndianRupee className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No invoices found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    filteredInvoices.length
                  )}{' '}
                  of {filteredInvoices.length} invoices
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================================
          PAYMENT DIALOG
          ============================================ */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for Invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Invoice Summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Flat</span>
                <span className="font-medium">{selectedInvoice?.flatId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">
                  ₹{Number(selectedInvoice?.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="font-medium text-green-600">
                  ₹{Number(selectedInvoice?.paidAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Outstanding</span>
                <span className="text-red-600">
                  ₹{(Number(selectedInvoice?.totalAmount || 0) - Number(selectedInvoice?.paidAmount || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-2">
              <Label>Payment Amount *</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={paymentForm.method}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                placeholder="Enter transaction reference"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={paymentSubmitting || !paymentForm.amount}
            >
              {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          EDIT INVOICE DIALOG
          ============================================ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Update invoice details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input
                  value={editForm.invoiceNumber}
                  onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                  placeholder="e.g. INV-001"
                />
              </div>
              <FlatPicker
                label="Flat *"
                value={editForm.flatId}
                onChange={(v) => setEditForm({ ...editForm, flatId: v })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Input
                  value={editForm.period}
                  onChange={(e) => setEditForm({ ...editForm, period: e.target.value })}
                  placeholder="e.g. Aug-2025"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Amount (₹) *</Label>
                <Input
                  type="number"
                  value={editForm.totalAmount}
                  onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={editSubmitting || !editForm.invoiceNumber || !editForm.totalAmount}>
              {editSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          VIEW INVOICE DIALOG
          ============================================ */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-mono font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium">{selectedInvoice.period || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flat</p>
                  <p className="font-medium">{selectedInvoice.flatId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${statusConfig[selectedInvoice.status]?.color} border-0`}>
                    {statusConfig[selectedInvoice.status]?.label}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(selectedInvoice.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>₹{Number(selectedInvoice.gstAmount).toLocaleString('en-IN')}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>₹{Number(selectedInvoice.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-green-600">
                  <span>Paid</span>
                  <span>₹{Number(selectedInvoice.paidAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-red-600 font-semibold">
                  <span>Outstanding</span>
                  <span>
                    ₹{(Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Invoice Date</p>
                  <p>{new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p>{new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedInvoice && Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount) > 0 && (
              <Button onClick={() => {
                setViewDialogOpen(false)
                handlePayClick(selectedInvoice)
              }}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE INVOICE DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice <strong>{selectedInvoice?.invoiceNumber}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={deleteSubmitting}>
              {deleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          GENERATE DUES DIALOG
          ============================================ */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Generate Monthly Dues</DialogTitle>
            <DialogDescription>
              Generate invoices for all flats for the selected period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select defaultValue="Sep-2025">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sep-2025">September 2025</SelectItem>
                  <SelectItem value="Oct-2025">October 2025</SelectItem>
                  <SelectItem value="Nov-2025">November 2025</SelectItem>
                  <SelectItem value="Dec-2025">December 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p>This will generate invoices for all active flats based on their maintenance amount.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setGenerateDialogOpen(false)}>
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
