import { useState, useEffect } from 'react'
import { Search, X, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { orpc } from '@/server/client'

interface Vendor {
  id: number
  name: string
  category?: string | null
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
}

interface VendorPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export function VendorPicker({
  value,
  onChange,
  label = 'Vendor',
  placeholder = 'Click to select vendor',
  error,
  disabled = false,
  required = false,
}: VendorPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await (orpc as any).vendors.list({}) as Vendor[]
        setVendors(data || [])
      } catch (error) {
        console.error('Failed to fetch vendors:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVendors()
  }, [])

  const selectedVendor = vendors.find(v => v.id === Number(value))
  const displayValue = selectedVendor ? selectedVendor.name : ''

  const filteredVendors = vendors.filter((vendor) => {
    const q = search.toLowerCase()
    return (
      vendor.name?.toLowerCase().includes(q) ||
      vendor.category?.toLowerCase().includes(q) ||
      vendor.contactPerson?.toLowerCase().includes(q) ||
      vendor.phone?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div className="space-y-2">
        {label && (
          <Label>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={displayValue}
            readOnly
            placeholder={placeholder}
            className={`cursor-pointer ${error ? 'border-destructive' : ''}`}
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
            <Search className="h-4 w-4" />
          </Button>
          {value && !disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Select Vendor</SheetTitle>
            <SheetDescription>
              Search and select a vendor
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
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

            {value && selectedVendor && (
              <div className="rounded-lg border bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Selected Vendor</p>
                    <p className="text-lg font-bold text-primary">
                      {selectedVendor.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange('')}
                  >
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Loading vendors...</p>
                </div>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      value === vendor.id.toString() ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      onChange(vendor.id.toString())
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.category || ''}
                          {vendor.contactPerson && ` · ${vendor.contactPerson}`}
                          {vendor.phone && ` · ${vendor.phone}`}
                        </p>
                      </div>
                    </div>
                    {value === vendor.id.toString() && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Truck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No vendors found</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
