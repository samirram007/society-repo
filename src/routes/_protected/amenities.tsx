import { createFileRoute } from '@tanstack/react-router'
import { AmenitiesPage } from '@/features/amenities'

export const Route = createFileRoute('/_protected/amenities')({
  component: AmenitiesPage,
})
