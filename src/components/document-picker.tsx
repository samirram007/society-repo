import { useState, useEffect } from 'react'
import { Search, X, FileText } from 'lucide-react'
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

interface Document {
  id: number
  title: string
  description?: string | null
  category?: string | null
  fileName?: string | null
  fileUrl?: string | null
  mimeType?: string | null
}

interface DocumentPickerProps {
  value: string[]  // array of document IDs
  onChange: (value: string[]) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function DocumentPicker({
  value,
  onChange,
  label = 'Attachments',
  placeholder = 'Click to select documents',
  error,
  disabled = false,
}: DocumentPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await (orpc as any).documents.list({}) as Document[]
        setDocuments(data || [])
      } catch (error) {
        console.error('Failed to fetch documents:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  const selectedDocs = documents.filter(d => value.includes(d.id.toString()))

  const filteredDocuments = documents.filter((doc) => {
    const q = search.toLowerCase()
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.fileName?.toLowerCase().includes(q) ||
      doc.category?.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q)
    )
  })

  const toggleDoc = (docId: string) => {
    if (value.includes(docId)) {
      onChange(value.filter(id => id !== docId))
    } else {
      onChange([...value, docId])
    }
  }

  return (
    <>
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2">
          <Input
            value={selectedDocs.length > 0 ? `${selectedDocs.length} document(s) selected` : ''}
            readOnly
            placeholder={placeholder}
            className={`cursor-pointer ${error ? 'border-destructive' : ''}`}
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
            <Search className="h-4 w-4" />
          </Button>
          {value.length > 0 && !disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Select Documents</SheetTitle>
            <SheetDescription>
              Search and select documents to attach
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, filename, or category..."
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

            {value.length > 0 && (
              <div className="rounded-lg border bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Selected Documents</p>
                    <p className="text-lg font-bold text-primary">
                      {value.length} attached
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange([])}
                  >
                    <X className="h-4 w-4 mr-1" /> Clear All
                  </Button>
                </div>
              </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Loading documents...</p>
                </div>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      value.includes(doc.id.toString()) ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleDoc(doc.id.toString())}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileName || doc.category || ''}
                          {doc.mimeType && ` · ${doc.mimeType.split('/').pop()}`}
                        </p>
                      </div>
                    </div>
                    {value.includes(doc.id.toString()) && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No documents found</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
