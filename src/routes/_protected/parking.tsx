import { createFileRoute } from '@tanstack/react-router'
import { ParkingPage } from '@/features/parking'

export const Route = createFileRoute('/_protected/parking')({
  component: ParkingPage,
})
