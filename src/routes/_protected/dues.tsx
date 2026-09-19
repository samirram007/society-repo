import { createFileRoute } from '@tanstack/react-router'
import { DuesPage } from '@/features/invoices'

export const Route = createFileRoute('/_protected/dues')({
  component: DuesPage,
})
