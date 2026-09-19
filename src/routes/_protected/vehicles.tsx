import { createFileRoute } from '@tanstack/react-router'
import { VehiclesPage } from '@/features/vehicles'

export const Route = createFileRoute('/_protected/vehicles')({
  component: VehiclesPage,
})
