import { useState, useEffect } from 'react'
import { Search, X, Home } from 'lucide-react'
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

interface Flat {
  id: number
  flatNumber: string
  wing?: string | null
  floor: number
  type: string
  ownerName?: string | null
  tenantName?: string | null
}

interface FlatPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export function FlatPicker({
  value,
  onChange,
  label = 'Assigned Flat',
  placeholder = 'Click to select flat',
  error,
  disabled = false,
  required = false,
}: FlatPickerProps) {
  const [open, setOpen] = useState(false)
  const [flatSearch, setFlatSearch] = useState('')
  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlats = async () => {
      try {
        const data = await (orpc as any).flats.list({}) as Flat[]
        setFlats(data || [])
      } catch (error) {
        console.error('Failed to fetch flats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFlats()
  }, [])

  const selectedFlat = flats.find(f => f.id === Number(value))
  const displayValue = selectedFlat
    ? `Flat ${selectedFlat.flatNumber}${selectedFlat.wing ? ` (${selectedFlat.wing})` : ''}`
    : ''

  const filteredFlats = flats.filter((flat) => {
    const q = flatSearch.toLowerCase()
    return (
      flat.flatNumber?.toLowerCase().includes(q) ||
      flat.wing?.toLowerCase().includes(q) ||
      flat.ownerName?.toLowerCase().includes(q) ||
      flat.tenantName?.toLowerCase().includes(q)
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
            <SheetTitle>Select Flat</SheetTitle>
            <SheetDescription>
              Search and select a flat
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by flat number, wing, or owner..."
                value={flatSearch}
                onChange={(e) => setFlatSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {flatSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setFlatSearch('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Selected flat display */}
            {value && selectedFlat && (
              <div className="rounded-lg border bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Selected Flat</p>
                    <p className="text-lg font-bold text-primary">
                      Flat {selectedFlat.flatNumber}
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

            {/* Flats list */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Loading flats...</p>
                </div>
              ) : filteredFlats.length > 0 ? (
                filteredFlats.map((flat) => (
                  <div
                    key={flat.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      value === flat.id.toString() ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      onChange(flat.id.toString())
                      setOpen(false)
                      setFlatSearch('')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {flat.flatNumber}
                      </div>
                      <div>
                        <p className="font-medium">Flat {flat.flatNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {flat.wing ? `Wing ${flat.wing}, ` : ''}Floor {flat.floor} · {flat.type}
                          {flat.ownerName && ` · ${flat.ownerName}`}
                        </p>
                      </div>
                    </div>
                    {value === flat.id.toString() && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Home className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No flats found</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
