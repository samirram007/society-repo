import { useState, useEffect } from 'react'
import { Search, X, Shield } from 'lucide-react'
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

interface StaffMember {
  id: number
  firstName: string
  lastName?: string | null
  phone?: string | null
  department?: string | null
  designation?: string | null
  isActive?: boolean
}

interface StaffPickerProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (staff: StaffMember | null) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  filterActive?: boolean
}

export function StaffPicker({
  value,
  onChange,
  onSelect,
  label = 'Staff Member',
  placeholder = 'Click to select staff member',
  error,
  disabled = false,
  required = false,
  filterActive = false,
}: StaffPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await (orpc as any).staff.list({}) as StaffMember[]
        setStaff(data || [])
      } catch (error) {
        console.error('Failed to fetch staff:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStaff()
  }, [])

  const selectedStaff = staff.find(s => s.id === Number(value))
  const displayValue = selectedStaff
    ? `${selectedStaff.firstName} ${selectedStaff.lastName || ''}`
    : ''

  const filteredStaff = staff.filter((member) => {
    if (filterActive && !member.isActive) return false
    const q = search.toLowerCase()
    return (
      member.firstName?.toLowerCase().includes(q) ||
      member.lastName?.toLowerCase().includes(q) ||
      member.phone?.toLowerCase().includes(q) ||
      member.department?.toLowerCase().includes(q) ||
      member.designation?.toLowerCase().includes(q)
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
            <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(''); onSelect?.(null) }}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Select Staff Member</SheetTitle>
            <SheetDescription>
              Search and select a staff member
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, department, or designation..."
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

            {value && selectedStaff && (
              <div className="rounded-lg border bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Selected Staff</p>
                    <p className="text-lg font-bold text-primary">
                      {selectedStaff.firstName} {selectedStaff.lastName}
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
                  <p>Loading staff...</p>
                </div>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      value === member.id.toString() ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      onChange(member.id.toString())
                      onSelect?.(member)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.department && `${member.department}`}
                          {member.designation && ` · ${member.designation}`}
                          {member.phone && ` · ${member.phone}`}
                        </p>
                      </div>
                    </div>
                    {value === member.id.toString() && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Shield className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No staff members found</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
