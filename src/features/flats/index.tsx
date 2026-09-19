import { useState, useEffect } from 'react'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  Home,
  Plus,
  Search,
  Loader2,
  Building2,
  MapPin,
  IndianRupee,
  Edit,
  Trash2,
  X,
  Download,
  CreditCard,
  Receipt,
  AlertCircle,
  FileText,
  Phone,
  MessageSquare,
  MoreHorizontal,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { orpc } from '@/server/client'
import { ImageGallery, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'
import { Paperclip } from 'lucide-react'
import type { Flat } from '@/interfaces'

// ============================================
// CONSTANTS
// ============================================
const typeColors: Record<string, string> = {
  '1BHK': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  '2BHK': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  '3BHK': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  '4BHK': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  penthouse: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  villa: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  shop: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  office: 'bg-muted text-muted-foreground',
}

const flatTypes = ['1BHK', '2BHK', '3BHK', '4BHK', 'penthouse', 'villa', 'shop', 'office']

// ============================================
// FINANCIAL SUMMARY TYPE
// ============================================
interface FlatFinancialSummary {
  totalInvoiced: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  lastPaymentDate?: string
  lastPaymentAmount?: number
  recentInvoices: Array<{
    id: number
    invoiceNumber: string
    totalAmount: number
    paidAmount: number
    status: string
    period?: string
    createdAt: string
  }>
}

// ============================================
// MAIN COMPONENT
// ============================================
export function FlatsPage() {
  // State
  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailTab, setDetailTab] = useState('overview')

  // Financial data
  const [financialSummary, setFinancialSummary] = useState<FlatFinancialSummary | null>(null)
  const [financialLoading, setFinancialLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    flatNumber: '',
    wing: '',
    floor: '1',
    type: '1BHK',
    maintenanceAmount: '3000',
    area: '',
    isOccupied: true,
  })
  const [flatImages, setFlatImages] = useState<string[]>([])
  const [flatDocuments, setFlatDocuments] = useState<UploadedDocument[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch flats
  const fetchFlats = async () => {
    try {
      const data = await orpc.flats.list({})
      setFlats(data || [])
    } catch (error) {
      console.error('Failed to fetch flats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlats()
  }, [])

  // Fetch financial summary for a flat
  const fetchFinancialSummary = async (flatId: number) => {
    setFinancialLoading(true)
    try {
      // Get invoices for this flat
      const invoices = await orpc.invoices.list({ flatId } as any)
      
      // Calculate summary
      const totalInvoiced = invoices?.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0) || 0
      const totalPaid = invoices?.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0) || 0
      const totalPending = invoices?.filter((inv: any) => ['sent', 'partial'].includes(inv.status))
        .reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0) || 0
      const totalOverdue = invoices?.filter((inv: any) => inv.status === 'overdue')
        .reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0) || 0
      
      // Get last payment
      const recentInvoices = invoices?.slice(0, 5).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        status: inv.status,
        period: inv.period,
        createdAt: inv.createdAt,
      })) || []

      setFinancialSummary({
        totalInvoiced,
        totalPaid,
        totalPending,
        totalOverdue,
        lastPaymentDate: recentInvoices[0]?.createdAt,
        lastPaymentAmount: recentInvoices[0]?.paidAmount,
        recentInvoices,
      })
    } catch (error) {
      console.error('Failed to fetch financial summary:', error)
      setFinancialSummary(null)
    } finally {
      setFinancialLoading(false)
    }
  }

  // Filter flats
  const filteredFlats = flats.filter((flat) => {
    const matchesSearch =
      flat.flatNumber?.toLowerCase().includes(search.toLowerCase()) ||
      flat.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      flat.tenantName?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || flat.type === typeFilter
    return matchesSearch && matchesType
  })

  // Stats
  const totalFlats = flats.length
  const occupiedFlats = flats.filter((f) => f.isOccupied).length
  const vacantFlats = totalFlats - occupiedFlats
  const totalMaintenance = flats.reduce((sum, f) => sum + Number(f.maintenanceAmount || 0), 0)

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.flatNumber.trim()) errors.flatNumber = 'Flat number is required'
    if (!formData.floor) errors.floor = 'Floor is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({ flatNumber: '', wing: '', floor: '1', type: '1BHK', maintenanceAmount: '3000', area: '', isOccupied: true })
    setFormErrors({})
  }

  // Open create dialog
  const handleCreate = () => {
    resetForm()
    setCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (flat: Flat) => {
    setSelectedFlat(flat)
    setFormData({
      flatNumber: flat.flatNumber || '',
      wing: flat.wing || '',
      floor: String(flat.floor || 1),
      type: flat.type || '1BHK',
      maintenanceAmount: String(flat.maintenanceAmount || 3000),
      area: flat.area?.toString() || '',
      isOccupied: flat.isOccupied ?? true,
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open flat detail dialog with financial info
  const handleViewDetail = (flat: Flat) => {
    setSelectedFlat(flat)
    setDetailTab('overview')
    setDetailDialogOpen(true)
    fetchFinancialSummary(flat.id)
  }

  // Open delete dialog
  const handleDeleteClick = (flat: Flat) => {
    setSelectedFlat(flat)
    setDeleteDialogOpen(true)
  }

  // Quick action handlers
  const handleQuickAction = (action: string, flat: Flat) => {
    switch (action) {
      case 'createInvoice':
        // TODO: Open create invoice dialog for this flat
        alert(`Create invoice for Flat ${flat.flatNumber}`)
        break
      case 'recordPayment':
        // TODO: Open record payment dialog
        alert(`Record payment for Flat ${flat.flatNumber}`)
        break
      case 'viewStatement':
        handleViewDetail(flat)
        setDetailTab('financial')
        break
      case 'sendNotice':
        // TODO: Open send notice dialog targeting this flat
        alert(`Send notice to Flat ${flat.flatNumber}`)
        break
      case 'contactOwner':
        // TODO: Open contact dialog
        alert(`Contact owner of Flat ${flat.flatNumber}`)
        break
    }
  }

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.flats.create({
        societyId: 1,
        flatNumber: formData.flatNumber,
        wing: formData.wing || undefined,
        floor: Number(formData.floor),
        type: formData.type as any,
        maintenanceAmount: Number(formData.maintenanceAmount),
        area: formData.area ? Number(formData.area) : undefined,
        images: flatImages.length > 0 ? JSON.stringify(flatImages) : undefined,
        documents: flatDocuments.length > 0 ? JSON.stringify(flatDocuments) : undefined,
      })
      setCreateDialogOpen(false)
      fetchFlats()
    } catch (error) {
      console.error('Failed to create flat:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedFlat) return
    setSubmitting(true)
    try {
      await orpc.flats.update({
        id: selectedFlat.id,
        data: {
          flatNumber: formData.flatNumber,
          wing: formData.wing || undefined,
          floor: Number(formData.floor),
          type: formData.type,
          maintenanceAmount: Number(formData.maintenanceAmount),
          area: formData.area ? Number(formData.area) : undefined,
          isOccupied: formData.isOccupied,
          images: flatImages.length > 0 ? JSON.stringify(flatImages) : null,
          documents: flatDocuments.length > 0 ? JSON.stringify(flatDocuments) : null,
        },
      })
      setEditDialogOpen(false)
      fetchFlats()
    } catch (error) {
      console.error('Failed to update flat:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedFlat) return
    setSubmitting(true)
    try {
      await orpc.flats.delete({ id: selectedFlat.id })
      setDeleteDialogOpen(false)
      fetchFlats()
    } catch (error) {
      console.error('Failed to delete flat:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Table columns
  const columns: ColumnDef<Flat>[] = [
    {
      accessorKey: 'flatNumber',
      header: 'Flat',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {row.original.flatNumber}
          </div>
          <div>
            <p className="font-medium">Flat {row.original.flatNumber}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.wing ? `Wing ${row.original.wing}, ` : ''}Floor {row.original.floor}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge className={`${typeColors[row.original.type] || ''} border-0`}>
          {row.original.type?.replace('BHK', ' BHK')}
        </Badge>
      ),
    },
    {
      accessorKey: 'area',
      header: 'Area',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.area ? `${row.original.area} sq ft` : '-'}</span>
      ),
    },
    {
      accessorKey: 'maintenanceAmount',
      header: 'Maintenance',
      cell: ({ row }) => (
        <span className="font-medium">₹{Number(row.original.maintenanceAmount || 0).toLocaleString('en-IN')}/mo</span>
      ),
    },
    {
      accessorKey: 'ownerName',
      header: 'Owner',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.ownerName || '-'}</span>
      ),
    },
    {
      accessorKey: 'isOccupied',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isOccupied ? 'default' : 'secondary'}>
          {row.original.isOccupied ? 'Occupied' : 'Vacant'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const flat = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); handleViewDetail(flat) }}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); handleEdit(flat) }}
              title="Edit Flat"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleQuickAction('createInvoice', flat)}>
                  <FileText className="mr-2 h-4 w-4" /> Create Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAction('recordPayment', flat)}>
                  <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAction('viewStatement', flat)}>
                  <Receipt className="mr-2 h-4 w-4" /> View Statement
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleQuickAction('sendNotice', flat)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Send Notice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAction('contactOwner', flat)}>
                  <Phone className="mr-2 h-4 w-4" /> Contact Owner
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteClick(flat)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useTable({
    data: filteredFlats,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flats</h1>
          <p className="text-muted-foreground">Manage all flats in the society</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Flat
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFlats}</p>
                <p className="text-xs text-muted-foreground">Total Flats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{occupiedFlats}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vacantFlats}</p>
                <p className="text-xs text-muted-foreground">Vacant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <IndianRupee className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalMaintenance.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Monthly Maintenance</p>
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
                placeholder="Search by flat number, owner..."
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {flatTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace('BHK', ' BHK')}</SelectItem>
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
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetail(row.original)}
                      >
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
                          <Home className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">No flats found</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Flat
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
                    filteredFlats.length
                  )}{' '}
                  of {filteredFlats.length} flats
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
          FLAT DETAIL DIALOG (with Financial Tab)
          ============================================ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" /> Flat {selectedFlat?.flatNumber}
              {selectedFlat && (
                <Badge className={`${typeColors[selectedFlat.type] || ''} border-0`}>
                  {selectedFlat.type?.replace('BHK', ' BHK')}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedFlat?.wing ? `Wing ${selectedFlat.wing}, ` : ''}Floor {selectedFlat?.floor}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Flat Type</p>
                  <p className="font-medium">{selectedFlat?.type?.replace('BHK', ' BHK')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Floor</p>
                  <p className="font-medium">{selectedFlat?.floor}</p>
                </div>
                {selectedFlat?.area && (
                  <div>
                    <p className="text-muted-foreground">Area</p>
                    <p className="font-medium">{selectedFlat.area} sq ft</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Maintenance</p>
                  <p className="font-medium">₹{Number(selectedFlat?.maintenanceAmount || 0).toLocaleString('en-IN')}/mo</p>
                </div>
                {selectedFlat?.ownerName && (
                  <div>
                    <p className="text-muted-foreground">Owner</p>
                    <p className="font-medium">{selectedFlat.ownerName}</p>
                  </div>
                )}
                {selectedFlat?.tenantName && (
                  <div>
                    <p className="text-muted-foreground">Tenant</p>
                    <p className="font-medium">{selectedFlat.tenantName}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4 mt-4">
              {financialLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : financialSummary ? (
                <>
                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total Invoiced</p>
                            <p className="font-bold">₹{financialSummary.totalInvoiced.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total Paid</p>
                            <p className="font-bold text-green-600">₹{financialSummary.totalPaid.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="font-bold text-amber-600">₹{financialSummary.totalPending.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Overdue</p>
                            <p className="font-bold text-red-600">₹{financialSummary.totalOverdue.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Recent Invoices */}
                  {financialSummary.recentInvoices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recent Invoices</h4>
                      <div className="space-y-2">
                        {financialSummary.recentInvoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                            <div>
                              <p className="font-medium">{invoice.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">{invoice.period || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₹{invoice.totalAmount.toLocaleString('en-IN')}</p>
                              <Badge
                                variant={
                                  invoice.status === 'paid' ? 'default' :
                                  invoice.status === 'overdue' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">No financial data available</p>
              )}
            </TabsContent>
            
            {/* Quick Actions Tab */}
            <TabsContent value="actions" className="space-y-3 mt-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('createInvoice', selectedFlat!)}
              >
                <FileText className="mr-2 h-4 w-4" /> Create New Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('recordPayment', selectedFlat!)}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Record Payment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('viewStatement', selectedFlat!)}
              >
                <Receipt className="mr-2 h-4 w-4" /> View Full Statement
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('sendNotice', selectedFlat!)}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Send Notice to Flat
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('contactOwner', selectedFlat!)}
              >
                <Phone className="mr-2 h-4 w-4" /> Contact Owner
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ============================================
          CREATE/EDIT FLAT DIALOG
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
            <DialogTitle>{editDialogOpen ? 'Edit Flat' : 'Add New Flat'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen
                ? 'Update flat details below.'
                : 'Fill in the details to add a new flat.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flatNumber">Flat Number *</Label>
                <Input
                  id="flatNumber"
                  value={formData.flatNumber}
                  onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                  placeholder="e.g. 101"
                  className={formErrors.flatNumber ? 'border-destructive' : ''}
                />
                {formErrors.flatNumber && (
                  <p className="text-xs text-destructive">{formErrors.flatNumber}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="wing">Wing</Label>
                <Input
                  id="wing"
                  value={formData.wing}
                  onChange={(e) => setFormData({ ...formData, wing: e.target.value })}
                  placeholder="e.g. A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  min="0"
                  className={formErrors.floor ? 'border-destructive' : ''}
                />
                {formErrors.floor && (
                  <p className="text-xs text-destructive">{formErrors.floor}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {flatTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('BHK', ' BHK')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maintenance (₹/mo)</Label>
                <Input
                  type="number"
                  value={formData.maintenanceAmount}
                  onChange={(e) => setFormData({ ...formData, maintenanceAmount: e.target.value })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Area (sq ft)</Label>
                <Input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  min="0"
                  placeholder="Optional"
                />
              </div>
            </div>
            {/* Photos */}
            <ImageGallery
              images={flatImages}
              onAdd={(img) => setFlatImages([...flatImages, img])}
              onRemove={(idx) => setFlatImages(flatImages.filter((_, i) => i !== idx))}
            />
            {/* Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Documents</Label>
              <DocumentUploader
                documents={flatDocuments}
                onAdd={(doc) => setFlatDocuments([...flatDocuments, doc])}
                onRemove={(idx) => setFlatDocuments(flatDocuments.filter((_, i) => i !== idx))}
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
              {editDialogOpen ? 'Update Flat' : 'Add Flat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} src={previewSrc} title={previewTitle} />

      {/* ============================================
          DELETE FLAT DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Flat{' '}
              <strong>{selectedFlat?.flatNumber}</strong>? This action cannot be undone.
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
    </div>
  )
}
