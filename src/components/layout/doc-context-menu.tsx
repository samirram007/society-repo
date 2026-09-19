import { useState, useEffect, useRef } from 'react'
import {
  Eye,
  Download,
  Edit,
  Copy,
  FolderInput,
  Trash2,
  Star,
  StarOff,
  FileText,
  FolderOpen,
  Info,
  Pencil,
  ChevronRight,
} from 'lucide-react'

interface ContextMenuItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive'
  dividerAfter?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) {
      menuRef.current.style.left = `${x - rect.width}px`
    }
    if (rect.bottom > vh) {
      menuRef.current.style.top = `${y - rect.height}px`
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] rounded-lg border bg-popover shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => {
        if (item.dividerAfter) {
          return (
            <div key={i}>
              <button
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  item.disabled
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : item.variant === 'destructive'
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick()
                    onClose()
                  }
                }}
                disabled={item.disabled}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
              <div className="my-1 border-t" />
            </div>
          )
        }
        return (
          <button
            key={i}
            className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
              item.disabled
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : item.variant === 'destructive'
                ? 'text-destructive hover:bg-destructive/10'
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

// Hook to manage context menu state
export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null)

  const show = (e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY, items })
  }

  const close = () => setMenu(null)

  const MenuComponent = menu ? (
    <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={close} />
  ) : null

  return { show, close, MenuComponent }
}
