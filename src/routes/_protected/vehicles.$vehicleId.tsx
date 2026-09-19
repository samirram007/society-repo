import { createFileRoute } from '@tanstack/react-router'
import { VehicleDetailPage } from '@/features/vehicles/detail'

export const Route = createFileRoute('/_protected/vehicles/$vehicleId')({
  component: VehicleDetailPage,
})
