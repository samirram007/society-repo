import { createFileRoute } from '@tanstack/react-router'
import SecurityFeature from '@/features/security'

export const Route = createFileRoute('/_protected/security')({
  component: SecurityFeature,
})
