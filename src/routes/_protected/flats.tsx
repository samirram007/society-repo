import { createFileRoute } from '@tanstack/react-router'
import { FlatsPage } from '@/features/flats'

export const Route = createFileRoute('/_protected/flats')({
  component: FlatsPage,
})
