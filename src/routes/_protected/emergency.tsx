import { createFileRoute } from '@tanstack/react-router'
import EmergencyFeature from '@/features/emergency'

export const Route = createFileRoute('/_protected/emergency')({
  component: EmergencyFeature,
})
