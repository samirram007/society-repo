import { useState, useEffect } from 'react'
import { useLegacyTable as useTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { flexRender } from '@tanstack/react-table'
import {
  Box,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  X,
  Download,
  Package,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Boxes,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { orpc } from '@/server/client'
import { ImageGallery, DocumentUploader, DocumentPreviewDialog, type UploadedDocument } from '@/components/document-uploader'
import { Camera, Paperclip } from 'lucide-react'

// ============================================
// TYPES
// ============================================
interface Asset {
  id: number
  societyId: number
  name: string
  description?: string
  categoryId?: number
  location?: string
  purchaseDate?: string
  purchasePrice?: number
  currentValue?: number
  warrantyExpiry?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  quantity: number
  condition: string
  status: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  isActive: boolean
  createdAt: string
}

interface InventoryItem {
  id: number
  societyId: number
  name: string
  description?: string
  sku?: string
  quantity: number
  minQuantity: number
  unitPrice?: number
  totalValue?: number
  location?: string
  department?: string
  isActive: boolean
  createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  retired: 'bg-muted text-muted-foreground',
  disposed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const conditionColors: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  fair: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  poor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const assetStatuses = ['active', 'maintenance', 'retired', 'disposed']
const conditions = ['excellent', 'good', 'fair', 'poor']

// ============================================
// MAIN COMPONENT
// ============================================
export function AssetsPage() {
  // State
  const [assets, setAssets] = useState<Asset[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tabValue, setTabValue] = useState('assets')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleteType, setDeleteType] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    purchasePrice: '',
    currentValue: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    quantity: '1',
    condition: 'good',
    status: 'active',
    warrantyExpiry: '',
  })
  const [assetImages, setAssetImages] = useState<string[]>([])
  const [assetDocuments, setAssetDocuments] = useState<UploadedDocument[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch data
  const fetchData = async () => {
    try {
      const [assetsData, inventoryData] = await Promise.all([
        orpc.assets.list({}),
        orpc.inventory.list({}),
      ])
      setAssets(assetsData || [])
      setInventory(inventoryData || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter
  const filteredAssets = assets.filter((a) => {
    const s = search.toLowerCase()
    return a.name?.toLowerCase().includes(s) || a.location?.toLowerCase().includes(s) || a.manufacturer?.toLowerCase().includes(s)
  })

  const filteredInventory = inventory.filter((i) => {
    const s = search.toLowerCase()
    return i.name?.toLowerCase().includes(s) || i.sku?.toLowerCase().includes(s) || i.location?.toLowerCase().includes(s)
  })

  // Stats
  const totalAssetValue = assets.reduce((s, a) => s + Number(a.currentValue || a.purchasePrice || 0), 0)
  const activeAssets = assets.filter(a => a.status === 'active').length
  const maintenanceAssets = assets.filter(a => a.status === 'maintenance').length
  const lowStockItems = inventory.filter(i => i.quantity <= i.minQuantity).length

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '', description: '', location: '', purchasePrice: '', currentValue: '',
      manufacturer: '', model: '', serialNumber: '', quantity: '1', condition: 'good',
      status: 'active', warrantyExpiry: '',
    })
    setFormErrors({})
  }

  const handleCreate = () => { resetForm(); setCreateDialogOpen(true) }

  const handleEdit = (item: any, type: string) => {
    setSelectedItem(item)
    setDeleteType(type)
    if (type === 'asset') {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        location: item.location || '',
        purchasePrice: item.purchasePrice?.toString() || '',
        currentValue: item.currentValue?.toString() || '',
        manufacturer: item.manufacturer || '',
        model: item.model || '',
        serialNumber: item.serialNumber || '',
        quantity: item.quantity?.toString() || '1',
        condition: item.condition || 'good',
        status: item.status || 'active',
        warrantyExpiry: item.warrantyExpiry ? new Date(item.warrantyExpiry).toISOString().split('T')[0] : '',
      })
    } else {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        location: item.location || '',
        purchasePrice: item.unitPrice?.toString() || '',
        currentValue: '',
        manufacturer: '',
        model: '',
        serialNumber: item.sku || '',
        quantity: item.quantity?.toString() || '0',
        condition: 'good',
        status: 'active',
        warrantyExpiry: '',
      })
    }
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (item: any, type: string) => {
    setSelectedItem(item)
    setDeleteType(type)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      if (editDialogOpen && selectedItem) {
        if (deleteType === 'asset') {
          await orpc.assets.update({
            id: selectedItem.id,
            data: {
              name: formData.name,
              description: formData.description || undefined,
              location: formData.location || undefined,
              purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
              currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
              manufacturer: formData.manufacturer || undefined,
              model: formData.model || undefined,
              serialNumber: formData.serialNumber || undefined,
              quantity: Number(formData.quantity),
              condition: formData.condition,
              status: formData.status,
              warrantyExpiry: formData.warrantyExpiry || undefined,
              images: assetImages.length > 0 ? JSON.stringify(assetImages) : undefined,
              documents: assetDocuments.length > 0 ? JSON.stringify(assetDocuments) : undefined,
            },
          })
        } else {
          await orpc.inventory.update({
            id: selectedItem.id,
            data: {
              name: formData.name,
              description: formData.description || undefined,
              sku: formData.serialNumber || undefined,
              quantity: Number(formData.quantity),
              unitPrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
              location: formData.location || undefined,
            },
          })
        }
      } else {
        await orpc.assets.create({
          societyId: 1,
          name: formData.name,
          description: formData.description || undefined,
          location: formData.location || undefined,
          purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
          currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
          manufacturer: formData.manufacturer || undefined,
          model: formData.model || undefined,
          serialNumber: formData.serialNumber || undefined,
          quantity: Number(formData.quantity),
          warrantyExpiry: formData.warrantyExpiry || undefined,
          images: assetImages.length > 0 ? JSON.stringify(assetImages) : undefined,
          documents: assetDocuments.length > 0 ? JSON.stringify(assetDocuments) : undefined,
        })
      }
      setCreateDialogOpen(false)
      setEditDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      if (deleteType === 'asset') {
        await orpc.assets.delete({ id: selectedItem.id })
      } else {
        await orpc.inventory.delete({ id: selectedItem.id })
      }
      setDeleteDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Asset table columns
  const assetColumns: ColumnDef<Asset>[] = [
    {
      accessorKey: 'name',
      header: 'Asset',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Box className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.manufacturer} {row.original.model}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => <span className="text-sm">{row.original.location || '-'}</span>,
    },
    {
      accessorKey: 'purchasePrice',
      header: 'Purchase Price',
      cell: ({ row }) => <span className="font-medium">₹{Number(row.original.purchasePrice || 0).toLocaleString('en-IN')}</span>,
    },
    {
      accessorKey: 'currentValue',
      header: 'Current Value',
      cell: ({ row }) => <span className="font-medium">₹{Number(row.original.currentValue || 0).toLocaleString('en-IN')}</span>,
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
      cell: ({ row }) => (
        <Badge className={`${conditionColors[row.original.condition] || ''} border-0`}>
          {row.original.condition?.charAt(0).toUpperCase() + row.original.condition?.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={`${statusColors[row.original.status] || ''} border-0`}>
          {row.original.status?.charAt(0).toUpperCase() + row.original.status?.slice(1)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row.original, 'asset')}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClick(row.original, 'asset')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Inventory table columns
  const inventoryColumns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: 'name',
      header: 'Item',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.sku && <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) => {
        const isLow = row.original.quantity <= row.original.minQuantity
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isLow ? 'text-red-600' : ''}`}>{row.original.quantity}</span>
            {isLow && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        )
      },
    },
    {
      accessorKey: 'minQuantity',
      header: 'Min Qty',
      cell: ({ row }) => <span className="text-sm">{row.original.minQuantity}</span>,
    },
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: ({ row }) => <span className="font-medium">₹{Number(row.original.unitPrice || 0).toLocaleString('en-IN')}</span>,
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => <span className="text-sm">{row.original.location || '-'}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(row.original, 'inventory')}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClick(row.original, 'inventory')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const assetTable = useTable({
    data: filteredAssets,
    columns: assetColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  const inventoryTable = useTable({
    data: filteredInventory,
    columns: inventoryColumns,
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
          <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground">Track society assets, inventory, and maintenance</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Box className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assets.length}</p>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAssets}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{maintenanceAssets}</p>
                <p className="text-xs text-muted-foreground">In Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <Boxes className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockItems}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets or inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setSearch('')}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList>
          <TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets">
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
                      {assetTable.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id}>
                          {hg.headers.map((h) => (
                            <TableHead key={h.id}>
                              {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {assetTable.getRowModel().rows?.length ? (
                        assetTable.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={assetColumns.length} className="h-24 text-center">
                            <p className="text-sm text-muted-foreground">No assets found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Showing {assetTable.getState().pagination.pageIndex * assetTable.getState().pagination.pageSize + 1} to{' '}
                      {Math.min((assetTable.getState().pagination.pageIndex + 1) * assetTable.getState().pagination.pageSize, filteredAssets.length)}{' '}
                      of {filteredAssets.length} assets
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => assetTable.previousPage()} disabled={!assetTable.getCanPreviousPage()}>Previous</Button>
                      <span className="text-sm text-muted-foreground">Page {assetTable.getState().pagination.pageIndex + 1} of {assetTable.getPageCount()}</span>
                      <Button variant="outline" size="sm" onClick={() => assetTable.nextPage()} disabled={!assetTable.getCanNextPage()}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
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
                      {inventoryTable.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id}>
                          {hg.headers.map((h) => (
                            <TableHead key={h.id}>
                              {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {inventoryTable.getRowModel().rows?.length ? (
                        inventoryTable.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={inventoryColumns.length} className="h-24 text-center">
                            <p className="text-sm text-muted-foreground">No inventory items found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Showing {inventoryTable.getState().pagination.pageIndex * inventoryTable.getState().pagination.pageSize + 1} to{' '}
                      {Math.min((inventoryTable.getState().pagination.pageIndex + 1) * inventoryTable.getState().pagination.pageSize, filteredInventory.length)}{' '}
                      of {filteredInventory.length} items
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => inventoryTable.previousPage()} disabled={!inventoryTable.getCanPreviousPage()}>Previous</Button>
                      <span className="text-sm text-muted-foreground">Page {inventoryTable.getState().pagination.pageIndex + 1} of {inventoryTable.getPageCount()}</span>
                      <Button variant="outline" size="sm" onClick={() => inventoryTable.nextPage()} disabled={!inventoryTable.getCanNextPage()}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================
          CREATE/EDIT DIALOG
          ============================================ */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) { setCreateDialogOpen(false); setEditDialogOpen(false); resetForm() }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Item' : 'Add Asset'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update item details.' : 'Register a new asset or inventory item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Generator, CCTV Camera"
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Tower A, Lobby"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Value (₹)</Label>
                <Input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g. Cummins"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. G-100"
                />
              </div>
            </div>
            {deleteType !== 'inventory' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={formData.condition} onValueChange={(val) => setFormData({ ...formData, condition: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {conditions.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {assetStatuses.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {/* Photos */}
            <ImageGallery
              images={assetImages}
              onAdd={(img) => setAssetImages([...assetImages, img])}
              onRemove={(idx) => setAssetImages(assetImages.filter((_, i) => i !== idx))}
            />
            {/* Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Documents</Label>
              <DocumentUploader
                documents={assetDocuments}
                onAdd={(doc) => setAssetDocuments([...assetDocuments, doc])}
                onRemove={(idx) => setAssetDocuments(assetDocuments.filter((_, i) => i !== idx))}
                onView={(doc) => { setPreviewSrc(doc.data); setPreviewTitle(doc.name); setPreviewOpen(true) }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); resetForm() }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.name}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editDialogOpen ? 'Update' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedItem?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
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
