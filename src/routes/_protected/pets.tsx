import { createFileRoute } from '@tanstack/react-router'
import { PetsPage } from '@/features/pets'

export const Route = createFileRoute('/_protected/pets')({
  component: PetsPage,
})
