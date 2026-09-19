import { createFileRoute } from '@tanstack/react-router'
import { SocietyMapPage } from '@/features/society-map'

export const Route = createFileRoute('/_protected/society-map')({
  component: SocietyMapPage,
})
