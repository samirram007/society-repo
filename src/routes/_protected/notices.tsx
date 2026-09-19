import { createFileRoute } from '@tanstack/react-router'
import { NoticesPage } from '@/features/notices'

export const Route = createFileRoute('/_protected/notices')({
  component: NoticesPage,
})
