import { createFileRoute } from '@tanstack/react-router'
import { VisitorsPage } from '@/features/visitors'

export const Route = createFileRoute('/_protected/visitors')({
  component: VisitorsPage,
})
