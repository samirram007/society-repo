import { useState, useEffect } from 'react'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  Receipt,
  Plus,
  Search,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Edit,
  Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { VendorPicker } from '@/components/vendor-picker'
import { orpc } from '@/server/client'
import { ImageUploadZone, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'
import { FileText } from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface Expense {
  id: number
  societyId: number
  category: string
  description: string
  amount: number
  gstAmount?: number
  tdsAmount?: number
  vendorId?: number
  vendor?: string
  expenseDate: string
  approvedBy?: number
  status: string
}

interface ExpensesSummary {
  totalExpenses: number
  paid: number
  pending: number
  budget: number
}

// ============================================
// CONSTANTS
// ============================================
const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  paid: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle2, label: 'Paid' },
  approved: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: TrendingUp, label: 'Approved' },
  pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Clock, label: 'Pending' },
  rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle, label: 'Rejected' },
}

const categories = [
  'maintenance', 'electricity', 'water', 'security', 'cleaning',
  'gardening', 'repairs', 'insurance', 'salary', 'other',
]

// ============================================
// MAIN COMPONENT
// ============================================
export function ExpensesPage() {
  // State
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpensesSummary>({ totalExpenses: 0, paid: 0, pending: 0, budget: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    category: 'maintenance',
    description: '',
    amount: '',
    vendor: '',
  })
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [expenseDocuments, setExpenseDocuments] = useState<UploadedDocument[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch data
  const fetchData = async () => {
    try {
      const [expensesData, summaryData] = await Promise.all([
        orpc.expenses.list({}),
        orpc.expenses.summary(),
      ])
      setExpenses(expensesData || [])
      setSummary(summaryData || { totalExpenses: 0, paid: 0, pending: 0, budget: 0 })
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description?.toLowerCase().includes(search.toLowerCase()) ||
      expense.category?.toLowerCase().includes(search.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.amount || Number(formData.amount) <= 0) errors.amount = 'Valid amount is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({ category: 'maintenance', description: '', amount: '', vendor: '' })
    setFormErrors({})
  }

  // Open create dialog
  const handleCreate = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setFormData({
      category: expense.category || 'maintenance',
      description: expense.description || '',
      amount: String(expense.amount || ''),
      vendor: expense.vendor || '',
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense)
    setDeleteDialogOpen(true)
  }

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.expenses.create({
        societyId: 1,
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        expenseDate: new Date(),
        receiptImage: receiptImage || undefined,
        documents: expenseDocuments.length > 0 ? JSON.stringify(expenseDocuments) : undefined,
        status: 'pending',
      })
      setCreateDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to create expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedExpense) return
    setSubmitting(true)
    try {
      await orpc.expenses.update({
        id: selectedExpense.id,
        data: {
          category: formData.category,
          description: formData.description,
          amount: Number(formData.amount),
          receiptImage: receiptImage || null,
          documents: expenseDocuments.length > 0 ? JSON.stringify(expenseDocuments) : null,
        },
      })
      setEditDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to update expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedExpense) return
    setSubmitting(true)
    try {
      await orpc.expenses.delete({ id: selectedExpense.id })
      setDeleteDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to delete expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Approve expense
  const handleApprove = async (id: number) => {
    try {
      await orpc.expenses.approve({ id, approvedBy: 1 })
      fetchData()
    } catch (error) {
      console.error('Failed to approve expense:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.description}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium">₹{Number(row.original.amount).toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.vendor || '-'}</span>
      ),
    },
    {
      accessorKey: 'expenseDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.expenseDate).toLocaleDateString('en-IN')}
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
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const expense = row.original
        return (
          <div className="flex items-center gap-1">
            {expense.status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-green-600 hover:text-green-700"
                onClick={() => handleApprove(expense.id)}
              >
                Approve
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(expense)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => handleDeleteClick(expense)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useTable({
    data: filteredExpenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  // Budget utilization
  const budgetUtilization = summary.budget > 0
    ? Math.round((summary.paid / summary.budget) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and approve society expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{(summary.paid || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">₹{(summary.pending || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Used</p>
                <p className="text-2xl font-bold">{budgetUtilization}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                />
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
                placeholder="Search by description, category, or vendor..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                          <Receipt className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No expenses found</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                          </Button>
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
                    filteredExpenses.length
                  )}{' '}
                  of {filteredExpenses.length} expenses
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
          CREATE/EDIT EXPENSE DIALOG
          ============================================ */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen
                ? 'Update expense details below.'
                : 'Fill in the details to add a new expense.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter expense description"
                className={formErrors.description ? 'border-destructive' : ''}
              />
              {formErrors.description && (
                <p className="text-xs text-destructive">{formErrors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  min="0"
                  className={formErrors.amount ? 'border-destructive' : ''}
                />
                {formErrors.amount && (
                  <p className="text-xs text-destructive">{formErrors.amount}</p>
                )}
              </div>
              <VendorPicker
                label="Vendor"
                value={formData.vendor}
                onChange={(v) => setFormData({ ...formData, vendor: v })}
              />
            </div>
            <ImageUploadZone
              label="Receipt/Bill Photo"
              icon={FileText}
              image={receiptImage}
              onUpload={setReceiptImage}
              onRemove={() => setReceiptImage(null)}
              hint="Upload receipt or bill image"
            />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supporting Documents</Label>
              <DocumentUploader
                documents={expenseDocuments}
                onAdd={(doc) => setExpenseDocuments([...expenseDocuments, doc])}
                onRemove={(idx) => setExpenseDocuments(expenseDocuments.filter((_, i) => i !== idx))}
                onView={(doc) => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false)
              setEditDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={editDialogOpen ? handleEditSubmit : handleCreateSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialogOpen ? 'Update Expense' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE EXPENSE DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />
    </div>
  )
}
