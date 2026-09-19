import { createFileRoute } from '@tanstack/react-router'
import { CelebrationsPage } from '@/features/celebrations'

export const Route = createFileRoute('/_protected/celebrations')({
  component: CelebrationsPage,
})
